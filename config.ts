// Add an index signature to the Config interface
interface Config {
  GENERAL: {
    PORT: number;
    SIMILARITY_MEASURE: string;
    KEEP_ALIVE: string;
  };
  API_KEYS: {
    DEEPSEEK: string;
    OPENAI: string;
    GROQ: string;
    ANTHROPIC: string;
    GEMINI: string;
  };
  API_ENDPOINTS: {
    OLLAMA: string;
    SEARXNG: string;
  };
  [key: string]: any; // Index signature to allow any string key
}

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};
const config: Config = {
  API_KEYS: {
    DEEPSEEK: '',
    OPENAI: '',
    GEMINI: '',
    GROQ: '',
    ANTHROPIC:''
    
  },
  GENERAL: {
    PORT: 3001,
    SIMILARITY_MEASURE: "cosine",
    KEEP_ALIVE: "5m"
  },

  API_ENDPOINTS: {
    SEARXNG: "http://localhost:8080",
    OLLAMA: ""
  },
  

} 
const loadConfig = () =>
  config;

export const getPort = () => loadConfig().GENERAL.PORT;

export const getSimilarityMeasure = () =>
  loadConfig().GENERAL.SIMILARITY_MEASURE;

export const getKeepAlive = () => loadConfig().GENERAL.KEEP_ALIVE;

export const getDeepSeekApiKey = () => loadConfig().API_KEYS.DEEPSEEK;

export const getOpenaiApiKey = () => loadConfig().API_KEYS.OPENAI;

export const getGroqApiKey = () => loadConfig().API_KEYS.GROQ;

export const getAnthropicApiKey = () => loadConfig().API_KEYS.ANTHROPIC;

export const getGeminiApiKey = () => loadConfig().API_KEYS.GEMINI;

export const getSearxngApiEndpoint = () => loadConfig().API_ENDPOINTS.SEARXNG;
export const getOllamaApiEndpoint = () => loadConfig().API_ENDPOINTS.OLLAMA;

export const updateConfig = (config: RecursivePartial<Config>) => {
  const currentConfig = loadConfig();

  for (const key in currentConfig) {
    if (!config[key]) config[key] = {};

    if (typeof currentConfig[key] === 'object' && currentConfig[key] !== null) {
      for (const nestedKey in currentConfig[key]) {
        if (
          !config[key][nestedKey] &&
          currentConfig[key][nestedKey] &&
          config[key][nestedKey] as any !== ''
        ) {
          config[key][nestedKey] = currentConfig[key][nestedKey];
        }
      }
    } else if (currentConfig[key] && config[key] as any !== '') {
      config[key] = currentConfig[key];
    }
  }

  // fs.writeFileSync(
  //   path.join(__dirname, `../${configFileName}`),
  //   toml.stringify(config as any),
  // );
};