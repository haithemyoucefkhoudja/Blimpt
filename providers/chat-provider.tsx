import type React from "react"

import { v4 as uuid } from "uuid"
import { type ChatRequestBody, handleChatRequest } from "@/perplexica/search"
import type { Message, StoreMessageResponse } from "@/types/Message"
import { CLOSE_DELAY } from "@/utils/constants"
import type { chatModel } from "@/perplexica/search"
import { useAppResize, useSizeChange } from "@/components/shortcut-ui/hooks/use-app-resize";
import { TClipBoard } from "@/types/clipboard";
import useShortcut from "@/components/shortcut-ui/hooks/use-shortcut";
import { useConfig } from "@/providers/config-provider"
import type { CustomProvider } from "@/types/settings/provider"
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
} from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import type { Conversation } from "@/types/Conversation"

import type { BaseChatModel } from "@langchain/core/language_models/chat_models"
import { ChatOpenAI } from "@langchain/openai"
import { getChatModel } from "@/lib/providers"
import { isWithinTokenLimit } from "gpt-tokenizer/model/gpt-4o"
import { apiStoreMessage } from "@/db/api"
import { editMessage, storeMessage } from "@/db/database"
// import * as Path from '@tauri-apps/api/path'

// Path.appDataDir().then(value=>console.log(value));
interface ChatContextValue {
  messages: Message[]
  lastMessage: Message | null
  sendMessage: (input: string, history: Message[], messageId?: string) => Promise<void>
  isLoading: boolean
  error: string | null
  input: string
  searchMode: string
  clipboardItems: TClipBoard[] | null
  lastClipBoardItem: TClipBoard | null;
  isFirstRender: boolean
  conversation: Conversation | null
  stopRef: React.MutableRefObject<boolean>
  stop: boolean
  addClipboardItem: (item: string) => void // New prop
  removeClipboardItem: (index: number) => void // New prop
  clearAllClipboardItems: () => void // New prop
  setStop: React.Dispatch<React.SetStateAction<boolean>>
  setConversation: React.Dispatch<React.SetStateAction<Conversation | null>>
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setInput: React.Dispatch<React.SetStateAction<string>>
  setSearchMode: React.Dispatch<React.SetStateAction<string>>
  setClipboardItems: React.Dispatch<React.SetStateAction<TClipBoard[] | null>>
  setLastMessage: React.Dispatch<React.SetStateAction<Message | null>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  rewrite: (messageId: string, conversationId: number) => void
  newChatStarter: () => void
  handleFormSubmit: () => void
}

const MAX_RETRIES = 3
const MAX_TOKENS = 50000
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper functions moved outside component to avoid recreation on each render
async function trimHistory(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  query: string,
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const trimmedHistory = [...history]
  let testChat = [...trimmedHistory, { role: "user", content: query }]

  while (!isWithinTokenLimit(testChat as any, MAX_TOKENS) && trimmedHistory.length > 0) {
    trimmedHistory.shift()
    testChat = [...trimmedHistory, { role: "user", content: query }]
  }

  return trimmedHistory
}

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
  let attempts = 0
  while (attempts < maxRetries) {
    try {
      return await fn()
    } catch (error) {
      attempts++
      if (attempts >= maxRetries) {
        throw error
      }
      await delay(1000 * attempts)
    }
  }
  throw new Error("Unexpected error in callWithRetry")
}


