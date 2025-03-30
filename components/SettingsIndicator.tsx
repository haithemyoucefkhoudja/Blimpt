import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { SettingsIcon } from "lucide-react";

interface SettingsIndicatorProps { 
    activeWindow: string;
    setActiveWindow: () => void;
  }
function SettingsIndicator({ activeWindow, setActiveWindow }: SettingsIndicatorProps) {
    function handleClick(): void {
        setActiveWindow();
    }

    return (
        <Button onClick={handleClick} variant='ghost' type="button" size="icon" className={cn("rounded-full relative ", activeWindow === "settings" ? "bg-accent" : "")}>
          
          <SettingsIcon className="h-4 w-4" />
        </Button>
    );
}

export default SettingsIndicator
