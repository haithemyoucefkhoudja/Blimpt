import { Fragment } from "react";

import FirstRender from "./first-render";
import { MessageDisplay } from "./message-display";
import MainComponent from "./main";
import { useChat } from "@/providers/chat-provider";

function MessangerContainer() {
  const { isFirstRender } = useChat();
  if (isFirstRender) return <FirstRender />;

  return (
    <Fragment>
      <MainComponent />
      <MessageDisplay />
    </Fragment>
  );
}

export default MessangerContainer;
