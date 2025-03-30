import { ScrollArea } from "@/components/ui/scroll-area"
import MessageBox from "./message-box"
import type { Message } from "@/types/Message"
import { ErrorMessage } from "./error-message"
import { useAppResize } from "./hooks/use-app-resize"
import { memo } from "react"

interface MessageDisplayProps {
  lastMessage: Message | null
  messages: Message[]
  isLoading: boolean
  rewrite: (messageId: string, conversationId: number) => void
  errorMessage: string | null
  setInput: (input: string) => void
}

export const MessageDisplay = memo(function MessageDisplay({
  lastMessage,
  messages,
  isLoading,
  setInput,
  errorMessage,
  rewrite,
}: MessageDisplayProps) {
  const { ActiveWindow } = useAppResize()

  if (ActiveWindow !== "chat") return null
  if (!lastMessage && !errorMessage) return null

  return (
    <div className="flex bg-background relative p-4 rounded-xl border-2 border-foreground/20 w-full">
      <div className="w-full max-h-48 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto p-4 block">
            {errorMessage && <ErrorMessage message={errorMessage} />}
            {lastMessage && (
              <div className="w-full">
                <MessageBox
                  type="single"
                  rewrite={rewrite}
                  message={lastMessage}
                  messageIndex={messages.length - 1}
                  history={messages}
                  loading={isLoading}
                  sendMessage={setInput}
                />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
})

