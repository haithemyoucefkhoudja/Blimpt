import { ScrollArea } from "@/components/ui/scroll-area";
import MessageBox from "./message-box";
import { ErrorMessage } from "./error-message";
import { useAppResize } from "./hooks/use-app-resize";
import { memo } from "react";
import { useChat } from "@/providers/chat-provider";

export const MessageDisplay = memo(function MessageDisplay() {
  const { ActiveWindow } = useAppResize();

  const { lastMessage, messages, isLoading, setInput, error, rewrite } =
    useChat();

  if (ActiveWindow !== "chat") return null;
  if (!lastMessage && !error) return null;

  return (
    <div className="flex bg-background relative p-4 rounded-xl border-2 border-foreground/20 w-full">
      <div className="w-full max-h-48 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto p-4 block">
            {error && <ErrorMessage message={error} />}
            {lastMessage && (
              <div className="w-full">
                <MessageBox
                  type="single"
                  rewrite={rewrite}
                  message={lastMessage}
                  messageIndex={messages.length - 1}
                  update={isLoading}
                  sendMessage={setInput}
                />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});
