import type { Message, StoreMessageResponse,  } from "@/types/Message"
import {
    storeMessage,
    getMessages,
    getConversations,
    editMessage,
  } from "./database"
import type { Conversation } from "@/types/Conversation"
  
  // API functions that replace the Tauri commands
  export async function apiStoreMessage(message: Message, conversationTitle: string): Promise<StoreMessageResponse> {
    try {
      return await storeMessage(message, conversationTitle)
    } catch (error) {
      console.error("Error storing message:", error)
      throw new Error(String(error))
    }
  }
  
  export async function apiGetMessages(conversationId: number): Promise<Message[]> {
    try {
      return await getMessages(conversationId)
    } catch (error) {
      console.error("Error getting messages:", error)
      throw new Error(String(error))
    }
  }
  
  export async function apiGetConversations(): Promise<Conversation[]> {
    try {
      return await getConversations()
    } catch (error) {
      console.error("Error getting conversations:", error)
      throw new Error(String(error))
    }
  }
  
  export async function apiEditMessage(messageId: number, message: Message): Promise<string> {
    try {
      return await editMessage(messageId, message)
    } catch (error) {
      console.error("Error editing message:", error)
      throw new Error(String(error))
    }
  }
  
  