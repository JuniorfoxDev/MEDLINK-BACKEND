const express = require("express");
const router = express.Router();
const Message = require("../../chat/models/message.model");
const Chat = require("../../chat/models/chat.model");
const { authMiddleware } = require("../../middlewares/auth.middleware");

// ✉️ Send message
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { chatId, text } = req.body;
    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      text,
    });

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

    const populatedMsg = await message.populate("sender", "name profilePic");

    // Emit real-time message via socket
    const io = req.app.get("io");
    io.to(chatId).emit("newMessage", populatedMsg);

    res.json({ success: true, message: populatedMsg });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 📜 Get messages by chatId
router.get("/:chatId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId }).populate(
      "sender",
      "name profilePic"
    );
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
