import { cn } from "@/lib/utils";
import { MessageCirclePlus } from "lucide-react";
import { useChat } from "@/providers/chat-provider";
import { Button } from "../ui/button";
import { useAppResize } from "./hooks/use-app-resize";

function NewChatIndicator() {
  const { ActiveWindow, setActiveWindow } = useAppResize();
  const { isLoading, newChatStarter } = useChat();
  const handleClick = () => {
    if (isLoading.state) return;

    if (ActiveWindow !== "chat") {
      setActiveWindow("chat");
    }
    newChatStarter();
  };
  return (
    <Button
      disabled={isLoading.state}
      onClick={handleClick}
      variant="ghost"
      type="button"
      size="icon"
      className={cn("rounded-full flex-shrink-0  relative")}
    >
      <MessageCirclePlus className="h-6 w-6" />
    </Button>
  );
}

export default NewChatIndicator;
