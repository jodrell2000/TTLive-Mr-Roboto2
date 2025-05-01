import fs from 'fs';
import pool from '../src/libs/dbConnectionPool.js';

const chatData = JSON.parse(fs.readFileSync(process.env.CHAT_JSON, "utf8"));
const entries = Object.entries(chatData.chatMessages);

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error getting connection from pool:", err);
    return;
  }

  function insertNext(index) {
    if (index >= entries.length) {
      connection.release();
      console.log("✅ All chat data inserted.");
      return;
    }

    const [command, { messages, pictures = [] }] = entries[index];

    connection.query("INSERT INTO chat_commands (command) VALUES (?)", [command], (err, cmdResult) => {
      if (err) {
        console.error(`Error inserting command "${command}":`, err);
        return insertNext(index + 1);
      }

      const cmdId = cmdResult.insertId;

      const insertMessages = messages.map(msg =>
        new Promise((resolve, reject) => {
          connection.query(
            "INSERT INTO chat_messages (chat_command_id, message) VALUES (?, ?)",
            [cmdId, msg],
            err => err ? reject(err) : resolve()
          );
        })
      );

      const insertPictures = pictures.map(url =>
        new Promise((resolve, reject) => {
          connection.query(
            "INSERT INTO chat_pictures (chat_command_id, url) VALUES (?, ?)",
            [cmdId, url],
            err => err ? reject(err) : resolve()
          );
        })
      );

      Promise.all([...insertMessages, ...insertPictures])
        .catch(err => console.error(`Error inserting data for "${command}":`, err))
        .finally(() => insertNext(index + 1));
    });
  }

  insertNext(0);
});
