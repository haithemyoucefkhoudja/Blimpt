import MetaSearchAgent from "./search/metaSearchAgent";
import prompts from "./prompts";

export const searchHandlers = {
  webSearch: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: true,
  }),
  academicSearch: new MetaSearchAgent({
    activeEngines: ["arxiv", "google scholar", "pubmed"],
    queryGeneratorPrompt: prompts.academicSearchRetrieverPrompt,
    responsePrompt: prompts.academicSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0,
    searchWeb: true,
    summarizer: false,
  }),
  writingAssistant: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: "",
    responsePrompt: prompts.writingAssistantPrompt,
    rerank: true,
    rerankThreshold: 0,
    searchWeb: false,
    summarizer: false,
  }),
  wolframAlphaSearch: new MetaSearchAgent({
    activeEngines: ["wolframalpha"],
    queryGeneratorPrompt: prompts.wolframAlphaSearchRetrieverPrompt,
    responsePrompt: prompts.wolframAlphaSearchResponsePrompt,
    rerank: false,
    rerankThreshold: 0,
    searchWeb: true,
    summarizer: false,
  }),
  youtubeSearch: new MetaSearchAgent({
    activeEngines: ["youtube"],
    queryGeneratorPrompt: prompts.youtubeSearchRetrieverPrompt,
    responsePrompt: prompts.youtubeSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: false,
  }),
  redditSearch: new MetaSearchAgent({
    activeEngines: ["reddit"],
    queryGeneratorPrompt: prompts.redditSearchRetrieverPrompt,
    responsePrompt: prompts.redditSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: false,
  }),
};

// async function* handleEmitterGenerator(
//   emitter: EventEmitter,
//   messageId: string,
//   chatId: string
// ) {
//   let receivedMessage = '';
//   let sources: any[] = [];

//   try {
//     for await (const event of on(emitter, 'data')) {
//       const parsedData = JSON.parse(event[0]);
//       if (parsedData.type === 'response') {
//         receivedMessage += parsedData.data;
//         yield {
//           type: 'message',
//           data: parsedData.data,
//           messageId
//         };
//       } else if (parsedData.type === 'sources') {
//         sources = parsedData.data;
//         yield {
//           type: 'sources',
//           data: parsedData.data,
//           messageId
//         };
//       }
//     }

//     // Final save on end
//     yield { type: 'messageEnd', messageId };

//     await db.insert(messagesSchema).values({
//       content: receivedMessage,
//       chatId,
//       messageId,
//       role: 'assistant',
//       metadata: JSON.stringify({
//         createdAt: new Date(),
//         ...(sources.length > 0 && { sources }),
//       }),
//     }).execute();

//   } catch (error) {
//     yield {
//       type: 'error',
//       data: error instanceof Error ? error.message : 'Unknown error',
//       key: 'CHAIN_ERROR',
//       messageId
//     };
//   }
// }
// export async function* handleMessageGenerator(
//   message: string,
//   llm: BaseChatModel,
//   embeddings: Embeddings
// ) {
//   try {
//     const parsedWSMessage = JSON.parse(message) as WSMessage;
//     const parsedMessage = parsedWSMessage.message;

//     if (parsedWSMessage.files.length > 0) {
//       parsedWSMessage.focusMode = 'webSearch';
//     }

//     const humanMessageId = parsedMessage.messageId ?? crypto.randomBytes(7).toString('hex');
//     const aiMessageId = crypto.randomBytes(7).toString('hex');

//     if (!parsedMessage.content) {
//       yield {
//         type: 'error',
//         data: 'Invalid message format',
//         key: 'INVALID_FORMAT'
//       };
//       return;
//     }

//     const history: BaseMessage[] = parsedWSMessage.history.map(msg =>
//       msg[0] === 'human'
//         ? new HumanMessage({ content: msg[1] })
//         : new AIMessage({ content: msg[1] })
//     );

//     if (parsedWSMessage.type === 'message') {
//       const handler = (searchHandlers as any)[parsedWSMessage.focusMode] as MetaSearchAgentType;

//       if (!handler) {
//         yield {
//           type: 'error',
//           data: 'Invalid focus mode',
//           key: 'INVALID_FOCUS_MODE'
//         };
//         return;
//       }

//       // Create chat first
//       const chat = await db.query.chats.findFirst({
//         where: eq(chats.id, parsedMessage.chatId),
//       });

//       if (!chat) {
//         await db.insert(chats).values({
//           id: parsedMessage.chatId,
//           title: parsedMessage.content,
//           createdAt: new Date().toString(),
//           focusMode: parsedWSMessage.focusMode,
//           files: parsedWSMessage.files.map(getFileDetails),
//         }).execute();
//       }

//       // Save user message
//       await db.insert(messagesSchema).values({
//         content: parsedMessage.content,
//         chatId: parsedMessage.chatId,
//         messageId: humanMessageId,
//         role: 'user',
//         metadata: JSON.stringify({ createdAt: new Date() }),
//       }).execute();

//       // Process the request
//       const emitter = await handler.searchAndAnswer(
//         parsedMessage.content,
//         history,
//         llm,
//         embeddings,
//         parsedWSMessage.optimizationMode,
//         parsedWSMessage.files,
//       );

//       yield* handleEmitterGenerator(emitter, aiMessageId, parsedMessage.chatId);
//     }
//   } catch (err) {
//     logger.error(`Failed to handle message: ${err}`);
//     yield {
//       type: 'error',
//       data: 'Invalid message format',
//       key: 'INVALID_FORMAT'
//     };
//   }
// }
