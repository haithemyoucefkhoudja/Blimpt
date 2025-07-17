import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import HideButton from "../HideButton";
import { useEffect, useState } from "react";
import { Shortcut } from "@/types/shortcut";
import { invoke } from "@tauri-apps/api/core";
import { Fragment } from "react";

function FirstRender() {
  const [keys, setKeys] = useState<Shortcut>([]);
  async function getCurrentShortcut(windowLabel: string) {
    try {
      const res: string = await invoke("get_current_shortcut", { windowLabel });
      if (windowLabel === "main") {
        setKeys(res?.split("+"));
      } else {
        setKeys(res?.split("+"));
      }
    } catch (err) {
      console.error(`Failed to fetch shortcut for ${windowLabel}:`, err);
    }
  }
  useEffect(() => {
    getCurrentShortcut("main");
  }, []);
  return (
    <Card
      data-tauri-drag-region
      className="w-[280px] shadow-lg bg-background/95 rounded-xl backdrop-blur border-neutral-500/80 h-full "
    >
      <CardContent data-tauri-drag-region className="p-0">
        <div className="w-full items-center flex justify-end p-4">
          <HideButton></HideButton>
        </div>
        <div
          data-tauri-drag-region
          className="w-full aspect-square flex items-center justify-center relative"
        >
          <object
            type="image/svg+xml"
            data="/animated.svg"
            className="w-full h-full p-0"
            data-tauri-drag-region
          >
            Your browser does not support SVG
          </object>
          <div
            className="absolute top-0 left-0 w-full h-full "
            data-tauri-drag-region
          ></div>
        </div>
        <div data-tauri-drag-region className="p-4 text-center">
          <h3 className="font-semibold text-sm mb-1">AI Assistant</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Always here to help
          </p>
          <p className="text-sm text-neutral-600 mb-3">
            You can call me anytime by pressing:
          </p>
          <div
            data-tauri-drag-region
            className="flex items-center justify-center gap-1.5"
          >
            {keys.map((key, index) => (
              <Fragment key={index}>
                <Badge variant="secondary" className="text-xs">
                  {key}
                </Badge>
                {index < keys.length - 1 && (
                  <span className="text-xs text-muted-foreground">+</span>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FirstRender;
