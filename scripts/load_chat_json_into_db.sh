#!/bin/bash

# Load environment variables from root-level .env
set -a
source "$(dirname "$0")/../.env"
set +a

# Define paths relative to the script location
CHAT_JSON="$(dirname "$0")/../data/$CHATDATA"
ALIAS_JSON="$(dirname "$0")/../data/$ALIASDATA"

# Clear existing data
mysql -u "$DBUSERNAME" -p"$DBPASSWORD" "$DBNAME" <<EOF
DELETE FROM chat_messages;
DELETE FROM chat_pictures;
DELETE FROM chat_aliases;
DELETE FROM chat_commands;
EOF

# Import chat data
node <<EOF
import fs from 'fs';
import pool from '../src/libs/dbConnectionPool.js';

async function importChatData() {
  const connection = await pool.getConnection();

  const chatData = JSON.parse(fs.readFileSync("$CHAT_JSON", "utf8"));

  for (const [command, { messages, pictures = [] }] of Object.entries(chatData.chatMessages)) {
    const [cmdResult] = await connection.execute("INSERT INTO chat_commands (command) VALUES (?)", [command]);
    const cmdId = cmdResult.insertId;

    for (const msg of messages) {
      await connection.execute("INSERT INTO chat_messages (chat_command_id, message) VALUES (?, ?)", [cmdId, msg]);
    }

    for (const url of pictures) {
      await connection.execute("INSERT INTO chat_pictures (chat_command_id, url) VALUES (?, ?)", [cmdId, url]);
    }
  }
  connection.release();
}

importChatData().catch(console.error);
EOF

# Import alias data
node <<EOF
import fs from 'fs';
import pool from '../src/libs/dbConnectionPool.js';

async function importAliasData() {
  const connection = await pool.getConnection();

  const aliasData = JSON.parse(fs.readFileSync("$ALIAS_JSON", "utf8"));
  const commandAliases = aliasData.commands || {};

  for (const [command, aliases] of Object.entries(commandAliases)) {
    const [rows] = await connection.execute("SELECT id FROM chat_commands WHERE command = ?", [command]);
    if (rows.length === 0) continue;

    const cmdId = rows[0].id;

    for (const alias of aliases) {
      try {
        await connection.execute("INSERT INTO chat_aliases (chat_command_id, alias_name) VALUES (?, ?)", [cmdId, alias]);
      } catch {
        console.warn(\`Skipping duplicate alias: \${alias}\`);
      }
    }
  }
  connection.release();
}

importAliasData().catch(console.error);
EOF

echo "✅ Data import complete."
