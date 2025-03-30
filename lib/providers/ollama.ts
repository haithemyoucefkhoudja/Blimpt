import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { getOllamaApiEndpoint } from '@/config';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import axios from 'axios';
import { AvailableEmbeddingModels } from '.';

export const loadOllamaChatModels = async (ollamaEndpoint: string, model: string) => {
  
  try {
    if (!ollamaEndpoint) return {};
    return new ChatOllama({
      baseUrl: ollamaEndpoint,
      model: model,
      temperature: 0.7,
    });
  } catch (err) {
    console.error(`Error loading Ollama models: ${err}`);
    return {};
  }
};

export const loadOllamaEmbeddingsModels = async ():Promise<AvailableEmbeddingModels> => {
  const ollamaEndpoint = getOllamaApiEndpoint();

  if (!ollamaEndpoint) return {};

  try {
    const response = await axios.get(`${ollamaEndpoint}/api/tags`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { models: ollamaModels } = response.data;

    const embeddingsModels = ollamaModels.reduce((acc: { [x: string]: { displayName: string; model: OllamaEmbeddings; }; }, model: { model: string; name: any; }) => {
      acc[model.model] = {
        displayName: model.name,
        model: new OllamaEmbeddings({
          baseUrl: ollamaEndpoint,
          model: model.model,
        }),
      };

      return acc;
    }, {});

    return embeddingsModels;
  } catch (err) {
    console.error(`Error loading Ollama embeddings model: ${err}`);
    return {};
  }
};
