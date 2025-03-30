import { ChatOpenAI } from '@langchain/openai';
import {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionMessage,
} from "openai/resources/index.mjs";
class DeepGroq extends ChatOpenAI {
  protected override _convertOpenAIDeltaToBaseMessageChunk(
    delta: Record<string, any>,
    rawResponse: ChatCompletionChunk,
    defaultRole?:
      | "function"
      | "user"
      | "system"
      | "developer"
      | "assistant"
      | "tool"
  ) {
    const messageChunk = super._convertOpenAIDeltaToBaseMessageChunk(
      delta,
      rawResponse as any,
      defaultRole
    );
    messageChunk.additional_kwargs.reasoning_content =
      delta.reasoning_content;
    return messageChunk;
  }

  protected override _convertOpenAIChatCompletionMessageToBaseMessage(
    message: ChatCompletionMessage,
    rawResponse: ChatCompletion
  ) {
    const langChainMessage =
      super._convertOpenAIChatCompletionMessageToBaseMessage(
        message,
        rawResponse
      );
    langChainMessage.additional_kwargs.reasoning_content = (
      message as any
    ).reasoning_content;
    return langChainMessage;
  }
}
export const loadGroqChatModels = async (GroqApiKey: string, model: string) => {

  try {
    
    if (!GroqApiKey) return {};
    return new DeepGroq(
      {
        openAIApiKey: GroqApiKey,
        modelName: model,
        temperature: 0.7,
        configuration: {
          baseURL: 'https://api.groq.com/openai/v1',
        }
      },
    );
  } catch (err) {
    console.error(`Error loading Groq models: ${err}`);
    return {};
  }
};
