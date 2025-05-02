import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ArrowBigDownIcon } from "lucide-react";
// Helper to merge refs if needed, although direct assignment works here too
function useMergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return React.useCallback(
    (value: T | null) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(value);
        } else if (ref != null) {
          (ref as React.MutableRefObject<T | null>).current = value;
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs // Dependencies are the refs themselves
  );
}
const ListScrollArea = React.forwardRef<
  // --- CHANGE 1: Update the Ref type ---
  // The ref now points to the Viewport, which is typically a DIV
  React.ElementRef<typeof ScrollAreaPrimitive.Viewport>,
  // Keep props of the Root, as that's what users configure
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  // Keep internal ref for button logic - it already points to Viewport
  const internalViewportRef = React.useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  const scrollToBottom = () => {
    // Use the internal ref for the button
    if (internalViewportRef.current) {
      internalViewportRef.current.scrollTo({
        top: internalViewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = React.useCallback(() => {
    // Use the internal ref for the button logic
    if (internalViewportRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        internalViewportRef.current;
      setShowScrollButton(scrollTop + clientHeight < scrollHeight - 100);
    }
  }, []); // Empty dependency array is fine if internalViewportRef doesn't change

  React.useEffect(() => {
    // Use the internal ref for the button logic
    const scrollAreaElement = internalViewportRef.current;
    if (scrollAreaElement) {
      scrollAreaElement.addEventListener("scroll", handleScroll, {
        passive: true,
      }); // Use passive listener
      // Initial check
      handleScroll();
      return () =>
        scrollAreaElement.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]); // Add handleScroll dependency

  // --- CHANGE 2: Merge the forwarded ref and internal ref ---
  // This ensures both the parent component (MessageList) and the internal
  // logic get a reference to the Viewport element.
  const mergedViewportRef = useMergeRefs(ref, internalViewportRef);

  return (
    <ScrollAreaPrimitive.Root
      // --- CHANGE 3: Remove ref from Root ---
      // ref={ref} // REMOVED FROM HERE
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        // --- CHANGE 4: Attach the merged ref to Viewport ---
        ref={mergedViewportRef}
        className="h-96 w-full rounded-[inherit]"
        data-tauri-drag-region // Keep drag region if needed here
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ListScrollBar />
      <ScrollAreaPrimitive.Corner />
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="absolute right-4 bottom-4 rounded-full flex-shrink-0 shadow-lg z-10"
          aria-label="Scroll to bottom"
        >
          <ArrowBigDownIcon className="h-6 w-6" />
        </Button>
      )}
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