const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export const ChatProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // State management
  const [messages, setMessages] = useState<Message[]>([])
  const [lastMessage, setLastMessage] = useState<Message | null>(null)
  const [lastClipBoardItem, setLastclipBoardItem] = useState<TClipBoard | null>(null);
  const [clipboardItems, setClipboardItems] = useState<TClipBoard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [stop, setStop] = useState(true)
  const [searchMode, setSearchMode] = useState("webSearch")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  

  // Refs
  const stopRef = useRef(true)

  // Hooks
  const { config, isDeepThinking, port, isSearch } = useConfig()
  const { isFirstRender, firstRenderRef, setIsFirstRender } = useShortcut({
    onEscape: () => closeWindow(),
  })
  const newChatStarter = () => {
    setMessages([])
    setLastMessage(null)
    setError(null)
    setInput("")
    setStop(true)
    setConversation(null)
  }
  const { ActiveWindowRef } = useAppResize()

  // Sync stopRef with stop state
  useEffect(() => {
    stopRef.current = stop
  }, [stop])

  // Handle window resizing
  useSizeChange(() => {
    // Handler for size changes
  }, [input, lastMessage, clipboardItems, isLoading, error, messages, isFirstRender, conversation?.title])

  // Helper functions
  const closeWindow = useCallback(() => {
    setLastMessage(null)
  }, [])

  const getModel = useCallback(
    (title = false) => {
      let model: chatModel = {} as chatModel
      const selectedModel = isDeepThinking && !title ? config.selectedDeepThinkingModel : config.selectedModel

      switch (selectedModel?.provider) {
        case "DEEPSEEK":
          model = {
            provider: "deepseek",
            model: selectedModel.name.split('||')[0],
            apiKey: config.providers.find((provider) => provider.name === "DEEPSEEK")?.apiKey || "",
          }
          break
        case "OPENAI":
          model = {
            provider: "openai",
            model: selectedModel.name.split('||')[0],
            apiKey: config.providers.find((provider) => provider.name === "OPENAI")?.apiKey || "",
          }
          break
        case "ANTHROPIC":
          model = {
            provider: "anthropic",
            model: selectedModel.name.split('||')[0],
            apiKey: config.providers.find((provider) => provider.name === "ANTHROPIC")?.apiKey || "",
          }
          break
        case "GROQ":
          model = {
            provider: "groq",
            model: selectedModel.name.split('||')[0],
            apiKey: config.providers.find((provider) => provider.name === "GROQ")?.apiKey || "",
          }
          break
        case "GEMINI":
          model = {
            provider: "gemini",
            model: selectedModel.name.split('||')[0],
            apiKey: config.providers.find((provider) => provider.name === "GEMINI")?.apiKey || "",
          }
          break
        case "MISTRAL":
          model = {
            provider: "mistral",
            model: selectedModel.name.split('||')[0],
            apiKey: config.providers.find((provider) => provider.name === "MISTRAL")?.apiKey || "",
          }
          break
        default:
          model = {
            provider: "custom_openai",
            customOpenAIKey: config.providers.find((provider) => provider.name === selectedModel?.provider)?.apiKey,
            customOpenAIBaseURL:
              (config.providers.find((provider) => provider.name === selectedModel?.provider) as CustomProvider)
                ?.baseUrl || "",
            model: selectedModel?.name.split('||')[0] || "",
            apiKey: config.providers.find((provider) => provider.name === selectedModel?.provider)?.apiKey || "",
          }
          break
      }
      return model
    },
    [config, isDeepThinking],
  )

  const updateAssistantMessage = useCallback(
    (assistantMessage: Message) => {
      if (ActiveWindowRef.current === "chat") {
        setLastMessage(assistantMessage)
      }
      setMessages((prev) => {
        return [...prev.filter((msg) => msg.id !== assistantMessage.id), assistantMessage]
      })
    },
    [ActiveWindowRef],
  )

  const saveUserMessage = useCallback(
    async (
      input: string,
      conversation?: Partial<Conversation>,
    ): Promise<{
      res: StoreMessageResponse
      title: string
    }> => {
      try {
        
        // console.log('path:', await path.configDir());
        // Initialize default values
        const timestamp = new Date().toISOString()
        let title = conversation?.title || ""
  
        // If no conversation or no ID, we need to create a new conversation
        const isNewConversation = !conversation || !conversation.id
  
        // Generate a title for new conversations
        if (isNewConversation) {
          try {
            // Try to generate a title based on the input
            title = await updateConversation({
              query: input,
              chatModel: getModel(true),
            })
          } catch (error) {
            // Fallback title if generation fails
            console.error("Failed to generate title:", error)
            title = `Chat ${new Date().toLocaleString()}`
          }
        }
  
        // Prepare conversation object
        const conversationData = {
          id: conversation?.id,
          title: title,
          timestamp: conversation?.timestamp || timestamp,
        }
  
        // Store the message
        const res = await apiStoreMessage(
          {
            id:'',
            content: input,
            role: "user",
            timestamp,
            conversation_id: conversationData.id,
          },
          title,
        )
        if (isNewConversation) { 
          setConversation({
            title: title,
            timestamp,
            id:res.conversation_id
          })
        }
        
  

  
        return {
          res,
          title,
        }
      } catch (error) {
        console.error("Error saving user message:", error)
        throw error
      }
    },
    [getModel, apiStoreMessage], // Removed setConversation since it's commented out
  )

  const updateConversation = useCallback(
    async (body: {
      query: string
      chatModel: chatModel
    }) => {
      let llm: BaseChatModel

      if (body.chatModel.provider === "custom_openai") {
        if (!body.chatModel.customOpenAIKey) {
          throw new Error("Missing customOpenAIKey for custom_openai provider.")
        }
        if (!body.chatModel.customOpenAIBaseURL) {
          throw new Error("Missing customOpenAIBaseURL for custom_openai provider.")
        }

        try {
          llm = new ChatOpenAI({
            modelName: body.chatModel.model,
            openAIApiKey: body.chatModel.customOpenAIKey,
            configuration: {
              baseURL: body.chatModel.customOpenAIBaseURL,
            },
            temperature: 0,
          }) as unknown as BaseChatModel
        } catch (error: any) {
          throw new Error("Error initializing ChatOpenAI: " + error.message)
        }
      } else {
        try {
          llm = (await getChatModel(
            body.chatModel.provider,
            body.chatModel.apiKey,
            body.chatModel.model,
          )) as BaseChatModel
          ;(llm as any).temperature = 0
        } catch (error: any) {
          console.error("Error initializing chat model: " + error.message)
          throw new Error("Error initializing chat model: " + error.message)
        }
      }

      try {
        const stream = await llm.stream(`Summarize this user query into a simple title ****Don't Use MarkDown****: "${body.query}"`)
        let chunks = ""
        let isFirst = true

        for await (const chunk of stream) {
          const llm_content = chunk.content as string
          if (!llm_content && !isFirst) {
            break
          }
          isFirst = false
          chunks += llm_content
          setConversation((prev) => prev && { ...prev, title: chunks })
        }

        return chunks
      } catch (error: any) {
        return body.query
      }
    },
    [],
  )

  const initResponse = useCallback(() => {
    setLastMessage({
      role: "assistant",
      id: "",
      content: "",
      timestamp: "",
    })
    setIsLoading(true)
    setError(null)
    setStop(false)
  }, [])

  const sendLLMMessage = useCallback(
    async (input: string, history: Message[], initMessageId?: string) => {
      const currentModel = getModel()
      const mode = initMessageId ? "edit" : "new"
      
      // ${clipboardText?.current ? "USER CLIPBOARD TEXT:" + clipboardText.current : ""}
      const userContent = `
      ${clipboardItems && clipboardItems.map((msg,index) => `USER CONTEXT-${index}: ${msg.text}`).join("\n")}
      
      ${input}
    `
      const messageId = initMessageId || uuid()
      let title = `NoTitle-${messageId}`
      
      const trimmedHistory = await trimHistory(
        history.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        userContent,
      )

      const requestBody: ChatRequestBody = {
        port: port || "",
        query: userContent,
        chatModel: currentModel,
        history: trimmedHistory.map((msg) => [msg.role === "user" ? "human" : "ai", msg.content]),
        focusMode: searchMode,
        optimizationMode: "balanced",
      }

      const chatGenerator = port && isSearch ? handleChatRequest(requestBody) : handleChatRequestNoPort(requestBody)
      const timestamp = new Date().toISOString()

      let assistantMessage: Message = {
        id: messageId,
        content: "",
        role: "assistant",
        sources: [],
        timestamp: timestamp,
      }

      let userId = uuid()
      let conversation_id = -1
      if (mode === "new") {
        // userId = uuid()
        // const userMessage: Message = {
        //   content: userContent,
        //   role: "user",
        //   id: userId,
        //   timestamp: timestamp,
        // }
        
        const user = await await callWithRetry(
          () => 
          saveUserMessage(userContent, conversation)
          , MAX_RETRIES)
        
        title = user.title
        conversation_id = user.res.conversation_id
        userId = String(user.res.message_id)
        
        

        const userMessage: Message = {
            content: userContent,
            role: "user",
            id: userId,
            timestamp: timestamp,
        }
        setMessages((prev) => [...prev, userMessage])
      }

      for await (const event of chatGenerator) {
        if (stopRef.current) {
          break
        }

        switch (event.type) {
          case "message":
            assistantMessage = {
              ...assistantMessage,
              content: assistantMessage.content + event.data,
            }
            updateAssistantMessage(assistantMessage)
            break
          case "sources":
            assistantMessage = {
              ...assistantMessage,
              sources: event.data,
            }
            updateAssistantMessage(assistantMessage)
            break
          case "reasoning":
            assistantMessage = {
              ...assistantMessage,
              reasoning: assistantMessage.reasoning ? assistantMessage.reasoning + event.data : event.data,
            }
            updateAssistantMessage(assistantMessage)
            break
          case "error":
            setError(event.data)
            setIsLoading(false)
            setStop(true)
            break
          default:
            break
        }
      }

      if (stopRef.current) {
        if (!assistantMessage.content) {
          assistantMessage = {
            ...assistantMessage,
            content: " ",
          }
          updateAssistantMessage(assistantMessage)
        }
      }

      if (mode === "new") {
        

        const StoreRes: StoreMessageResponse | string = await callWithRetry(
          () =>
            storeMessage({
                id:'',
                content: assistantMessage.content,
                role: "assistant",
                timestamp,
                sources: assistantMessage.sources,
                suggestions: assistantMessage.suggestions,
                conversation_id: conversation_id,
                reasoning: assistantMessage.reasoning,
              },
              title,
            ),
          MAX_RETRIES,
        )

        if (typeof StoreRes === "string") {
          throw new Error(StoreRes)
        }

        if (StoreRes.message_id) {
          assistantMessage.id = StoreRes.message_id.toString()
          assistantMessage.conversation_id = StoreRes.conversation_id
          setMessages((prev) => prev.map((msg) => (msg.id === messageId ? assistantMessage : msg)))
        }
      } else {
        const EditRes: string = await callWithRetry(
          () =>
            editMessage(Number(messageId), {
                id:'',
                content: assistantMessage.content,
                role: "assistant",
                timestamp: new Date().toISOString(),
                sources: assistantMessage.sources,
                suggestions: assistantMessage.suggestions,
                conversation_id: conversation.id,
                reasoning: assistantMessage.reasoning,
              }),
          MAX_RETRIES
        )

        if (EditRes !== "success") {
          throw new Error(EditRes)
        }
      }
    },
    [clipboardItems, conversation, getModel, isSearch, port, searchMode, updateAssistantMessage, saveUserMessage],
  )

  const rewrite = useCallback(
    async (messageId: string, conversationId: number) => {
      try {
        initResponse()

        const index = messages.findIndex((msg) => msg.id === messageId)

        if (index === 0) throw new Error("Messages is length of 0")

        const message = messages[index - 1]
        await sendLLMMessage(message.content, messages, messages[index].id)
      } catch (error: any) {
        setError(error instanceof Error ? error.message : "Failed to process message")
        console.error("Error-Container:", error)
      } finally {
        setIsLoading(false)
        setInput("")
        setStop(true)
      }
    },
    [messages, initResponse, sendLLMMessage],
  )

  const handleFormSubmit = useCallback(async () => {
    if (!input.trim()) return

    try {
      const hasSuccessiveUserMessages = messages.length > 0 && messages[messages.length - 1].role === "user"

      initResponse()

      if (hasSuccessiveUserMessages) {
        await rewrite(messages[messages.length - 1].id, conversation?.id || 0)
        return
      }

      await sendLLMMessage(input, messages)
    } catch (error: any) {
      if (typeof error === "string") {
        setError(error)
      } else {
        setError(error instanceof Error ? error.message : "Failed to process message")
      }
      console.error("Error-Container:", error)
    } finally {
      setIsLoading(false)
      setInput("")
      setStop(true)
    }
  }, [input, messages, conversation, initResponse, rewrite, sendLLMMessage])

  // Handle first render and auto-hide
  const hasExecutedTimeout = useRef(false)

  useEffect(() => {
    if (hasExecutedTimeout.current) return;

    const physicalWindow = getCurrentWindow()
    const timer = setTimeout(async () => {
      if (hasExecutedTimeout.current || !firstRenderRef.current) return
      await physicalWindow.hide()
      setIsFirstRender(false)
      hasExecutedTimeout.current = true
    }, CLOSE_DELAY)

    return () => {
      clearTimeout(timer)
    }
  }, [firstRenderRef, setIsFirstRender])
  const addClipboardItem = useCallback((text: string | null) => {
    if (!text) return

    setClipboardItems((prev) => {
      // Create new item
      
      const newItem: TClipBoard = {
        text: text,
      }
      
      // Handle case where prev might be null or undefined
      let newItems = []
      if (prev && prev.length > 0 )
      // Add to beginning of array and limit to MAX_CLIPBOARD_ITEMS
        newItems = [newItem, ...prev.filter((item) => item.text !== text)]
      else {
        newItems = [newItem]
      }
      if (newItems.length > 10) {
        return newItems.slice(0, 10)
      }
      return newItems
    })
  }, [])

  const removeClipboardItem = useCallback((index: number) => {
    
    setClipboardItems((prev) => { 
      const newItems = [...prev]
      newItems.splice(index, 1)
      return newItems
    })
  }, [])

  const clearAllClipboardItems = useCallback(() => {
    setClipboardItems([])
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      stop,
      setStop,
      stopRef,
      isFirstRender,
      clipboardItems,
      lastClipBoardItem,
      searchMode,
      setMessages,
      messages,
      lastMessage,
      sendMessage: sendLLMMessage,
      isLoading,
      error,
      input,
      conversation,
      setConversation,
      setInput,
      setSearchMode,
      setClipboardItems,
      handleFormSubmit,
      rewrite,
      setLastMessage,
      setError,
      clearAllClipboardItems,
      removeClipboardItem,
      addClipboardItem,
      newChatStarter
    }),
    [
      stop,
      isFirstRender,
      clipboardItems,
      searchMode,
      messages,
      lastMessage,
      sendLLMMessage,
      isLoading,
      error,
      input,
      conversation,
      setInput,
      setSearchMode,
      handleFormSubmit,
      rewrite,
      clearAllClipboardItems,
      removeClipboardItem,
      addClipboardItem,
      newChatStarter
    ],
  )

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
}

