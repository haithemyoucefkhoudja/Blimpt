import { PhysicalPosition } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow, cursorPosition } from "@tauri-apps/api/window";
import {
  register,
  unregister,
  isRegistered,
} from "@tauri-apps/plugin-global-shortcut";
import { useEffect, useRef, useState } from "react";

const SHORTCUT = "CommandOrControl+Shift+Y";
export default function useShortcut() {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const firstRenderRef = useRef(true);
  const isFirstInteractionRef = useRef(true);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const checkShortcut = async () => {
      try {
        const isShortcutRegistered = await isRegistered(SHORTCUT);
        console.log("Shortcut registered:", isShortcutRegistered);
      } catch (e) {
        console.error("Failed to check shortcut registration:", e);
      }
    };
    checkShortcut();
  }, [hidden]);
  useEffect(() => {
    console.log("useShortcut effect runs");
    const windowInstance = getCurrentWebviewWindow();
    const physicalWindow = getCurrentWindow();

    const handleCtrlT = async () => {
      isFirstInteractionRef.current = false; // The first interaction has occurred

      const visible = await windowInstance.isVisible();
      if (visible) {
        await windowInstance.hide();
        setHidden(true);
      } else {
        console.log("Shortcut handler fired: ", SHORTCUT);
        const position = await cursorPosition();
        await windowInstance.show();
        await windowInstance.setFocus();
        physicalWindow.setPosition(
          new PhysicalPosition(position.x, position.y)
        );
        physicalWindow.setAlwaysOnTop(true);
        setHidden(false);
      }
    };

    const initShortcuts = async () => {
      try {
        if (await isRegistered(SHORTCUT)) {
          await unregister(SHORTCUT);
        }
        await register(SHORTCUT, handleCtrlT);
        console.log("Shortcut registered successfully:", SHORTCUT);
      } catch (e) {
        console.error("Failed to initialize shortcuts", e);
      }
    };

    initShortcuts();

    const handleEscape = async (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Prevent hiding on the very first escape press if no other interaction happened

        if (isFirstInteractionRef.current) {
          setIsFirstRender(false);
          isFirstInteractionRef.current = false;
          setHidden(false);
          return;
        }
        console.log("Escape key pressed");
        const visible = await windowInstance.isVisible();
        if (visible) {
          await windowInstance.hide();
          setHidden(true);
        }
        // onEscape?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    // Cleanup function
    return () => {
      console.log(
        "Running cleanup: unregistering shortcut and event listener."
      );
      // unregister is async, but we don't need to await it in cleanup
      // as the component is being destroyed anyway.
      unregister(SHORTCUT).catch((e) =>
        console.error("Failed to unregister shortcut on cleanup", e)
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, []); // Added onEscape to dependency array as it's used inside the effect

  useEffect(() => {
    // Keep ref in sync
    firstRenderRef.current = isFirstRender;
  }, [isFirstRender]);

  return { isFirstRender, firstRenderRef, setIsFirstRender, hidden };
}
