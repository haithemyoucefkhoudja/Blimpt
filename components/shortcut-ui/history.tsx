"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare } from "lucide-react"
// import { invoke } from "@tauri-apps/api/core"
import { Conversation } from "@/types/Conversation"
import { useChat } from "@/providers/chat-provider"
import { Message } from "@/types/Message"
import { useAppResize, useSizeChange } from "./hooks/use-app-resize"
import { apiGetConversations } from "@/db/api"
import { getMessages } from "@/db/database"

interface ConversationListProps {
  onSelectConversation: (id: Conversation) => void
  selectedConversation: Conversation | null
}

const WINDOW = 'history';
export function ConversationList({ onSelectConversation, selectedConversation }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const { setMessages, setConversation, setError, error, isLoading } = useChat();
  const { setActiveWindow, } = useAppResize()
  useSizeChange(() => { }, [
    conversations
  ])
  useEffect(() => {
    setActiveWindow(WINDOW)
  }, [setActiveWindow]);

  useEffect(() => { 
    
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          
          const fetchedMessages:Message[] = await getMessages(selectedConversation.id)
          setMessages(fetchedMessages)
          setConversation(selectedConversation);
        } catch (error) {
          if (typeof(error) == 'string')
            setError(error as string)
          else if (error.message) setError(error.message)
          console.error("Failed to fetch messages:", error)
        }
      }
      fetchMessages()
    }
  }, [selectedConversation?.id])
  // Fetch conversations when component mounts
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await apiGetConversations()
        setConversations(data)
      } catch (err) {
        console.error("Error fetching conversations:", err)
        setError("Failed to load conversations")
      } finally {
      }
    }

    fetchConversations()
  }, [])

  // Group conversations by date
  const groupedConversations = conversations.reduce(
    (groups, conversation) => {
      const date = new Date(conversation.timestamp)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let groupKey = ""

      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday"
      } else if (date > new Date(today.setDate(today.getDate() - 7))) {
        groupKey = "This Week"
      } else if (date > new Date(today.setDate(today.getDate() - 30))) {
        groupKey = "This Month"
      } else {
        groupKey = "Older"
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }

      groups[groupKey].push(conversation)
      return groups
    },
    {} as Record<string, Conversation[]>,
  )

  // Sort conversations within each group by timestamp (newest first)
  Object.keys(groupedConversations).forEach((key) => {
    groupedConversations[key].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  })

  // Define the display order of groups
  const groupOrder = ["Today", "Yesterday", "This Week", "This Month", "Older"]

  return (
    <div className="w-full max-h-48 overflow-hidden px-2">
      <ScrollArea className="h-full p-4">
        <h1 className="text-lg font-bold text-primary mb-4">Conversations:</h1>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-4">Loading ...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : (
          groupOrder.map((groupName) => {
            const groupConversations = groupedConversations[groupName]
            if (!groupConversations || groupConversations.length === 0) return null

            return (
              <div key={groupName} className="mb-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-2">{groupName}</h2>
                {groupConversations.map((conversation) => (
                  <Button
                    disabled={selectedConversation?.id === conversation.id}
                    key={conversation.id}
                    id={String(conversation.id)}
                    variant={selectedConversation?.id === conversation.id ? "secondary" : "ghost"}
                    className="w-full justify-start mb-2"
                    onClick={() => onSelectConversation(conversation)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start overflow-x-hidden">
                      <span className="truncate w-full">{conversation.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            )
          })
        )}
      </ScrollArea>
    </div>
      
  )
}

