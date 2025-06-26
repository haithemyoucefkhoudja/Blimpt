import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { getChatModel } from "../ai";
import { ChatRequestBody } from "../ai";

export async function* handleChatRequestNoSearch(body: ChatRequestBody) {
  let llm: BaseChatModel;

  if (body.chatModel.provider === "custom_openai") {
    if (!body.chatModel.customOpenAIKey) {
      throw new Error("Missing customOpenAIKey for custom_openai provider.");
    }
    if (!body.chatModel.customOpenAIBaseURL) {
      throw new Error(
        "Missing customOpenAIBaseURL for custom_openai provider."
      );
    }

    try {
      llm = new ChatOpenAI({
        modelName: body.chatModel.model,
        openAIApiKey: body.chatModel.customOpenAIKey,
        configuration: { baseURL: body.chatModel.customOpenAIBaseURL },
      }) as unknown as BaseChatModel;
    } catch (error: any) {
      console.error("Error initializing OpenAI chat model: " + error.message);
      yield {
        type: "error",
        data: "Error initializing OpenAI chat model: " + error.message,
      };
      return;
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
      yield {
        type: "error",
        data: "Error initializing chat model: " + error.message,
      };
      return;
    }
  }
  try {
    // Initiate the chat stream
    const stream = await llm.stream([...body.history, ["human", body.query]]);
    if (stream.locked) {
      yield {
        type: "error",
        data: "Error streaming response: " + stream.locked,
      };
      return;
    }
    let isFirst = true;

    for await (const chunk of stream) {
      // console.log('chunk:', chunk)
      const reasoning_content = chunk.additional_kwargs
        ?.reasoning_content as string;
      const llm_content = chunk.content as string;

      if (!llm_content && !isFirst && !reasoning_content) {
        break;
      }

      isFirst = false;

      // Yield the message chunk
      if (llm_content) {
        yield { type: "message", data: llm_content };
      }

      if (reasoning_content) {
        yield { type: "reasoning", data: reasoning_content };
      }
    }

    // Finalize the stream
    yield { type: "end" };
  } catch (error) {
    console.error("Error streaming response: " + error.message);
    yield {
      type: "error",
      data: "Error streaming response: " + error.message,
    };
    return;
  }
}
