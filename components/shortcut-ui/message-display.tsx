import { ScrollArea } from "@/components/ui/scroll-area";
import MessageBox from "./message-box";
import { ErrorMessage } from "./error-message";
import { useAppResize } from "./hooks/use-app-resize";
import { memo } from "react";
import { useChat } from "@/providers/chat-provider";
import { useConfig } from "@/providers/config-provider";
import { cn } from "@/lib/utils";
const MessageDisplayWrapper = memo(function MessageDisplayWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { messageDisplayRef } = useAppResize();
  const { config } = useConfig();
  const { LAYOUT_MODE } = config;
  return (
    <div
      ref={messageDisplayRef}
      className={cn(
        "flex bg-background relative p-4 rounded-xl border-2 border-foreground/20 w-full ",
        LAYOUT_MODE === "vertical" ? "flex-1" : "min-w-[450px]"
      )}
      data-tauri-drag-region
      // style={{ width: LAYOUT_MODE === "horizontal" ? mainDivWidth : "auto" }}
    >
      {children}
    </div>
  );
});
export const MessageDisplay = memo(function MessageDisplay() {
  const { ActiveWindow } = useAppResize();
  const { config } = useConfig();
  const { LAYOUT_MODE } = config;
  const { messages, error, rewrite, lastMessage } = useChat();
  const lastMessageVisible =
    (!!lastMessage?.content ||
      !!lastMessage?.attachments ||
      !!lastMessage?.action) &&
    !lastMessage.hidden;

  if (ActiveWindow !== "chat") return null;
  if (!lastMessageVisible && !error) return null;

  return (
    <MessageDisplayWrapper>
      <div
        className={cn(
          "w-full  overflow-hidden",
          LAYOUT_MODE === "vertical" ? "max-h-48" : "max-h-96 flex-1"
        )}
        data-tauri-drag-region
      >
        <ScrollArea className="h-full">
          <div className="mx-auto p-4 block" data-tauri-drag-region>
            {error && <ErrorMessage message={error} />}
            {lastMessageVisible && (
              <div className="w-full">
                <MessageBox
                  type="single"
                  rewrite={rewrite}
                  message={lastMessage}
                  messageIndex={messages.length - 1}
                />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </MessageDisplayWrapper>
  );
});
