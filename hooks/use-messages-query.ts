import { getAllMessages } from "@/db/database";
import { useQuery } from "@tanstack/react-query";

// Messages infinite query
export function useGetMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const messages = await getAllMessages(conversationId);

      return messages;
    },
    enabled: !!conversationId,
  });
}
