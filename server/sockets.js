module.exports = (io, db) => {
  const activeUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`Новое подключение: ${socket.id}`);

    // Авторизация
    socket.on("authenticate", (userData) => {
      activeUsers.set(socket.id, userData);
      socket.broadcast.emit("user-online", userData);
    });

    // Отправка сообщения
    socket.on("send-message", async (messageData) => {
      const sender = activeUsers.get(socket.id);
      if (!sender) return;

      await db.saveMessage({
        senderId: sender.id,
        receiverId: messageData.receiverId,
        content: messageData.content,
        fileUrl: messageData.fileUrl
      });

      // Отправка получателю
      const targetSocket = findSocketByUserId(messageData.receiverId);
      if (targetSocket) {
        io.to(targetSocket).emit("new-message", {
          ...messageData,
          senderId: sender.id,
          timestamp: new Date()
        });
      }
    });

    // Отключение
    socket.on("disconnect", () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        activeUsers.delete(socket.id);
        socket.broadcast.emit("user-offline", user.id);
      }
    });
  });

  function findSocketByUserId(userId) {
    for (const [socketId, user] of activeUsers) {
      if (user.id === userId) return socketId;
    }
    return null;
  }
};