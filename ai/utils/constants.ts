import { Config } from "../settings/config";
import { Model } from "../settings/model";

const CLOSE_DELAY = 15000;
const WIDTH_OFFSET = 200;
const MAX_HEIGHT = 900;
const MAX_WIDTH = 600;
const CHECKSEARXNG_TIMOUT = 30000;
const defaultModels: Model[] = [
  {
    name: "deepseek-chat",
    provider: "DEEPSEEK",
    id: "deepseek",
    isDeepThinking: false,
  },
  {
    name: "deepseek-reasoner",
    provider: "DEEPSEEK",
    id: "deepseek-reasoner",
    isDeepThinking: true,
  },
];
const defaultConfig: Config = {
  GENERAL: { KEEP_ALIVE: "5m" },
  providers: [
    { name: "DEEPSEEK", apiKey: "" },
    { name: "OPENAI", apiKey: "" },
    { name: "ANTHROPIC", apiKey: "" },
    { name: "GROQ", apiKey: "" },
    { name: "GEMINI", apiKey: "" },
    { name: "MISTRAL", apiKey: "" },
    { name: "OLLAMA", apiKey: "", baseUrl: "" },
  ],
  API_ENDPOINTS: { OLLAMA: "" },
  models: defaultModels,
  selectedModel: defaultModels[0],
  selectedDeepThinkingModel: defaultModels[1],
};
export {
  CLOSE_DELAY,
  WIDTH_OFFSET,
  MAX_HEIGHT,
  MAX_WIDTH,
  CHECKSEARXNG_TIMOUT,
  defaultModels,
  defaultConfig,
};
