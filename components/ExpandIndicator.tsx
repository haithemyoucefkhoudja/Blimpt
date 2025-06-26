import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { MessageCircleMore } from "lucide-react";
import { useAppResize } from "@/components/shortcut-ui/hooks/use-app-resize";

function ExpandIndicator() {
  const { ActiveWindow, setActiveWindow } = useAppResize();
  function handleClick(): void {
    setActiveWindow("list");
  }

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      type="button"
      size="icon"
      className={cn(
        "rounded-full relative ",
        ActiveWindow === "list" ? "bg-accent" : ""
      )}
    >
      <MessageCircleMore className="h-4 w-4" />
    </Button>
  );
}

export default ExpandIndicator;
