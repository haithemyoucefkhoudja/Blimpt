"use client";
import { memo, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual"; // Import the hook
import { useAppResize } from "./hooks/use-app-resize"; // Assuming useSizeChange is no longer needed
import { ErrorMessage } from "./error-message";
import MessageBox from "./message-box";
import type { Message } from "@/types/Message";
import { ListScrollArea } from "../ui/list-scroll-area";

interface MessageListProps {
  messages: Message[] | null;
  isLoading: boolean;
  errorMessage: string;
  rewrite: (messageId: string, conversationId: number) => void;
  conversationId: number | null;
}

const WINDOW = "list";
const ESTIMATED_MESSAGE_HEIGHT = 100; // Adjust based on your average message height

const MessageList = memo(function MessageList({
  messages,
  isLoading: chatLoading,
  errorMessage,
  rewrite,
  conversationId,
}: MessageListProps) {
  const { setActiveWindow } = useAppResize();
  const parentRef = useRef<HTMLDivElement>(null); // Ref for the scroll container
  // console.log("messages:", messages);
  // Set the active window once on component mount
  useEffect(() => {
    setActiveWindow(WINDOW);
  }, [setActiveWindow]);
  // console.log("messages:", messages);
  // console.log("conversationId:", conversationId);
  const rowVirtualizer = useVirtualizer({
    count: messages?.length ?? 0,
    // Get the scrollable element. This might need adjustment
    // depending on how ListScrollArea renders. If it uses Radix UI Scroll Area,
    // you might need to target the viewport specifically.
    // This assumes ListScrollArea forwards the ref to the scrollable element
    // or its immediate parent. A querySelector might be more robust if needed:
    // getScrollElement: () => parentRef.current?.querySelector('[data-radix-scroll-area-viewport]') || parentRef.current,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_MESSAGE_HEIGHT, // Provide an estimated height
    // overscan: 5, // Render a few extra items for smoother scrolling
    // Enable virtualization only when we have messages and a conversation
    enabled: !!conversationId && !!messages && messages.length > 0,
  });

  // Get the virtual items to render
  const virtualItems = rowVirtualizer.getVirtualItems();
  // console.log("virtualItems:", virtualItems);
  // Calculate the total size for the scroll container
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div
      className="w-full flex-1 overflow-hidden px-2 flex flex-col" // This parent needs a height constraint from *its* parent for flex-1 to work vertically.
      data-tauri-drag-region
    >
      {/* Error message can stay outside the scroll area if desired */}
      {errorMessage && (
        <div className="p-2 shrink-0">
          <ErrorMessage message={errorMessage} />
        </div>
      )}

      {/* The main scrollable area */}
      {/* Removed <ListScrollArea> */}

      {/* Conditionally render based on conversation and messages */}
      {!conversationId ? (
        <div className="text-center text-muted-foreground p-4 flex-1 flex items-center justify-center">
          {" "}
          {/* Added flex centering for placeholders */}
          Select a conversation to view messages
        </div>
      ) : !messages || messages.length === 0 ? (
        !chatLoading ? (
          <div className="text-center text-muted-foreground p-4 flex-1 flex items-center justify-center">
            {" "}
            {/* Added flex centering */}
            No messages in this conversation
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-4 flex-1 flex items-center justify-center">
            {" "}
            {/* Added flex centering */}
            Loading messages...
          </div>
        )
      ) : (
        // ---- Virtualization Container ----
        // **** CHANGE HERE: Added h-full ****
        // This div needs to have a constrained height to scroll.
        // h-full makes it try to fill its parent (the flex-1 container).
        // This ONLY works if the flex-1 parent actually receives a height from ITS parent.
        // <div className="w-full h-96 overflow-y-auto" ref={parentRef}>
        <ListScrollArea ref={parentRef}>
          <div
            className="relative w-full" // Added w-full here too for safety
            style={{
              height: `${totalSize}px`,
            }}
          >
            {/* Inner container for positioning virtual items */}
            <div
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
              }}
            >
              {virtualItems.map((virtualRow) => {
                const message = messages[virtualRow.index];
                // console.log("message:", message); // Keep for debugging if needed
                if (!message) return null;

                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="w-full" // Item wrapper
                  >
                    {/* Render your MessageBox component */}
                    <MessageBox
                      loading={
                        chatLoading && virtualRow.index === messages.length - 1
                      }
                      rewrite={rewrite}
                      message={message}
                      messageIndex={virtualRow.index}
                      history={messages}
                      type="list"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </ListScrollArea>
        // ---- End Virtualization Container ----
      )}
    </div>
  );
});

export default MessageList;
