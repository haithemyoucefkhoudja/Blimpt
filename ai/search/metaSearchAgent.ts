import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { Embeddings } from "@langchain/core/embeddings";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  RunnableLambda,
  RunnableMap,
  RunnableSequence,
} from "@langchain/core/runnables";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import LineListOutputParser from "@/ai/outputParsers/listLineOutputParser";
import LineOutputParser from "@/ai/outputParsers/lineOutputParser";
import { getDocumentsFromLinks } from "@/utils/documents";
import { Document } from "langchain/document";
import { searchSearxng } from "@/ai/searxng";
import { EventEmitter } from "eventemitter3";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { TAttachment } from "@/types/attachment";
export interface MetaSearchAgentType {
  searchAndAnswer: (
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings | undefined,
    optimizationMode: "speed" | "balanced" | "quality",
    port: string,
    attachments: TAttachment[]
  ) => Promise<EventEmitter>;
}
interface Config {
  searchWeb: boolean;
  rerank: boolean;
  summarizer: boolean;
  rerankThreshold: number;
  queryGeneratorPrompt: string;
  responsePrompt: string;
  activeEngines: string[];
}
type BasicChainInput = { chat_history: BaseMessage[]; query: HumanMessage };
class MetaSearchAgent implements MetaSearchAgentType {
  private config: Config;
  private strParser = new StringOutputParser();
  private emitter = new EventEmitter();
  constructor(config: Config) {
    this.config = config;
  }
  private async createSearchRetrieverChain(llm: BaseChatModel, port: string) {
    process.env.NODE_ENV == "development" &&
      console.log("Creating search retriever chain...");
    (llm as unknown as ChatOpenAI).temperature = 0;
    return RunnableSequence.from([
      ChatPromptTemplate.fromMessages([
        ["system", this.config.queryGeneratorPrompt],
        new MessagesPlaceholder("chat_history"),
        new MessagesPlaceholder("query"),
      ]),
      async (input) => {
        console.log("Search retriever chain input LLM:", input);
        return await llm.invoke(input);
      },
      this.strParser,
      RunnableLambda.from(async (input: string) => {
        console.log(
          "Search  chain input:",
          input,
          process.env.NODE_ENV == "development"
        );
        process.env.NODE_ENV == "development" &&
          console.log("Search retriever chain input:", input);
        try {
          this.emitter.emit(
            "data",
            JSON.stringify({
              type: "action",
              data: "Generating search queries...",
            })
          );
          const linksOutputParser = new LineListOutputParser({ key: "links" });
          const questionOutputParser = new LineOutputParser({
            key: "question",
          });
          const links = await linksOutputParser.parse(input);
          process.env.NODE_ENV == "development" &&
            console.log("Parsed links:", links);
          let question = this.config.summarizer
            ? await questionOutputParser.parse(input)
            : input;
          process.env.NODE_ENV == "development" &&
            console.log("Parsed question:", question);
          if (question === "not_needed") {
            process.env.NODE_ENV == "development" &&
              console.log("Question not needed, returning empty result.");
            return { query: "", docs: [] };
          }
          if (links.length > 0) {
            process.env.NODE_ENV == "development" &&
              console.log("Processing links...");
            if (question.length === 0) {
              question = "summarize";
              process.env.NODE_ENV == "development" &&
                console.log("Empty question, setting to 'summarize'.");
            }
            let docs: Document<{ title: any; url: any }>[] = [];
            this.emitter.emit(
              "data",
              JSON.stringify({
                type: "action",
                data: "Fetching content from links...",
              })
            );
            const linkDocs = await getDocumentsFromLinks({ links });
            process.env.NODE_ENV == "development" &&
              console.log("Retrieved documents from links:", linkDocs);
            const docGroups: Document[] = [];
            linkDocs.map((doc) => {
              const URLDocExists = docGroups.find(
                (d) =>
                  d.metadata.url === doc.metadata.url &&
                  d.metadata.totalDocs < 10
              );
              if (!URLDocExists) {
                docGroups.push({
                  ...doc,
                  metadata: { ...doc.metadata, totalDocs: 1 },
                });
              }
              const docIndex = docGroups.findIndex(
                (d) =>
                  d.metadata.url === doc.metadata.url &&
                  d.metadata.totalDocs < 10
              );
              if (docIndex !== -1) {
                docGroups[docIndex].pageContent =
                  docGroups[docIndex].pageContent + `\n\n` + doc.pageContent;
                docGroups[docIndex].metadata.totalDocs += 1;
              }
            });
            process.env.NODE_ENV == "development" &&
              console.log("Grouped documents:", docGroups);
            this.emitter.emit(
              "data",
              JSON.stringify({ type: "action", data: "Summarizing content..." })
            );
            await Promise.all(
              docGroups.map(async (doc) => {
                try {
                  process.env.NODE_ENV == "development" &&
                    console.log("Summarizing document:", doc.metadata.url);
                  const res = await llm.invoke(
                    `            You are a web search summarizer, tasked with summarizing a piece of text retrieved from a web search. Your job is to summarize the \n            text into a detailed, 2-4 paragraph explanation that captures the main ideas and provides a comprehensive answer to the query.\n            If the query is "summarize", you should provide a detailed summary of the text. If the query is a specific question, you should answer it in the summary.\n            \n            - **Journalistic tone**: The summary should sound professional and journalistic, not too casual or vague.\n            - **Thorough and detailed**: Ensure that every key point from the text is captured and that the summary directly answers the query.\n            - **Not too lengthy, but detailed**: The summary should be informative but not excessively long. Focus on providing detailed information in a concise format.\n\n            The text will be shared inside the \`text\` XML tag, and the query inside the \`query\` XML tag.\n\n            <example>\n            1. \`<text>\n            Docker is a set of platform-as-a-service products that use OS-level virtualization to deliver software in packages called containers. \n            It was first released in 2013 and is developed by Docker, Inc. Docker is designed to make it easier to create, deploy, and run applications \n            by using containers.\n            </text>\n\n            <query>\n            What is Docker and how does it work?\n            </query>\n\n            Response:\n            Docker is a revolutionary platform-as-a-service product developed by Docker, Inc., that uses container technology to make application \n            deployment more efficient. It allows developers to package their software with all necessary dependencies, making it easier to run in \n            any environment. Released in 2013, Docker has transformed the way applications are built, deployed, and managed.\n            \`\n            2. \`<text>\n            The theory of relativity, or simply relativity, encompasses two interrelated theories of Albert Einstein: special relativity and general\n            relativity. However, the word "relativity" is sometimes used in reference to Galilean invariance. The term "theory of relativity" was based\n            on the expression "relative theory" used by Max Planck in 1906. The theory of relativity usually encompasses two interrelated theories by\n            Albert Einstein: special relativity and general relativity. Special relativity applies to all physical phenomena in the absence of gravity.\n            General relativity explains the law of gravitation and its relation to other forces of nature. It applies to the cosmological and astrophysical\n            realm, including astronomy.\n            </text>\n\n            <query>\n            summarize\n            </query>\n\n            Response:\n            The theory of relativity, developed by Albert Einstein, encompasses two main theories: special relativity and general relativity. Special\n            relativity applies to all physical phenomena in the absence of gravity, while general relativity explains the law of gravitation and its\n            relation to other forces of nature. The theory of relativity is based on the concept of "relative theory," as introduced by Max Planck in\n            1906. It is a fundamental theory in physics that has revolutionized our understanding of the universe.\n            \`\n            </example>\n\n            Everything below is the actual data you will be working with. Good luck!\n\n            <query>\n            ${question}\n            </query>\n\n            <text>\n            ${doc.pageContent}\n            </text>\n\n            Make sure to answer the query in the summary.\n          `
                  );
                  const document = new Document({
                    pageContent: res.content as string,
                    metadata: {
                      title: doc.metadata.title,
                      url: doc.metadata.url,
                    },
                  });
                  docs.push(document);
                  process.env.NODE_ENV == "development" &&
                    console.log(
                      "Finished summarizing document:",
                      doc.metadata.url
                    );
                } catch (error: any) {
                  console.error(
                    "Something Wrong Happened during summarization:",
                    error.message
                  );
                }
              })
            );
            process.env.NODE_ENV == "development" &&
              console.log("Finished processing links. Result:", {
                query: question,
                docs: docs,
              });
            return { query: question, docs: docs };
          } else {
            process.env.NODE_ENV == "development" &&
              console.log("No links found, performing web search...");
            this.emitter.emit(
              "data",
              JSON.stringify({
                type: "action",
                data: `Searching for: ${question}`,
              })
            );
            const res = await searchSearxng(question, port, {
              language: "en",
              engines: this.config.activeEngines,
            });
            process.env.NODE_ENV == "development" &&
              console.log("Searxng result:", res);
            if (!res.results) {
              throw new Error("No result was found Searxng API has an issue");
            }
            const documents = res.results.map(
              (result) =>
                new Document({
                  pageContent:
                    result.content ||
                    (this.config.activeEngines.includes("youtube")
                      ? result.title
                      : "") /* Todo: Implement transcript grabbing using Youtubei (source: https://www.npmjs.com/package/youtubei) */,
                  metadata: {
                    title: result.title,
                    url: result.url,
                    ...(result.img_src && { img_src: result.img_src }),
                  },
                })
            );
            process.env.NODE_ENV == "development" &&
              console.log("Web search documents:", documents);
            return { query: question, docs: documents };
          }
        } catch (error: any) {
          console.error(
            "Something Wrong Happened in search retriever chain:",
            error.message
          );
          return { query: "", docs: [] };
        }
      }),
    ]);
  }
  private async createAnsweringChain(llm: BaseChatModel, port: string) {
    process.env.NODE_ENV == "development" &&
      console.log("Creating answering chain...");
    const searchRetrieverChain = await this.createSearchRetrieverChain(
      llm,
      port
    );

    this.emitter.emit(
      "data",
      JSON.stringify({
        type: "action",
        data: "Building answer...",
      })
    );
    const contextRetriever = RunnableLambda.from(
      async (input: BasicChainInput) => {
        const { query, chat_history } = input;
        console.log("Query:", query);
        let docs: Document[] | null = null;
        if (this.config.searchWeb) {
          process.env.NODE_ENV == "development" &&
            console.log("Generating search query with:", query);
          const searchRetrieverResult = await searchRetrieverChain.invoke({
            chat_history,
            query,
          });
          docs = searchRetrieverResult.docs;
          return {
            query,
            docs: docs ?? [],
            chat_history,
          };
        }
        return {
          query,
          docs: [],
          chat_history,
        };
      }
    ).withConfig({ runName: "FinalSourceRetriever" });
    return RunnableSequence.from([
      contextRetriever,
      RunnableMap.from({
        query: (input) => input.query,
        chat_history: (input) => input.chat_history,
        context: (input) => this.processDocs(input.docs),
        date: () => new Date().toISOString(),
      }),
      ChatPromptTemplate.fromMessages([
        ["system", this.config.responsePrompt],
        new MessagesPlaceholder("chat_history"),
        new MessagesPlaceholder("query"),
      ]),
      llm,
      this.strParser,
    ]).withConfig({ runName: "FinalResponseGenerator" });
  }
  private processDocs(docs: Document[]) {
    if (!docs) {
      return "";
    }
    return docs
      .map(
        (_, index) =>
          `${index + 1}. ${docs[index].metadata.title} ${
            docs[index].pageContent
          }`
      )
      .join("\n");
  }
  private async handleStream(
    stream: IterableReadableStream<StreamEvent>,
    emitter: EventEmitter
  ) {
    process.env.NODE_ENV == "development" && console.log("Handling stream...");
    try {
      for await (const event of stream) {
        if (
          event.event === "on_chain_end" &&
          event.name === "FinalSourceRetriever"
        ) {
          emitter.emit(
            "data",
            JSON.stringify({
              type: "sources",
              data: event.data.output?.docs || [],
            })
          );
        }
        if (event.event == "on_llm_stream" && event.name == "ChatDeepSeek") {
          if (event.data.chunk?.message?.additional_kwargs?.reasoning_content) {
            emitter.emit(
              "data",
              JSON.stringify({
                type: "reasoning",
                data: event.data.chunk?.message.additional_kwargs
                  .reasoning_content,
              })
            );
          }
        }
        if (
          event.event === "on_chain_stream" &&
          event.name === "FinalResponseGenerator"
        ) {
          emitter.emit(
            "data",
            JSON.stringify({ type: "response", data: event.data.chunk })
          );
        }
        if (
          event.event === "on_chain_end" &&
          event.name === "FinalResponseGenerator"
        ) {
          break;
        }
      }
      process.env.NODE_ENV == "development" && console.log("Stream ended.");
      setTimeout(() => {
        emitter.emit("data", JSON.stringify({ type: "end" }));
        process.env.NODE_ENV == "development" &&
          console.log("End stream event emitted.");
      }, 100);
    } catch (error: any) {
      console.error("Streaming error:", error);
      emitter.emit(
        "data",
        JSON.stringify({ type: "error", data: error.message })
      );
      emitter.emit("data", JSON.stringify({ type: "end" }));
    }
  }
  async searchAndAnswer(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings | undefined,
    optimizationMode: "speed" | "balanced" | "quality",
    port: string,
    attachments: TAttachment[]
  ) {
    process.env.NODE_ENV == "development" &&
      console.log("searchAndAnswer called with:", {
        message,
        history,
        optimizationMode,
        port,
        attachments,
      });
    const answeringChain = await this.createAnsweringChain(llm, port);
    const stream = answeringChain.streamEvents(
      {
        chat_history: history,
        query: new HumanMessage({
          content: [
            { type: "text", text: message },
            ...attachments.map((attachment) => {
              switch (attachment.type) {
                case "image":
                  return {
                    type: "image_url",
                    image_url: { url: attachment.base64 },
                  };
                case "text":
                  return { type: "text", text: attachment.text };
                default:
                  return {
                    type: "text",
                    text: "Unsupported attachment type",
                  };
              }
            }),
          ],
        }),
      },
      { version: "v1" }
    );
    this.handleStream(stream, this.emitter);
    return this.emitter;
  }
}
export default MetaSearchAgent;
