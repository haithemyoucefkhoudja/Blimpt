import { HeartIcon } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
interface DonationIndicatorProps {
  activeWindow: string;
  setActiveWindow: (window: string) => void;
}
function DonationIndicator({
  activeWindow,
  setActiveWindow,
}: DonationIndicatorProps) {
  return (
    <Button
      variant="ghost"
      type="button"
      size="icon"
      className={cn(
        "rounded-full relative hover:bg-red-400 ",
        activeWindow === "donation" ? "bg-red-500" : ""
      )}
      onClick={() => setActiveWindow("donation")}
    >
      <HeartIcon className="h-4 w-4" />
    </Button>
  );
}

export default DonationIndicator;
