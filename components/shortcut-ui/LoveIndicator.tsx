import { HeartIcon } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
function LoveIndicator() {
  return (
    <Button
      asChild
      variant="ghost"
      type="button"
      size="icon"
      className={cn("rounded-full relative hover:bg-red-400")}
    >
      <a target="_blank" href="https://donorbox.org/donate-blimpt">
        <HeartIcon className="h-4 w-4" />
      </a>
    </Button>
  );
}

export default LoveIndicator;
