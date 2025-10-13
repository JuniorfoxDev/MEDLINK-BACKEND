const express = require("express");
const router = express.Router();
const Notification = require("../models/notification.model");
const User = require("../../auth/models/user.model");
const auth = require("../../../middlewares/auth.middleware");

// 🧾 Get all notifications for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate("sender", "name profilePic role")
      .sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching notifications" });
  }
});


// ✅ Accept Connection Request
router.post("/accept/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id).populate(
      "sender"
    );
    if (!notification || notification.type !== "connection_request") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request" });
    }

    // Update status
    notification.status = "accepted";
    await notification.save();

    // Add both users to connections
    const receiver = await User.findById(req.user.id);
    const sender = await User.findById(notification.sender._id);
    if (!receiver.connections.includes(sender._id)) {
      receiver.connections.push(sender._id);
      sender.connections.push(receiver._id);
      await receiver.save();
      await sender.save();
    }

    // Send back a notification to sender
    const acceptNotif = await Notification.create({
      user: sender._id,
      sender: receiver._id,
      type: "connection_accept",
      message: `${receiver.name} accepted your connection request.`,
      status: "accepted",
    });

    // Emit socket to sender
    const io = req.app.get("io");
    io.to(sender._id.toString()).emit("notification", acceptNotif);

    res.json({ success: true, message: "Connection accepted" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error accepting connection" });
  }
});

// ❌ Remove / Reject Connection Request
router.post("/reject/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Not found" });

    notification.status = "rejected";
    await notification.save();

    res.json({ success: true, message: "Connection request removed" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error rejecting request" });
  }
});

// ⏳ Maybe Later
router.post("/maybe/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Not found" });

    notification.status = "maybe_later";
    await notification.save();

    res.json({ success: true, message: "Saved for later" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating request" });
  }
});

module.exports = router;
