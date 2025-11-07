// src/modules/chat/routes/chat.routes.js
const express = require("express");
const router = express.Router();
const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const auth = require("../../../middlewares/auth.middleware");

// 🟢 Create or send first message (auto creates pending chat)
router.post("/start", auth, async (req, res) => {
  try {
    const { userId, text } = req.body;

    if (!userId || !text)
      return res
        .status(400)
        .json({ success: false, message: "userId & text required" });

    const senderId = req.user.id || req.user._id; // ✅ safe check
    const receiverId = userId;

    // 🔍 Check if chat already exists between sender and receiver
    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [senderId, receiverId],
        status: "pending",
        requestedBy: senderId,
      });
    }

    // 💬 Save first message
    const message = await Message.create({
      chat: chat._id,
      sender: senderId,
      text,
    });

    chat.lastMessage = message._id;
    await chat.save();

    // 📢 Notify the receiver in real-time only
    const io = req.app.get("io");
    if (io) {
      io.to(receiverId.toString()).emit("newMessageRequest", {
        from: senderId,
        text,
        chatId: chat._id,
      });
    }

    res.json({
      success: true,
      message: "Message request sent successfully!",
      chat,
    });
  } catch (err) {
    console.error("❌ Start chat error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟣 Get all chats for the logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const chats = await Chat.find({
      participants: userId,
      $or: [
        { status: "active" },
        { status: "pending", requestedBy: { $ne: userId } }, // ✅ show pending only to receiver
      ],
    })
      .populate("participants", "name profilePic")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json({ success: true, chats });
  } catch (err) {
    console.error("❌ Fetch chats failed:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 💬 Get all messages of a chat
router.get("/:chatId/messages", auth, async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name profilePic")
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (err) {
    console.error("❌ Get messages error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 Accept message request (activate chat)
router.post("/:chatId/accept", auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat)
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });

    const userId = req.user.id || req.user._id;

    if (!chat.participants.map(String).includes(userId.toString()))
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    chat.status = "active";
    await chat.save();

    // 🔔 Notify the other participant
    const otherUser = chat.participants.find(
      (p) => p.toString() !== userId.toString()
    );

    const io = req.app.get("io");
    if (io && otherUser) {
      io.to(otherUser.toString()).emit("messageRequestAccepted", {
        chatId: chat._id,
        by: userId,
      });
    }

    res.json({ success: true, message: "Chat accepted successfully!" });
  } catch (err) {
    console.error("❌ Accept chat error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🔴 Ignore message request (optional)
router.post("/:chatId/ignore", auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat)
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });

    chat.status = "ignored";
    await chat.save();

    res.json({ success: true, message: "Chat request ignored" });
  } catch (err) {
    console.error("❌ Ignore chat error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 💭 Send message in active chat
router.post("/:chatId/message", auth, async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.id || req.user._id;

    const chat = await Chat.findById(req.params.chatId);
    if (!chat)
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });

    if (chat.status !== "active")
      return res
        .status(400)
        .json({ success: false, message: "Chat is not active yet" });

    const message = await Message.create({
      chat: chat._id,
      sender: userId,
      text,
    });

    chat.lastMessage = message._id;
    await chat.save();

    const populatedMsg = await Message.findById(message._id).populate(
      "sender",
      "name profilePic"
    );

    // 📢 Emit message to both participants in real-time
    const io = req.app.get("io");
    if (io) io.to(chat._id.toString()).emit("newMessage", populatedMsg);

    res.json({
      success: true,
      message: "Message sent successfully!",
      data: populatedMsg,
    });
  } catch (err) {
    console.error("❌ Send message error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
