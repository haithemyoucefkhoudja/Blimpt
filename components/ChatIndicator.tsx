import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { MessageCircle } from "lucide-react";
import { useAppResize } from "@/components/shortcut-ui/hooks/use-app-resize";

function ChatIndicator() {
  const { ActiveWindow, setActiveWindow } = useAppResize();

  const handleClick = () => {
    setActiveWindow("chat");
  };

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      type="button"
      size="icon"
      className={cn(
        "rounded-full relative ",
        ActiveWindow === "chat" ? "bg-accent" : ""
      )}
    >
      <MessageCircle className="h-4 w-4" />
    </Button>
  );
}

export default ChatIndicator;
