import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { api, API } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function ChatPage() {
  const { token, user } = useAuthStore();
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    api.chats(token).then(setChats).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!active) return;
    api.messages(active._id, token).then(setMessages).catch(console.error);
    const socket = io(API);
    socket.emit("chat:join", active._id);
    socket.emit("join", user.id);
    socket.on("message:new", (msg) => {
      if (String(msg.chatId) === String(active._id)) {
        setMessages((m) => [...m, msg]);
      }
    });
    return () => socket.disconnect();
  }, [active, token, user?.id]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const socket = io(API);
    socket.emit("message:send", {
      chatId: active._id,
      senderId: user.id,
      text,
    });
    setText("");
    socket.disconnect();
    setTimeout(() => api.messages(active._id, token).then(setMessages), 300);
  }

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
      <ul className="border border-slate-800 rounded-lg overflow-auto">
        {chats.map((c) => (
          <li key={c._id}>
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-slate-800 text-sm"
              onClick={() => setActive(c)}
            >
              Chat {c._id.slice(-6)}
            </button>
          </li>
        ))}
        {!chats.length && <p className="p-3 text-sm text-slate-500">No chats yet.</p>}
      </ul>
      <div className="md:col-span-2 border border-slate-800 rounded-lg flex flex-col">
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {messages.map((m) => (
            <p key={m._id} className="text-sm bg-slate-900 inline-block px-2 py-1 rounded">
              {m.text}
            </p>
          ))}
        </div>
        {active && (
          <form onSubmit={send} className="p-2 border-t border-slate-800 flex gap-2">
            <input className="input flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" />
            <button type="submit" className="bg-brand px-3 rounded-lg">
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
