
// Define the structure of the chatModels object
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionMessage,
} from "openai/resources/index.mjs";

class ChatDeepSeek extends ChatOpenAI {
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
// Explicitly define the return type as Promise<ChatModels>
export const loadDeepSeekChatModels = async (DeepSeekApiKey: string, model: string) => {
  
  try {
    
    if (!DeepSeekApiKey) return {};
    return new ChatDeepSeek(
    
      { 
        openAIApiKey: DeepSeekApiKey,
        modelName: model,
        temperature: 0.7,
        configuration: {
          baseURL: "https://api.deepseek.com",
        },
      },
    )
  } catch (err) {
    console.error(`Error loading DeepSeek models: ${err}`);
    return {};
  }
};