import { Document } from "langchain/document";
export type Message = {
  suggestions?: any;
  id: string;
  reasoning?: string;
  content: string;
  role: "user" | "assistant";
  sources?: Document[];
  timestamp: string;
  conversation_id?:  number;
}
export type StoreMessageResponse = {
  message_id: number;
  conversation_id: number;
}