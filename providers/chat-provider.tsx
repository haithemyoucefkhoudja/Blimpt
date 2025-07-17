import type React from "react";
import { v4 as uuid } from "uuid";
import { type ChatRequestBody, handleChatRequest } from "@/ai";
import type { Message, StoreMessageResponse } from "@/types/Message";
import { CLOSE_DELAY } from "@/utils/constants";
import type { chatModel } from "@/ai";
import { useSizeChange } from "@/components/shortcut-ui/hooks/use-app-resize";
import { TAttachment } from "@/types/attachment";
import { useConfig, useShortcut } from "@/providers/config-provider";
import type { CustomProvider } from "@/types/settings/provider";
import {
  createContext,
  useState,
  useEffect,
  useRef,
  useContext,
  type FC,
  type ReactNode,
  useCallback,
  useMemo,
} from "react";
import type { Conversation } from "@/types/Conversation";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { getChatModel } from "@/ai";
import { apiStoreMessage } from "@/db/api";
import { editMessage, storeMessage } from "@/db/database";
import { callWithRetry, handleChatRequestNoSearch } from "@/lib";
import delay from "@/lib/delay";
import { listen } from "@tauri-apps/api/event";
import { readFileAsBase64 } from "@/lib/readFileAsBase64";
import { HiddenMessage } from "@/types/Message";
import { useInfiniteConversations } from "@/hooks/use-infinite-query";
import { useQueryClient } from "@tanstack/react-query";
interface ChatContextValue {
  messages: Message[];
  lastMessage: HiddenMessage | null;
  isLoading: {
    state: boolean;
    id: string | null;
  };
  error: string | null;
  conversation: Conversation | null;
  stopRef: React.MutableRefObject<boolean>;
  stop: boolean;
  setStop: React.Dispatch<React.SetStateAction<boolean>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  setLastMessage: React.Dispatch<React.SetStateAction<HiddenMessage | null>>;
  closeLastMessage: () => void;
  toggleLastMessage: () => void;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  rewrite: (
    messageId: string,
    searchMode: string,
    emptyInput: () => void
  ) => void;
  newChatStarter: (emptyInput: () => void) => void;
  handleFormSubmit: (
    query: string,
    attachments: TAttachment[],
    searchMode: string,
    emptyInput: () => void
  ) => void;
}
interface ConversationsContextValue {
  conversations: Conversation[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isLoading: boolean;
  isError: boolean;
  error: any;
}
interface AttachmentsContextValue {
  attachments: TAttachment[];
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  addAttachment: (attachment: TAttachment) => void;
  removeAttachment: (attachmentId: string) => void;
  clearAttachments: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}
interface InputContextValue {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  emptyInput: () => void;
}
interface SearchModeContextValue {
  searchMode: string;
  setSearchMode: React.Dispatch<React.SetStateAction<string>>;
}

const MAX_RETRIES = 3;
const SizeComponent: FC<{ children: ReactNode }> = ({ children }) => {
  const { lastMessage, isLoading, error, messages, conversation } = useChat();
  const { input } = useInput();
  const { attachments } = useAttachments();
  const { dockerMessage } = useDockerMessage();
  const { isFirstRender } = useShortcut();
  const LastMessageVisible = !!lastMessage && !lastMessage.hidden;
  const lastMessageContent = lastMessage?.content;
  const sizeChangeDeps = useMemo(
    () => [
      input,
      lastMessage?.id, // Only track ID instead of entire object
      attachments.length, // Only track length
      isLoading.state,
      error,
      messages.length, // Only track length
      conversation?.title,
      dockerMessage,
      isFirstRender,
      LastMessageVisible,
      lastMessageContent,
    ],
    [
      input,
      lastMessage?.id,
      attachments.length,
      isLoading.state,
      error,
      messages.length,
      conversation?.title,
      dockerMessage,
      isFirstRender,
      LastMessageVisible,
      lastMessageContent,
    ]
  );

  useSizeChange(sizeChangeDeps);
  return children;
};
const ConversationsContext = createContext<ConversationsContextValue>({
  conversations: [],
  fetchNextPage: () => {},
  hasNextPage: false,
  isLoading: false,
  isError: false,
  error: null,
});
const ConversationsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error: ErrorConversation,
  } = useInfiniteConversations();
  const conversations = data?.pages.flat() || [];

  const conversationsContextValue = useMemo<ConversationsContextValue>(() => {
    return {
      conversations,
      fetchNextPage,
      hasNextPage,
      isLoading,
      isError,
      error: ErrorConversation,
    };
  }, [
    conversations,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    ErrorConversation,
  ]);
  return (
    <ConversationsContext.Provider value={conversationsContextValue}>
      {children}
    </ConversationsContext.Provider>
  );
};
interface DockerMessageContextValue {
  dockerMessage: string;
  updateDockerMessage: (message: string) => void;
}
const DockerMessageContext = createContext<DockerMessageContextValue>({
  dockerMessage: "",
  updateDockerMessage: () => {},
});
export const DockerMessageProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [dockerMessage, setDockerMessage] = useState<string>("");
  const updateDockerMessage = (message: string) => {
    setDockerMessage(message);
  };
  const dockerMessageContextValue = useMemo<DockerMessageContextValue>(() => {
    return {
      dockerMessage,
      updateDockerMessage,
    };
  }, [dockerMessage]);
  return (
    <DockerMessageContext.Provider value={dockerMessageContextValue}>
      {children}
    </DockerMessageContext.Provider>
  );
};
const InputProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [input, setInput] = useState("");
  const [searchMode, setSearchMode] = useState("webSearch");
  const [attachments, setAttachments] = useState<TAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleAppShortcut } = useShortcut();
  const emptyInput = useMemo(() => {
    return () => {
      setInput("");
      setAttachments([]);
    };
  }, []);
  // useEffect(() => {
  //   console.log("attachments:", attachments);
  // }, [attachments]);
  useEffect(() => {
    const unlisten = listen("cropped_image", (event) => {
      const base64 = event.payload as string;
      addAttachment({
        id: uuid(),
        metadata: {
          name: `screenshot-${Date.now()}.png`,
          type: "image/png",
          size: 0,
          lastModified: Date.now(),
        },
        base64: base64,
        type: "image",
        text: `screenshot-${Date.now()}.png`,
      });

      handleAppShortcut();
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const addAttachment = useCallback(
    (attachment: TAttachment) => {
      if (!attachment) return;

      setAttachments((prev) => {
        const newItem: TAttachment = attachment;

        let newItems = [];
        console.log("prev:", prev);
        if (prev)
          newItems = [
            newItem,
            ...prev.filter((item) => item.id !== attachment.id),
          ];
        else {
          newItems = [newItem];
        }
        return newItems;
      });
    },
    [attachments]
  );
  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments((prev) => {
      const newItems = [...prev];
      newItems.splice(
        newItems.findIndex((item) => item.id === attachmentId),
        1
      );
      return newItems;
    });
  }, []);
  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      newFiles.map((file) => {
        if (file.type.startsWith("image/")) {
          readFileAsBase64(file).then((base64) => {
            const item: TAttachment = {
              id: `${file.name}-${file.lastModified}-${
                file.size
              }-${Math.random().toString(36).substring(7)}`,
              metadata: {
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
              },
              type: "image",
              text: file.name,
              base64: `data:${file.type};base64,${base64}`,
            };
            addAttachment(item);
          });
        }
      });
      event.target.value = "";
    }
  };
  const attachmentsContextValue = useMemo<AttachmentsContextValue>(() => {
    return {
      attachments,
      fileInputRef,
      addAttachment,
      removeAttachment,
      clearAttachments,
      handleFileChange,
    };
  }, [
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
    handleFileChange,
  ]);
  const inputContextValue = useMemo<InputContextValue>(() => {
    return {
      input,
      setInput,
      emptyInput,
    };
  }, [input, setInput, emptyInput]);
  const searchModeContextValue = useMemo<SearchModeContextValue>(() => {
    return {
      searchMode,
      setSearchMode,
    };
  }, [searchMode, setSearchMode]);
  return (
    <InputContext.Provider value={inputContextValue}>
      <AttachmentsContext.Provider value={attachmentsContextValue}>
        <SearchModeContext.Provider value={searchModeContextValue}>
          {children}
        </SearchModeContext.Provider>
      </AttachmentsContext.Provider>
    </InputContext.Provider>
  );
};
// Helper functions moved outside component to avoid recreation on each render
const ChatContext = createContext<ChatContextValue | undefined>(undefined);
const InputContext = createContext<InputContextValue | undefined>(undefined);
const AttachmentsContext = createContext<AttachmentsContextValue | undefined>(
  undefined
);
const SearchModeContext = createContext<SearchModeContextValue | undefined>(
  undefined
);
const lastMessagePlaceholder = {
  content: `lorum ipsum dolor sit amet consectetur adipiscing elit lorum ipsum dolor sit amet consectetur adipiscing elit lorum ipsum dolor sit amet consectetur adipiscing elit
  lorum ipsum dolor sit amet consectetur adipiscing elit lorum ipsum dolor sit amet consectetur adipiscing elit lorum ipsum dolor sit amet consectetur adipiscing elit
  lorum ipsum dolor sit amet consectetur adipiscing elit lorum ipsum dolor sit amet consectetur adipiscing elit lorum ipsum dolor sit amet consectetur adipiscing elit
  lorum ipsum dolor sit amet consectetur adipiscing elit lorum ipsum dolor sit amet consectetur adipiscing elit lorum ipsum dolor sit amet consectetur adipiscing elit
  `,
  role: "assistant" as const,
  sources: [],
  id: "",
  timestamp: "",
  isLoading: false,
  suggestions: [],
  hidden: false,
};
export const ChatProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessage, setLastMessage] = useState<HiddenMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stop, setStop] = useState(true);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<{
    state: boolean;
    id: string | null;
  }>({
    state: false,
    id: null,
  });
  const stopRef = useRef(stop);

  const { config, isDeepThinking, port, isSearch } = useConfig();
  const { OUTPUT_DELAY } = config;
  const newChatStarter = (emptyInput: () => void) => {
    ("newChatStarter");
    setMessages([]);
    setLastMessage(null);
    setError(null);
    setStop(true);
    setConversation(null);
    setIsLoading({ state: false, id: null });
    emptyInput();
  };
  // Sync stopRef with stop state
  useEffect(() => {
    stopRef.current = stop;
    if (stop) {
      setIsLoading({ state: false, id: null });
    }
  }, [stop]);
  // Handle window resizing

  // Helper functions
  const getModel = useCallback(
    (title = false) => {
      let model: chatModel = {} as chatModel;
      const selectedModel =
        isDeepThinking && !title
          ? config.selectedDeepThinkingModel
          : config.selectedModel;

      switch (selectedModel?.provider) {
        case "DEEPSEEK":
          model = {
            provider: "deepseek",
            model: selectedModel.name.split("||")[0],
            apiKey:
              config.providers.find((provider) => provider.name === "DEEPSEEK")
                ?.apiKey || "",
          };
          break;
        case "OPENAI":
          model = {
            provider: "openai",
            model: selectedModel.name.split("||")[0],
            apiKey:
              config.providers.find((provider) => provider.name === "OPENAI")
                ?.apiKey || "",
          };
          break;
        case "ANTHROPIC":
          model = {
            provider: "anthropic",
            model: selectedModel.name.split("||")[0],
            apiKey:
              config.providers.find((provider) => provider.name === "ANTHROPIC")
                ?.apiKey || "",
          };
          break;
        case "GROQ":
          model = {
            provider: "groq",
            model: selectedModel.name.split("||")[0],
            apiKey:
              config.providers.find((provider) => provider.name === "GROQ")
                ?.apiKey || "",
          };
          break;
        case "GEMINI":
          model = {
            provider: "gemini",
            model: selectedModel.name.split("||")[0],
            apiKey:
              config.providers.find((provider) => provider.name === "GEMINI")
                ?.apiKey || "",
          };
          break;
        case "MISTRAL":
          model = {
            provider: "mistral",
            model: selectedModel.name.split("||")[0],
            apiKey:
              config.providers.find((provider) => provider.name === "MISTRAL")
                ?.apiKey || "",
          };
          break;
        default:
          model = {
            provider: "custom_openai",
            customOpenAIKey: config.providers.find(
              (provider) => provider.name === selectedModel?.provider
            )?.apiKey,
            customOpenAIBaseURL:
              (
                config.providers.find(
                  (provider) => provider.name === selectedModel?.provider
                ) as CustomProvider
              )?.baseUrl || "",
            model: selectedModel?.name.split("||")[0] || "",
            apiKey:
              config.providers.find(
                (provider) => provider.name === selectedModel?.provider
              )?.apiKey || "",
          };
          break;
      }
      return model;
    },
    [config, isDeepThinking]
  );
  const saveUserMessage = useCallback(
    async (
      input: string,
      attachments: TAttachment[],
      conversation?: Partial<Conversation>
    ): Promise<{
      res: StoreMessageResponse;
      title: string;
    }> => {
      try {
        // ('path:', await path.configDir());
        // Initialize default values
        const timestamp = new Date().toISOString();
        let title = conversation?.title || "";

        // If no conversation or no ID, we need to create a new conversation
        const isNewConversation =
          !conversation ||
          !conversation.id ||
          conversation.title.startsWith("Assistant");

        // Generate a title for new conversations
        if (isNewConversation) {
          try {
            // Try to generate a title based on the input
            title = await updateConversation({
              query: input,
              chatModel: getModel(true),
              attachments,
            });
          } catch (error) {
            // Fallback title if generation fails
            console.error("Failed to generate title:", error);
            title = `Chat ${new Date().toLocaleString()}`;
          }
        }

        // Prepare conversation object
        const conversationData = {
          id: conversation?.id,
          title: title,
          timestamp: conversation?.timestamp || timestamp,
        };

        // Store the message
        const res = await apiStoreMessage(
          {
            id: "",
            content: input,
            role: "user",
            timestamp,
            conversation_id:
              conversationData.id == -1 ? null : conversationData.id,
            attachments,
          },
          title
        );
        if (isNewConversation) {
          setConversation({
            title: title,
            timestamp,
            id: res.conversation_id,
          });
        }

        return {
          res,
          title,
        };
      } catch (error) {
        console.error("Error saving user message:", error);
        throw error;
      }
    },
    [getModel, apiStoreMessage] // Removed setConversation since it's commented out
  );
  const updateConversation = async ({
    query,
    chatModel,
    attachments,
  }: {
    query: string;
    chatModel: chatModel;
    attachments: TAttachment[];
  }) => {
    let llm: BaseChatModel;

    if (chatModel.provider === "custom_openai") {
      if (!chatModel.customOpenAIKey) {
        throw new Error("Missing customOpenAIKey for custom_openai provider.");
      }
      if (!chatModel.customOpenAIBaseURL) {
        throw new Error(
          "Missing customOpenAIBaseURL for custom_openai provider."
        );
      }

      try {
        llm = new ChatOpenAI({
          modelName: chatModel.model,
          openAIApiKey: chatModel.customOpenAIKey,
          configuration: {
            baseURL: chatModel.customOpenAIBaseURL,
          },
          temperature: 0,
        }) as unknown as BaseChatModel;
      } catch (error: any) {
        throw new Error("Error initializing ChatOpenAI: " + error.message);
      }
    } else {
      try {
        llm = (await getChatModel(
          chatModel.provider,
          chatModel.apiKey,
          chatModel.model
        )) as BaseChatModel;
        (llm as any).temperature = 0;
      } catch (error: any) {
        console.error("Error initializing chat model: " + error.message);
        throw new Error("Error initializing chat model: " + error.message);
      }
    }
    const prompt = `You are responsible for creating Title for the conversation.  given the first user message don't answer the question create general title based on user Input\n      UserMessage: \n      ${query}`;
    try {
      const stream = await llm.stream([
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...(attachments.map((item) => {
              switch (item.type) {
                case "image":
                  return {
                    type: "image_url",
                    image_url: { url: item.base64 },
                  };
                case "text":
                  return {
                    type: "text",
                    text: item.text,
                  };
                default:
                  return {
                    type: "text",
                    text: "Unsupported attachment type",
                  };
              }
            }) || []),
          ],
        },
      ]);
      let chunks = "";
      let isFirst = true;

      for await (const chunk of stream) {
        const llm_content = chunk.content as string;
        if (!llm_content && !isFirst) {
          break;
        }
        isFirst = false;
        chunks += llm_content;
        setConversation((prev) => prev && { ...prev, title: chunks });
      }

      return chunks;
    } catch (error: any) {
      return query;
    }
  };
  const queryClient = useQueryClient();
  const invalidateConversations = () => {
    queryClient.invalidateQueries({
      queryKey: ["conversations"],
    });
  };
  const sendLLMMessage = async (
    userMessageContent: string,
    currentHistory: Message[],
    attachments: TAttachment[],
    searchMode: string,
    emptyInput: () => void,
    existingMessageId?: string
  ) => {
    ("sendLLMMessage");
    const currentModel = getModel();
    const mode = existingMessageId ? "edit" : "new";
    const optimisticAssistantId = existingMessageId || uuid(); // Use existing or new optimistic ID
    // 1. Prepare User Content (including clipboard)

    setIsLoading({ state: true, id: optimisticAssistantId });
    setError(null); // Clear previous errors
    setStop(false); // Allow streaming

    let finalUserMessageId: string | null = null;
    console.log("conversation:", conversation);
    let conversationDetailsForAssistant = conversation;

    // 2. Handle User Message (if "new" mode)
    const optimisticUserMessageId = uuid();
    const userMessage: Message = {
      id: optimisticUserMessageId,
      content: userMessageContent,
      role: "user",
      timestamp: new Date().toISOString(),
      attachments,
    };
    if (mode === "new") {
      setMessages((prev) => [...prev, userMessage]);
    }

    // 3. Prepare History for LLM
    // History should be based on the state *before* adding the new optimistic user message if applicable,
    // or up to the point of rewrite.
    const historyForLLM = currentHistory;

    const trimmedHistory = historyForLLM.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: [
        {
          type: "text",
          text: msg.content,
        },
        ...(msg.attachments?.map((item) => {
          switch (item.type) {
            case "image":
              return {
                type: "image_url",
                image_url: { url: item.base64 },
              };
            case "text":
              return {
                type: "text",
                text: item.text,
              };
            default:
              return {
                type: "text",
                text: "Unsupported attachment type",
              };
          }
        }) || []),
      ],
    }));

    // 4. Prepare Assistant Message (Optimistic Add or Find for Edit)
    conversationDetailsForAssistant =
      conversation && conversation.id
        ? conversation
        : {
            id: -1,
            title: `Assistant ${new Date().toISOString()}`,
            timestamp: new Date().toISOString(),
          };
    setConversation(conversationDetailsForAssistant);
    let assistantMessage: Message = {
      id: optimisticAssistantId,
      content: "",
      role: "assistant",
      sources: [],
      isLoading: true,
      timestamp: new Date().toISOString(),
    };

    if (mode === "new") {
      // Add optimistic assistant shell
      setMessages((prev) => [...prev, assistantMessage]);
    } else {
      // For edit mode, update the existing message to clear content
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticAssistantId
            ? {
                ...m,
                action: "Waiting...",
                content: "",
                sources: [],
                reasoning: undefined,
                isLoading: true,
                timestamp: new Date().toISOString(),
              }
            : m
        )
      );
      // Re-fetch the assistant message from state to ensure we're working with the latest version for updates
      const existingMsg = messages.find((m) => m.id === optimisticAssistantId);
      if (existingMsg)
        assistantMessage = {
          ...existingMsg,
          action: "Waiting...",
          content: "",
          sources: [],
          isLoading: true,
          reasoning: undefined,
          timestamp: new Date().toISOString(),
        };
    }

    // 5. Make API Call and Stream Response
    const requestBody: ChatRequestBody = {
      port: port || "",
      query: userMessageContent,
      chatModel: currentModel,
      history: trimmedHistory.map((msg) => [msg.role, msg.content]),
      focusMode: searchMode,
      optimizationMode: "balanced",
      attachments: attachments,
    };

    const chatGenerator =
      port && isSearch
        ? handleChatRequest(requestBody)
        : handleChatRequestNoSearch(requestBody);

    let accumulatedContent = "";
    let accumulatedSources: any[] = [];
    let accumulatedReasoning = "";
    let newAction = "";
    try {
      for await (const event of chatGenerator) {
        if (stopRef.current) break;
        let updateType = "";
        let newContent = "";
        let newReasoning = "";

        if (event.type === "message") {
          newAction = "Generating...";
          newContent = event.data;
          updateType = "content";
        } else if (event.type === "sources") {
          newAction = "Sources...";
          accumulatedSources = event.data; // Assuming sources are replaced, not appended
          updateType = "sources";
        } else if (event.type === "reasoning") {
          newAction = "Reasoning...";
          newReasoning = event.data;
          updateType = "reasoning";
        } else if (event.type === "error") {
          throw new Error(event.data); // Propagate error to catch block
        } else if (event.type === "action") {
          newAction = event.data;
          updateType = "action";
        }
        switch (updateType) {
          case "content":
            for (let i = 0; i < newContent.length; i++) {
              await delay(OUTPUT_DELAY);
              accumulatedContent += newContent[i];

              setMessages((prevMsgs) =>
                prevMsgs.map((m) =>
                  m.id === optimisticAssistantId
                    ? {
                        ...m,
                        content: accumulatedContent,
                        sources: accumulatedSources,
                        reasoning: accumulatedReasoning || undefined, // Keep undefined if empty
                        isLoading: true,
                        action: newAction,
                      }
                    : m
                )
              );
              setLastMessage({
                id: optimisticAssistantId,
                content: accumulatedContent,
                role: "assistant",
                sources: accumulatedSources,
                reasoning: accumulatedReasoning || undefined,
                timestamp: new Date().toISOString(),
                conversation_id: conversationDetailsForAssistant.id,
                isLoading: true,
                action: newAction,
                hidden: false,
              });
            }
            break;
          case "reasoning":
            for (let i = 0; i < newReasoning.length; i++) {
              await delay(OUTPUT_DELAY);
              accumulatedReasoning += newReasoning[i];
              setMessages((prevMsgs) =>
                prevMsgs.map((m) =>
                  m.id === optimisticAssistantId
                    ? {
                        ...m,
                        content: accumulatedContent,
                        sources: accumulatedSources,
                        reasoning: accumulatedReasoning || undefined, // Keep undefined if empty
                        isLoading: true,
                        action: newAction,
                      }
                    : m
                )
              );
              setLastMessage({
                id: optimisticAssistantId,
                content: accumulatedContent,
                role: "assistant",
                sources: accumulatedSources,
                reasoning: accumulatedReasoning || undefined,
                timestamp: new Date().toISOString(),
                conversation_id: conversationDetailsForAssistant.id,
                isLoading: true,
                action: newAction,
                hidden: false,
              });
            }
            break;
          case "sources":
            setMessages((prevMsgs) =>
              prevMsgs.map((m) =>
                m.id === optimisticAssistantId
                  ? {
                      ...m,
                      content: accumulatedContent,
                      sources: accumulatedSources,
                      reasoning: accumulatedReasoning || undefined, // Keep undefined if empty
                      isLoading: true,
                      action: newAction,
                    }
                  : m
              )
            );
            setLastMessage({
              id: optimisticAssistantId,
              content: accumulatedContent,
              role: "assistant",
              sources: accumulatedSources,
              reasoning: accumulatedReasoning || undefined,
              timestamp: new Date().toISOString(),
              conversation_id: conversationDetailsForAssistant.id,
              isLoading: true,
              action: newAction,
              hidden: false,
            });
            break;
          case "action":
            setMessages((prevMsgs) =>
              prevMsgs.map((m) =>
                m.id === optimisticAssistantId
                  ? {
                      ...m,
                      content: accumulatedContent,
                      sources: accumulatedSources,
                      reasoning: accumulatedReasoning || undefined, // Keep undefined if empty
                      isLoading: true,
                      action: newAction,
                    }
                  : m
              )
            );
            setLastMessage({
              id: optimisticAssistantId,
              content: accumulatedContent,
              role: "assistant",
              sources: accumulatedSources,
              reasoning: accumulatedReasoning || undefined,
              timestamp: new Date().toISOString(),
              conversation_id: conversationDetailsForAssistant.id,
              isLoading: true,
              action: newAction,
              hidden: false,
            });
            break;
        }
      }

      if (stopRef.current && !accumulatedContent) {
        // Ensure at least some content if stopped early
        accumulatedContent += " ";
        setMessages((prevMsgs) =>
          prevMsgs.map((m) =>
            m.id === optimisticAssistantId
              ? { ...m, content: accumulatedContent }
              : m
          )
        );
      }

      // 6. Finalize Assistant Message in DB
      const finalAssistantMessageData: Message = {
        id: "", // DB will assign
        content: accumulatedContent,
        action: "",
        role: "assistant" as const,
        timestamp: assistantMessage.timestamp, // Use initial timestamp or update to new Date().toISOString()
        sources: accumulatedSources,
        // suggestions: assistantMessage.suggestions, // Add if you have suggestions
        // conversation_id: conversationDetailsForAssistant.id,
        reasoning: accumulatedReasoning || undefined,
        isLoading: false,
      };

      let finalAssistantDbId: string = optimisticAssistantId;

      if (mode === "new") {
        console.log(
          "before-conversationDetailsForAssistant:",
          conversationDetailsForAssistant
        );
        try {
          const userSaveResult = await callWithRetry(
            () =>
              saveUserMessage(
                userMessage.content,
                attachments,
                conversationDetailsForAssistant
              ),
            MAX_RETRIES
          );
          conversationDetailsForAssistant = {
            title: userSaveResult.title,
            id: userSaveResult.res.conversation_id,
            timestamp: new Date().toISOString(),
          };
          console.log(
            "conversationDetailsForAssistant:",
            conversationDetailsForAssistant
          );
          invalidateConversations();
          finalAssistantMessageData.conversation_id =
            userSaveResult.res.conversation_id;
          finalUserMessageId = String(userSaveResult.res.message_id);

          // Update user message with final ID from DB
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === optimisticUserMessageId
                ? { ...msg, id: finalUserMessageId! }
                : msg
            )
          );
        } catch (err: any) {
          setError(`Failed to save user message: ${err.message}`);
          setIsLoading({ state: false, id: null });
          setStop(true);
          // Optionally remove the optimistic user message or mark it as failed
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== optimisticUserMessageId)
          );
          return;
        }
        const storeRes = await callWithRetry(
          () =>
            storeMessage(
              finalAssistantMessageData,
              conversationDetailsForAssistant.title
            ),
          MAX_RETRIES
        );
        if (typeof storeRes === "string") throw new Error(storeRes);
        finalAssistantDbId = String(storeRes.message_id);
      } else {
        const editRes = await callWithRetry(
          () =>
            editMessage(
              Number(optimisticAssistantId),
              finalAssistantMessageData
            ),
          MAX_RETRIES
        );
        if (editRes !== "success") throw new Error(editRes);
        // finalAssistantDbId remains optimisticAssistantId as it's an edit
      }

      // Update message in state with final DB ID (if new) and ensure all data is consistent
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticAssistantId
            ? {
                ...msg, // Spread existing fields first
                id: finalAssistantDbId, // Update ID if it changed
                content: accumulatedContent,
                isLoading: false,
                sources: accumulatedSources,
                reasoning: accumulatedReasoning || undefined,
                conversation_id: conversationDetailsForAssistant.id,
                timestamp: finalAssistantMessageData.timestamp, // Ensure timestamp is consistent
                action: "",
              }
            : msg
        )
      );
      setLastMessage({
        id: finalAssistantDbId, // Update ID if it changed
        content: accumulatedContent,
        isLoading: false,
        sources: accumulatedSources,
        reasoning: accumulatedReasoning || undefined,
        conversation_id: conversationDetailsForAssistant.id,
        timestamp: finalAssistantMessageData.timestamp, // Ensure timestamp is consistent
        role: "assistant" as const,
        hidden: false,
        action: "",
      });
    } catch (err: any) {
      setError(`LLM processing error: ${err.message}`);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticAssistantId
            ? {
                ...msg, // Spread existing fields first
                isLoading: false, // Update ID if it changed
                action: "",
              }
            : msg
        )
      );
      setLastMessage({
        ...lastMessage,
        isLoading: false,
        action: "",
      });
      // If assistant message was optimistically added, consider removing or marking as error
      // For simplicity here, we just show the error.
    } finally {
      // setIsLoading({ state: false, id: null });
      emptyInput();
      setStop(true);
    }
  };
  const rewrite = async (
    assistantMessageIdToRewrite: string,
    searchMode: string,
    emptyInput: () => void
  ) => {
    // Renamed for clarity
    const messageIndex = messages.findIndex(
      (msg) => msg.id === assistantMessageIdToRewrite
    );

    if (messageIndex < 0) {
      setError("Cannot rewrite: Original assistant message not found.");
      setIsLoading({ state: false, id: null }); // Reset loading
      setStop(true); // Ensure stop is true
      return;
    }
    if (messages[messageIndex].role !== "assistant") {
      setError("Cannot rewrite: Target message is not an assistant message.");
      setIsLoading({ state: false, id: null });
      setStop(true);
      return;
    }

    // The user message is typically the one *before* the assistant message
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== "user") {
      // This scenario is tricky: An assistant message without a preceding user message?
      // This could happen if the very first message in the chat was an assistant greeting.
      // How do you "rewrite" a greeting without user context?
      // For now, let's assume a user message is required.
      setError("Cannot rewrite: No preceding user message found for context.");
      setIsLoading({ state: false, id: null });
      setStop(true);
      return;
    }

    const userQueryForRewrite = messages[userMessageIndex].content;
    const userAttachments = messages[userMessageIndex].attachments;
    // History should be all messages *plus* the userQueryForRewrite was originally sent
    const historyForRewrite = messages.slice(0, userMessageIndex + 1);

    // initResponse(); // Handled by sendLLMMessage

    try {
      // Call sendLLMMessage in "edit" mode
      await sendLLMMessage(
        userQueryForRewrite,
        historyForRewrite,
        userAttachments,
        searchMode,
        emptyInput,
        assistantMessageIdToRewrite
      );
    } catch (err: any) {
      console.error("Error during rewrite operation:", err);
      // sendLLMMessage should set the error in context.
      // Ensure loading/stop states are reset if sendLLMMessage failed to do so.
      setError(`Rewrite failed: ${err.message || "Unknown error"}`); // Potentially override if sendLLMMessage error isn't specific enough
      setIsLoading({ state: false, id: null });
      setStop(true);
    }
    // No finally needed here if sendLLMMessage handles its own finally for loading/stop
  };
  const handleFormSubmit = async (
    query: string,
    attachments: TAttachment[],
    searchMode: string,
    emptyInput: () => void
  ) => {
    if (!query.trim()) return;

    try {
      const history = messages;
      let mutableInput = query;
      const hasSuccessiveUserMessages =
        history.length > 0 && history[history.length - 1].role === "user";

      if (hasSuccessiveUserMessages) {
        mutableInput = history[history.length - 1].content + "\n" + query;
        history.pop();
        setMessages(history);
      }
      await sendLLMMessage(
        mutableInput,
        history,
        attachments,
        searchMode,
        emptyInput
      );
    } catch (error: any) {
      if (typeof error === "string") {
        setError(error);
      } else {
        setError(
          error instanceof Error ? error.message : "Failed to process message"
        );
      }
      console.error("Error-Container:", error);
    } finally {
      setIsLoading({ id: null, state: false });
      // setInput("");
      // clearAttachments();
      setStop(true);
    }
  };
  // Handle first render and auto-hide

  const toggleLastMessage = () => {
    setLastMessage((prev) =>
      prev
        ? {
            ...prev,
            hidden: !prev.hidden,
          }
        : null
    );
  };
  const closeLastMessage = () => {
    setLastMessage((prev) => ({
      ...prev,
      hidden: true,
    }));
  };
  const contextValue = useMemo<ChatContextValue>(() => {
    return {
      stop,
      setStop,
      stopRef,
      setMessages,
      messages,
      lastMessage,
      isLoading,
      error,
      conversation,
      handleFormSubmit,
      rewrite,
      setLastMessage,
      toggleLastMessage,
      setConversation,
      setError,
      newChatStarter,
      closeLastMessage,
    };
  }, [
    stop,
    setStop,
    stopRef,
    setMessages,
    messages,
    lastMessage,
    isLoading,
    error,
    conversation,
    handleFormSubmit,
    rewrite,
    setLastMessage,
    setConversation,
    setError,
    newChatStarter,
    closeLastMessage,
  ]);
  return (
    <ChatContext.Provider value={contextValue}>
      <InputProvider>
        <DockerMessageProvider>
          <ConversationsProvider>
            <SizeComponent>{children}</SizeComponent>
          </ConversationsProvider>
        </DockerMessageProvider>
      </InputProvider>
    </ChatContext.Provider>
  );
};
// Helper function for handling chat requests without port
export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
export const useInput = (): InputContextValue => {
  const context = useContext(InputContext);
  if (context === undefined) {
    throw new Error("useInput must be used within a ChatProvider");
  }
  return context;
};
export const useAttachments = (): AttachmentsContextValue => {
  const context = useContext(AttachmentsContext);
  if (context === undefined) {
    throw new Error("useAttachments must be used within a ChatProvider");
  }
  return context;
};
export const useSearchMode = (): SearchModeContextValue => {
  const context = useContext(SearchModeContext);
  if (context === undefined) {
    throw new Error("useSearchMode must be used within a ChatProvider");
  }
  return context;
};
export const useDockerMessage = (): DockerMessageContextValue => {
  const context = useContext(DockerMessageContext);
  if (context === undefined) {
    throw new Error("useDockerMessage must be used within a ChatProvider");
  }
  return context;
};
export const useConversations = (): ConversationsContextValue => {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error("useConversations must be used within a ChatProvider");
  }
  return context;
};
export default ChatProvider;
