"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import {
  X,
  Clipboard,
  Plus,
  Trash2,
  ClipboardCheckIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TAttachment } from "@/types/attachment";
import { cn } from "@/lib/utils";

const MAX_CLIPBOARD_ITEMS = 30;

interface ClipboardIndicatorProps {
  clipboardItems: TAttachment[];
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
  console.log("clipboardItemsss:", clipboardItems);
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
    <Fragment>
      {clipboardItems.map((item, index) => (
        <div
          key={index}
          className={cn(
            "relative group w-20 h-fit flex-shrink-0 p-2 rounded-lg border",
            "flex flex-col items-center justify-between",
            "bg-card border-border text-card-foreground"
          )}
        >
          <div className="w-10 h-10 flex items-center justify-center mb-1 overflow-hidden rounded-md ">
            <ClipboardCheckIcon className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="w-full text-center">
            <p className="text-xs truncate w-full" title={item.text}>
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
            onClick={() => removeClipboardItem(index)}
            aria-label={`Remove ${item.text}`}
          >
            <XIcon className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </Fragment>
  );
}
