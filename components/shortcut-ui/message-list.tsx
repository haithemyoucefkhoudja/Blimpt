import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  createContext,
  useContext,
  useState,
  useReducer,
  useImperativeHandle,
} from "react";
import { Message } from "@/types/Message";
import MessageBox from "./message-box";
import { useSmoothInvertedScroll } from "@/hooks/use-invert-scroll";
import { useChat } from "@/providers/chat-provider";

// --- Configuration ---
const OVERSCAN = 1; // Number of items to render above and below the viewport
const DEFAULT_ITEM_HEIGHT = 30; // Assumed height for items not yet measured

// --- 1. State Management: Context and Reducer ---

const VirtContext = createContext(null);

const initialState = {
  // Core Measurements
  scrollTop: 0,
  viewportHeight: 0,
  viewportWidth: 0,
  totalHeight: 0,
  scrollToBottom: false,
  // Data & Sizing
  data: [],
  itemSizes: new Map(), // Map<index, height>
  itemOffsets: [], // Array<offset>
  updateIndex: null,

  // Virtualization State
  visibleItems: [],
  paddingTop: 0,
  paddingBottom: 0,

  // Component Props
  ItemContent: () => null,
  EmptyPlaceholder: () => null,
  Header: () => null,
  Footer: () => null,
  computeItemKey: (index: any) => index,
  context: null,
};

function reducer(state: any, action: any) {
  switch (action.type) {
    case "SET_PROPS":
      return { ...state, ...action.payload };

    case "SET_DATA":
      return {
        ...state,
        data: action.payload,
      };

    case "PREPEND_DATA":
      // When prepending, all existing indices shift. The simplest way to handle this
      // is to reset the size/offset measurements and let them be recalculated.
      const itemSizes = new Map(state.itemSizes);
      for (let i = 0; i < state.itemSizes.size; i++) {
        itemSizes.set(i + 1, state.itemSizes.get(i) || DEFAULT_ITEM_HEIGHT);
      }
      itemSizes.set(0, DEFAULT_ITEM_HEIGHT);
      const itemOffsets = [
        state.totalHeight + DEFAULT_ITEM_HEIGHT,
        ...state.itemOffsets,
      ];
      const data = state.data.map((item: any, index: number) => {
        return {
          ...item,
          index: index + 1,
        };
      });
      return {
        ...state,
        scrollTop: state.scrollTop + DEFAULT_ITEM_HEIGHT,
        data: [...action.payload, ...data],
        itemSizes: itemSizes,
        itemOffsets: itemOffsets,
      };

    case "SET_ITEM_SIZE": {
      const { index, size } = action.payload;

      if (state.itemSizes.get(index) === size) return state;

      const newItemSizes = new Map(state.itemSizes);
      newItemSizes.set(index, size);
      return { ...state, itemSizes: newItemSizes };
    }

    case "UPDATE_MEASUREMENTS":
      return { ...state, ...action.payload };

    case "RECALCULATE_VIRTUAL_STATE": {
      const { data, itemSizes, scrollTop, viewportHeight } = state;

      // 1. Calculate total height and offsets for each item
      let totalHeight = 0;
      const itemOffsets = [];
      for (let i = 0; i < data.length; i++) {
        itemOffsets[i] = totalHeight;
        const height = itemSizes.get(i) || DEFAULT_ITEM_HEIGHT;
        totalHeight += height;
      }

      // 2. Find the start of the visible range
      let startIndex = 0;
      while (
        startIndex < data.length &&
        itemOffsets[startIndex] +
          (itemSizes.get(startIndex) || DEFAULT_ITEM_HEIGHT) <
          scrollTop
      ) {
        startIndex++;
      }

      // 3. Find the end of the visible range
      let endIndex = startIndex;
      while (
        endIndex < data.length &&
        itemOffsets[endIndex] < scrollTop + viewportHeight
      ) {
        endIndex++;
      }
      // 4. Apply overscan
      startIndex = Math.max(0, startIndex - OVERSCAN);
      endIndex = Math.min(data.length - 1, endIndex + OVERSCAN);

      // 5. Build the list of items to render
      const visibleItems = [];
      for (let i = startIndex; i <= endIndex; i++) {
        if (data[i] !== undefined) {
          visibleItems.push({
            index: i,
            data: data[i],
            offset: itemOffsets[i],
            height: itemSizes.get(i) || DEFAULT_ITEM_HEIGHT,
          });
        }
      }

      // 6. Calculate padding to keep the scrollbar size correct
      const paddingTop = visibleItems.length > 0 ? itemOffsets[startIndex] : 0;
      const lastVisibleItem = visibleItems[visibleItems.length - 1];
      const paddingBottom = lastVisibleItem
        ? totalHeight - (lastVisibleItem.offset + lastVisibleItem.height)
        : 0;

      return {
        ...state,
        totalHeight,
        itemOffsets,
        visibleItems,
        paddingTop,
        paddingBottom,
      };
    }
    case "UPDATE_ITEM_DATA": {
      const { index, newItemData } = action.payload;

      // Update the data array immutably
      const newData = state.data.map((item: any, i: any) =>
        i === index ? newItemData : item
      );

      //   // Invalidate the size of the updated item so it gets remeasured only for new line!

      if (newItemData.content == "") {
        const newItemSizes = new Map(state.itemSizes);
        newItemSizes.set(index, DEFAULT_ITEM_HEIGHT);
        return { ...state, data: newData, itemSizes: newItemSizes };
      }
      return { ...state, data: newData };
    }
    case "UPDATE_INDEX": {
      const { index } = action.payload;
      return { ...state, updateIndex: index };
    }
    default:
      return state;
  }
}

