"use client";

import { useEffect, useRef, useState } from "react";
import { X, Clipboard, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TClipBoard } from "@/types/clipboard";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

const MAX_CLIPBOARD_ITEMS = 30;

interface ClipboardIndicatorProps {
  clipboardItems: TClipBoard[];
  addClipboardItem: (item: string) => void;
  removeClipboardItem: (index: number) => void;
  clearAllClipboardItems: () => void;
}

export function ClipboardIndicator({
  clipboardItems,
  addClipboardItem,
  removeClipboardItem,
  clearAllClipboardItems,
}: ClipboardIndicatorProps) {
  // Use a ref to keep track of the latest clipboardItems
  const clipboardItemsRef = useRef(clipboardItems);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Update the ref whenever clipboardItems changes
  useEffect(() => {
    clipboardItemsRef.current = clipboardItems;
  }, [clipboardItems]);

  // Clear status message after 3 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();

      // Don't add empty text
      if (!text || text.trim() === "") {
        setStatusMessage("Nothing to paste. Copy something first.");
        return;
      }

      // Check if this text is already in our list
      const isDuplicate = clipboardItemsRef.current?.some(
        (item) => item.text === text
      );

      if (isDuplicate) {
        setStatusMessage("This content is already in your clipboard history.");
        return;
      }

      if (clipboardItems.length >= MAX_CLIPBOARD_ITEMS) {
        setStatusMessage(
          `You can only store up to ${MAX_CLIPBOARD_ITEMS} items. Remove some items first.`
        );
        return;
      }

      // Add new item directly using the provided function
      addClipboardItem(text);
      setStatusMessage("Added to clipboard history");
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      setStatusMessage("Failed to read clipboard. Check permissions.");
    }
  };

  return (
    <div className="border rounded-md p-2 mb-2 w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clipboard className="h-4 w-4" />
          <span>
            Clipboard ({clipboardItems.length}/{MAX_CLIPBOARD_ITEMS})
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 py-0 rounded-md text-xs flex items-center gap-1"
            onClick={handlePaste}
            type="button"
            title="Paste from clipboard"
            disabled={clipboardItems.length >= MAX_CLIPBOARD_ITEMS}
          >
            <Plus className="h-3 w-3" />
            <span>Paste</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 py-0 hover:bg-foreground/20 rounded-md text-xs flex items-center gap-1"
            onClick={clearAllClipboardItems}
            title="Clear all"
            disabled={clipboardItems.length === 0}
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear all</span>
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="text-xs mb-2 px-1 text-muted-foreground">
          {statusMessage}
        </div>
      )}

      {clipboardItems.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-3">
          Your clipboard history is empty. Click "Paste" to add content.
        </div>
      ) : (
        <ScrollArea>
          <ScrollBar orientation="horizontal"></ScrollBar>
          <div className="flex w-max space-x-2 py-3">
            {clipboardItems.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0 flex items-center justify-between text-xs py-1 px-2 rounded-md bg-accent/50 hover:bg-accent/70 max-w-[200px] min-w-[100px]"
              >
                <div className="truncate flex-1">
                  {item.text && item.text.length > 25
                    ? `${item.text.slice(0, 25)}...`
                    : item.text}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-foreground/20 rounded-full ml-2 flex-shrink-0"
                  onClick={() => removeClipboardItem(index)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove item</span>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
