import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { load } from "@tauri-apps/plugin-store";
import { Config, General, TAPI_ENDPOINTS } from "@/types/settings/config";
import { Provider } from "@/types/settings/provider";
import { Model } from "@/types/settings/model";
import { defaultConfig } from "@/utils/constants";

// Define the shape of our context
interface ConfigContextType {
  port: string | null;
  setPort: (port: string | null) => void;
  config: Config;
  updateConfig: (section: keyof Config,  value: any) => void;
  saveConfig: () => Promise<void>;
  isUpdated: boolean;
  isDeepThinking: boolean;
  setIsDeepThinking: () => void;
  isSearch: boolean;
  setIsSearch: ()=>void;
}


const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfig] = useState<Config>(defaultConfig);
    const [isUpdated, setIsUpdated] = useState(false);
    const [isDeepThinking, setIsDeepThinking] = useState(false);
    const [isSearch, setIsSearch] = useState(false);
    const [port, setPort] = useState<string | null>(null);
  useEffect(() => {
    const loadConfig = async () => {
      const store = await load("config.json", { autoSave: false });
      const storedConfig = await store.get<Config>("config");
      if (storedConfig?.providers.length === 0) {
        storedConfig.providers = defaultConfig.providers;  
        await store.set("config", storedConfig);
        await store.save();      
      }
      if (storedConfig?.models.length == 0) {
        storedConfig.models = defaultConfig.models;
        await store.set("config", storedConfig);
        await store.save();
      }
      if (storedConfig && !storedConfig?.selectedModel) { 
        storedConfig.selectedModel = defaultConfig.selectedModel;
        await store.set("config", storedConfig);
        await store.save();
      }
      if (storedConfig && !storedConfig?.selectedDeepThinkingModel) { 
        storedConfig.selectedDeepThinkingModel = defaultConfig.selectedDeepThinkingModel;
        await store.set("config", storedConfig);
        await store.save();
      }
      
        
      if (storedConfig) {
          setConfig(storedConfig);
    }
    };
    loadConfig();
  }, []);

const updateConfig = (section: keyof Config, value: Provider[] | Model[] | TAPI_ENDPOINTS | General) => {
    if (section === "providers") { 
        const filteredModels = config.models.filter(model => { 
            return (value as Provider[]).some(provider => provider.name === model.provider)
        })
        setConfig((prev) => ({
            ...prev,
            models: filteredModels,
            [section]: value as Provider[]
        }));
        setIsUpdated(true);
        return;
    }
    setConfig((prev) => ({
      ...prev,
      [section]: value,
    }));
    setIsUpdated(true);
  };

  const saveConfig = async () => {
    const store = await load("config.json", { autoSave: false });
    await store.set("config", config);
    await store.save();
    setIsUpdated(false);
  };

  return (
    <ConfigContext.Provider value={{
      config, updateConfig, saveConfig, isUpdated, isDeepThinking, setIsDeepThinking() {
        setIsDeepThinking(prev => !prev);
      },
      isSearch, setIsSearch: () => {
        setIsSearch(prev =>!prev);
      },
      
      port, setPort: (port: string | null) => {
        setPort(port);
      }
    }
    }>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
