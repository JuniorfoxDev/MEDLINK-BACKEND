const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const User = require("../models/user.model");

// Get all users except me
router.get("/", auth, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user.id } }).select(
    "name email role bio profilePic location specialization"
  );
  res.json({ users });
});

// Get my connections
router.get("/connections", auth, async (req, res) => {
  const me = await User.findById(req.user.id).populate(
    "connections",
    "name email role bio profilePic location"
  );
  res.json({ connections: me.connections || [] });
});

// Connect user
router.post("/:id/connect", auth, async (req, res) => {
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
});

// Unconnect
router.post("/:id/unconnect", auth, async (req, res) => {
  const me = await User.findById(req.user.id);
  const other = await User.findById(req.params.id);

  me.connections = me.connections.filter(
    (id) => id.toString() !== other._id.toString()
  );
  other.connections = other.connections.filter(
    (id) => id.toString() !== me._id.toString()
  );

  await me.save();
  await other.save();

  res.json({ success: true, message: `Removed connection with ${other.name}` });
});

module.exports = router;
