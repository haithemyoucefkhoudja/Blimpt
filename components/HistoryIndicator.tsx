import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { HistoryIcon } from "lucide-react";
import { useAppResize } from "@/components/shortcut-ui/hooks/use-app-resize";

function HistoryIndicator() {
  const { ActiveWindow, setActiveWindow } = useAppResize();

  const handleClick = () => {
    setActiveWindow("history");
  };

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      type="button"
      size="icon"
      className={cn(
        "rounded-full relative ",
        ActiveWindow === "history" ? "bg-accent" : ""
      )}
    >
      <HistoryIcon className="h-4 w-4" />
    </Button>
  );
}

export default HistoryIndicator;
