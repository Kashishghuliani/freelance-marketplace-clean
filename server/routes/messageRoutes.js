const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");

const { verifyToken } = require("../middleware/jwt");
const {
  sendMessage,
  getConversation,
  getInbox,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  reactToMessage,
  getMessagesByConversationId,
} = require("../controllers/messageController");

const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const router = express.Router();

// ✅ Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + file.originalname),
});
const upload = multer({ storage });

/**
 * ✅ Send text message
 * POST /api/messages/
 */
router.post("/", verifyToken, sendMessage);

/**
 * ✅ Send message with file
 * POST /api/messages/upload
 */
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message, conversationId } = req.body;

    if (!senderId || !receiverId || !conversationId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: message || "",
      conversationId,
      fileUrl: req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null,
      fileName: req.file?.originalname,
      isRead: false,
      status: "sent",
    });

    await newMessage.save();

    // Emit socket event if receiver is online
    const receiverSocket = req.app.get("ioUserMap")?.get(receiverId);
    if (receiverSocket) {
      const io = req.app.get("ioInstance");
      newMessage.status = "delivered";
      await newMessage.save();
      io.to(receiverSocket).emit("receiveMessage", newMessage);
    }

    res.status(200).json(newMessage);
  } catch (err) {
    console.error("❌ File upload error:", err);
    res.status(500).json({ error: "File upload failed" });
  }
});

/**
 * ✅ Get inbox for the current user
 * GET /api/messages/inbox
 */
router.get("/inbox", verifyToken, getInbox);

/**
 * ✅ Get messages by conversation ID
 * GET /api/messages/conversation/:conversationId
 */
router.get("/conversation/:conversationId", verifyToken, getMessagesByConversationId);

/**
 * ✅ Get conversation ID
 * GET /api/messages/conversations/:userId
 */
// ✅ Get or create conversation by userId
router.get("/conversations/:userId", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    let conversation = await Conversation.findOne({
      members: { $all: [currentUserId, otherUserId] },
    });

    // ✅ Auto-create if not found
    if (!conversation) {
      conversation = new Conversation({ members: [currentUserId, otherUserId] });
      await conversation.save();
    }

    res.status(200).json({ conversationId: conversation._id });
  } catch (err) {
    console.error("❌ Fetch conversation error:", err);
    res.status(500).json({ message: "Failed to fetch or create conversation" });
  }
});


/**
 * ✅ Mark all messages from a user as read
 * PUT /api/messages/read/:userId
 */
router.put("/read/:userId", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const result = await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: currentUserId,
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("❌ Read update error:", err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

/**
 * ✅ Mark a single message as read
 * PUT /api/messages/read-single/:messageId
 */
router.put("/read-single/:messageId", verifyToken, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { isRead: true },
      { new: true }
    );
    res.status(200).json(message);
  } catch (err) {
    console.error("❌ Read single message error:", err);
    res.status(500).json({ error: "Failed to update read status" });
  }
});

/**
 * ✅ Edit a message
 * PUT /api/messages/edit/:id
 */
router.put("/edit/:id", verifyToken, editMessage);

/**
 * ✅ Delete a message (soft delete)
 * DELETE /api/messages/:id
 */
router.delete("/:id", verifyToken, deleteMessage);

/**
 * ✅ React to a message
 * POST /api/messages/react/:id
 */
router.post("/react/:id", verifyToken, reactToMessage);

/**
 * ✅ Typing indicator (fallback)
 * POST /api/messages/typing
 */
router.post("/typing", verifyToken, async (req, res) => {
  try {
    const { isTyping, toUserId } = req.body;
    res.status(200).json({
      message: "Typing status received",
      from: req.user.id,
      to: toUserId,
      isTyping,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update typing status" });
  }
});

/**
 * ✅ Get conversation with a specific user
 * GET /api/messages/:userId
 * ⚠️ Keep this route LAST to avoid conflicts
 */
router.get("/:userId", verifyToken, getConversation);

module.exports = router;
