import "./App.css";
import MessangerContainer from "@/components/shortcut-ui/messanger-container";
import { ConfigProvider } from "@/providers/config-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import ChatProvider from "@/providers/chat-provider";
import { QueryProvider } from "@/providers/query-provider";
import { AppResizeProvider } from "@/components/shortcut-ui/hooks/use-app-resize";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryProvider>
        <ConfigProvider>
          <AppResizeProvider>
            <ChatProvider>
              <MessangerContainer />
            </ChatProvider>
          </AppResizeProvider>
        </ConfigProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
// export default function ChatPage() {
//   const [messages, setMessages] = useState<Array<{
//     content: string | undefined;
//     role: 'user' | 'assistant';
//     sources?: any[];
//   }>>([]);
//   const [isFirstRender, setIsFirstRender] = useState(true);

//   const webviewRef = useRef<HTMLDivElement | null>(null);

//   const [input, setInput] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [sources, setSources] = useState<any[]>([]);
//   useEffect(() => {
//     const window = getCurrentWebviewWindow();
//     const physicalWindow = getCurrentWindow();
//     const asyncInitShortcut = async () => {
//       await register("CommandOrControl+Y", async () => {
//         if (isFirstRender) {
//           setIsFirstRender(false)
//         }
//         const isVisible = await window.isVisible();
//         if (!isVisible) {
//           const position = await cursorPosition();
//           await window.show();
//           await window.setFocus();
//           physicalWindow.setPosition(
//             new PhysicalPosition(position.x, position.y)
//           );
//           physicalWindow.setAlwaysOnTop(true);
//         }
//       });

//       await register("Escape", async () => {
//         if (isFirstRender) {
//           setIsFirstRender(false)
//         }
//         const isVisible = await window.isVisible();
//         if (isVisible) {
//           // setLastMessage(null);
//           await window.hide();
//         }
//       });
//     };

//     asyncInitShortcut();
//     return () => {
//       unregister("CommandOrControl+Y");
//       unregister("Escape");
//     };
//   }, []);
//   const changeSize = async () => {
//     if (!webviewRef.current) return;
//     const rect = webviewRef.current.getBoundingClientRect();
//     const size = await getCurrentWindow().outerSize();

//     const width = Math.min(
//       Math.max(Math.ceil(rect.width * 1.3), size.width),
//       MAX_WIDTH
//     );
//     const height = Math.min(Math.ceil(rect.height * 1.3), MAX_HEIGHT);
//     if (width && height) {
//       getCurrentWindow().setSize(new PhysicalSize(width, height));
//       getCurrentWindow().setMinSize(new PhysicalSize(width, height));
//       getCurrentWindow().setMaxSize(
//         new PhysicalSize(width + WIDTH_OFFSET, height)
//       );
//     }
//   };
//   useEffect(() => {
//     if (!webviewRef.current) return;

//     changeSize();
//     webviewRef.current.onresize = () => {
//       changeSize();
//     };

//     return () => {
//       if (webviewRef.current) {
//         webviewRef.current.onresize = null;
//       }
//     };
//   }, [webviewRef.current]);

//   useEffect(() => {
//     changeSize();
//   }, [input]);
//   const handleSendMessage = async () => {
//     if (!input.trim()) return;

//     setIsLoading(true);
//     setError(null);

//     const requestBody: ChatRequestBody = {
//       query: input,
//       chatModel:{'provider':'custom_openai' , model:'deepseek-chat', customOpenAIBaseURL:'https://api.deepseek.com', customOpenAIKey:'sk-cdf08fabb1324e6485e59caa75daf8fb'},
//       history: messages.map(msg => [
//         msg.role === 'user' ? 'human' : 'ai',
//         msg.content
//       ]) as Array<['human' | 'ai', string]>,
//       focusMode: 'webSearch', // Default mode
//       optimizationMode: 'balanced',
//     };

//     try {
//       // Add user message immediately
//       setMessages(prev => [...prev, { content: input, role: 'user' }]);
//       setInput('');

//       // Create generator
//       const chatGenerator = handleChatRequest(requestBody);

//       // Temporary storage for streaming message
//       let assistantMessage = { content: '', role: 'assistant' as const, sources: [] as any[] };

//       // Process generator
//       for await (const event of chatGenerator) {
//         console.log('event:', event);
//         switch (event.type) {
//           case 'message':
//             assistantMessage = {
//               ...assistantMessage,
//               content: assistantMessage.content + event.data
//             };
//             setMessages(prev => {
//               const last = prev[prev.length - 1];
//               return last?.role === 'assistant'
//                 ? [...prev.slice(0, -1), assistantMessage]
//                 : [...prev, assistantMessage];
//             });
//             break;

//           case 'sources':
//             assistantMessage = {
//               ...assistantMessage,
//               sources: event.data
//             };
//             setSources(event.data);
//             break;

//           case 'end':
//             setMessages(prev => [...prev.slice(0, -1), {
//               content: event.message,
//               role: 'assistant',
//               sources: event.sources
//             }]);
//             break;

