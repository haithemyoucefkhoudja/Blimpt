import { Conversation } from "@/types/Conversation"
import type { Message, StoreMessageResponse } from "@/types/Message"
import Database from "@tauri-apps/plugin-sql"

// Types matching your Rust structs
// export interface Message {
//   conversation_id?: number
//   content: string
//   reasoning?: string
//   role: string // "user" or "assistant"
//   suggestions?: any
//   sources?: any
//   timestamp: string
//   id?: string // Added for frontend use
// }

// export interface Conversation {
//   id: number
//   title: string
//   timestamp: string
// }

// export interface StoreMessageResponse {
//   message_id: number
//   conversation_id: number
// }

// Database connection singleton
let db: Database | null = null

/**
 * Initialize the database connection
 */
export async function initDatabase() {
  if (!db) {
    db = await Database.load("sqlite:db.sqlite")

    // Create tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id)
      )
    `)
  }

  return db
}

/**
 * Store a message in the database
 */
export async function storeMessage(message: Message, conversationTitle: string): Promise<StoreMessageResponse> {
  const db = await initDatabase()

  // If conversation_id is not provided, insert new conversation
  let conversationId = message.conversation_id

  if (!conversationId) {
    const result = await db.execute("INSERT INTO conversations (title, timestamp) VALUES ($1, $2)", [
      conversationTitle,
      message.timestamp,
    ])

    conversationId = result.lastInsertId
  }

  // Prepare message JSON
  const messageWithConvId = {
    ...message,
    conversation_id: conversationId,
  }

  const messageJson = JSON.stringify(messageWithConvId)

  const result = await db.execute("INSERT INTO messages (message, timestamp, conversation_id) VALUES ($1, $2, $3)", [
    messageJson,
    message.timestamp,
    conversationId,
  ])

  return {
    message_id: result.lastInsertId,
    conversation_id: conversationId as number,
  }
}

/**
 * Get all messages for a conversation
 */
export async function getMessages(conversationId: number): Promise<Message[]> {
  const db = await initDatabase()

  const result = await db.select<any>("SELECT id, message, timestamp FROM messages WHERE conversation_id = $1", [
    conversationId,
  ])

  return result.map((row) => {
    const message = JSON.parse(row.message)
    message.id = row.id.toString() // Add ID for frontend use
    return message
  })
}

/**
 * Get all conversations
 */
export async function getConversations(): Promise<Conversation[]> {
  const db = await initDatabase()

  const result = await db.select<any>("SELECT id, title, timestamp FROM conversations")
  return result.map((row) => ({
    id: row.id,
    title: row.title,
    timestamp: row.timestamp,
  }))
}

/**
 * Edit a message
 */
export async function editMessage(messageId: number, message: Message): Promise<string> {
  const db = await initDatabase()

  const messageJson = JSON.stringify(message)

  await db.execute("UPDATE messages SET message = $1 WHERE id = $2", [messageJson, messageId])

  return "success"
}

