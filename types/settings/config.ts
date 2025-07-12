import { Model } from "./model";
import { Provider } from "./provider";
export type General = {
  KEEP_ALIVE: string;
};
export type TAPI_ENDPOINTS = {
  OLLAMA: string;
};
export type Config = {
  GENERAL: General;
  providers: Provider[];
  API_ENDPOINTS: TAPI_ENDPOINTS;
  models: Model[];
  selectedModel: Model | null;
  selectedDeepThinkingModel: Model | null;
  MAX_TOKENS: number;
  APP_SHORTCUT: string;
  SCREENSHOT_SHORTCUT: string;
  OUTPUT_DELAY: number;
};
