"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import type { Conversation } from "@/types/Conversation";
import { useChat } from "@/providers/chat-provider";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { useGetMessages } from "@/hooks/use-messages-query";
import { ListScrollArea } from "../ui/list-scroll-area";
import { useConversations } from "@/providers/chat-provider";

export function ConversationList() {
  const {
    setConversation,
    setError,
    error,
    isLoading: chatLoading,
    setMessages,
    conversation,
  } = useChat();

  const onSelectConversation = (conversation: Conversation) => {
    setConversation(conversation);
  };

  const conversationId = conversation?.id;
  const {
    data: messagesdata,
    isError: isErrorMessage,
    error: errorMeessage,
  } = useGetMessages(conversationId);
  const {
    conversations,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error: ErrorConversation,
  } = useConversations();

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
  // useEffect(() => {
  //   if (conversation) {
  //     console.log("Conversation selected:", conversation);
  //     setConversation(conversation);
  //   }
  // }, [conversation, setConversation]);

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

  // useSizeChange(() => {}, [conversations]);

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
    <div className="w-full  max-h-96 overflow-hidden px-2">
      <ListScrollArea className="h-full p-4">
        <h1 className="text-lg font-bold text-primary mb-4">Conversations:</h1>
        {isLoading || chatLoading.state ? (
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
                  {groupConversations.map((conversationItem) => (
                    <Button
                      disabled={conversation?.id === conversationItem.id}
                      key={conversationItem.id}
                      id={String(conversationItem.id)}
                      variant={
                        conversation?.id === conversationItem.id
                          ? "secondary"
                          : "ghost"
                      }
                      className="w-full justify-start mb-2"
                      onClick={() => onSelectConversation(conversationItem)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start overflow-x-hidden">
                        <span className="truncate w-full text-left">
                          {conversationItem.title}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              conversationItem.timestamp
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              conversationItem.timestamp
                            ).toLocaleDateString([], {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              );
            })}
          </InfiniteScroll>
        )}
      </ListScrollArea>
    </div>
  );
}
ConversationList.displayName = "ConversationList";
