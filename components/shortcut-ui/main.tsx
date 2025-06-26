// MainComponent.tsx
import { ChatInput } from "./input";
import WebSearchIndicator from "../WebSearchIndicator";
import HideButton from "../HideButton";
import { memo, useEffect, useMemo } from "react";
import { CommandControl } from "@/src/command-list";
import ChatIndicator from "../ChatIndicator";
import { useAppResize } from "./hooks/use-app-resize";
import ExpandIndicator from "../ExpandIndicator";
import MessageList from "./message-list";
import ConfigManager from "./config-manager";
// Message type is not directly used in MainComponent props, but likely by useChat
// import { Message } from "@/types/Message";
import SettingsIndicator from "../SettingsIndicator";
import ThemeIndicator from "../themeIndicator";
import HistoryIndicator from "../HistoryIndicator";
import { ConversationList } from "./history";
import { useChat } from "@/providers/chat-provider";
import LoveIndicator from "./LoveIndicator";
import NewChatIndicator from "./new-chat-indicator";
import { cn } from "@/lib/utils";

// Define your window types for better type safety
type WindowKey = "chat" | "commands" | "list" | "settings" | "history";

const MainComponent = memo(function MainComponent() {
  const { ActiveWindow, setActiveWindow } = useAppResize();
  const { setLastMessage, setError, conversation, isLoading } = useChat(); // Destructure all props needed by child components here

  const closeWindowOnChatInactive = () => {
    setLastMessage(null);
    setError(null);
  };

  useEffect(() => {
    if (ActiveWindow !== "chat") {
      closeWindowOnChatInactive();
    }
  }, [ActiveWindow]); // Removed closeWindow from deps as it's stable

  // Define all possible window components and their props
  // Memoize this structure if props within it are stable, or ensure props from useChat are stable
  const windowDefinitions = useMemo(() => {
    return [
      {
        key: "chat" as WindowKey,
        // Pass necessary props. Ensure these props are stable (memoized if objects/arrays/functions)
        // to prevent re-renders of ChatInput when it's not the active one changing.
        Component: () => <ChatInput />,
      },
      {
        key: "commands" as WindowKey,
        Component: () => <CommandControl />,
      },
      {
        key: "list" as WindowKey,
        // Example: if MessageList needs scrollToMessageId
        // Component: () => <MessageList scrollToMessageId={someIdFromState} />,
        Component: () => <MessageList />,
      },
      {
        key: "settings" as WindowKey,
        Component: () => <ConfigManager />,
      },
      {
        key: "history" as WindowKey,
        Component: () => <ConversationList />,
      },
    ];
  }, [isLoading, conversation]);

  return (
    <div
      className="flex bg-background relative w-full p-4 rounded-xl border-2 border-foreground/20"
      data-tauri-drag-region
    >
      {/* Left Sidebar */}
      <div
        className="flex flex-col items-center gap-2 h-full justify-end mt-auto shrink-0"
        data-tauri-drag-region
      >
        <WebSearchIndicator />
        <HistoryIndicator />
        <ChatIndicator />
        <ExpandIndicator />
      </div>

      {/* Main Content Area - This will contain the sliding windows */}
      <div
        className="w-full flex-1 flex flex-col overflow-hidden relative mx-2"
        data-tauri-drag-region
      >
        {" "}
        {/* Added relative and overflow-hidden */}
        <div
          className="flex justify-between w-full h-fit shrink-0"
          data-tauri-drag-region
        >
          <h3 className="h-fit w-full text-md font-bold text-primary truncate break-words my-2 mx-4">
            {conversation?.title}
          </h3>
          <NewChatIndicator />
        </div>
        {/* Container for the sliding windows */}
        <div className="flex-1 relative h-full">
          {" "}
          {/* Ensures this container takes up remaining space and is a positioning context */}
          <div className={cn("w-full  h-full")}>
              {windowDefinitions.find((w) => w.key === ActiveWindow)?.Component()}
            
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div
        className="flex flex-col items-center gap-2 justify-between shrink-0"
        data-tauri-drag-region
      >
        <HideButton />
        <div
          className="flex items-center flex-col gap-2"
          data-tauri-drag-region
        >
          <ThemeIndicator />
          <SettingsIndicator
            activeWindow={ActiveWindow}
            setActiveWindow={() => setActiveWindow("settings")}
          />
          <LoveIndicator />
        </div>
      </div>
    </div>
  );
});

export default MainComponent;
