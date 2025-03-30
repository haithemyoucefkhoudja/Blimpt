import { loadAnthropicChatModels } from './anthropic';
import { loadDeepSeekChatModels } from './deepseek';
import { loadGeminiChatModels, loadGeminiEmbeddingsModels } from './gemini';
import { loadGroqChatModels } from './groq';
import { loadOllamaChatModels, loadOllamaEmbeddingsModels } from './ollama';
import { loadOpenAIChatModels, loadOpenAIEmbeddingsModels } from './openai';
import { loadTransformersEmbeddingsModels } from './transformers';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Embeddings } from '@langchain/core/embeddings';

// Define the type for the chatModelProviders object
interface ChatModelProviders {
  [key: string]: (ApiKey: string, model:string) => Promise<BaseChatModel | {}>;
}

interface EmbeddingModel {
  displayName: string;
  model: Embeddings | undefined;
}

// Update the EmbeddingsModelProviders interface to match the actual structure
export interface EmbeddingsModelProviders {
  [key: string]: ()=> Promise<AvailableEmbeddingModels>; // Each key maps to an EmbeddingModel object
}

// Define the AvailableEmbeddingModels interface
export interface AvailableEmbeddingModels {
  [key: string]: EmbeddingModel; // Each key maps to an EmbeddingsModelProviders object
}

export interface EmbeddingModelMap {
  [key: string]: AvailableEmbeddingModels
}
// interface PromiseAvailableEmbeddingModels {
  
//   [key: string]: () => Promise<EmbeddingsModelProviders>; // Each key maps to an EmbeddingsModelProviders object
// }
// Add an index signature to allow dynamic keys
const chatModelProviders: ChatModelProviders = {
  deepseek: loadDeepSeekChatModels,
  openai: loadOpenAIChatModels,
  groq: loadGroqChatModels,
  ollama: loadOllamaChatModels,
  anthropic: loadAnthropicChatModels,
  gemini: loadGeminiChatModels,
};

// Define the return type for getAvailableChatModelProviders
interface AvailableModels {
  [key: string]: BaseChatModel |  {}; // Allow ChatModels or empty objects
}

const embeddingModelProviders:EmbeddingsModelProviders = {
  openai: loadOpenAIEmbeddingsModels,
  local: loadTransformersEmbeddingsModels,
  ollama: loadOllamaEmbeddingsModels,
  gemini: loadGeminiEmbeddingsModels,
};
export const getChatModel = async (provider: string, apiKey: string, model: string): Promise<BaseChatModel | {}> => { 
  if (!provider) {
    throw new Error('Provider is required.');
  }
  if (!apiKey) {
    throw new Error('API key is required.');
  }
  if (!model) {
    throw new Error('Model name is required.');
  }
  const chatModelFunc = chatModelProviders[provider];

  if (!chatModelFunc) {
    throw new Error(`No provider found with name: ${provider}`);
  }

  try {
    const chatModel = await chatModelFunc(apiKey, model);
    return chatModel;
  } catch (error: any) {
    throw new Error('Error initializing chat model: ' + error.message);
  }
}
export const getAvailableChatModelProviders = async (ApiKey: string, model:string): Promise<AvailableModels> => {
  const models: AvailableModels = {};
  
  for (const provider in chatModelProviders) {

    const providerModels = await chatModelProviders[provider](ApiKey, model);
    
    if (Object.keys(providerModels).length > 0) {
      models[provider] = providerModels;
    }
  }

  models['custom_openai'] = {} as BaseChatModel;
  return models;
};
export const getAvailableEmbeddingModelProviders = async (): Promise<EmbeddingModelMap> => {
  const models: EmbeddingModelMap = {};

  for (const provider in embeddingModelProviders) {
    try {
      const providerModels = await embeddingModelProviders[provider]();
      if (Object.keys(providerModels).length > 0) {
        models[provider] = providerModels;
      }
    } catch (error: any) {
      
      console.error(`Error loading embedding models for provider "${provider}": ${error.message}`)
      throw new Error(
        `Error loading embedding models for provider "${provider}": ${error.message}`
      );
      
    }
  }

  // if (Object.keys(models).length === 0) {
  //   throw new Error('No embedding models available');
  // }
  return models;
};
