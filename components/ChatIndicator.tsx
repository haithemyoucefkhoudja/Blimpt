import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { MessageCircle } from "lucide-react";

interface ChatIndicatorProps { 
    activeWindow: string;
    setActiveWindow: () => void;
  }
function ChatIndicator({ activeWindow, setActiveWindow }: ChatIndicatorProps) {
    function handleClick(): void {
        setActiveWindow();
    }

    return (
        <Button onClick={handleClick} variant='ghost' type="button" size="icon" className={cn("rounded-full relative ", activeWindow === "chat" ? "bg-accent" : "")}>
          
          <MessageCircle className="h-4 w-4" />
        </Button>
    );
}

export default ChatIndicator
