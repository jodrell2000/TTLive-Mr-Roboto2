CREATE TABLE chat_commands (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          command VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE chat_messages (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          chat_command_id INT NOT NULL,
                          message TEXT,
                          FOREIGN KEY (chat_command_id) REFERENCES chat_commands(id) ON DELETE CASCADE
);

CREATE TABLE chat_pictures (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          chat_command_id INT NOT NULL,
                          url TEXT,
                          FOREIGN KEY (chat_command_id) REFERENCES chat_commands(id) ON DELETE CASCADE
);

CREATE TABLE chat_aliases (
                         id INT AUTO_INCREMENT PRIMARY KEY,
                         chat_command_id INT NOT NULL,
                         alias_name VARCHAR(255) UNIQUE,
                         FOREIGN KEY (chat_command_id) REFERENCES chat_commands(id) ON DELETE CASCADE
);