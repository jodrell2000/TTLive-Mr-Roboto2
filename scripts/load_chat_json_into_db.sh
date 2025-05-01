#!/bin/bash

# Load environment variables from root-level .env
set -a
source "$(dirname "$0")/../.env"
set +a

CHAT_JSON="$(dirname "$0")/../$CHATDATA"
ALIAS_JSON="$(dirname "$0")/../$ALIASDATA"

# Clear existing data
mysql -u "$DBUSERNAME" -p"$DBPASSWORD" "$DBNAME" <<EOF
DELETE FROM chat_messages;
DELETE FROM chat_pictures;
DELETE FROM chat_aliases;
DELETE FROM chat_commands;
EOF

# Import chat data
node <<EOF
const fs = require('fs');
const mysql = require('mysql2/promise');

async function importChatData() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: process.env.DBUSERNAME,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME
  });

  const chatData = JSON.parse(fs.readFileSync("$CHAT_JSON", "utf8"));

  for (const [command, { messages, pictures = [] }] of Object.entries(chatData.chatMessages)) {
    const [cmdResult] = await db.execute("INSERT INTO chat_commands (command) VALUES (?)", [command]);
    const cmdId = cmdResult.insertId;

    for (const msg of messages) {
      await db.execute("INSERT INTO chat_messages (chat_command_id, message) VALUES (?, ?)", [cmdId, msg]);
    }

    for (const url of pictures) {
      await db.execute("INSERT INTO chat_pictures (chat_command_id, url) VALUES (?, ?)", [cmdId, url]);
    }
  }
  await db.end();
}

importChatData().catch(console.error);
EOF


# Import alias data
node <<EOF
const fs = require('fs');
const mysql = require('mysql2/promise');

async function importAliasData() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: process.env.DBUSERNAME,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME
  });

  const aliasData = JSON.parse(fs.readFileSync("$ALIAS_JSON", "utf8"));
  const commandAliases = aliasData.commands || {};

  for (const [command, aliases] of Object.entries(commandAliases)) {
    const [rows] = await db.execute("SELECT id FROM chat_commands WHERE command = ?", [command]);
    if (rows.length === 0) continue;

    const cmdId = rows[0].id;

    for (const alias of aliases) {
      try {
        await db.execute("INSERT INTO chat_aliases (chat_command_id, alias_name) VALUES (?, ?)", [cmdId, alias]);
      } catch {
        console.warn(\`Skipping duplicate alias: \${alias}\`);
      }
    }
  }
  await db.end();
}

importAliasData().catch(console.error);
EOF

echo "✅ Data import complete."