// --- 2. Provider Component ---

const VirtProvider = ({ children, ...props }: any) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    dispatch({ type: "SET_PROPS", payload: { ...props } });
  }, []);
  const {
    paddingTop,
    totalHeight,
    paddingBottom,
    viewportHeight,
    scrollTop,
    viewportWidth,
  } = state;
  // const [dimensions, MeasurementPortal] = useOffscreenMeasurement();

  const { messages: chatMessages } = useChat();
  // --- INTEGRATION: Sync internal state when chat messages change ---
  useEffect(() => {
    const messagesList = chatMessages
      .map((ele, index) => {
        return {
          index: String(chatMessages.length - index - 1),
          ...ele,
        };
      })
      .reverse();
    dispatch({ type: "SET_DATA", payload: messagesList });
    dispatch({ type: "RECALCULATE_VIRTUAL_STATE" });
  }, [chatMessages]);
  useEffect(() => {
    // === THE "TRIGGER ZONE" LOGIC MOVED HERE ===
    const topRenderedBoundary = paddingTop;
    const bottomRenderedBoundary = totalHeight - paddingBottom;
    const viewportBottom = state.scrollTop + viewportHeight;

    const buffer = 200; // A buffer to preload items before they are visible

    // Check if we have scrolled close to the edge of the rendered content.
    if (
      scrollTop < topRenderedBoundary + buffer ||
      viewportBottom > bottomRenderedBoundary - buffer
    ) {
      // If so, trigger the recalculation. This will run once, update the padding,
      // and this effect won't run again until the user scrolls further.
      dispatch({ type: "RECALCULATE_VIRTUAL_STATE" });
    }

    // This effect depends on the relevant state values.
    // When RECALCULATE_VIRTUAL_STATE runs, paddingTop/Bottom change, but since
    // scrollTop hasn't changed yet, this effect doesn't re-run immediately.
  }, [
    scrollTop,
    paddingTop,
    paddingBottom,
    totalHeight,
    viewportHeight,
    viewportWidth,
    dispatch,
  ]);
  const contextValue = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <>
      {/* <MeasurementPortal viewportWidth={state.viewportWidth}>
        <div
          style={{
            height: "100%",
            border: "1px solid black",
            overflowY: "auto",
            position: "relative",
          }}
        >
          {state.data.map((item: any, index: number) =>
            // <div key={index}>
            state.ItemContent({ index, data: item, update: false })
            // </div>
          )}
        </div>
      </MeasurementPortal> */}
      <VirtContext.Provider value={contextValue as any}>
        {children}
      </VirtContext.Provider>
    </>
  );
};

// --- 3. Core Components ---

const ListItem = React.memo(
  ({
    offset,
    height,
    index,
    data,
    mount,
    unmount,
    ItemContent,
    onSizeChange,
  }: any) => {
    const ref = useRef<HTMLDivElement | null>(null);

    const setRef = useCallback(
      (element: any) => {
        if (element) {
          ref.current = element;
          mount(element);
        } else if (ref.current) {
          unmount(ref.current);
          ref.current = null;
        }
      },
      [mount, unmount]
    );

    return (
      <div
        ref={setRef}
        data-index={index}
        style={{
          position: "absolute",
          width: "100%",
          top: offset,
          // If the item has been measured, set its height. Otherwise, let it be auto.
          height: height !== DEFAULT_ITEM_HEIGHT ? height : undefined,
          // Set a min-height to prevent collapse before measurement.
          minHeight: DEFAULT_ITEM_HEIGHT,
          transform: "scaleY(-1)",
        }}
      >
        <ItemContent index={index} data={data} onSizeChange={onSizeChange} />
      </div>
    );
  }
);
ListItem.displayName = "ListItem";

