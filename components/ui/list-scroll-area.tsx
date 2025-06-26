"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

function useMergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return React.useCallback((value: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  }, refs);
}

const ListScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  const internalViewportRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const mergedViewportRef = useMergeRefs(ref, internalViewportRef);

  return (
    <ScrollAreaPrimitive.Root
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <style>
        {`
        [data-radix-scroll-area-viewport] > div {
            display:block !important;
        }
        `}
      </style>
      <ScrollAreaPrimitive.Viewport
        ref={mergedViewportRef}
        className="h-96 w-full rounded-[inherit] overflow-x-hidden"
        data-tauri-drag-region
      >
        <div ref={contentRef} className="h-full">
          {children}
        </div>
      </ScrollAreaPrimitive.Viewport>
      <ListScrollBar />
      <ScrollAreaPrimitive.Corner />
      {/* {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="absolute right-4 bottom-4 rounded-full flex-shrink-0 shadow-lg z-10"
          aria-label="Scroll to bottom"
        >
          <ArrowBigDownIcon className="h-6 w-6" />
        </Button>
      )} */}
    </ScrollAreaPrimitive.Root>
  );
});
ListScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ListScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ListScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ListScrollArea, ListScrollBar };
