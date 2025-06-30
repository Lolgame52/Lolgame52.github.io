const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const authRoutes = require("./auth");
const db = require("./db");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/public")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", require("./upload"));

// WebSocket
require("./sockets")(io, db);

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});