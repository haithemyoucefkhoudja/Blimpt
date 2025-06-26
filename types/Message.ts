import { Document } from "langchain/document";
import { TClipBoard } from "./clipboard";
export type Message = {
  suggestions?: any;
  id: string;
  reasoning?: string;
  content: string;
  role: "user" | "assistant";
  sources?: Document[];
  timestamp: string;
  conversation_id?: number;
  clipboardItems?: TClipBoard[];
  isLoading?: boolean;
};
export type StoreMessageResponse = {
  message_id: number;
  conversation_id: number;
};
