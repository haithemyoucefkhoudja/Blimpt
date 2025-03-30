import type { Message } from "@/types/Message"
import MessageBox from "./message-box"
import { memo, useEffect,  } from "react"
import { ListScrollArea } from "../ui/list-scroll-area"
import { useAppResize } from "./hooks/use-app-resize"
import { ErrorMessage } from "./error-message"

interface MessageListProps {
  messages: Message[]
  isLoading: boolean;
  errorMessage: string;
  rewrite: (messageId: string, conversationId: number) => void
}
const WINDOW = 'list'
const MessageList = memo(function MessageList({ messages, errorMessage, rewrite, isLoading }: MessageListProps) {
  const {setActiveWindow} = useAppResize()
  // Set the active window once on component mount
  useEffect(() => {
    
    setActiveWindow(WINDOW);
  },[setActiveWindow])

  return (
    <div className="w-full max-h-96 overflow-hidden px-2" data-tauri-drag-region>
      <ListScrollArea className="h-full" data-tauri-drag-region >
      {/* <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] "
      ref={scrollAreaRef}
      > */}
        <div className="mx-auto p-2 block" data-tauri-drag-region>
          
          {errorMessage && <ErrorMessage message={errorMessage} />}
          {messages.map((message, index) => (
            <div key={message.id + index} className="w-full">
              <MessageBox
                loading={isLoading}
                rewrite={rewrite}
                message={message}
                messageIndex={index}
                history={messages}
                type="list"
              />
            </div>
          ))}
          
          </div>
      {/* </ScrollAreaPrimitive.Viewport> */}
      </ListScrollArea>
      
    </div>
  )
})

export default MessageList

