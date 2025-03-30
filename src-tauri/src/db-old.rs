// use rusqlite::Connection;
// use serde::{Deserialize, Serialize};


// // This struct now includes a timestamp field and an optional conversation_id.
// #[derive(Debug, Serialize, Deserialize)]
// pub struct Message {
//     #[serde(skip_serializing)]
//     pub conversation_id: Option<i64>, // Reference to conversation table.
//     pub content: String,
//     pub reasoning: Option<String>,
//     pub role: String, // "user" or "assistant"
//     pub suggestions: Option<serde_json::Value>,
//     pub sources: Option<serde_json::Value>,
//     pub timestamp: String, // ISO formatted date-time string.
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct Conversation {
//     pub id: i64,
//     pub title: String,
//     pub timestamp: String,
// }
// #[derive(Debug, Serialize, Deserialize)]
// pub struct StoreMessageResponse {
//     pub message_id: i64,
//     pub conversation_id: i64,
// }
// /// Stores a message in the database. Assumes the conversation already exists.

// #[tauri::command]
// pub fn store_message(
//     message: Message,
//     conversation_title: String,
// ) -> Result<StoreMessageResponse, String> {
    
//     let conn = Connection::open("db.sqlite").map_err(|e| e.to_string())?;
//     // Create conversations table if not exists.
//     conn.execute(
//         "CREATE TABLE IF NOT EXISTS conversations (
//             id INTEGER PRIMARY KEY AUTOINCREMENT,
//             title TEXT NOT NULL,
//             timestamp TEXT NOT NULL
//         )",
//         [],
//     )
//     .map_err(|e| e.to_string())?;

//     // Create messages table with conversation_id and timestamp.
//     conn.execute(
//         "CREATE TABLE IF NOT EXISTS messages (
//             id INTEGER PRIMARY KEY AUTOINCREMENT,
//             conversation_id INTEGER,
//             message TEXT NOT NULL,
//             timestamp TEXT NOT NULL,
//             FOREIGN KEY(conversation_id) REFERENCES conversations(id)
//         )",
//         [],
//     )
//     .map_err(|e| e.to_string())?;
//     // println!("converstionTitle: {}", conversation_title);
//     // If conversation_id is not provided, insert new conversation.
//     let conv_id = match message.conversation_id {
//         Some(id) => id,
//         None => {
//             conn.execute(
//                 "INSERT INTO conversations (title, timestamp) VALUES (?1, ?2)",
//                 &[&conversation_title, &message.timestamp],
//             )
//             .map_err(|e| e.to_string())?;
//             conn.last_insert_rowid()
//         }
//     };

//     // Prepare message JSON without the provided id.
//     let message_no_id = Message {
//         conversation_id: Some(conv_id),
//         content: message.content,
//         role: message.role,
//         suggestions: message.suggestions,
//         sources: message.sources,
//         timestamp: message.timestamp,
//         reasoning: message.reasoning,
//     };
//     // println!("message_no_id: {:?}", message_no_id);
//     let message_json = serde_json::to_string(&message_no_id).map_err(|e| e.to_string())?;
//     conn.execute(
//         "INSERT INTO messages (message, timestamp, conversation_id) VALUES (?1, ?2, ?3)",
//         rusqlite::params![
//             message_json,
//             message_no_id.timestamp,
//             message_no_id.conversation_id.unwrap()
//         ],
//     )
//     .map_err(|e| e.to_string())?;

//     let new_id = conn.last_insert_rowid();

//     Ok(StoreMessageResponse {
//         message_id: new_id,
//         conversation_id: conv_id,
//     })
// }

// #[tauri::command]
// pub fn get_messages(conversation_id: i64) -> Result<Vec<Message>, String> {
//     let conn = Connection::open("db.sqlite").map_err(|e| e.to_string())?;
//     let mut stmt = conn
//         .prepare("SELECT id, message, timestamp FROM messages WHERE conversation_id = ?1")
//         .map_err(|e| e.to_string())?;
//     let messages = stmt
//         .query_map(rusqlite::params![conversation_id], |row| {
//             let _: i64 = row.get(0)?;
//             let message: String = row.get(1)?;
//             let message: Message = serde_json::from_str(&message)
//                 .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
//             Ok(message)
//         })
//         .map_err(|e| e.to_string())?
//         .collect::<Result<Vec<Message>, _>>()
//         .map_err(|e| e.to_string())?;
//     Ok(messages)
// }

// #[tauri::command]
// pub fn get_conversations() -> Result<Vec<Conversation>, String> {
//     // Get the app data directory
//     let config = tauri::Config::default();
//     let app_data_dir = std::env::current_exe().unwrap().parent();

    
//     // Create db directory if it doesn't exist
//     let db_dir = app_data_dir.join("db");
//     std::fs::create_dir_all(&db_dir).map_err(|e| e.to_string())?;
    
//     // Set the database path
//     let db_path = db_dir.join("db.sqlite");
    
//     // Open the connection
//     let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
//     let mut stmt = conn
//         .prepare("SELECT id, title, timestamp FROM conversations")
//         .map_err(|e| e.to_string())?;
//     let conversations = stmt
//         .query_map([], |row| {
//             let id: i64 = row.get(0)?;
//             let title: String = row.get(1)?;
//             let timestamp: String = row.get(2)?;
//             Ok(Conversation {
//                 id,
//                 title,
//                 timestamp,
//             })
//         })
//         .map_err(|e| e.to_string())?
//         .collect::<Result<Vec<Conversation>, _>>()
//         .map_err(|e| e.to_string())?;
//     Ok(conversations)
// }
// #[tauri::command]
// pub fn edit_message(message_id: i64, message: Message) -> Result<String, String> {
//     let conn = Connection::open("db.sqlite").map_err(|e| e.to_string())?;

//     let message_json = serde_json::to_string(&message).map_err(|e| e.to_string())?;
//     conn.execute(
//         "UPDATE messages SET message = ?1 WHERE id = ?2",
//         rusqlite::params![message_json, message_id],
//     )
//     .map_err(|e| e.to_string())?;
//     Ok("success".to_string())
// }