const VirtMessageListInternal = forwardRef(
  ({ style, ...props }: any, ref: any) => {
    const { state, dispatch } = useContext<any>(VirtContext);
    const {
      visibleItems,
      paddingTop,
      paddingBottom,
      totalHeight,
      data,
      scrollTop,
      viewportHeight,
      ...components
    } = state;

    const scrollerRef = useRef<HTMLDivElement | null>(null);

    const [resizeObserver] = useState(
      () =>
        new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.target === scrollerRef.current) {
              dispatch({
                type: "UPDATE_MEASUREMENTS",
                payload: {
                  viewportHeight: entry.contentRect.height,
                  viewportWidth: entry.contentRect.width,
                },
              });
            } else if ((entry.target as any).dataset.index !== undefined) {
              const index = Number((entry.target as any).dataset.index);
              dispatch({
                type: "SET_ITEM_SIZE",
                payload: {
                  index,
                  size: entry.contentRect.height,
                },
              });
            }
          }
        })
    );

    const mountItem = useCallback(
      (el: any) => resizeObserver.observe(el),
      [resizeObserver]
    );
    const unmountItem = useCallback(
      (el: any) => resizeObserver.unobserve(el),
      [resizeObserver]
    );

    const handleScroll = useCallback(() => {
      if (scrollerRef.current) {
        dispatch({
          type: "UPDATE_MEASUREMENTS",
          payload: { scrollTop: (scrollerRef.current as any).scrollTop },
        });
      }
    }, [dispatch]);
    useEffect(() => {
      if (state.scrollTop < 200) {
        dispatch({
          type: "UPDATE_MEASUREMENTS",
          payload: { scrollToBottom: true },
        });
      } else {
        dispatch({
          type: "UPDATE_MEASUREMENTS",
          payload: { scrollToBottom: false },
        });
      }
    }, [state.scrollTop]);
    // const stateRef = useRef(state);
    // stateRef.current = state;
    const handleSmoothScroll = useCallback(
      (newScrollTop: number) => {
        dispatch({
          type: "UPDATE_MEASUREMENTS",
          payload: { scrollTop: newScrollTop },
        });
      },
      [dispatch]
    );
    useSmoothInvertedScroll(
      scrollerRef,
      handleSmoothScroll,
      state.scrollToBottom,
      state.updateIndex
    );

    useLayoutEffect(() => {
      const scroller = scrollerRef.current;
      if (scroller) {
        (scroller as any).addEventListener("scroll", handleScroll, {
          passive: true,
        });
        resizeObserver.observe(scroller);
        return () => {
          (scroller as any).removeEventListener("scroll", handleScroll);
          resizeObserver.unobserve(scroller);
        };
      }
    }, [handleScroll, resizeObserver]);

    useImperativeHandle(
      ref,
      () => createVirtMethods(scrollerRef, state, dispatch),
      [state, dispatch]
    );
    const handleSizeChange = useCallback(
      (payload: { index: number; size: number }) => {
        dispatch({ type: "SET_ITEM_SIZE", payload });
        if (state.itemSizes.get(payload.index) !== payload.size) {
          dispatch({ type: "RECALCULATE_VIRTUAL_STATE" });
        }
      },
      [dispatch]
    );
    const handleFinishUpdate = useCallback(() => {
      dispatch({ type: "RECALCULATE_VIRTUAL_STATE" });
    }, [dispatch]);

    return (
      <div
        ref={scrollerRef}
        data-testid="virtuoso-scroller"
        style={{
          ...style,
          overflowY: "auto",
          position: "relative",
          transform: "scaleY(-1)",
        }}
        {...props}
      >
        <div
          id="list-container"
          style={{
            position: "relative",
            width: "100%",
            height: totalHeight,
          }}
        >
          <div style={{ paddingTop, paddingBottom }}>
            {components.Header && (
              <components.Header context={components.context} />
            )}
            {data.length > 0
              ? visibleItems.map((item: any) => (
                  <ListItem
                    key={components.computeItemKey(item.index)}
                    offset={item.offset}
                    height={item.height}
                    index={item.index}
                    data={item.data}
                    mount={mountItem}
                    unmount={unmountItem}
                    ItemContent={components.ItemContent}
                    onSizeChange={handleSizeChange}
                    onFinishUpdate={handleFinishUpdate}
                  />
                ))
              : components.EmptyPlaceholder && (
                  <components.EmptyPlaceholder context={components.context} />
                )}
            {components.Footer && (
              <components.Footer context={components.context} />
            )}
          </div>
        </div>
      </div>
    );
  }
);
VirtMessageListInternal.displayName = "VirtMessageListInternal";

