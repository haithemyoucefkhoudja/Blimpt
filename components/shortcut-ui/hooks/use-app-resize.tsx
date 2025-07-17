"use client";

import type React from "react";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  useState,
  useMemo,
} from "react";
import { MAX_HEIGHT, MAX_WIDTH, WIDTH_OFFSET } from "@/utils/constants";
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";
import { useConfig } from "@/providers/config-provider";
import { useShortcut } from "@/providers/config-provider";
type WindowType =
  | "chat"
  | "list"
  | "commands"
  | "settings"
  | "history"
  | "donation";

type AppResizeContextType = {
  ActiveWindow: WindowType;
  setActiveWindow: (window: WindowType) => void;
  changeSize: () => Promise<void>;
  webviewRef: React.RefObject<HTMLDivElement>;
  mainRef: React.RefObject<HTMLDivElement>;
  messageDisplayRef: React.RefObject<HTMLDivElement>;
  ActiveWindowRef: React.MutableRefObject<WindowType>;
};

const AppResizeContext = createContext<AppResizeContextType | undefined>(
  undefined
);

export function useAppResize() {
  const context = useContext(AppResizeContext);
  if (context === undefined) {
    throw new Error("useAppResize must be used within an AppResizeProvider");
  }
  return context;
}

export function AppResizeProvider({ children }: { children: React.ReactNode }) {
  const webviewRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const messageDisplayRef = useRef<HTMLDivElement>(null);
  const [ActiveWindow, setActiveWindow] = useState<WindowType>("chat");
  const ActiveWindowRef = useRef<WindowType>("chat");
  const { config } = useConfig();
  const { LAYOUT_MODE } = config;
  // const [mainDivWidth, setMainDivWidth] = useState(0);
  const { isFirstRender } = useShortcut();
  // useEffect(() => {
  //   if (!mainRef.current) return;

  //   const resizeObserver = new ResizeObserver((entries) => {
  //     // 'entries' contains information about the observed elements
  //     for (let entry of entries) {
  //       setMainDivWidth(entry.contentRect.width);
  //     }
  //   });

  //   resizeObserver.observe(mainRef.current);

  //   // Cleanup function to disconnect the observer when the component unmounts
  //   return () => resizeObserver.disconnect();
  // }, [mainRef]);

  // Memoize the changeSize function to prevent unnecessary recreations
  const changeSize = async () => {
    if (!webviewRef.current && !mainRef.current) return;

    try {
      const rect = webviewRef.current.getBoundingClientRect();
      const size = await getCurrentWindow().outerSize();
      let maxWidth = MAX_WIDTH;
      let width = size.width;
      if (LAYOUT_MODE === "horizontal" && !isFirstRender) {
        let mainRect = 0;
        let messageDisplayRect = 0;
        if (mainRef.current)
          mainRect = mainRef.current.getBoundingClientRect().width;
        if (messageDisplayRef.current) {
          maxWidth = MAX_WIDTH * 2;
          messageDisplayRect =
            messageDisplayRef.current.getBoundingClientRect().width;
        }

        width = Math.min(
          Math.max(
            Math.ceil((mainRect + messageDisplayRect) * 1.3),
            size.width
          ),
          maxWidth
        );
      } else {
        width = Math.min(
          Math.max(Math.ceil(rect.width * 1.3), size.width),
          maxWidth
        );
      }

      const height = Math.min(Math.ceil(rect.height * 1.3), MAX_HEIGHT);
      if (height == size.height && width == size.width) return;
      console.log("changeSize:", width, height);
      if (width && height) {
        const currentWindow = getCurrentWindow();
        const newSize = new PhysicalSize(width, height);
        await currentWindow.setSize(newSize);
        await currentWindow.setMinSize(newSize);
        await currentWindow.setMaxSize(
          new PhysicalSize(width + WIDTH_OFFSET, height)
        );
      }
    } catch (error) {
      console.error("Error resizing window:", error);
    }
  };

  // Update the ref whenever ActiveWindow changes
  useEffect(() => {
    ActiveWindowRef.current = ActiveWindow;
  }, [ActiveWindow]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      changeSize,
      ActiveWindow,
      setActiveWindow,
      webviewRef,
      mainRef,
      messageDisplayRef,
      ActiveWindowRef,
    }),
    [changeSize, ActiveWindow, webviewRef, mainRef, messageDisplayRef]
  );

  return (
    <AppResizeContext.Provider value={contextValue}>
      {children}
    </AppResizeContext.Provider>
  );
}

export function useSizeChange(deps: React.DependencyList = []) {
  const { changeSize, ActiveWindow, mainRef, messageDisplayRef, webviewRef } =
    useAppResize();
  const { config } = useConfig();
  const { LAYOUT_MODE } = config;
  useEffect(() => {
    let isMounted = true;
    console.log("useSizeChange");
    const handleResize = async () => {
      if (!isMounted) return;
      await changeSize();
    };

    handleResize();

    return () => {
      isMounted = false;
    };
  }, [
    LAYOUT_MODE,
    ActiveWindow,
    changeSize,
    mainRef.current,
    messageDisplayRef.current,
    webviewRef.current,
    ...deps,
  ]);
}
