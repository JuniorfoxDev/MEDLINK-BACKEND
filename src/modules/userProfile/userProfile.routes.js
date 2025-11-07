const express = require("express");
const router = express.Router();
const User = require("../../modules/auth/models/user.model");
const auth = require("../../middlewares/auth.middleware");
const Notification = require("../notification/models/notification.model");
const Chat = require("../chat/models/chat.model"); // ✅ Chat model import

// ✅ Get all users except logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select(
      "name email role bio profilePic location specialization connections"
    );
    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("❌ Error fetching users:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Send Connection Request
router.post("/connect/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    if (userId === targetId)
      return res
        .status(400)
        .json({ success: false, message: "You cannot connect to yourself" });

    const sender = await User.findById(userId);
    const receiver = await User.findById(targetId);

    if (!receiver)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // ✅ Prevent duplicate requests
    const existingNotif = await Notification.findOne({
      user: targetId,
      sender: userId,
      type: "connection_request",
      status: "pending",
    });

    if (existingNotif)
      return res
        .status(400)
        .json({ success: false, message: "Connection request already sent" });

    // ✅ Create new connection request notification
    const newNotif = await Notification.create({
      user: targetId,
      sender: userId,
      type: "connection_request",
      status: "pending",
      message: `${sender.name} sent you a connection request.`,
    });

    // ✅ Real-time socket event (if Socket.IO initialized)
    const io = req.app.get("io");
    if (io) io.to(targetId.toString()).emit("notification", newNotif);

    res.json({ success: true, message: "Connection request sent" });
  } catch (err) {
    console.error("❌ Connect Route Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Accept Connection Request
router.post("/accept/:id", auth, async (req, res) => {
  try {
    const receiverId = req.user.id; // logged-in user (acceptor)
    const senderId = req.params.id; // requester

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver || !sender)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // ✅ Already connected check
    if (receiver.connections.includes(senderId)) {
      return res.json({ success: false, message: "Already connected" });
    }

    // ✅ Add connection in both users’ profiles
    receiver.connections.push(senderId);
    sender.connections.push(receiverId);
    await receiver.save();
    await sender.save();

    // ✅ Update pending notification → accepted
    await Notification.findOneAndUpdate(
      { sender: senderId, user: receiverId, type: "connection_request" },
      { status: "accepted" }
    );

    // ✅ Auto-create chat if not exists
    const existingChat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!existingChat) {
      await Chat.create({
        participants: [senderId, receiverId],
      });
      console.log(`💬 Chat created between ${sender.name} & ${receiver.name}`);
    }

    // ✅ Notify sender in real-time
    const io = req.app.get("io");
    if (io) {
      io.to(senderId.toString()).emit("notification", {
        type: "connection_accept",
        sender: receiverId,
        message: `${receiver.name} accepted your connection request.`,
      });
    }

    res.json({
      success: true,
      message: "Connection accepted successfully & chat created!",
    });
  } catch (err) {
    console.error("❌ Accept Connection Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get All My Connections
router.get("/connections", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).populate(
      "connections",
      "name email role bio profilePic location specialization"
    );

    res.status(200).json({
      success: true,
      connections: me.connections || [],
    });
  } catch (err) {
    console.error("❌ Fetch Connections Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Remove a Connection
router.post("/:id/unconnect", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const other = await User.findById(req.params.id);

    if (!other)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // ✅ Remove from both users' connection arrays
    me.connections = me.connections.filter(
      (id) => id.toString() !== other._id.toString()
    );
    other.connections = other.connections.filter(
      (id) => id.toString() !== me._id.toString()
    );

    await me.save();
    await other.save();

    // ✅ Delete chat between them (optional)
    await Chat.findOneAndDelete({
      participants: { $all: [me._id, other._id] },
    });

    // ✅ Send optional notification (if you want)
    const io = req.app.get("io");
    if (io) {
      io.to(other._id.toString()).emit("notification", {
        type: "connection_removed",
        message: `${me.name} removed you from connections.`,
      });
    }

    res.json({
      success: true,
      message: `Removed connection with ${other.name}`,
    });
  } catch (err) {
    console.error("❌ Unconnect Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
