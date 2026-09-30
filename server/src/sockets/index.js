import { sendMessage } from "../controllers/chatController.js";
import { Chat } from "../models/Chat.js";

export function registerSockets(io) {
  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on("typing", ({ chatId, userId }) => {
      socket.to(`chat:${chatId}`).emit("typing", { chatId, userId });
    });

    socket.on("message:send", async (payload, ack) => {
      try {
        const { chatId, senderId, text, attachments } = payload;
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.some((p) => String(p) === String(senderId))) {
          ack?.({ error: "Forbidden" });
          return;
        }
        const msg = await sendMessage(chatId, senderId, text, attachments);
        io.to(`chat:${chatId}`).emit("message:new", msg);
        chat.participants.forEach((p) => {
          io.to(`user:${p}`).emit("message:new", msg);
        });
        ack?.({ ok: true, message: msg });
      } catch (e) {
        ack?.({ error: e.message });
      }
    });

    socket.on("chat:join", (chatId) => {
      socket.join(`chat:${chatId}`);
    });
  });
}
