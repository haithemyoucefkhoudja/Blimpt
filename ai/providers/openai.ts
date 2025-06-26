import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
// import { getOpenaiApiKey } from '@/config';
import { AvailableEmbeddingModels } from ".";
import {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionMessage,
} from "openai/resources/index.mjs";
export class DeepChatOpenAI extends ChatOpenAI {
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
    messageChunk.additional_kwargs.reasoning_content = delta.reasoning_content;
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
export const loadOpenAIChatModels = async (
  openAIApiKey: string,
  model: string
) => {
  try {
    if (!openAIApiKey) return {};
    return new DeepChatOpenAI({
      openAIApiKey,
      modelName: model,
      temperature: 0.7,
    });
  } catch (err) {
    console.error(`Error loading OpenAI models: ${err}`);
    return {};
  }
};
