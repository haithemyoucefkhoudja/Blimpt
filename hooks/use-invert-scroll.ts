import { useEffect, useRef } from "react";

// Configuration for the scroll "feel"
const LERP_FACTOR = 0.1; // Easing factor. Lower is smoother/slower, higher is faster/snappier. (0.05 to 0.2 is a good range)
const KEYBOARD_SCROLL_AMOUNT = 60; // How many pixels to scroll with arrow keys

export function useSmoothInvertedScroll(
  scrollableRef: React.RefObject<HTMLElement>,
  // The callback function that will receive the updated scroll position
  onScroll: (scrollTop: number) => void,
  scrollToBottom: boolean,
  updateIndex: number
) {
  const targetScroll = useRef(0);
  const currentScroll = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  useEffect(() => {
    console.log("scrollToBottom:", scrollToBottom);
    if (scrollToBottom && scrollableRef.current && updateIndex !== null) {
      targetScroll.current = scrollableRef.current.scrollTop;
      currentScroll.current = scrollableRef.current.scrollTop;
    }
  }, [scrollToBottom, scrollableRef, updateIndex]);
  // We wrap the onScroll callback in a ref to ensure we always have the latest
  // version inside our event handlers without needing to re-attach them.
  const onScrollRef = useRef(onScroll);
  useEffect(() => {
    onScrollRef.current = onScroll;
  }, [onScroll]);

  useEffect(() => {
    const el = scrollableRef.current;
    if (!el) return;

    // targetScroll.current = el.scrollTop;
    // currentScroll.current = el.scrollTop;
    const smoothScroll = () => {
      const delta = targetScroll.current - currentScroll.current;

      if (Math.abs(delta) < 0.5) {
        currentScroll.current = targetScroll.current;
        const finalScrollTop = Math.round(currentScroll.current);
        el.scrollTop = finalScrollTop;

        // === FIX 1: CALL THE CALLBACK ONCE AT THE END ===
        // Ensure the final, settled position is reported.
        onScrollRef.current(finalScrollTop);

        animationFrameId.current = null;
        return;
      }

      currentScroll.current += delta * LERP_FACTOR;
      el.scrollTop = currentScroll.current;

      // === FIX 2: CALL THE CALLBACK ON EVERY FRAME ===
      // This is the line that was missing. It reports the new scroll position
      // back to the component on every frame of the animation.
      onScrollRef.current(currentScroll.current);

      animationFrameId.current = requestAnimationFrame(smoothScroll);
    };

    const startAnimation = () => {
      if (animationFrameId.current === null) {
        animationFrameId.current = requestAnimationFrame(smoothScroll);
      }
    };

    // ... (handleWheel and handleKeyDown are the same) ...
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      targetScroll.current -= event.deltaY;

      const maxScrollTop = el.scrollHeight - el.clientHeight;
      targetScroll.current = Math.max(
        0,
        Math.min(targetScroll.current, maxScrollTop)
      );
      startAnimation();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the event target is an input, textarea, etc.
      // If so, don't hijack the arrow keys.
      const targetNode = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(targetNode.tagName)) {
        return;
      }

      let scrollAmount = 0;
      // Invert the keyboard controls to match the inverted scroll
      if (event.key === "ArrowUp") {
        scrollAmount = KEYBOARD_SCROLL_AMOUNT;
      } else if (event.key === "ArrowDown") {
        scrollAmount = -KEYBOARD_SCROLL_AMOUNT;
      }
      // ... (you can add PageUp/PageDown logic here too)

      if (scrollAmount !== 0) {
        event.preventDefault();
        targetScroll.current += scrollAmount;
        const maxScrollTop = el.scrollHeight - el.clientHeight;
        targetScroll.current = Math.max(
          0,
          Math.min(targetScroll.current, maxScrollTop)
        );
        startAnimation();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    // It's generally better to listen on the element itself if possible,
    // but window is okay if you ensure it only acts when the element is "active".
    // For simplicity, window is fine here.
    window.addEventListener("keydown", handleKeyDown, false);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [scrollableRef]); // The main effect only runs when the ref changes.
}
