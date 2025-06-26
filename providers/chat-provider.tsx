import type React from "react";
import { v4 as uuid } from "uuid";
import { type ChatRequestBody, handleChatRequest } from "@/ai";
import type { Message, StoreMessageResponse } from "@/types/Message";
import { CLOSE_DELAY } from "@/utils/constants";
import type { chatModel } from "@/ai";
import { useSizeChange } from "@/components/shortcut-ui/hooks/use-app-resize";
import { TClipBoard } from "@/types/clipboard";
import useShortcut from "@/components/shortcut-ui/hooks/use-shortcut";
import { useConfig } from "@/providers/config-provider";
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
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Conversation } from "@/types/Conversation";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { getChatModel } from "@/ai";
import { apiStoreMessage } from "@/db/api";
import { editMessage, storeMessage } from "@/db/database";
import { callWithRetry, trimHistory, handleChatRequestNoSearch } from "@/lib";
import { messageList } from "@/components/shortcut-ui/test";
import delay from "@/lib/delay";
interface ChatContextValue {
  messages: Message[];
  lastMessage: Message | null;
  sendMessage: (
    input: string,
    history: Message[],
    clipboardItems: TClipBoard[],
    messageId?: string
  ) => Promise<void>;
  isLoading: {
    state: boolean;
    id: string | null;
  };
  error: string | null;
  isFirstRender: boolean;
  conversation: Conversation | null;
  stopRef: React.MutableRefObject<boolean>;
  stop: boolean;
  setStop: React.Dispatch<React.SetStateAction<boolean>>;
  setConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setLastMessage: React.Dispatch<React.SetStateAction<Message | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  rewrite: (messageId: string) => void;
  newChatStarter: () => void;
  handleFormSubmit: () => void;
}
interface InputContextValue {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  searchMode: string;
  setSearchMode: React.Dispatch<React.SetStateAction<string>>;
  clipboardItems: TClipBoard[];
  addClipboardItem: (item: string) => void;
  removeClipboardItem: (index: number) => void;
  clearAllClipboardItems: () => void;
}
const MAX_RETRIES = 3;
// Helper functions moved outside component to avoid recreation on each render
const ChatContext = createContext<ChatContextValue | undefined>(undefined);
const InputContext = createContext<InputContextValue | undefined>(undefined);
export const ChatProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [clipboardItems, setClipboardItems] = useState<TClipBoard[]>([]);
  // const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [stop, setStop] = useState(true);
  const [searchMode, setSearchMode] = useState("webSearch");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<{
    state: boolean;
    id: string | null;
  }>({
    state: false,
    id: null,
  });
  // Refs
  const stopRef = useRef(stop);
  // Hooks
  const { config, isDeepThinking, port, isSearch } = useConfig();

  const { isFirstRender, firstRenderRef, hidden, setIsFirstRender } =
    useShortcut();
  const newChatStarter = () => {
    ("newChatStarter");
    setMessages([]);
    setLastMessage(null);
    setError(null);
    setInput("");
    setStop(true);
    setConversation(null);
    setIsLoading({ state: false, id: null });
  };
  useEffect(() => {
    if (hidden) setLastMessage(null);
  }, [hidden]);
  // Sync stopRef with stop state
  useEffect(() => {
    stopRef.current = stop;
    if (stop) {
      setIsLoading({ state: false, id: null });
    }
  }, [stop]);
  // Handle window resizing
  const sizeChangeDeps = useMemo(
    () => [
      input,
      lastMessage?.id, // Only track ID instead of entire object
      clipboardItems.length, // Only track length
      isLoading.state,
      error,
      messages.length, // Only track length
      isFirstRender,
      conversation?.title,
    ],
    [
      input,
      lastMessage?.id,
      clipboardItems.length,
      isLoading.state,
      error,
      messages.length,
      isFirstRender,
      conversation?.title,
    ]
  );

  useSizeChange(() => {
    // Handler for size changes
  }, sizeChangeDeps);
  // Helper functions
  const closeWindow = useCallback(() => {
    setLastMessage(null);
  }, []);
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
      clipboardItems: TClipBoard[],
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
        const isNewConversation = !conversation || !conversation.id;

        // Generate a title for new conversations
        if (isNewConversation) {
          try {
            // Try to generate a title based on the input
            title = await updateConversation({
              query: input,
              chatModel: getModel(true),
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
            conversation_id: conversationData.id,
            clipboardItems,
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
  const updateConversation = useCallback(
    async (body: { query: string; chatModel: chatModel }) => {
      let llm: BaseChatModel;

      if (body.chatModel.provider === "custom_openai") {
        if (!body.chatModel.customOpenAIKey) {
          throw new Error(
            "Missing customOpenAIKey for custom_openai provider."
          );
        }
        if (!body.chatModel.customOpenAIBaseURL) {
          throw new Error(
            "Missing customOpenAIBaseURL for custom_openai provider."
          );
        }

        try {
          llm = new ChatOpenAI({
            modelName: body.chatModel.model,
            openAIApiKey: body.chatModel.customOpenAIKey,
            configuration: {
              baseURL: body.chatModel.customOpenAIBaseURL,
            },
            temperature: 0,
          }) as unknown as BaseChatModel;
        } catch (error: any) {
          throw new Error("Error initializing ChatOpenAI: " + error.message);
        }
      } else {
        try {
          llm = (await getChatModel(
            body.chatModel.provider,
            body.chatModel.apiKey,
            body.chatModel.model
          )) as BaseChatModel;
          (llm as any).temperature = 0;
        } catch (error: any) {
          console.error("Error initializing chat model: " + error.message);
          throw new Error("Error initializing chat model: " + error.message);
        }
      }

      try {
        const stream = await llm.stream(
          `Summarize this user query into a simple title ****Don't Use MarkDown****: "${body.query}"`
        );
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
        return body.query;
      }
    },
    []
  );
  const MocksendLLMMessage = useCallback(
    async (
      userMessageContent: string,
      currentHistory: Message[],
      clipboardItems: TClipBoard[],
      existingMessageId?: string
    ) => {
      ("sendLLMMessage");
      const currentModel = getModel();
      const mode = existingMessageId ? "edit" : "new";
      const optimisticAssistantId = existingMessageId || uuid(); // Use existing or new optimistic ID
      // 1. Prepare User Content (including clipboard)

      setInput("");
      setIsLoading({ state: true, id: optimisticAssistantId });
      setError(null); // Clear previous errors
      setStop(false); // Allow streaming

      let finalUserMessageId: string | null = null;
      let conversationDetailsForAssistant = conversation;

      // 2. Handle User Message (if "new" mode)
      if (mode === "new") {
        const optimisticUserMessageId = uuid();
        const userMessage: Message = {
          id: optimisticUserMessageId,
          content: userMessageContent,
          role: "user",
          timestamp: new Date().toISOString(),
          clipboardItems,
        };
        setMessages((prev) => [...prev, userMessage]);

        try {
          const userSaveResult = await callWithRetry(
            () =>
              saveUserMessage(
                userMessage.content,
                clipboardItems,
                conversationDetailsForAssistant
              ),
            MAX_RETRIES
          );
          conversationDetailsForAssistant = {
            title: userSaveResult.title,
            id: userSaveResult.res.conversation_id,
            timestamp: new Date().toISOString(),
          };
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
      }

      // 3. Prepare History for LLM
      // History should be based on the state *before* adding the new optimistic user message if applicable,
      // or up to the point of rewrite.
      const historyForLLM = currentHistory;

      const trimmedHistory = await trimHistory(
        historyForLLM.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content:
            msg.clipboardItems?.map((item) => item.text).join("\n") +
            "\n" +
            msg.content,
        })),
        clipboardItems.map((item) => item.text).join("\n") +
          "\n" +
          userMessageContent, // Use the version with context
        config.MAX_TOKENS
      );
      console.log("trimmedHistory:", trimmedHistory);

      // 4. Prepare Assistant Message (Optimistic Add or Find for Edit)
      let assistantMessage: Message = {
        id: optimisticAssistantId,
        content: "",
        role: "assistant",
        sources: [],
        isLoading: true,
        timestamp: new Date().toISOString(),
        conversation_id: conversationDetailsForAssistant.id, // Link to conversation
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
                  content: "",
                  sources: [],
                  reasoning: undefined,
                  timestamp: new Date().toISOString(),
                }
              : m
          )
        );
        // Re-fetch the assistant message from state to ensure we're working with the latest version for updates
        const existingMsg = messages.find(
          (m) => m.id === optimisticAssistantId
        );
        if (existingMsg)
          assistantMessage = {
            ...existingMsg,
            content: "",
            sources: [],
            reasoning: undefined,
            timestamp: new Date().toISOString(),
          };
      }

      // 5. Make API Call and Stream Response
      const requestBody: ChatRequestBody = {
        port: port || "",
        query:
          clipboardItems.map((item) => item.text).join("\n") +
          "\n" +
          userMessageContent,
        chatModel: currentModel,
        history: trimmedHistory.map((msg) => [
          msg.role === "user" ? "human" : "ai",
          msg.content,
        ]),
        focusMode: searchMode,
        optimizationMode: "balanced",
      };

      // const chatGenerator =
      //   port && isSearch
      //     ? handleChatRequest(requestBody)
      //     : handleChatRequestNoSearch(requestBody);

      let accumulatedContent = "";
      let accumulatedSources: any[] = [];
      let accumulatedReasoning = "";

      try {
        for await (const event of messageList) {
          await delay(100);
          if (stopRef.current) break;

          let needsUpdate = false;
          if (event.type === "message") {
            accumulatedContent += event.data;
            needsUpdate = true;
          }
          // } else if (event.type === "sources") {
          //   accumulatedSources = event.data; // Assuming sources are replaced, not appended
          //   needsUpdate = true;
          // } else if (event.type === "reasoning") {
          //   accumulatedReasoning += event.data;
          //   needsUpdate = true;
          // } else if (event.type === "error") {
          //   throw new Error(event.data); // Propagate error to catch block
          // }

          if (needsUpdate) {
            setMessages((prevMsgs) =>
              prevMsgs.map((m) =>
                m.id === optimisticAssistantId
                  ? {
                      ...m,
                      content: accumulatedContent,
                      sources: accumulatedSources,
                      reasoning: accumulatedReasoning || undefined, // Keep undefined if empty
                      isLoading: true,
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
            });
          }
        }

        if (stopRef.current && !accumulatedContent) {
          // Ensure at least some content if stopped early
          accumulatedContent = " ";
          setMessages((prevMsgs) =>
            prevMsgs.map((m) =>
              m.id === optimisticAssistantId
                ? { ...m, content: accumulatedContent }
                : m
            )
          );
        }

        // 6. Finalize Assistant Message in DB
        const finalAssistantMessageData = {
          id: "", // DB will assign
          content: accumulatedContent,
          role: "assistant" as "assistant",
          timestamp: assistantMessage.timestamp, // Use initial timestamp or update to new Date().toISOString()
          sources: accumulatedSources,
          // suggestions: assistantMessage.suggestions, // Add if you have suggestions
          conversation_id: conversationDetailsForAssistant.id,
          reasoning: accumulatedReasoning || undefined,
          isLoading: false,
        };

        let finalAssistantDbId: string = optimisticAssistantId;

        if (mode === "new") {
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
          role: "assistant",
        });
      } catch (err: any) {
        setError(`LLM processing error: ${err.message}`);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticAssistantId
              ? {
                  ...msg, // Spread existing fields first
                  isLoading: false, // Update ID if it changed
                }
              : msg
          )
        );
        setLastMessage({
          ...lastMessage,
          isLoading: false,
        });
        // If assistant message was optimistically added, consider removing or marking as error
        // For simplicity here, we just show the error.
      } finally {
        // setIsLoading({ state: false, id: null });

        setStop(true);
      }
    },
    [
      getModel,
      saveUserMessage,
      messages,
      clipboardItems,
      conversation,
      lastMessage,
      error,
      input,
      stop,
      isLoading,
    ]
  );
  const sendLLMMessage = useCallback(
    async (
      userMessageContent: string,
      currentHistory: Message[],
      clipboardItems: TClipBoard[],
      existingMessageId?: string
    ) => {
      ("sendLLMMessage");
      const currentModel = getModel();
      const mode = existingMessageId ? "edit" : "new";
      const optimisticAssistantId = existingMessageId || uuid(); // Use existing or new optimistic ID
      // 1. Prepare User Content (including clipboard)

      setInput("");
      setIsLoading({ state: true, id: optimisticAssistantId });
      setError(null); // Clear previous errors
      setStop(false); // Allow streaming

      let finalUserMessageId: string | null = null;
      let conversationDetailsForAssistant = conversation;

      // 2. Handle User Message (if "new" mode)
      if (mode === "new") {
        const optimisticUserMessageId = uuid();
        const userMessage: Message = {
          id: optimisticUserMessageId,
          content: userMessageContent,
          role: "user",
          timestamp: new Date().toISOString(),
          clipboardItems,
        };
        setMessages((prev) => [...prev, userMessage]);

        try {
          const userSaveResult = await callWithRetry(
            () =>
              saveUserMessage(
                userMessage.content,
                clipboardItems,
                conversationDetailsForAssistant
              ),
            MAX_RETRIES
          );
          conversationDetailsForAssistant = {
            title: userSaveResult.title,
            id: userSaveResult.res.conversation_id,
            timestamp: new Date().toISOString(),
          };
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
      }

      // 3. Prepare History for LLM
      // History should be based on the state *before* adding the new optimistic user message if applicable,
      // or up to the point of rewrite.
      const historyForLLM = currentHistory;

      const trimmedHistory = await trimHistory(
        historyForLLM.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content:
            msg.clipboardItems?.map((item) => item.text).join("\n") +
            "\n" +
            msg.content,
        })),
        clipboardItems.map((item) => item.text).join("\n") +
          "\n" +
          userMessageContent, // Use the version with context
        config.MAX_TOKENS
      );

      // 4. Prepare Assistant Message (Optimistic Add or Find for Edit)
      let assistantMessage: Message = {
        id: optimisticAssistantId,
        content: "",
        role: "assistant",
        sources: [],
        isLoading: true,
        timestamp: new Date().toISOString(),
        conversation_id: conversationDetailsForAssistant.id, // Link to conversation
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
                  content: "",
                  sources: [],
                  reasoning: undefined,
                  timestamp: new Date().toISOString(),
                }
              : m
          )
        );
        // Re-fetch the assistant message from state to ensure we're working with the latest version for updates
        const existingMsg = messages.find(
          (m) => m.id === optimisticAssistantId
        );
        if (existingMsg)
          assistantMessage = {
            ...existingMsg,
            content: "",
            sources: [],
            reasoning: undefined,
            timestamp: new Date().toISOString(),
          };
      }

      // 5. Make API Call and Stream Response
      const requestBody: ChatRequestBody = {
        port: port || "",
        query:
          clipboardItems.map((item) => item.text).join("\n") +
          "\n" +
          userMessageContent,
        chatModel: currentModel,
        history: trimmedHistory.map((msg) => [
          msg.role === "user" ? "human" : "ai",
          msg.content,
        ]),
        focusMode: searchMode,
        optimizationMode: "balanced",
      };

      const chatGenerator =
        port && isSearch
          ? handleChatRequest(requestBody)
          : handleChatRequestNoSearch(requestBody);

      let accumulatedContent = "";
      let accumulatedSources: any[] = [];
      let accumulatedReasoning = "";

      try {
        for await (const event of chatGenerator) {
          // await delay(300);
          if (stopRef.current) break;

          let needsUpdate = false;
          if (event.type === "message") {
            accumulatedContent += event.data;
            needsUpdate = true;
          } else if (event.type === "sources") {
            accumulatedSources = event.data; // Assuming sources are replaced, not appended
            needsUpdate = true;
          } else if (event.type === "reasoning") {
            accumulatedReasoning += event.data;
            needsUpdate = true;
          } else if (event.type === "error") {
            throw new Error(event.data); // Propagate error to catch block
          }

          if (needsUpdate) {
            setMessages((prevMsgs) =>
              prevMsgs.map((m) =>
                m.id === optimisticAssistantId
                  ? {
                      ...m,
                      content: accumulatedContent,
                      sources: accumulatedSources,
                      reasoning: accumulatedReasoning || undefined, // Keep undefined if empty
                      isLoading: true,
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
            });
          }
        }

        if (stopRef.current && !accumulatedContent) {
          // Ensure at least some content if stopped early
          accumulatedContent = " ";
          setMessages((prevMsgs) =>
            prevMsgs.map((m) =>
              m.id === optimisticAssistantId
                ? { ...m, content: accumulatedContent }
                : m
            )
          );
        }

        // 6. Finalize Assistant Message in DB
        const finalAssistantMessageData = {
          id: "", // DB will assign
          content: accumulatedContent,
          role: "assistant" as "assistant",
          timestamp: assistantMessage.timestamp, // Use initial timestamp or update to new Date().toISOString()
          sources: accumulatedSources,
          // suggestions: assistantMessage.suggestions, // Add if you have suggestions
          conversation_id: conversationDetailsForAssistant.id,
          reasoning: accumulatedReasoning || undefined,
          isLoading: false,
        };

        let finalAssistantDbId: string = optimisticAssistantId;

        if (mode === "new") {
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
          role: "assistant",
        });
      } catch (err: any) {
        setError(`LLM processing error: ${err.message}`);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticAssistantId
              ? {
                  ...msg, // Spread existing fields first
                  isLoading: false, // Update ID if it changed
                }
              : msg
          )
        );
        setLastMessage({
          ...lastMessage,
          isLoading: false,
        });
        // If assistant message was optimistically added, consider removing or marking as error
        // For simplicity here, we just show the error.
      } finally {
        // setIsLoading({ state: false, id: null });

        setStop(true);
      }
    },
    [
      getModel,
      saveUserMessage,
      messages,
      clipboardItems,
      conversation,
      lastMessage,
      error,
      input,
      stop,
      isLoading,
    ]
  );
  const rewrite = useCallback(
    async (assistantMessageIdToRewrite: string) => {
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
        setError(
          "Cannot rewrite: No preceding user message found for context."
        );
        setIsLoading({ state: false, id: null });
        setStop(true);
        return;
      }

      const userQueryForRewrite = messages[userMessageIndex].content;
      // History should be all messages *plus* the userQueryForRewrite was originally sent
      const historyForRewrite = messages.slice(0, userMessageIndex + 1);

      // initResponse(); // Handled by sendLLMMessage

      try {
        // Call sendLLMMessage in "edit" mode
        await MocksendLLMMessage(
          userQueryForRewrite,
          historyForRewrite,
          clipboardItems,
          assistantMessageIdToRewrite // Pass the ID of the assistant message to be "edited"
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
    },
    [
      MocksendLLMMessage,
      messages,
      clipboardItems,
      getModel,
      conversation,
      lastMessage,
      error,
      input,
      stop,
      isLoading,
    ]
  );
  const handleFormSubmit = useCallback(async () => {
    if (!input.trim()) return;

    try {
      const history = messages;
      let mutableInput = input;
      const hasSuccessiveUserMessages =
        history.length > 0 && history[history.length - 1].role === "user";

      if (hasSuccessiveUserMessages) {
        mutableInput = history[history.length - 1].content + "\n" + input;
        history.pop();
        setMessages(history);
      }
      await MocksendLLMMessage(mutableInput, history, clipboardItems);
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
      setInput("");
      setStop(true);
    }
  }, [input, messages, clipboardItems, MocksendLLMMessage]);
  // Handle first render and auto-hide
  const hasExecutedTimeout = useRef(false);
  useEffect(() => {
    if (hasExecutedTimeout.current) return;

    const physicalWindow = getCurrentWindow();
    const timer = setTimeout(async () => {
      if (hasExecutedTimeout.current || !firstRenderRef.current) return;
      await physicalWindow.hide();
      setIsFirstRender(false);
      hasExecutedTimeout.current = true;
    }, CLOSE_DELAY);

    return () => {
      clearTimeout(timer);
    };
  }, [firstRenderRef, setIsFirstRender]);
  const addClipboardItem = useCallback((text: string | null) => {
    if (!text) return;

    setClipboardItems((prev) => {
      // Create new item

      const newItem: TClipBoard = {
        text: text,
      };

      // Handle case where prev might be null or undefined
      let newItems = [];
      if (prev && prev.length > 0)
        // Add to beginning of array and limit to MAX_CLIPBOARD_ITEMS
        newItems = [newItem, ...prev.filter((item) => item.text !== text)];
      else {
        newItems = [newItem];
      }
      if (newItems.length > 10) {
        return newItems.slice(0, 10);
      }
      return newItems;
    });
  }, []);
  const removeClipboardItem = useCallback((index: number) => {
    setClipboardItems((prev) => {
      const newItems = [...prev];
      newItems.splice(index, 1);
      return newItems;
    });
  }, []);
  const clearAllClipboardItems = useCallback(() => {
    setClipboardItems([]);
  }, []);
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    return {
      stop,
      setStop,
      stopRef,
      isFirstRender,
      clipboardItems,
      searchMode,
      setMessages,
      messages,
      lastMessage,
      sendMessage: MocksendLLMMessage,
      isLoading,
      error,
      input,
      conversation,
      setConversation,
      handleFormSubmit,
      rewrite,
      setLastMessage,
      setError,
      clearAllClipboardItems,
      removeClipboardItem,
      addClipboardItem,
      newChatStarter,
    };
  }, [
    stop,
    setStop,
    stopRef,
    isFirstRender,
    clipboardItems,
    searchMode,
    setMessages,
    messages,
    lastMessage,
    MocksendLLMMessage,
    isLoading,
    error,
    input,
    conversation,
    handleFormSubmit,
    rewrite,
    setLastMessage,
    setError,
    clearAllClipboardItems,
    removeClipboardItem,
    addClipboardItem,
    newChatStarter,
  ]);
  const inputContextValue = useMemo(() => {
    return {
      input,
      setInput,
      searchMode,
      setSearchMode,
      clipboardItems,
      addClipboardItem,
      removeClipboardItem,
      clearAllClipboardItems,
    };
  }, [
    input,
    setInput,
    searchMode,
    setSearchMode,
    clipboardItems,
    addClipboardItem,
    removeClipboardItem,
    clearAllClipboardItems,
  ]);
  return (
    <ChatContext.Provider value={contextValue}>
      <InputContext.Provider value={inputContextValue}>
        {children}
      </InputContext.Provider>
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
export default ChatProvider;
