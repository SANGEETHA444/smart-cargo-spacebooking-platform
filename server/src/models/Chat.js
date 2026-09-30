import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    containerId: { type: mongoose.Schema.Types.ObjectId, ref: "Container" },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    lastMessageAt: Date,
  },
  { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: String,
    attachments: [String],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
