import { TClipBoard } from "@/types/clipboard";
import { ChatInput } from "../input-field/input";
import WebSearchIndicator from "../WebSearchIndicator";
import HideButton from "../HideButton";
import { useEffect } from "react";
import { CommandControl } from "@/src/command-list";
import ChatIndicator from "../ChatIndicator";
import { useAppResize } from "./hooks/use-app-resize";
import ExpandIndicator from "../ExpandIndicator";
import MessageList from "./message-list";
import ConfigManager from "./config-manager";
import {Message} from '@/types/Message';
import SettingsIndicator from "../SettingsIndicator";
import ThemeIndicator from "../themeIndicator";
import HistoryIndicator from "../HistoryIndicator";
import { ConversationList } from "./history";
import { useChat } from "@/providers/chat-provider";
import LoveIndicator from "./LoveIndicator";
import NewChatIndicator from "./new-chat-indicator";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';


interface MainInputProps {
  input: string;
  isLoading: boolean;
  lastClipBoardItem: TClipBoard | null;
  errorMessage: string;
  rewrite:(messageId: string, conversationId: number) =>void
  setInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  clipboardItems: TClipBoard[];
  addClipboardItem: (item: string) => void // New prop
  removeClipboardItem: (index: number) => void // New prop
  clearAllClipboardItems: () => void // New prop
  searchMode: string;
  messages: Message[];
  setSearchMode: (mode: string) => void;
  closeWindow: () => void;
  newChatStarter: () => void;
}

function MainComponent({
    input,
    errorMessage,
    isLoading,
    messages,
    lastClipBoardItem,
    rewrite,
    setInput,
    handleSubmit,
    clipboardItems,
    addClipboardItem, // New prop
    removeClipboardItem, // New prop
    clearAllClipboardItems, // New prop
    searchMode,
    setSearchMode,
    closeWindow,
    newChatStarter
}: MainInputProps) {
  const {ActiveWindow, setActiveWindow} = useAppResize();
  const { conversation, setConversation } = useChat();
  useEffect(() => {
    if (ActiveWindow !== 'chat') {
      closeWindow();
    }
  }, [ActiveWindow]);
  useEffect(() => {
    const updateChecker = async () => {
      const update = await check();
      console.log(update)
    }
    updateChecker();
  // if (update) {
  // console.log(
  //   `found update ${update.version} from ${update.date} with notes ${update.body}`
  // );
  // let downloaded = 0;
  // let contentLength = 0;
  // // alternatively we could also call update.download() and update.install() separately
  // await update.downloadAndInstall((event) => {
  //   switch (event.event) {
  //     case 'Started':
  //       contentLength = event.data.contentLength;
  //       console.log(`started downloading ${event.data.contentLength} bytes`);
  //       break;
  //     case 'Progress':
  //       downloaded += event.data.chunkLength;
  //       console.log(`downloaded ${downloaded} from ${contentLength}`);
  //       break;
  //     case 'Finished':
  //       console.log('download finished');
  //       break;
  //   }
  // });

  // console.log('update installed');
  // await relaunch();
// }
  },[])
  // New switch to determine the main content component
  let contentComponent;
  switch (ActiveWindow) {
    case "chat":
      contentComponent = (
        <ChatInput
          lastClipBoardItem={lastClipBoardItem}
          clipboardItems={clipboardItems}
          addClipboardItem={addClipboardItem} // Pass the new function
          removeClipboardItem={removeClipboardItem} // Pass the new function
          clearAllClipboardItems={clearAllClipboardItems} // Pass the new function
          isLoading={isLoading}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
        />
      );
      break;
    case "commands":
      contentComponent = <CommandControl />;
      break;
    case "list":
      contentComponent = <MessageList errorMessage={errorMessage} isLoading={isLoading} rewrite={rewrite} messages={messages} />;
      break;
    case "settings":
      contentComponent = <ConfigManager />;
      break
    case "history":
      contentComponent = <ConversationList onSelectConversation={(conversation) => {
        setConversation(conversation);
        // setActiveWindow('chat');
      }} selectedConversation={conversation}/>;
      break;
    default:
      contentComponent = null;
  }

  return (
    <div
      className="flex bg-background relative w-full p-4 rounded-xl border-2 border-foreground/20"
      data-tauri-drag-region
        >
          <div className="flex flex-col items-center gap-2 h-full justify-end mt-auto" data-tauri-drag-region>
              <WebSearchIndicator activeWindow={ActiveWindow} setActiveWindow={() => setActiveWindow('commands')} />
              <HistoryIndicator activeWindow={ActiveWindow} setActiveWindow={() => setActiveWindow('history')} />
              <ChatIndicator activeWindow={ActiveWindow} setActiveWindow={() => setActiveWindow('chat')} />
              <ExpandIndicator activeWindow={ActiveWindow} setActiveWindow={() => setActiveWindow('list')} />

        
      </div>
      <div className="w-full flex flex-col overflow-hidden ">
        <div className="flex justify-between w-full h-fit">
          <h3 className=" h-fit w-full  text-md font-bold text-primary truncate break-words my-2 mx-4">
            {conversation?.title}
          </h3>    
          
          <NewChatIndicator newChatStarter={newChatStarter} isLoading={isLoading}  activeWindow={ActiveWindow} setActiveWindow={() => setActiveWindow('chat')} />
        </div>
        {contentComponent}
      </div>
          <div data-tauri-drag-region className="flex flex-col items-center gap-2  justify-between">
        <HideButton />
        <div data-tauri-drag-region className="flex items-center flex-col gap-2">
        <ThemeIndicator />
        <SettingsIndicator activeWindow={ActiveWindow} setActiveWindow={() => setActiveWindow('settings')} />
        <LoveIndicator/>
        </div>
      </div>
    </div>
  )
}
  
  
export default MainComponent
