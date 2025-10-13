const express = require("express");
const router = express.Router();
const User = require("../../modules/auth/models/user.model");
const auth = require("../../middlewares/auth.middleware");
const Notification = require("../notification/models/notification.model");

// ✅ Get all users except the logged-in one
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
// router.post("/connect/:id", auth, async (req, res) => {
//   try {
//     const sender = await User.findById(req.user.id);
//     const receiver = await User.findById(req.params.id);

//     if (!receiver) return res.status(404).json({ message: "User not found" });

//     // Check if already connected
//     if (receiver.connections.includes(sender._id)) {
//       return res.json({ success: false, message: "Already connected" });
//     }

//     // Check if request already sent
//     const existing = await Notification.findOne({
//       user: receiver._id,
//       sender: sender._id,
//       type: "connection_request",
//       status: "pending",
//     });
//     if (existing)
//       return res.json({ success: false, message: "Request already sent" });

//     // Create notification
//     const notification = await Notification.create({
//       user: receiver._id,
//       sender: sender._id,
//       type: "connection_request",
//       message: `${sender.name} sent you a connection request.`,
//     });

//     const io = req.app.get("io");
//     io.to(receiver._id.toString()).emit("notification", notification);

//     res.json({ success: true, message: "Connection request sent" });
//   } catch (err) {
//     console.error("Connection error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });
// ✅ Get my connections
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

    // ✅ Prevent duplicate request
    const existingNotif = await Notification.findOne({
      user: targetId,
      sender: userId,
      type: "connection_request",
      status: "pending",
    });
    if (existingNotif)
      return res
        .status(400)
        .json({ success: false, message: "Request already sent" });

    // ✅ Create notification for receiver
    const newNotif = await Notification.create({
      user: targetId,
      sender: userId,
      type: "connection_request",
      message: `${sender.name} sent you a connection request.`,
    });

    // ✅ Send socket notification in real-time
    const io = req.app.get("io");
    if (io) io.to(targetId.toString()).emit("notification", newNotif);

    res.json({ success: true, message: "Connection request sent" });
  } catch (err) {
    console.error("❌ Connect Route Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/connections", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).populate(
      "connections",
      "name email role bio profilePic location"
    );
    res.status(200).json({
      success: true,
      connections: me.connections || [],
    });
  } catch (err) {
    console.error("❌ Fetch connections failed:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Connect with another user
router.post("/:id/connect", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const other = await User.findById(req.params.id);

    if (!other) return res.status(404).json({ message: "User not found" });

    if (me.connections.includes(other._id))
      return res.status(400).json({ message: "Already connected" });

    me.connections.push(other._id);
    other.connections.push(me._id);
    await me.save();
    await other.save();

    res.json({ success: true, message: `Connected with ${other.name}` });
  } catch (err) {
    console.error("❌ Connect failed:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Remove a connection
router.post("/:id/unconnect", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const other = await User.findById(req.params.id);

    if (!other) return res.status(404).json({ message: "User not found" });

    me.connections = me.connections.filter(
      (id) => id.toString() !== other._id.toString()
    );
    other.connections = other.connections.filter(
      (id) => id.toString() !== me._id.toString()
    );

    await me.save();
    await other.save();

    res.json({
      success: true,
      message: `Removed connection with ${other.name}`,
    });
  } catch (err) {
    console.error("❌ Unconnect failed:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
