const express = require("express");
const router = express.Router();
const Chat = require("../../chat/models/chat.model");
const Message = require("../../chat/models/message.model");
const { authMiddleware } = require("../../middlewares/auth.middleware");

// 🆕 Create or get existing chat
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const existing = await Chat.findOne({
      participants: { $all: [req.user._id, userId] },
    }).populate("participants", "name profilePic");

    if (existing) return res.json({ success: true, chat: existing });

    const newChat = await Chat.create({ participants: [req.user._id, userId] });
    res.json({ success: true, chat: newChat });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err });
  }
});

// 💬 Get all chats for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate("participants", "name profilePic")
      .populate("lastMessage");

    res.json({ success: true, chats });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
