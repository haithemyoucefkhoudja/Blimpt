"use client";

import type { Message } from "@/types/Message";
import MessageBox from "./message-box";
import { memo, useRef, useMemo, useEffect } from "react";
import { Virtuoso } from "react-virtuoso";

interface VirtualizedMessageListProps {
  messages: Message[];
  isLoading: boolean;
  errorMessage: string;
  rewrite: (messageId: string) => void;
}
const MIN_MESSAGE_HEIGHT = 600;

const calculateMessageHeight = (message: Message) => {
  const words = message.content.split(/\s+/).length;
  const lineWidth = 80; // chars per line (adjust based on your UI)
  const lineHeight = 24; // px
  const lines = Math.ceil(words / lineWidth);
  return Math.max(lines * lineHeight, MIN_MESSAGE_HEIGHT);
};
const VirtualizedMessageList = memo(function VirtualizedMessageList({
  messages,
  errorMessage,
  rewrite,
  isLoading,
}: VirtualizedMessageListProps) {
  const virtuosoRef = useRef<any>(null);
  const itemSizes = useMemo(
    () => messages.map(calculateMessageHeight),
    [messages]
  );
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (virtuosoRef.current && messages.length > 0) {
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: messages.length - 1,
          behavior: "auto",
          align: "end",
        });
      }, 0);
    }
  }, [messages.length]);

  const Components = useMemo(() => {
    return {
      Item: memo(({ children, ...props }: any) => (
        <div {...props} className="py-1">
          {children}
        </div>
      )),
      List: memo(({ children, ...props }: any) => (
        <div {...props} className="w-full h-full">
          {children}
        </div>
      )),
      EmptyPlaceholder: memo(() =>
        errorMessage ? (
          <div className="p-4 text-red-500">{errorMessage}</div>
        ) : null
      ),
    };
  }, [errorMessage]);

  const itemContent = useMemo(() => {
    return (index: number) => {
      const message = messages[index];
      return (
        <MessageBox
          rewrite={rewrite}
          message={message}
          messageIndex={index}
          type="list"
        />
      );
    };
  }, [messages, isLoading, rewrite]);

  const getItemSize = (
    el: HTMLElement,
    field: "offsetHeight" | "offsetWidth"
  ) => {
    const index = Number(el.getAttribute("data-index"));
    // console.log('index:', index);
    return itemSizes[index] || MIN_MESSAGE_HEIGHT;
  };
  const totalHeight = itemSizes.reduce((sum, h) => sum + h, 0);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-[28rem]">
        {" "}
        {/* Container that allows shrinking */}
        {/* <Virtuoso
          ref={virtuosoRef}
          data={messages}
          itemContent={itemContent}
          components={Components}
          totalCount={messages.length}
          overscan={window.innerHeight * 2} // Overscan more items for smoother scrolling
        
          followOutput
          alignToBottom={true}
          increaseViewportBy={{ top: 0, bottom: 200 }} // Extra space at bottom
          
          // Better scroll behavior
        //   scrollBehavior={(behavior:any) => {
        //     if (behavior === 'smooth') return 'auto' // Disable smooth scrolling
        //     return behavior
        //   }}
          // Better item height estimation
          computeItemKey={(index) => messages[index]?.id || index}
          defaultItemHeight={120} // Adjust based on your typical message height
          
          // Disable window scroll
          useWindowScroll={false}
          style={{ height: '100%' }} // Ensure Virtuoso takes full height
        /> */}
        <Virtuoso
          data={messages}
          itemContent={(index) => itemContent(index)}
          itemSize={getItemSize}
          overscan={window.innerHeight * 2}
          totalListHeightChanged={(height) =>
            console.log("Total height:", height)
          }
          ref={virtuosoRef}
          style={{ height: "100%" }}
          components={{
            Item: ({ children, ...props }) => (
              <div {...props} data-index={props["data-index"]}>
                {children}
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
});

export default VirtualizedMessageList;
