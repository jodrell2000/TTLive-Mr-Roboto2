#!/bin/bash

# Load .env from root directory
set -a
source "$(dirname "$0")/../.env"
set +a

# Set full paths
CHAT_JSON="$(dirname "$0")/../data/$CHATDATA"
ALIAS_JSON="$(dirname "$0")/../data/$ALIASDATA"

export CHAT_JSON
export ALIAS_JSON

# Clear existing DB content
mysql -u "$DBUSERNAME" -p"$DBPASSWORD" "$DBNAME" <<EOF
DELETE FROM chat_messages;
DELETE FROM chat_pictures;
DELETE FROM chat_aliases;
DELETE FROM chat_commands;
EOF

# Run Node scripts
node "$(dirname "$0")/load_chat_data.js"
node "$(dirname "$0")/load_alias_data.js"

echo "✅ Data import complete."
