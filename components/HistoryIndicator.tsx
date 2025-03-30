import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { HistoryIcon } from "lucide-react";

interface HistoryIndicatorProps { 
    activeWindow: string;
    setActiveWindow: () => void;
  }
function HistoryIndicator({ activeWindow, setActiveWindow }: HistoryIndicatorProps) {
    function handleClick(): void {
        setActiveWindow();
    }

    return (
        <Button onClick={handleClick} variant='ghost' type="button" size="icon" className={cn("rounded-full relative ", activeWindow === "history" ? "bg-accent" : "")}>
          
          <HistoryIcon className="h-4 w-4" />
        </Button>
    );
}

export default HistoryIndicator
