import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { load } from "@tauri-apps/plugin-store";
import { Config, General, TAPI_ENDPOINTS } from "@/types/settings/config";
import { Provider } from "@/types/settings/provider";
import { Model } from "@/types/settings/model";
import { defaultConfig } from "@/utils/constants";

// --- 1. Define State and Action Types ---

interface ConfigState {
  config: Config;
  isUpdated: boolean;
  isDeepThinking: boolean;
  isSearch: boolean;
  port: string | null;
}

type ConfigAction =
  | { type: "SET_CONFIG_LOADED"; payload: Config }
  | {
      type: "UPDATE_CONFIG_SECTION";
      payload: { section: keyof Config; value: any };
    }
  | { type: "SAVE_SUCCESS" }
  | { type: "TOGGLE_DEEP_THINKING" }
  | { type: "TOGGLE_SEARCH" }
  | { type: "SET_PORT"; payload: string | null };

// --- 2. Define the Initial State ---

const initialState: ConfigState = {
  config: defaultConfig,
  isUpdated: false,
  isDeepThinking: false,
  isSearch: false,
  port: null,
};

// --- 3. Create the Reducer Function ---

const configReducer = (
  state: ConfigState,
  action: ConfigAction
): ConfigState => {
  switch (action.type) {
    case "SET_CONFIG_LOADED":
      return {
        ...state,
        config: action.payload,
        isUpdated: false, // Reset update status on load
      };

    case "UPDATE_CONFIG_SECTION": {
      const { section, value } = action.payload;

      // Keep the special filtering logic for providers
      if (section === "providers") {
        const filteredModels = state.config.models.filter((model) =>
          (value as Provider[]).some(
            (provider) => provider.name === model.provider
          )
        );
        return {
          ...state,
          config: {
            ...state.config,
            models: filteredModels,
            [section]: value as Provider[],
          },
          isUpdated: true,
        };
      }

      // Handle all other sections
      return {
        ...state,
        config: {
          ...state.config,
          [section]: value,
        },
        isUpdated: true,
      };
    }

    case "SAVE_SUCCESS":
      return {
        ...state,
        isUpdated: false,
      };

    case "TOGGLE_DEEP_THINKING":
      return {
        ...state,
        isDeepThinking: !state.isDeepThinking,
      };

    case "TOGGLE_SEARCH":
      return {
        ...state,
        isSearch: !state.isSearch,
      };

    case "SET_PORT":
      return {
        ...state,
        port: action.payload,
      };

    default:
      return state;
  }
};

// --- Context Definition (No changes needed here) ---

interface ConfigContextType {
  port: string | null;
  setPort: (port: string | null) => void;
  config: Config;
  updateConfig: (section: keyof Config, value: any) => void;
  saveConfig: () => Promise<void>;
  isUpdated: boolean;
  isDeepThinking: boolean;
  setIsDeepThinking: () => void;
  isSearch: boolean;
  setIsSearch: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);
// --- 4. The Refactored Provider Component ---

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  // All state is now managed by the reducer
  const [state, dispatch] = useReducer(configReducer, initialState);
  const { config, isUpdated, isDeepThinking, isSearch, port } = state;

  // The loading effect now dispatches an action
  useEffect(() => {
    const loadConfig = async () => {
      const store = await load("config.json", { autoSave: false });
      let storedConfig = await store.get<Config>("config");

      // The logic for checking and back-filling defaults is great, keep it.
      // We'll just make sure to save if we modify it.
      let needsSave = false;
      if (!storedConfig) {
        storedConfig = defaultConfig;
        needsSave = true;
      }
      if (!storedConfig.providers || storedConfig.providers.length === 0) {
        storedConfig.providers = defaultConfig.providers;
        needsSave = true;
      }
      if (!storedConfig.models || storedConfig.models.length === 0) {
        storedConfig.models = defaultConfig.models;
        needsSave = true;
      }
      if (!storedConfig.selectedModel) {
        storedConfig.selectedModel = defaultConfig.selectedModel;
        needsSave = true;
      }
      if (!storedConfig.selectedDeepThinkingModel) {
        storedConfig.selectedDeepThinkingModel =
          defaultConfig.selectedDeepThinkingModel;
        needsSave = true;
      }

      if (needsSave) {
        await store.set("config", storedConfig);
        await store.save();
      }

      dispatch({ type: "SET_CONFIG_LOADED", payload: storedConfig });
    };
    loadConfig();
  }, []);

  // Public functions now dispatch actions
  const updateConfig = (section: keyof Config, value: any) => {
    dispatch({ type: "UPDATE_CONFIG_SECTION", payload: { section, value } });
  };

  const saveConfig = async () => {
    const store = await load("config.json", { autoSave: false });
    await store.set("config", config); // Use config from state
    await store.save();
    dispatch({ type: "SAVE_SUCCESS" });
  };

  const setIsDeepThinking = () => dispatch({ type: "TOGGLE_DEEP_THINKING" });
  const setIsSearch = () => dispatch({ type: "TOGGLE_SEARCH" });
  const setPort = (port: string | null) =>
    dispatch({ type: "SET_PORT", payload: port });

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
      config,
      updateConfig,
      saveConfig,
      isUpdated,
      isDeepThinking,
      setIsDeepThinking,
      isSearch,
      setIsSearch,
      port,
      setPort,
    }),
    [config, isUpdated, isDeepThinking, isSearch, port]
  );

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

// The consumer hook remains exactly the same
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