// --- 4. Main Exported Component Wrapper ---
export const VirtMessageList = forwardRef(({ ...props }: any, ref) => {
  return (
    <VirtProvider {...props}>
      <VirtMessageListInternal ref={ref} {...props} />
    </VirtProvider>
  );
});
VirtMessageList.displayName = "VirtMessageList";

// --- 5. Imperative API and Custom Hooks ---

function createVirtMethods(scrollerRef: any, state: any, dispatch: any) {
  return {
    scrollTo: (top: any) => {
      if (scrollerRef.current)
        scrollerRef.current.scrollTo({ top, behavior: "auto" });
    },
    scrollToIndex: (index: any, options: any = {}) => {
      const { align = "start", behavior = "auto" } = options;
      const offset = state.itemOffsets[index];
      const itemHeight = state.itemSizes.get(index) || DEFAULT_ITEM_HEIGHT;
      if (offset !== undefined && scrollerRef.current) {
        let top;
        if (align === "end") {
          top = offset - state.viewportHeight + itemHeight;
        } else if (align === "center") {
          top = offset - state.viewportHeight / 2 + itemHeight / 2;
        } else {
          top = offset;
        }
        scrollerRef.current.scrollTo({ top, behavior });
      }
    },
    scrollerElement: () => scrollerRef.current,
    data: {
      get: () => state.data,
      prepend: (items: any) =>
        dispatch({ type: "PREPEND_DATA", payload: items }),

      update: (index: any, newItemData: any) =>
        dispatch({ type: "UPDATE_ITEM_DATA", payload: { index, newItemData } }),
    },
    updateIndex: {
      update: (index: any) => {
        dispatch({ type: "UPDATE_INDEX", payload: { index } });
      },
    },
  };
}

export function useVirtMethods() {
  const { state, dispatch } = useContext<any>(VirtContext);
  return useMemo(
    () => createVirtMethods({ current: null }, state, dispatch),
    [state, dispatch]
  );
}

export function useCurrentlyRenderedData() {
  const { state } = useContext<any>(VirtContext);
  return useMemo(
    () => state.visibleItems.map((item: any) => item.data),
    [state.visibleItems]
  );
}

// --- 7. Example Usage ---

function MessageList() {
  const virtuosoRef = useRef<any>(null);
  const { rewrite } = useChat();

  // The Item component is now much simpler
  const Item = ({
    index,
    data,
    onSizeChange,
  }: {
    index: any;
    data: Message;
    onSizeChange: ({ index, size }: { index: number; size: number }) => void;
  }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      if (!ref.current) return;
      const height = ref.current.clientHeight;
      onSizeChange({
        index: index,
        size: height,
      });
    }, [data, index]);
    return (
      <div
        ref={ref}
        style={{
          padding: "16px 8px",
        }}
        className="border-b border-gray-700 dark:border-gray-200"
      >
        <MessageBox
          message={data}
          messageIndex={index}
          rewrite={rewrite}
          type="list"
        />
      </div>
    );
  };
  Item.displayName = "Item";
  // const handlePrepend = () => {
  //   virtuosoRef.current?.data.prepend([
  //     {
  //       id: String(counter++),
  //       role: "user",
  //       content: `--- Prepend ${counter++} ---`,
  //     },
  //   ]);
  // };

  // const handleAppend = () => {
  //   virtuosoRef.current?.data.append([`--- Append ${counter++} ---`]);
  // };

  // const handleScrollTo500 = () => {
  //   virtuosoRef.current?.scrollToIndex(500, { align: "center" });
  // };

  return (
    <section className="w-full h-[400px]">
      {" "}
      <div style={{ fontFamily: "sans-serif" }} className="h-full flex-1 ">
        <VirtMessageList
          ref={virtuosoRef}
          ItemContent={Item}
          style={{ height: "100%" }}
        />
      </div>
    </section>
  );
}

export default MessageList;
