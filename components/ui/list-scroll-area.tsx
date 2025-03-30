import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"
import { Button } from "./button";
import { ArrowBigDownIcon } from "lucide-react";

const ListScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
    >(({ className, children, ...props }, ref) => {
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = React.useState(false);
    
    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
        }
    };
    
    const handleScroll = () => {
        if (scrollAreaRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
        // console.log('ScrollTop:', scrollTop)
        // console.log('ScrollHeight:', scrollHeight)
        // console.log('ClientHeight:', clientHeight)
        
        // Show button if not scrolled to bottom (with some threshold)
        setShowScrollButton(scrollTop + clientHeight < scrollHeight - 100);
        }
    };
    React.useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
        scrollArea.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();
        return () => scrollArea.removeEventListener('scroll', handleScroll);
        }
    }, []);
        
        return (

  <ScrollAreaPrimitive.Root
    className={cn("relative overflow-hidden", className)}
    {...props}
    ref={ref}
  >
    <ScrollAreaPrimitive.Viewport ref={scrollAreaRef} className="h-full w-full rounded-[inherit] " data-tauri-drag-region>
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ListScrollBar />
    <ScrollAreaPrimitive.Corner />
    {showScrollButton && (
        <Button
        onClick={scrollToBottom}
        size="icon"
        className="absolute right-4 bottom-4   rounded-full  flex-shrink-0 shadow-lg z-10"
        aria-label="Scroll to bottom"
        >
            <ArrowBigDownIcon className="h-6 w-6"/>
        </Button>
      )}            
  </ScrollAreaPrimitive.Root>
)})
ListScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

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
))
ListScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ListScrollArea, ListScrollBar }
