import { ChatAnthropic } from '@langchain/anthropic';

export const loadAnthropicChatModels = async (AnthropicApiKey: string, model: string) => {
  
  if (!AnthropicApiKey) return {};

  try {
    return new ChatAnthropic({
      temperature: 0.7,
      anthropicApiKey: AnthropicApiKey,
      model: model,
    });
    
  } catch (err) {
   console.error(`Error loading Anthropic models: ${err}`);
    return {};
  }
};
