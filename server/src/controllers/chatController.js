import { Chat, Message } from "../models/Chat.js";

export async function listChats(req, res) {
  const chats = await Chat.find({ participants: req.user._id }).sort({ lastMessageAt: -1 });
  res.json(chats);
}

export async function createChat(req, res) {
  const { lspId, traderId, containerId, bookingId } = req.body;
  const otherId = req.user.role === "TRADER" ? lspId : traderId;
  if (!otherId) return res.status(400).json({ message: "Counterparty required" });

  let chat = await Chat.findOne({
    participants: { $all: [req.user._id, otherId] },
    containerId: containerId || undefined,
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [req.user._id, otherId],
      containerId,
      bookingId,
      lastMessageAt: new Date(),
    });
  }

  res.status(201).json(chat);
}

export async function getMessages(req, res) {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.participants.some((p) => String(p) === String(req.user._id))) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 }).limit(200);
  res.json(messages);
}

export async function sendMessage(chatId, senderId, text, attachments = []) {
  const msg = await Message.create({
    chatId,
    senderId,
    text,
    attachments,
    readBy: [senderId],
  });
  await Chat.findByIdAndUpdate(chatId, { lastMessageAt: new Date() });
  return msg;
}
