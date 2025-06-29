import type React from "react";
import { Fragment, memo, useMemo, useEffect, useRef } from "react";
import { AutosizeTextarea } from "../ui/auto-size-textarea";
import { ClipboardIndicator } from "../ClipboardIndicator";
import { Button } from "../ui/button";
import {
  ArrowUpIcon,
  Brain,
  FileIcon,
  GlobeIcon,
  ImageIcon,
  XIcon,
} from "lucide-react";
import { useConfig } from "@/providers/config-provider";
import SearchModeSelect from "../shortcut-ui/search-mode-select";
import { cn } from "@/lib/utils";
import { useChat } from "@/providers/chat-provider";
import { StopIcon } from "@radix-ui/react-icons";
import { useInput } from "@/providers/chat-provider";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

export const ChatInput = memo(function ChatInput() {
  const { isLoading, handleFormSubmit } = useChat();
  const {
    input,
    setInput,
    clearAttachments,
    addAttachment,
    removeAttachment,
    attachments,
    handleFileChange,
    fileInputRef,
  } = useInput();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleFormSubmit();
    }
    if (e.ctrlKey && e.key === "v") {
      e.preventDefault();
      const text = await navigator.clipboard.readText();
      addAttachment({
        id: `${text}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        text,
        type: "text",
      });
    }
  };

  return (
    <div className="border rounded-xl p-4 bg-background text-foreground w-full">
      <div className="max-w-3xl mx-auto w-full  relative ">
        {
          <div className="mb-3 pb-1">
            {/* <div className="flex space-x-3 overflow-x-auto scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-accent pb-2">
             */}
            <ScrollArea className={cn(attachments.length > 0 && "py-2")}>
              <ScrollBar orientation="horizontal" />
              <div
                className={cn(
                  "flex space-x-3",
                  attachments.length > 0 && "p-2"
                )}
              >
                {attachments.length > 0 &&
                  attachments.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "relative group w-20 h-fit flex-shrink-0 p-2 rounded-lg border",
                        "flex flex-col items-center justify-between",
                        "bg-card border-border text-card-foreground"
                      )}
                    >
                      <div className="w-10 h-10 flex items-center justify-center mb-1 overflow-hidden rounded-md ">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.file?.name}
                            className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <FileIcon className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      <div className="w-full text-center">
                        <p
                          className="text-xs truncate w-full"
                          title={item.text}
                        >
                          {item.text}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                          "hover:bg-destructive/90"
                        )}
                        onClick={() => removeAttachment(item.id)}
                        disabled={isLoading.state}
                        aria-label={`Remove ${item.file?.name}`}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        }
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
            <div
              className="relative flex items-center space-x-2 px-3 py w-full "
              data-tauri-drag-region
            >
              <div
                className="flex flex-col space-y-2 flex-1"
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
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  disabled={isLoading.state}
                />
                <div
                  className="flex gap-2 justify-between"
                  data-tauri-drag-region
                >
                  <Buttons />

                  <SendButton />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

const Buttons = memo(function Buttons() {
  const { config, isDeepThinking, setIsDeepThinking, isSearch, setIsSearch } =
    useConfig();
  const models = useMemo(() => config.models, [config.models]);
  const { isLoading } = useChat();
  const { searchMode, setSearchMode, fileInputRef } = useInput();
  const isImage = useMemo(() => {
    console.log(
      "config.selectedDeepThinkingModel:",
      config.selectedDeepThinkingModel
    );
    console.log("config.selectedModel:", config.selectedModel);

    if (isDeepThinking) {
      return config.selectedDeepThinkingModel.isImage;
    }
    return config.selectedModel.isImage;
  }, [isDeepThinking, config.selectedDeepThinkingModel, config.selectedModel]);
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
      <Button
        type="button"
        disabled={isLoading.state || !isImage}
        variant="outline"
        className={cn("relative rounded-full h-8 p-2")}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon className={cn("h-4 w-4 transition-all text-primary")} />

        <span className="sr-only">Attach file</span>
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
