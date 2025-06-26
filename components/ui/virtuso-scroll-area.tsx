import {
  Virtuoso,
  type VirtuosoHandle,
  type ScrollerProps,
} from "react-virtuoso";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"; // Import Radix primitives
import { cn } from "@/lib/utils"; // Your cn utility
import React from "react";

// Your existing ListScrollBar component (or a slightly adapted one)
const VirtuosoCustomScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors z-20", // Ensure z-index if needed
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
VirtuosoCustomScrollBar.displayName = "VirtuosoCustomScrollBar";

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

// Custom Scroller for Virtuoso that uses Radix ScrollArea
const CustomVirtuosoScroller = React.forwardRef<HTMLDivElement, ScrollerProps>(
  ({ style, children, ...props }, ref) => {
    const internalViewportRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const mergedViewportRef = useMergeRefs(ref, internalViewportRef);

    return (
      <ScrollAreaPrimitive.Root
        className={cn("relative overflow-hidden")}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          ref={mergedViewportRef}
          className="h-96 w-full rounded-[inherit]"
          data-tauri-drag-region
        >
          <div ref={contentRef} className="h-full">
            {children}
          </div>
        </ScrollAreaPrimitive.Viewport>
        <VirtuosoCustomScrollBar />
      </ScrollAreaPrimitive.Root>
    );
  }
);
CustomVirtuosoScroller.displayName = "CustomVirtuosoScroller";

export { CustomVirtuosoScroller };
