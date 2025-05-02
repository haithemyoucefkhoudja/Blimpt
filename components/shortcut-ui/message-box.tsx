"use client"

import { cn } from "@/lib/utils"
import type { Message } from "@/types/Message"
import { BookCopy, Layers3, Plus, Share, UserIcon } from "lucide-react"
import { memo, useEffect, useRef, useState } from "react"
import { MarkdownMessage } from "@/components/ui/react-markdown"
import MessageSources from "./message-sources"
import Copy from "../Copy"
import Rewrite from "../Rewrite"

const MessageBox = memo(function MessageBox({
  message,
  messageIndex,
  history,
  rewrite,
  loading,
  type,
  sendMessage,
}: {
  message: Message;
  messageIndex: number;
  history: Message[];
  loading?: boolean;
  rewrite: (messageId: string, conversationId: number) => void;
  type: 'list' | 'single';
  sendMessage?: (message: string) => void;
  }) {
  const [parsedMessage, setParsedMessage] = useState(message.content);
  useEffect(() => {
    const regex = /\[(\d+)\]/g;

    if (
      message.role === "assistant" &&
      message?.sources &&
      message.sources.length > 0
    ) {
      setParsedMessage(
        message.content.replace(
          regex,
          (_, number) =>
            `<a href="${message.sources?.[number - 1]?.metadata?.url
            }" target="_blank" class="bg-light-secondary dark:bg-dark-secondary px-1 rounded ml-1 no-underline text-xs text-black/70 dark:text-white/70">${number}</a>`
        )
      );
    } else {
      setParsedMessage(message.content);
    }
  }, [message.content, message.sources, message.role]);
  
  return (
    <div className={cn("w-full max-w-full break-words")} data-tauri-drag-region >
      {message.role === "user" && (
        <div className="flex flex-col space-y-2" data-tauri-drag-region>
          <div className="flex flex-row items-center space-x-2 mx-1" data-tauri-drag-region>
            <UserIcon className="text-black dark:text-white" size={25} />
            <h3 className="text-black dark:text-white font-medium text-xl">
              You:
            </h3>
          </div>
          <div className={cn("w-full", messageIndex === 0 ? "pt-0" : "py-2")} data-tauri-drag-region>
            <p className=" break-words text-wrap">{message.content}</p>
          </div>
        </div>
      )}

      {message.role === "assistant" && (
        <div data-tauri-drag-region className="flex flex-col space-y-9 lg:space-y-0 lg:flex-row lg:justify-between w-full lg:space-x-9">
          <div data-tauri-drag-region className="flex flex-col space-y-6 w-full lg:w-9/12">
            {message.sources && message.sources.length > 0 && (
              <div data-tauri-drag-region className="flex flex-col space-y-2">
                <div data-tauri-drag-region className="flex flex-row items-center space-x-2">
                  <BookCopy className="text-black dark:text-white" size={20} />
                  <h3 className="text-black dark:text-white font-medium text-xl">
                    Sources
                  </h3>
                </div>
                <MessageSources sources={message.sources} />
                
              </div>
            )}
            <div data-tauri-drag-region className="flex flex-col space-y-2">
              <div data-tauri-drag-region className="flex flex-row items-center space-x-2">
                {loading ? (
                  <div data-tauri-drag-region className="w-10 h-10 aspect-square flex items-center justify-center">
                    <object
                      type="image/svg+xml"
                      data="/AnimatedLoading.svg"
                      className="w-full h-full p-0"
                    >
                      Your browser does not support SVG
                    </object>
                  </div>
                ) : (
                  <div data-tauri-drag-region className="w-10 h-10 aspect-square flex items-center justify-center">
                    <object
                      type="image/svg+xml"
                      data="/bot-logo.svg"
                      className="w-full h-full p-0"
                    >
                      Your browser does not support SVG
                    </object>
                  </div>
                )}
                <h3 className="text-black dark:text-white font-medium text-xl">
                  Answer:
                </h3>
              </div>
              
              <MarkdownMessage reasoning={message.reasoning} content={parsedMessage}></MarkdownMessage>
              {loading ? null : (
                <div data-tauri-drag-region className="flex flex-row items-center justify-between w-full text-black dark:text-white py-4 -mx-2">
                  <div data-tauri-drag-region className="flex flex-row items-center space-x-1">
                    <button className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black text-black dark:hover:text-white">
                      <Share size={18} />
                    </button>
                    <Rewrite type={type} rewrite={() => {
                      rewrite(message.id, message.conversation_id as number);
                      
                    }} messageId={message.id} />
                  </div>
                  <div data-tauri-drag-region className="flex flex-row items-center space-x-1">
                    <Copy initialMessage={message.content} message={message} />
                  </div>
                </div>
              )}
              {message.suggestions &&
                message.suggestions.length > 0 &&
                message.role === "assistant" &&
                !loading && (
                  <>
                    <div data-tauri-drag-region className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                    <div data-tauri-drag-region className="flex flex-col space-y-3 text-black dark:text-white">
                      <div data-tauri-drag-region className="flex flex-row items-center space-x-2 mt-4">
                        <Layers3 />
                        <h3 className="text-xl font-medium">Related</h3>
                      </div>
                      <div data-tauri-drag-region className="flex flex-col space-y-3">
                        {message.suggestions.map(
                          (suggestion: string, i: number) => (
                            <div data-tauri-drag-region
                              className="flex flex-col space-y-3 text-sm"
                              key={i}
                            >
                              <div data-tauri-drag-region className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                              <div
                                onClick={() => {
                                  sendMessage && sendMessage(suggestion);
                                }}
                                className="cursor-pointer flex flex-row justify-between font-medium space-x-2 items-center"
                              >
                                <p className="transition duration-200 hover:text-[#24A0ED]">
                                  {suggestion}
                                </p>
                                <Plus
                                  size={20}
                                  className="text-[#24A0ED] flex-shrink-0"
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
});
export default MessageBox

