import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

import {
  getAvailableEmbeddingModelProviders,
  getChatModel,
} from "../providers";
import { searchHandlers } from "../messageHandler";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { MetaSearchAgentType } from "../search/metaSearchAgent";
import { Embeddings } from "@langchain/core/embeddings";
import EventEmitter from "eventemitter3";
import { Document } from "langchain/document";
import { DeepChatOpenAI } from "../providers/openai";
import { TAttachment } from "@/types/attachment";

// Add this utility function to convert EventEmitter to AsyncIterator
export function on(emitter: EventEmitter, event: string) {
  const queue: any[] = [];
  const resolvers: ((value: IteratorResult<any>) => void)[] = [];
  let finished = false;

  const listener = (data: any) => {
    if (resolvers.length > 0) {
      resolvers.shift()!({ value: data, done: false });
    } else {
      queue.push(data);
    }
  };

  const endListener = () => {
    if (resolvers.length > 0) {
      resolvers.shift()!({ value: undefined, done: true });
    }
    finished = true;
  };

  emitter.on(event, listener);
  emitter.on("end", endListener); // Listen for the 'end' event

  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    next() {
      return new Promise((resolve) => {
        if (queue.length > 0) {
          resolve({ value: queue.shift(), done: false });
        } else if (finished) {
          resolve({ value: undefined, done: true });
        } else {
          resolvers.push(resolve);
        }
      });
    },
    return() {
      // Clean up listeners when the consumer stops listening
      emitter.removeListener(event, listener);
      emitter.removeListener("end", endListener);
      return Promise.resolve({ done: true });
    },
  };
}
export interface chatModel {
  provider: string;
  model: string;
  apiKey: string;
  customOpenAIBaseURL?: string;
  customOpenAIKey?: string;
}

async function* streamSearchResponse(
  query: string,
  history: BaseMessage[],
  llm: BaseChatModel,
  embeddings: Embeddings | undefined,
  searchHandler: MetaSearchAgentType,
  optimizationMode: "speed" | "balanced",
  port: string,
  attachments: TAttachment[] = []
) {
  const emitter = await searchHandler.searchAndAnswer(
    query,
    history,
    llm,
    embeddings,
    optimizationMode,
    port,
    attachments
  );

  let message = "";
  let reasoning_content = "";
  let sources: Document[] = [];

  try {
    for await (const event of on(emitter, "data")) {
      const parsedData = JSON.parse(event);
      if (parsedData.type === "end") {
        yield { type: "end", message, sources };
        break;
      }
      if (parsedData.type === "response") {
        if (!parsedData.data && message.length > 0) break;
        message += parsedData.data;
        yield { type: "message", data: parsedData.data };
      } else if (parsedData.type == "reasoning") {
        reasoning_content += parsedData.data;
        yield { type: "reasoning", data: parsedData.data };
      } else if (parsedData.type === "sources") {
        sources = parsedData.data;
        yield { type: "sources", data: parsedData.data };
      } else if (parsedData.type === "action") {
        console.log("action", parsedData.data);
        yield { type: "action", data: parsedData.data };
      } else if (parsedData.type === "error") {
        yield { type: "error", data: parsedData.data };
        break;
      }
    }
    console.log("End stream");
    yield { type: "end", message, sources };
  } catch (error) {
    yield {
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
export interface ChatRequestBody {
  embeddingModel?: any;
  optimizationMode: "speed" | "balanced";
  focusMode: string;
  chatModel: chatModel;
  query: string;
  port: string;
  history: Array<[string, any]>;
  attachments?: TAttachment[];
}

async function initializeModels(body: ChatRequestBody) {
  if (!body.chatModel) {
    console.error("Missing chatModel in request body.");
    throw new Error("Missing chatModel in request body.");
  }
  let llm: BaseChatModel;

  if (body.chatModel.provider === "custom_openai") {
    // Validate required fields for the custom_openai provider.
    if (!body.chatModel.customOpenAIKey) {
      throw new Error("Missing customOpenAIKey for custom_openai provider.");
    }
    if (!body.chatModel.customOpenAIBaseURL) {
      throw new Error(
        "Missing customOpenAIBaseURL for custom_openai provider."
      );
    }
    try {
      llm = new DeepChatOpenAI({
        modelName: body.chatModel.model,
        openAIApiKey: body.chatModel.customOpenAIKey,
        configuration: { baseURL: body.chatModel.customOpenAIBaseURL },
      }) as unknown as BaseChatModel;
    } catch (error: any) {
      throw new Error("Error initializing ChatOpenAI: " + error.message);
    }
  } else {
    try {
      llm = (await getChatModel(
        body.chatModel.provider,
        body.chatModel.apiKey,
        body.chatModel.model
      )) as BaseChatModel;
    } catch (error: any) {
      console.error("Error initializing chat model: " + error.message);
      throw new Error("Error initializing chat model: " + error.message);
    }
  }
  let embeddings: Embeddings | undefined = undefined;
  if (body.embeddingModel) {
    // Load embedding model providers.
    const embeddingModelProviders = await getAvailableEmbeddingModelProviders();

    const embeddingProviderKey =
      body.embeddingModel.provider || Object.keys(embeddingModelProviders)[0];
    const embeddingProvider = embeddingModelProviders[embeddingProviderKey];
    if (!embeddingProvider) {
      throw new Error(
        `No embedding provider found for key: ${embeddingProviderKey}`
      );
    }

    const embeddingModelKey =
      body.embeddingModel.model || Object.keys(embeddingProvider)[0];
    const embeddingModel = embeddingProvider[embeddingModelKey];
    if (!embeddingModel || !embeddingModel.model) {
      throw new Error(`No embedding model found for key: ${embeddingModelKey}`);
    }
    embeddings = embeddingModel.model as Embeddings;
  }

  return { llm, embeddings };
}

export async function* handleChatRequest(body: ChatRequestBody) {
  try {
    const { llm, embeddings } = await initializeModels(body);
    const searchHandler = (searchHandlers as any)[body.focusMode];
    if (!searchHandler) {
      throw new Error("Invalid focus mode");
    }

    const history = body.history.map((msg) => {
      if (msg[0] === "user") {
        return new HumanMessage({ content: msg[1] });
      } else if (msg[0] === "assistant") {
        return new AIMessage({ content: msg[1] });
      } else {
        throw new Error("Unknown message type in history");
      }
    });

    yield* streamSearchResponse(
      body.query,
      history,
      llm,
      embeddings,
      searchHandler,
      body.optimizationMode,
      body.port,
      body.attachments
    );
  } catch (error: any) {
    console.error("Error streaming response: " + error.message);
    yield {
      type: "error",
      data: error.message,
    };
  }
}
