const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = path.join(__dirname, "db/database.sqlite");
const db = new sqlite3.Database(DB_PATH);

// Инициализация БД
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      receiver_id INTEGER,
      content TEXT,
      file_url TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
  `);
});

module.exports = {
  // Регистрация пользователя
  createUser(user) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (nickname, email, password, avatar) VALUES (?, ?, ?, ?)`,
        [user.nickname, user.email, user.password, user.avatar],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Поиск пользователя
  findUserByNickname(nickname) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE nickname = ?`,
        [nickname],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Сохранение сообщения
  saveMessage(message) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO messages (sender_id, receiver_id, content, file_url) VALUES (?, ?, ?, ?)`,
        [message.senderId, message.receiverId, message.content, message.fileUrl],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Получение истории чата
  getMessages(user1, user2) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?)
        OR (sender_id = ? AND receiver_id = ?)
        ORDER BY timestamp ASC`,
        [user1, user2, user2, user1],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
};