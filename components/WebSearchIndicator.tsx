import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlobeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { CHECKSEARXNG_TIMOUT } from "@/utils/constants";
import { useConfig } from "@/providers/config-provider";
import { useAppResize } from "@/components/shortcut-ui/hooks/use-app-resize";

export default function WebSearchIndicator() {
  const { ActiveWindow, setActiveWindow } = useAppResize();

  const [isOn, setIsOn] = useState(false);
  const { setPort } = useConfig();
  useEffect(() => {
    const checkSearxng = async () => {
      invoke<string>("get_searxng_state")
        .then((port) => {
          setIsOn(!!port);
          if (port) {
            setPort(port);
          } else {
            setPort(null);
          }
        })
        .catch(console.error);
    };

    const timer: NodeJS.Timeout = setInterval(() => {
      checkSearxng();
    }, CHECKSEARXNG_TIMOUT);

    checkSearxng();
    // Listen for "searxng-check" events and update state
    const unlisten = listen("searxng-done", (_) => {
      setIsOn(true);
    });
    return () => {
      unlisten.then((f) => f());
      if (timer) clearInterval(timer);
    };
  }, []);

  const handleClick = async () => {
    setActiveWindow("commands");
    // try {
    //   const wins = await getAllWebviewWindows();
    //   const commandsWin = wins.find((w) => w.label === "commands");
    //   if (commandsWin) {
    //     await commandsWin.show();
    //   } else {
    //     console.warn("Commands window not found");
    //   }
    // } catch (error) {
    //   console.error("Failed to summon commands window", error);
    // }
  };

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      type="button"
      size="icon"
      className={cn(
        "rounded-full relative ",
        ActiveWindow === "commands" ? "bg-accent" : ""
      )}
    >
      <span
        className={cn(
          "absolute top-0 right-0 h-3 w-3 rounded-full ",
          isOn ? "bg-green-400" : "bg-red-400 animate-bounce"
        )}
      />
      <GlobeIcon className="h-4 w-4" />
    </Button>
  );
}
