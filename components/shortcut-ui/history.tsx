"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import type { Conversation } from "@/types/Conversation";
import { useChat } from "@/providers/chat-provider";
import { useAppResize, useSizeChange } from "./hooks/use-app-resize";
import { useInfiniteConversations } from "@/hooks/use-infinite-query";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { useGetMessages } from "@/hooks/use-messages-query";

interface ConversationListProps {
  onSelectConversation: (id: Conversation) => void;
  selectedConversation: Conversation | null;
}

const WINDOW = "history";
export function ConversationList({
  onSelectConversation,
  selectedConversation,
}: ConversationListProps) {
  const {
    setConversation,
    setError,
    error,
    isLoading: chatLoading,
    setMessages,
  } = useChat();
  const { setActiveWindow } = useAppResize();
  const conversationId = selectedConversation?.id;
  const {
    data: messagesdata,
    isError: isErrorMessage,
    error: errorMeessage,
  } = useGetMessages(conversationId);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error: ErrorConversation,
  } = useInfiniteConversations();

  // Update messages in chat context ONLY when messagesdata changes AND is defined
  useEffect(() => {
    // Check if messagesdata has actually loaded (is not undefined).
    // This prevents setting `undefined` or an empty array during the initial fetch/ID change.
    // console.log("messagesdata:", messagesdata);
    if (messagesdata !== undefined) {
      // console.log("Setting messages in context:", messagesdata); // Keep for debugging if helpful
      setMessages(messagesdata); // Update context with the fetched data
    }
    // Optional: If you want to clear messages when no conversation is selected
    else if (conversationId === null) {
      setMessages([]);
    }
    // Depend on the actual data from the query and the setter function
  }, [messagesdata, conversationId, setMessages]); // <-- CORRECTED DEPENDENCIES

  // Update the selected conversation in the context
  useEffect(() => {
    if (selectedConversation) {
      setConversation(selectedConversation);
    }
    // Maybe clear if deselected?
    // else {
    //   setConversation(null);
    // }
  }, [selectedConversation, setConversation]);

  // Handle errors from the query
  useEffect(() => {
    if (isError || isErrorMessage) {
      setError(
        ErrorConversation.message ||
          errorMeessage?.message ||
          "Failed to load conversations"
      );
    }
  }, [errorMeessage, ErrorConversation, setError]);

  // Flatten the pages of conversations
  const conversations = data?.pages.flat() || [];

  useSizeChange(() => {}, [conversations]);

  useEffect(() => {
    setActiveWindow(WINDOW);
  }, [setActiveWindow]);

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups, conversation) => {
    const date = new Date(conversation.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey = "";

    if (date.toDateString() === today.toDateString()) {
      groupKey = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = "Yesterday";
    } else if (date > new Date(today.setDate(today.getDate() - 7))) {
      groupKey = "This Week";
    } else if (date > new Date(today.setDate(today.getDate() - 30))) {
      groupKey = "This Month";
    } else {
      groupKey = "Older";
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push(conversation);
    return groups;
  }, {} as Record<string, Conversation[]>);

  // Sort conversations within each group by timestamp (newest first)
  Object.keys(groupedConversations).forEach((key) => {
    groupedConversations[key].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });

  // Define the display order of groups
  const groupOrder = ["Today", "Yesterday", "This Week", "This Month", "Older"];

  if (isError) {
    setError("Failed to load conversations");
  }

  return (
    <div className="w-full max-h-48 overflow-hidden px-2">
      <ScrollArea className="h-full p-4">
        <h1 className="text-lg font-bold text-primary mb-4">Conversations:</h1>
        {isLoading || chatLoading ? (
          <div className="text-center text-muted-foreground py-4">
            Loading ...
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : (
          <InfiniteScroll
            onLoadMore={() => fetchNextPage()}
            hasMore={!!hasNextPage}
            isLoading={isLoading}
          >
            {groupOrder.map((groupName) => {
              const groupConversations = groupedConversations[groupName];
              if (!groupConversations || groupConversations.length === 0)
                return null;

              return (
                <div key={groupName} className="mb-4">
                  <h2 className="text-sm font-medium text-muted-foreground mb-2">
                    {groupName}
                  </h2>
                  {groupConversations.map((conversation) => (
                    <Button
                      disabled={selectedConversation?.id === conversation.id}
                      key={conversation.id}
                      id={String(conversation.id)}
                      variant={
                        selectedConversation?.id === conversation.id
                          ? "secondary"
                          : "ghost"
                      }
                      className="w-full justify-start mb-2"
                      onClick={() => onSelectConversation(conversation)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start overflow-x-hidden">
                        <span className="truncate w-full">
                          {conversation.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conversation.timestamp).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              );
            })}
          </InfiniteScroll>
        )}
      </ScrollArea>
    </div>
  );
}
