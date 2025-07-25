import fs from 'fs';
import pool from '../src/libs/dbConnectionPool.js';

const aliasData = JSON.parse(fs.readFileSync(process.env.ALIAS_JSON, 'utf8'));
const commandAliases = aliasData.commands || {};

(async () => {
  const connection = await new Promise((resolve, reject) =>
    pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)))
  );

  try {
    // Set UTF-8 support once per connection
    await new Promise((resolve, reject) =>
      connection.query('SET NAMES utf8mb4', err => (err ? reject(err) : resolve()))
    );
    await new Promise((resolve, reject) =>
      connection.query('SET CHARACTER SET utf8mb4', err => (err ? reject(err) : resolve()))
    );
    await new Promise((resolve, reject) =>
      connection.query('SET character_set_connection = utf8mb4', err => (err ? reject(err) : resolve()))
    );

    for (const [command, aliases] of Object.entries(commandAliases)) {
      const rows = await new Promise((resolve, reject) =>
        connection.query(
          'SELECT id FROM chat_commands WHERE command = ?',
          [command],
          (err, results) => (err ? reject(err) : resolve(results))
        )
      );

      if (rows.length === 0) continue;
      const cmdId = rows[0].id;

      for (const alias of aliases) {
        try {
          await new Promise((resolve, reject) =>
            connection.query(
              'INSERT INTO chat_aliases (chat_command_id, alias_name) VALUES (?, ?)',
              [cmdId, alias],
              err => {
                if (err && err.code === 'ER_DUP_ENTRY') {
                  console.warn(`Skipping duplicate alias: ${alias}`);
                  resolve();
                } else if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              }
            )
          );
        } catch (err) {
          console.error(`Error inserting alias "${alias}" for command "${command}":`, err);
        }
      }
    }

    console.log('✅ Alias data inserted.');
  } catch (err) {
    console.error('Error inserting alias data:', err);
  } finally {
    connection.release();
  }
})();
