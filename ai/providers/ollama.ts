import { ChatOllama } from "@langchain/community/chat_models/ollama";

export const loadOllamaChatModels = async (
  ollamaEndpoint: string,
  model: string
) => {
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
