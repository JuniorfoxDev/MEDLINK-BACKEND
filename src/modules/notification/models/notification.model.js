const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // receiver
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["connection_request", "connection_accept", "like", "comment"],
      required: true,
    },
    message: { type: String },
    isRead: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "maybe_later"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
