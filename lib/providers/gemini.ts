import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';
import { getGeminiApiKey } from '../../config';
// import logger from '../../utils/logger';

export const loadGeminiChatModels = async (geminiApiKey: string, model: string) => {
  
  try {
    
    if (!geminiApiKey) return {};
    return new ChatGoogleGenerativeAI({
      modelName: model,
      temperature: 0.7,
      apiKey: geminiApiKey,
    })
  } catch (err) {
    console.error(`Error loading Gemini models: ${err}`);
    return {};
  }
};

export const loadGeminiEmbeddingsModels = async () => {
  const geminiApiKey = getGeminiApiKey();

  if (!geminiApiKey) return {};

  try {
    const embeddingModels = {
      'text-embedding-004': {
        displayName: 'Text Embedding',
        model: new GoogleGenerativeAIEmbeddings({
          apiKey: geminiApiKey,
          modelName: 'text-embedding-004',
        }),
      },
    };

    return embeddingModels;
  } catch (err) {
    console.error(`Error loading Gemini embeddings model: ${err}`);
    return {};
  }
};
