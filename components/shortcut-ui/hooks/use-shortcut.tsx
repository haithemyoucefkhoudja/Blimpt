import { PhysicalPosition } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow, cursorPosition } from "@tauri-apps/api/window";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { useEffect, useRef, useState } from "react";

type UseShortcutOptions = {
  onEscape?: () => void;
};

export default function useShortcut({ onEscape }: UseShortcutOptions = {}) {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const firstRenderRef = useRef(true);

  useEffect(() => {
    const windowInstance = getCurrentWebviewWindow();
    const physicalWindow = getCurrentWindow();

    const handleCtrlY = async () => {
      if (firstRenderRef.current) {
        setIsFirstRender(false);
        firstRenderRef.current = false;
      }
      const visible = await windowInstance.isVisible();
      if (!visible) {
        const position = await cursorPosition();
        await windowInstance.show();
        await windowInstance.setFocus();
        physicalWindow.setPosition(new PhysicalPosition(position.x, position.y));
        physicalWindow.setAlwaysOnTop(true);
      }
    };

    const initShortcuts = async () => {
      await register("CommandOrControl+Shift+Y", handleCtrlY);
    };

    initShortcuts();

    const handleEscape = async (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (firstRenderRef.current) {
          setIsFirstRender(false);
          firstRenderRef.current = false;
        }
        const visible = await windowInstance.isVisible();
        if (visible) {
          await windowInstance.hide();
        }
        if (onEscape) {
          onEscape();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      unregister("CommandOrControl+Shift+Y");
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onEscape]);
  
  useEffect(() => {
    
    // Keep ref in sync
    firstRenderRef.current = isFirstRender;

  }, [isFirstRender]);

  return { isFirstRender, firstRenderRef, setIsFirstRender };
}
