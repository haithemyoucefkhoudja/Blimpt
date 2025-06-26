import { createContext, useContext } from "react";

// Define the shape of the API we want to expose.
// This gives us great autocompletion and type safety.
export type VirtuosoApi = {
  scrollToIndex: (
    index: number,
    options?: {
      align?: "start" | "center" | "end";
      behavior?: "smooth" | "auto";
    }
  ) => void;
  data: {
    get: () => any[];
    append: (items: any[]) => void;
    prepend: (items: any[]) => void;
    update: (index: number, newItemData: any) => void;
  };
  // We add this to handle your "is regenerating" UI state
  updateIndex: {
    update: (index: number | null) => void;
  };
};

// Create the context with a null default value.
export const VirtuosoControlContext = createContext<VirtuosoApi | null>(null);

/**
 * Custom hook to easily access the Virtuoso list's control API
 * from any component wrapped in its provider.
 */
export const useVirtuosoControl = (): VirtuosoApi | null => {
  const api = useContext(VirtuosoControlContext);

  return api;
};
