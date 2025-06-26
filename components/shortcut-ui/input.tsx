import type React from "react";
import { Fragment, memo, useMemo, useRef } from "react";
import { AutosizeTextarea } from "../ui/auto-size-textarea";
import { ClipboardIndicator } from "../ClipboardIndicator";
import { Button } from "../ui/button";
import { ArrowUpIcon, Brain, GlobeIcon } from "lucide-react";
import { useConfig } from "@/providers/config-provider";
import SearchModeSelect from "../shortcut-ui/search-mode-select";
import { cn } from "@/lib/utils";
import { useChat } from "@/providers/chat-provider";
import { StopIcon } from "@radix-ui/react-icons";
import { useInput } from "@/providers/chat-provider";

export const ChatInput = memo(function ChatInput() {
  const { isLoading, handleFormSubmit } = useChat();
  const {
    input,
    setInput,
    clearAllClipboardItems,
    addClipboardItem,
    removeClipboardItem,
    clipboardItems,
  } = useInput();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        handleFormSubmit();
      }}
      data-tauri-drag-region
    >
      <div
        className="flex justify-between flex-col space-y-3 w-full"
        data-tauri-drag-region
      >
        <div className="flex justify-start mt-2 mx-4" data-tauri-drag-region>
          <ClipboardIndicator
            clipboardItems={clipboardItems}
            removeClipboardItem={removeClipboardItem}
            clearAllClipboardItems={clearAllClipboardItems}
            addClipboardItem={addClipboardItem}
          />
        </div>
        <div
          className="relative flex items-center space-x-2 px-3 py w-full "
          data-tauri-drag-region
        >
          <div
            className="flex flex-col border rounded-xl p-4 space-y-2 flex-1"
            data-tauri-drag-region
          >
            <AutosizeTextarea
              ref={(ref) => {
                if (ref) {
                  (textareaRef as any).current = ref.textArea;
                }
              }}
              disabled={isLoading.state}
              value={input}
              maxHeight={150}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Chat Bot"
              className="border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0  min-w-[200px] max-w-[400px] focus:outline-none scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-transparent hover:scrollbar-thumb-neutral-500"
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <div className="flex gap-2 justify-between" data-tauri-drag-region>
              <Buttons />

              <SendButton />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
});

const Buttons = memo(function Buttons() {
  const { config, isDeepThinking, setIsDeepThinking, isSearch, setIsSearch } =
    useConfig();
  const models = useMemo(() => config.models, [config.models]);
  const { isLoading } = useChat();
  const { searchMode, setSearchMode } = useInput();
  return (
    <div className="flex gap-2" data-tauri-drag-region>
      {models.length > 0 && (
        <SearchModeSelect
          searchModes={[
            "webSearch",
            "academicSearch",
            "writingAssistant",
            "wolframAlphaSearch",
            "youtubeSearch",
            "redditSearch",
          ]}
          selectedSearchMode={searchMode}
          onSearchModeChange={(mode) => setSearchMode(mode)}
        />
      )}
      <Button
        onClick={setIsDeepThinking}
        type="button"
        disabled={isLoading.state}
        variant={isDeepThinking ? "default" : "outline"}
        className={cn(
          "relative rounded-full h-8 p-2",
          isDeepThinking &&
            "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        <Brain
          className={cn(
            "h-4 w-4 transition-all",
            isDeepThinking ? "text-primary-foreground" : "text-primary"
          )}
        />
      </Button>
      <Button
        onClick={setIsSearch}
        type="button"
        disabled={isLoading.state}
        variant={isSearch ? "default" : "outline"}
        className={cn(
          "relative rounded-full h-8 p-2",
          isSearch && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        <GlobeIcon
          className={cn(
            "h-4 w-4 transition-all",
            isSearch ? "text-primary-foreground" : "text-primary"
          )}
        />
      </Button>
    </div>
  );
});
Buttons.displayName = "Buttons";
function SendButton() {
  const { stop, setStop, isLoading } = useChat();
  return (
    <Fragment>
      {!stop ? (
        <Button
          size="icon"
          type="button"
          onClick={() => {
            setStop(true);
          }}
          className="h-8 w-8 rounded-full"
        >
          <StopIcon className="h-4 w-4" />
          <span className="sr-only">Stop message</span>
        </Button>
      ) : (
        <Button
          disabled={isLoading.state}
          type="submit"
          size="icon"
          className="h-8 w-8 rounded-full"
        >
          <ArrowUpIcon className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      )}
    </Fragment>
  );
}