// Helper function for handling chat requests without port
async function* handleChatRequestNoPort(body: ChatRequestBody) {
  let llm: BaseChatModel

  if (body.chatModel.provider === "custom_openai") {
    if (!body.chatModel.customOpenAIKey) {
      throw new Error("Missing customOpenAIKey for custom_openai provider.")
    }
    if (!body.chatModel.customOpenAIBaseURL) {
      throw new Error("Missing customOpenAIBaseURL for custom_openai provider.")
    }

    try {
      llm = new ChatOpenAI({
        modelName: body.chatModel.model,
        openAIApiKey: body.chatModel.customOpenAIKey,
        configuration: { baseURL: body.chatModel.customOpenAIBaseURL },
      }) as unknown as BaseChatModel
    } catch (error: any) {
      console.error("Error initializing OpenAI chat model: " + error.message)
      yield { type: "error", data: "Error initializing OpenAI chat model: " + error.message }
      return
    }
  } else {
    try {
      llm = (await getChatModel(body.chatModel.provider, body.chatModel.apiKey, body.chatModel.model)) as BaseChatModel
    } catch (error: any) {
      console.error("Error initializing chat model: " + error.message)
      yield { type: "error", data: "Error initializing chat model: " + error.message }
      return
    }
  }

  // Initiate the chat stream
  const stream = await llm.stream([...body.history, ["human", body.query]])
  let isFirst = true

  for await (const chunk of stream) {
    // console.log('chunk:', chunk)
    const reasoning_content = chunk.additional_kwargs?.reasoning_content as string
    const llm_content = chunk.content as string

    if (!llm_content && !isFirst && !reasoning_content) {
      break
    }

    isFirst = false

    // Yield the message chunk
    if (llm_content) {
      yield { type: "message", data: llm_content }
    }

    if (reasoning_content) {
      yield { type: "reasoning", data: reasoning_content }
    }
  }

  // Finalize the stream
  yield { type: "end" }
}

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}

export default ChatProvider