//           case 'error':
//             setError(event.data);
//             setIsLoading(false);
//             break;
//         }
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to process message');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-5 h-screen flex flex-col bg-background" ref={webviewRef} data-tauri-drag-region>
//       {/* Messages Container */}
//       <div className="flex-1 overflow-y-auto mb-4 space-y-4">
//         {messages.map((msg, index) => (
//           <div
//             key={index}
//             className={`flex flex-col p-4 rounded-lg ${
//               msg.role === 'user'
//                 ? 'bg-gray-100 self-end'
//                 : 'bg-blue-50 self-start'
//             }`}
//           >
//             <span className="font-bold mb-1">
//               {msg.role === 'user' ? 'You' : 'Assistant'}
//             </span>
//             <p className="whitespace-pre-wrap">{msg.content}</p>

//           </div>
//         ))}

//         {sources && sources.length > 0 && (
//               <div className="mt-2 text-sm text-gray-600">
//                 <h4 className="font-semibold">Sources:</h4>
//                 <ul className="list-disc pl-5">
//                   {sources.map((source, i) => (
//                     <li key={i}>
//                       <a
//                         href={source.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-blue-600 hover:underline"
//                       >
//                         {source.title || source.url}
//                       </a>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//         {isLoading && (
//           <div className="p-3 bg-yellow-100 text-yellow-800 rounded-lg">
//             Thinking...
//           </div>
//         )}

//         {error && (
//           <div className="p-3 bg-red-100 text-red-800 rounded-lg">
//             Error: {error}
//           </div>
//         )}
//       </div>

//       {/* Input Form */}
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           handleSendMessage();
//         }}
//         className="flex gap-2"
//       >
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           disabled={isLoading}
//           placeholder="Type your message..."
//           className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
//         />
//         <button
//           type="submit"
//           disabled={isLoading}
//           className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
//         >
//           {isLoading ? 'Sending...' : 'Send'}
//         </button>
//       </form>
//     </div>

//   );
// }
// export default App;
// useEffect(() => {
//   if (input.endsWith('/')) {
//     const window  = new WebviewWindow('commands')
//     window.maximize()
//     window.setSize(new PhysicalSize(600, 320))
//     window.setMinSize(new PhysicalSize(600, 320))
//     window.setMaxSize(new PhysicalSize(600 + WIDTH_OFFSET, 320))
//     window.setPosition(new PhysicalPosition(0, 0))
//     window.setAlwaysOnTop(true)
//     window.setDecorations(false)
//     window.setShadow(false)
//   } else {
//     // setShowCommands(false)
//   }
// }, [input])

// const handleCommandSelect = (command: string) => {
//   setName(prev => prev + ' ' + command)
//   setShowCommands(false)
//   textareaRef.current?.focus()
// }

// const handleKeyDown = (e: React.KeyboardEvent) => {
//   if (showCommands) {
//     if (e.key === 'ArrowDown') {
//       e.preventDefault()
//       setSelectedCommandIndex(prev =>
//         prev < commands.length - 1 ? prev + 1 : prev
//       )
//     } else if (e.key === 'ArrowUp') {
//       e.preventDefault()
//       setSelectedCommandIndex(prev =>
//         prev > 0 ? prev - 1 : prev
//       )
//     } else if (e.key === 'Tab' || e.key === 'Enter') {
//       e.preventDefault()
//       handleCommandSelect(commands[selectedCommandIndex].command)
//     } else if (e.key === 'Escape') {
//       e.preventDefault()
//       setShowCommands(false)
//     }
//   } else if (e.key === 'Enter' && !e.shiftKey) {
//     e.preventDefault()
//     handleSubmit(e)
//   }
// }

// const windows  = await getAllWebviewWindows();
// for(const _window of windows){
//   if(_window.label == 'commands'){
//     if (!(await _window.isMinimized())) {
//       _window.minimize()
//       return;
//     }
//   }
// }

// const processDeltasWithDelay = async (
//   deltas: string[],
//   assistantMessage: string,
//   assistantMessageId: string
// ) => {
//   for (const delta of deltas) {
//     assistantMessage += delta;

//     setLastMessage({
//       id: assistantMessageId,
//       role: "assistant",
//       content: assistantMessage,
//     });

//     setMessages((prev) => {
//       const existing = prev.find((m) => m.id === assistantMessageId);
//       if (existing) {
//         return prev.map((m) =>
//           m.id === assistantMessageId
//             ? { ...m, content: assistantMessage }
//             : m
//         );
//       } else {
//         return [
//           ...prev,
//           {
//             id: assistantMessageId,
//             role: "assistant",
//             content: assistantMessage,
//           },
//         ];
//       }
//     });

//     // Wait for 0.2 ms before processing the next delta
//     await delay(0.3); // Use a larger delay (e.g., 10 ms) if needed
//   }

//   emit("transfer-data", {
//     id: assistantMessageId,
//     role: "assistant",
//     content: assistantMessage,
//   });
// };
