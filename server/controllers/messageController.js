const mongoose = require("mongoose");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

exports.uploadMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, conversationId, message, clientTempId, replyTo } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let convoId = conversationId;
    let conversation;

    // If no convo ID, find or create one
    if (!convoId || convoId === "null") {
      conversation = await Conversation.findOne({
        members: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = new Conversation({ members: [senderId, receiverId] });
        await conversation.save();
      }

      convoId = conversation._id;
    } else {
      conversation = await Conversation.findById(convoId);
    }

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      conversationId: conversation._id,
      message: message?.trim() || null,
      fileUrl: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
      replyTo: replyTo || null,
      isRead: false,
      status: "sent",
    });

    const saved = await newMessage.save();

    const populated = await Message.findById(saved._id)
      .populate("senderId", "username")
      .populate("replyTo");

    populated._doc.clientTempId = clientTempId || null;

    // Emit via socket
    const io = req.app.get("ioInstance");
    const onlineUsers = req.app.get("ioUserMap");

    if (io && onlineUsers) {
      const receiverSocket = onlineUsers.get(receiverId);
      const senderSocket = onlineUsers.get(senderId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", populated);
      }
      if (senderSocket && senderSocket !== receiverSocket) {
        io.to(senderSocket).emit("receiveMessage", populated);
      }
    }

    return res.status(200).json(populated);
  } catch (e) {
    console.error("❌ Upload message error:", e);
    res.status(500).json({ error: "Upload failed" });
  }
};

// ✅ Send a message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message, replyTo } = req.body;
    const file = req.file;

    if ((!message || message.trim() === "") && !file) {
      return res.status(400).json({ error: "Message or file is required" });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({ members: [senderId, receiverId] });
      await conversation.save();
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      message: message?.trim() || null,
      fileUrl: file
        ? `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
        : null,
      conversationId: conversation._id,
      replyTo: replyTo || null,
    });

    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    console.error("❌ Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};


// ✅ Fetch conversation
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "username")
      .populate("receiverId", "username")
      .populate("replyTo", "message sender");


    res.json(messages);
  } catch (err) {
    console.error("❌ Get Conversation Error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// ✅ Get inbox
exports.getInbox = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("senderId", "username")
      .populate("receiverId", "username");

    const conversationMap = new Map();

    messages.forEach((msg) => {
      const otherUser =
        msg.senderId._id.toString() === userId
          ? msg.receiverId
          : msg.senderId;

      if (!conversationMap.has(otherUser._id.toString())) {
        conversationMap.set(otherUser._id.toString(), {
          user: otherUser,
          lastMessage: msg.isDeleted ? "This message was deleted" : msg.message,
          lastTime: msg.createdAt,
          conversationId: msg.conversationId,
          isRead: msg.isRead,
        });
      }
    });

    res.json(Array.from(conversationMap.values()));
  } catch (err) {
    console.error("❌ Get Inbox Error:", err);
    res.status(500).json({ message: "Failed to fetch inbox" });
  }
};

// ✅ Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const result = await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    res.status(200).json({
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Failed to mark messages as read:", error.message);
    res.status(500).json({ message: "Failed to update read status" });
  }
};

// ✅ Edit a message
exports.editMessage = async (req, res) => {
  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      {
        message: req.body.message,
        isEdited: true,
      },
      { new: true }
    );
    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Edit Message Error:", error);
    res.status(500).json({ error: "Failed to edit message" });
  }
};

// ✅ Soft delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const deletedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        message: "", // remove text
        fileUrl: null, // remove file
      },
      { new: true }
    );

    res.status(200).json({ message: "Message deleted", deletedMessage });
  } catch (error) {
    console.error("Delete Message Error:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

// ✅ React to a message
exports.reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (!message.reactions) message.reactions = [];

    message.reactions.push(emoji);
    await message.save();
    const io = req.app.get("io"); // ensure io is accessible
    
    res.status(200).json(message);
  } catch (err) {
    console.error("React error:", err);
    res.status(500).json({ error: "Failed to react" });
  }
};

// ✅ Get all messages by conversation ID
exports.getMessagesByConversationId = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId })
  .sort({ createdAt: 1 }) // sort oldest to newest
  .populate("senderId", "username")
  .populate("receiverId", "username")
  .populate("replyTo", "message sender");


    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Failed to fetch messages by conversation ID:", error);
    res.status(500).json({ error: "Server error while fetching messages" });
  }
};

