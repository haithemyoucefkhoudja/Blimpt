import { Fragment } from "react";

import FirstRender from "./first-render";
import { MessageDisplay } from "./message-display";
import MainComponent from "./main";
import { useChat } from "@/providers/chat-provider";

function MessangerContainer() {
  
  const {
    error,
    input,
    isLoading,
    lastMessage,
    messages,
    searchMode,
    clipboardItems,
    isFirstRender,
    lastClipBoardItem,
    addClipboardItem, // Use the new function
    removeClipboardItem, // Use the new function
    clearAllClipboardItems, // Use the new function
    setInput,
    setSearchMode,
    rewrite,
    handleFormSubmit,
    setLastMessage,
    setError,
    newChatStarter
  } = useChat();
  
  // Form submission handler
  const handleSubmit = (e: any) => {
    e.preventDefault();
    handleFormSubmit();
  };
  const closeWindow = () => { 
    setLastMessage(null);
    setError(null);
}
  if (isFirstRender) return <FirstRender />;

  return (
    <Fragment>
      <MainComponent
        
        newChatStarter={newChatStarter}
        closeWindow={closeWindow}
        rewrite={rewrite}
        messages={messages}
        errorMessage={error}
        searchMode={searchMode}
        lastClipBoardItem={lastClipBoardItem}
        setSearchMode={(mode) => setSearchMode(mode)}
        clearAllClipboardItems={clearAllClipboardItems}
        clipboardItems={clipboardItems}
        addClipboardItem={addClipboardItem}
        removeClipboardItem={removeClipboardItem}
        input={input}
        isLoading={isLoading}
        setInput={(input) => setInput(input)}
        handleSubmit={handleSubmit}
      />
      <MessageDisplay
        rewrite={rewrite}
        errorMessage={error}
        lastMessage={lastMessage}
        messages={messages}
        isLoading={isLoading}
        setInput={() => setInput("")}
      ></MessageDisplay>
    </Fragment>
  );
}

export default MessangerContainer;
