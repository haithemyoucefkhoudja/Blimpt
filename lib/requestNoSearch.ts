import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { getChatModel } from "../ai";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
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
    const history = body.history.map((msg) => {
      if (msg[0] === "human") {
        return new HumanMessage({ content: msg[1] });
      } else {
        return new AIMessage({ content: msg[1] });
      }
    });
    console.log("func:", llm);

    const query = new HumanMessage({
      content: [
        { type: "text", text: body.query },
        ...(body.attachments || []).map((item) => {
          switch (item.type) {
            case "image":
              return {
                type: "image_url",
                image_url: `data:${item.file.type};base64,${item.base64}`,
              };
            case "text":
              return {
                type: "text",
                text: item.text,
              };
            default:
              return {
                type: "text",
                text: "Unsupported attachment type",
              };
          }
        }),
      ],
    });

    const stream = await llm.stream([...history, query]);
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
  }
}
