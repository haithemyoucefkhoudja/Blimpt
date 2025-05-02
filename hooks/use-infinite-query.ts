import { useInfiniteQuery } from "@tanstack/react-query"
import { getConversations, getMessages } from "@/db/database"

// Conversations infinite query
export function useInfiniteConversations(pageSize = 10) {
  return useInfiniteQuery({
    queryKey: ["conversations"],
    queryFn: async ({ pageParam = 0 }) => {
      const conversations = await getConversations(pageParam, pageSize)
      return conversations
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === pageSize ? allPages.length : undefined
    },
    initialPageParam: 0,
  })
}

// Messages infinite query
export function useInfiniteMessages(conversationId: number | null, pageSize = 3) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
      queryFn: async ({ pageParam = 0 }) => {
          console.log('conversationID:', conversationId);
      if (!conversationId) return []
        const messages = await getMessages(conversationId, pageParam, pageSize)
        
      return messages
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === pageSize ? allPages.length : undefined
    },
    initialPageParam: 0,
    enabled: !!conversationId,
  })
}
