import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { MessageCircleMore } from "lucide-react";

interface ExpandIndicatorProps { 
    activeWindow: string;
    setActiveWindow: () => void;
  }
function ExpandIndicator({ activeWindow, setActiveWindow }: ExpandIndicatorProps) {
    function handleClick(): void {
        setActiveWindow();
    }

    return (
        <Button onClick={handleClick} variant='ghost' type="button" size="icon" className={cn("rounded-full relative ", activeWindow === "list" ? "bg-accent" : "")}>
          
          <MessageCircleMore className="h-4 w-4" />
        </Button>
    );
}

export default ExpandIndicator
