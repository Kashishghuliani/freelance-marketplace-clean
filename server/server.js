const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const path = require("path");
const Conversation = require("./models/Conversation"); // ✅ Add this line


dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/gigs", require("./routes/gigRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/reviews", require("./routes/review.routes"));

app.get("/", (req, res) => res.send("🟢 API is running..."));

// ---------------------------
// ✅ Socket.io Integration
// ---------------------------
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map();
app.set("ioInstance", io);
app.set("ioUserMap", onlineUsers);

const Message = require("./models/Message");

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} joined. Socket ID: ${socket.id}`);
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { senderId });
    }
  });

 socket.on("sendMessage", async (data) => {
  const {
    senderId,
    receiverId,
    conversationId: incomingConvoId,
    message,
    fileUrl,
    replyTo,
    clientTempId,
  } = data;

  try {
    let conversationId = incomingConvoId;
    let conversation;

    // 🛠 Create conversation if not provided
    if (!conversationId || conversationId === "null") {
      conversation = await Conversation.findOne({
        members: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = new Conversation({ members: [senderId, receiverId] });
        await conversation.save();
      }

      conversationId = conversation._id;
    } else {
      conversation = await Conversation.findById(conversationId);
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      conversationId,
      message,
      fileUrl,
      replyTo,
      isRead: false,
      status: "sent",
    });

    const savedMessage = await newMessage.save();

    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("senderId", "username")
      .populate("replyTo");

    populatedMessage._doc.clientTempId = clientTempId;

    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      populatedMessage.status = "delivered";
      await populatedMessage.save();
      io.to(receiverSocket).emit("receiveMessage", populatedMessage);
    }

    const senderSocket = onlineUsers.get(senderId);
    if (senderSocket && senderSocket !== receiverSocket) {
      io.to(senderSocket).emit("receiveMessage", populatedMessage);
    }
  } catch (err) {
    console.error("❌ Error sending message:", err);
  }
});


  // ✅ Message Edit
  socket.on("editMessage", (data) => {
    const { receiverId } = data;
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("messageEdited", data);
    }
  });

  // ✅ Message Delete
  socket.on("deleteMessage", (data) => {
    const { receiverId } = data;
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("messageDeleted", data);
    }
  });

  // ✅ Emoji reaction
  socket.on("reactMessage", async ({ msgId, emoji, senderId, receiverId, clientTempId }) => {
  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      msgId,
      { $addToSet: { reactions: emoji } },
      { new: true }
    );

    if (!updatedMessage) {
      console.error("❌ Message not found for reaction:", msgId);
      return;
    }

    updatedMessage._doc.clientTempId = clientTempId || null;

    const receiverSocket = onlineUsers.get(receiverId);
    const senderSocket = onlineUsers.get(senderId);

    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveReaction", updatedMessage);
    }
    if (senderSocket && senderSocket !== receiverSocket) {
      io.to(senderSocket).emit("receiveReaction", updatedMessage);
    }
  } catch (err) {
    console.error("❌ Error reacting to message:", err);
  }
});


  // ✅ Message Read Status
  socket.on("message-read", async ({ conversationId, readerId }) => {
    try {
      await Message.updateMany(
        {
          conversationId,
          receiverId: readerId,
          isRead: false,
        },
        { $set: { isRead: true, status: "seen" } }
      );

      const messages = await Message.find({
        conversationId,
        receiverId: readerId,
      });

      const distinctSenderIds = [
        ...new Set(messages.map((msg) => msg.senderId.toString())),
      ];

      distinctSenderIds.forEach((senderId) => {
        const senderSocket = onlineUsers.get(senderId);
        if (senderSocket) {
          io.to(senderSocket).emit("messageRead", {
            readerId,
            conversationId,
          });
        }
      });
    } catch (error) {
      console.error("❌ Error marking messages as read:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

// ---------------------------
// ✅ Start Server
// ---------------------------
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
