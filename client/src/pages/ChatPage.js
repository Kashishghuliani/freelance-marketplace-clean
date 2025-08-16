import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaReply } from "react-icons/fa";
import { BsEmojiSmile } from "react-icons/bs";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import API from "../utils/api";
import { useSocket } from "../context/SocketContext";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

const ChatPage = () => {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const socket = useSocket();

  const token = localStorage.getItem("token");
  const currentUser = token ? JSON.parse(atob(token.split(".")[1])) : null;

  const fetchConversationId = async () => {
    try {
      const response = await axios.get(
  `${process.env.REACT_APP_API_URL}/messages/conversation/${otherUserId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

      const convId = res.data?.conversationId;
      setConversationId(convId);
      return convId;
    } catch (err) {
      console.error("Error fetching conversation ID:", err);
      return null;
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await API.get(`/messages/conversation/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (e) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      if (!conversationId || !currentUser?.id) return;
      await API.put(`/messages/read/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      socket.emit("message-read", { conversationId, readerId: currentUser.id });
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (userId && socket && currentUser?.id) {
        const convId = await fetchConversationId();
        if (convId) {
          await fetchMessages(convId);
          socket.emit("join", currentUser.id);
        }
      }
    };
    init();
  }, [userId, socket, currentUser?.id]);

  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.senderId !== currentUser?.id && !lastMsg?.isRead && conversationId && userId) {
      markAsRead();
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket || !currentUser?.id) return;

    const handleReceive = (data) => {
      setMessages((prev) => {
        const tempMatchIndex = prev.findIndex((m) => m.status === "sending" && m.clientTempId === data.clientTempId);
        if (tempMatchIndex !== -1) {
          const updated = [...prev];
          updated[tempMatchIndex] = data;
          return updated;
        }
        const exists = prev.some((m) => m._id === data._id);
        if (!exists) return [...prev, data];
        return prev;
      });

      const isForMe = data.receiverId === currentUser.id;
      const isCurrentChat = data.senderId === userId || data.receiverId === userId;
      if (isForMe && isCurrentChat) markAsRead();
    };

    const handleTyping = ({ senderId }) => {
      if (senderId !== currentUser.id) {
        setTypingUser(senderId);
        setTimeout(() => setTypingUser(null), 3000);
      }
    };

    const handleReadStatus = ({ readerId, conversationId: seenConv }) => {
      setMessages((prev) => prev.map((msg) => (msg.conversationId === seenConv && msg.receiverId === readerId ? { ...msg, isRead: true, status: "seen" } : msg)));
    };

    const handleReceiveReaction = (updatedMessage) => {
      if (!updatedMessage || !updatedMessage._id) return;
      setMessages((prev) => prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg)));
    };

    const handleMessageEdited = (updated) => {
      setMessages((prev) => prev.map((msg) => (msg._id === updated._id ? { ...msg, message: updated.message, isEdited: true } : msg)));
    };

    const handleMessageDeleted = (updated) => {
      setMessages((prev) => prev.map((msg) => (msg._id === updated._id ? { ...msg, message: "This message was deleted", isDeleted: true } : msg)));
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("messageRead", handleReadStatus);
    socket.on("receiveReaction", handleReceiveReaction);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("messageRead", handleReadStatus);
      socket.off("receiveReaction", handleReceiveReaction);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [socket, currentUser?.id, conversationId, userId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const tempId = Date.now().toString();
    const newMsg = {
      _id: tempId,
      senderId: currentUser.id,
      receiverId: userId,
      conversationId,
      message: text,
      fileUrl: null,
      isRead: false,
      status: "sending",
      createdAt: new Date().toISOString(),
      replyTo: replyingTo || null,
      clientTempId: tempId,
    };

    setMessages((prev) => [...prev, newMsg]);
    setText("");
    setReplyingTo(null);
    setShowEmojiPicker(false);
    socket.emit("sendMessage", { ...newMsg, replyTo: replyingTo?._id || null });
  };

  const handleTyping = () => {
    socket?.emit("typing", { senderId: currentUser.id, receiverId: userId });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const tempId = Date.now().toString();
    const optimistic = {
      _id: tempId,
      senderId: currentUser.id,
      receiverId: userId,
      conversationId,
      message: "",
      fileUrl: URL.createObjectURL(file),
      isRead: false,
      status: "sending",
      createdAt: new Date().toISOString(),
      replyTo: replyingTo || null,
      clientTempId: tempId,
    };
    setMessages((prev) => [...prev, optimistic]);
    setReplyingTo(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("receiverId", userId);
      form.append("conversationId", conversationId);
      form.append("message", "");
      form.append("clientTempId", tempId);

      const { data: saved } = await API.post("/messages/upload", form, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      saved.clientTempId = tempId;
      setMessages((prev) => prev.map((m) => (m.clientTempId === tempId ? saved : m)));
    } catch (err) {
      toast.error("File upload failed");
      setMessages((prev) => prev.filter((m) => m.clientTempId !== tempId));
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/messages/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages((prev) => prev.map((msg) => (msg._id === id ? { ...msg, message: "This message was deleted", isDeleted: true } : msg)));
      socket.emit("deleteMessage", { _id: id, receiverId: userId });
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await API.put(`/messages/edit/${id}`, { message: editingText }, { headers: { Authorization: `Bearer ${token}` } });
      const updated = res.data;
      setMessages((prev) => prev.map((msg) => (msg._id === id ? { ...msg, message: updated.message, isEdited: true } : msg)));
      setEditingId(null);
      setEditingText("");
      socket.emit("editMessage", { ...updated, receiverId: userId });
    } catch {
      toast.error("Failed to edit message");
    }
  };

  const handleReact = async (msgId, emoji) => {
    setShowReactionPicker(null);
    try {
      await API.post(`/messages/react/${msgId}`, { emoji }, { headers: { Authorization: `Bearer ${token}` } });
      socket.emit("reactMessage", { msgId, emoji, senderId: currentUser.id, receiverId: userId });
    } catch {
      toast.error("Failed to react to message");
    }
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] bg-gray-50">
        <AiOutlineLoading3Quarters className="text-blue-600 animate-spin text-4xl" />
        <span className="ml-3 text-blue-700 font-semibold text-lg">
          Loading chat...
        </span>
      </div>
    );
  }

  return (
    <div className="font-inter">
      <div className="max-w-5xl mx-auto p-4 bg-white rounded-xl shadow-lg transition-all">
        {/* Header */}
<div className="flex justify-between items-center mb-4 bg-blue-600 p-4 rounded-lg shadow">
  <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
    💬 Chat on <span className="font-light">NovaBridge</span>
  </h2>
</div>


        {/* Chat Box */}
        <div className="border border-gray-200 p-4 h-[500px] overflow-y-auto rounded-xl bg-gray-50 shadow-inner transition-all">
          {messages.map((msg, idx) => {
            const senderId = msg.senderId._id ?? msg.senderId;
            const isCurrentUser = senderId === currentUser.id;
            const hasFile = !!msg.fileUrl;
            const replied = msg.replyTo;
            if (!msg.message && !msg.fileUrl && !msg.isDeleted) return null;

            return (
              <div
                key={msg._id || idx}
                className={`relative mb-3 p-3 rounded-2xl max-w-[75%] ${
                  isCurrentUser
                    ? "bg-blue-100 text-gray-800 ml-auto"
                    : "bg-gray-100 text-gray-800 mr-auto"
                } shadow-sm`}
              >
                {/* Message Content */}
                {editingId === msg._id ? (
                  <div className="flex gap-2">
                    <input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded"
                    />
                    <button
                      onClick={() => handleEdit(msg._id)}
                      className="text-green-600 font-semibold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    {replied && (
                      <div className="text-xs italic text-gray-500 border-l-2 border-blue-400 pl-2 mb-1">
                        Replying to: {replied.message || "Media/Deleted"}
                      </div>
                    )}
                    <div>
                      {msg.isDeleted ? (
                        <span className="italic text-gray-400 text-sm">
                          This message was deleted
                        </span>
                      ) : (
                        <>
                          {msg.message}
                          {msg.isEdited && (
                            <span className="text-gray-500 text-xs ml-1">
                              (edited)
                            </span>
                          )}
                        </>
                      )}
                      {hasFile &&
                        (msg.fileUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                          <img
                            src={msg.fileUrl}
                            alt="preview"
                            className="max-w-xs rounded mt-2"
                          />
                        ) : (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline text-sm block mt-1"
                          >
                            📎 File Attachment
                          </a>
                        ))}
                    </div>

                    {/* Always Visible Actions */}
                    {!msg.isDeleted && (
                      <div
                        className={`flex gap-3 mt-2 ${
                          isCurrentUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="p-1 text-indigo-500 hover:scale-110 transition"
                          title="Reply"
                        >
                          <FaReply />
                        </button>
                        <button
                          onClick={() =>
                            setShowReactionPicker(
                              (prev) => (prev === msg._id ? null : msg._id)
                            )
                          }
                          className="p-1 text-yellow-500 hover:scale-110 transition"
                          title="React"
                        >
                          🙂
                        </button>
                        {isCurrentUser && (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(msg._id);
                                setEditingText(msg.message);
                              }}
                              className="p-1 text-green-500 hover:scale-110 transition"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(msg._id)}
                              className="p-1 text-red-500 hover:scale-110 transition"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Reaction Picker */}
                    {showReactionPicker === msg._id && (
                      <div className="absolute z-50 top-full mt-2 animate-fade-in">
                        <Picker
                          data={data}
                          onEmojiSelect={(e) => handleReact(msg._id, e.native)}
                        />
                      </div>
                    )}

                    {/* Reactions */}
                    {msg.reactions?.length > 0 && (
                      <div className="flex gap-1 mt-1 text-lg">
                        {msg.reactions.map((emoji, index) => (
                          <span key={index}>{emoji}</span>
                        ))}
                      </div>
                    )}

                    {/* Status */}
                    {isCurrentUser && (
                      <span className="text-xs text-gray-500 block mt-1">
                        {msg.isRead ? "✅ Seen" : "🕓 Delivered"} •{" "}
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef}></div>
          {typingUser && (
            <p className="text-gray-500 text-sm italic mt-2">
              ✍️ Typing...
            </p>
          )}
        </div>

        {/* Reply Preview */}
        {replyingTo && (
          <div className="bg-gray-100 border-l-4 border-blue-500 p-2 my-2 flex justify-between items-center rounded">
            <span className="text-sm italic text-gray-700">
              Replying to: {replyingTo.message || "Media/Deleted"}
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-red-500 text-xs ml-4"
            >
              Cancel ✖
            </button>
          </div>
        )}

        {/* Input Section */}
        <div className="flex mt-4 gap-2 items-center relative bg-white p-3 rounded-lg shadow border border-gray-200">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleTyping}
            placeholder="Type a message..."
            className="flex-grow border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-blue-600 text-2xl hover:scale-110 transition"
          >
            <BsEmojiSmile />
          </button>
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer text-blue-600 text-xl hover:scale-110 transition"
          >
            📎
          </label>
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition"
          >
            Send
          </button>
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-16 right-4 bg-white shadow-lg rounded-lg p-2 z-50 animate-fade-in"
            >
              <Picker data={data} onEmojiSelect={addEmoji} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
