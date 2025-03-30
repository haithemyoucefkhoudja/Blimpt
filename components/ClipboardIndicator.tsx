"use client"

import { useEffect, useRef, useState } from "react"
import { X, Clipboard, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { type TClipBoard } from "@/types/clipboard"
import { ScrollArea, ScrollBar } from "./ui/scroll-area"

const MAX_CLIPBOARD_ITEMS = 10;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ClipboardIndicatorProps {
  lastClipBoardItem: TClipBoard;
  clipboardItems: TClipBoard[] 
  addClipboardItem: (item: string) => void
  removeClipboardItem: (index: number) => void
  clearAllClipboardItems: () => void
}

export function ClipboardIndicator({ 
  clipboardItems, 
  lastClipBoardItem,
  addClipboardItem, 
  removeClipboardItem, 
  clearAllClipboardItems 
}: ClipboardIndicatorProps) {
  
  // Use a ref to keep track of the latest clipboardItems
  const clipboardItemsRef = useRef(clipboardItems);
  // const lastClipBoardItemRef = useRef(lastClipBoardItem);
  

  // Update the ref whenever clipboardItems changes
  useEffect(() => {
    clipboardItemsRef.current = clipboardItems;    
  }, [clipboardItems]);
  // useEffect(() => {
  //   lastClipBoardItemRef.current = lastClipBoardItem;
  // },[lastClipBoardItem])

  useEffect(() => {
    const checkClipboard = async () => {
      try {
        await delay(300);
        if (!document.hasFocus()) return;
        
        const text = await navigator.clipboard.readText();
        
        // Don't add empty text
        if (!text || text.trim() === '') return;
        // Check if this text is already in our list or was the last removed item
        const isDuplicate = clipboardItemsRef.current?.some((item) => item.text === text)
        

        if (!isDuplicate) {
          // Add new item directly using the provided function
          addClipboardItem(text)
        }
      } catch (err) {
        console.error("Failed to read clipboard:", err);
      }
    };

    const handleFocus = () => {
      checkClipboard();
    };

    window.addEventListener("focus", handleFocus);
    checkClipboard(); // Initial check

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [addClipboardItem]); 

  if (!clipboardItems || clipboardItems.length === 0) return null;

  return (
    <div className="border rounded-md p-2 mb-2 w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clipboard className="h-4 w-4" />
          <span>
            Clipboard ({clipboardItems.length}/{MAX_CLIPBOARD_ITEMS})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 py-0 hover:bg-foreground/20 rounded-md text-xs flex items-center gap-1"
          onClick={clearAllClipboardItems}
          title="Clear all"
        >
          <Trash2 className="h-3 w-3" />
          <span>Clear all</span>
        </Button>
      </div>

      {/* Horizontal scrollable container for clipboard items */}
      <ScrollArea >
        <ScrollBar orientation="horizontal" ></ScrollBar>
        <div className="flex w-max space-x-2 py-3">
        {clipboardItems.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 flex items-center justify-between text-xs py-1 px-2 rounded-md bg-accent/50 hover:bg-accent/70 max-w-[200px] min-w-[100px]"
          >
            <div className="truncate flex-1">
              {item.text && item.text.length > 25 ? `${item.text.slice(0, 25)}...` : item.text}
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
    </div>
  );
}
