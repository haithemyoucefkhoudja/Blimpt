import FirstRender from "./first-render";
import { MessageDisplay } from "./message-display";
import MainComponent from "./main";
import { useChat } from "@/providers/chat-provider";
import { useConfig } from "@/providers/config-provider";
import { cn } from "@/lib/utils";
import { useAppResize } from "./hooks/use-app-resize";
import { Fragment } from "react";
import { useShortcut } from "@/providers/config-provider";
function MessangerContainer() {
  const { lastMessage } = useChat();
  const { config } = useConfig();
  const { LAYOUT_MODE } = config;
  const { webviewRef } = useAppResize();
  const { isFirstRender } = useShortcut();
  if (isFirstRender)
    return (
      <section
        className="flex flex-col h-full bg-transparent w-full space-y-2 justify-center items-center min-h-fit"
        ref={webviewRef}
        data-tauri-drag-region
      >
        <FirstRender />
      </section>
    );
  return (
    <section
      className={cn(
        "flex ",
        LAYOUT_MODE === "vertical"
          ? "flex-col"
          : "flex-row  w-full overflow-hidden ",
        lastMessage && "gap-2"
      )}
      ref={webviewRef}
      data-tauri-drag-region
    >
      <Fragment>
        <MainComponent />
        <MessageDisplay />
      </Fragment>
    </section>
  );
}

export default MessangerContainer;
