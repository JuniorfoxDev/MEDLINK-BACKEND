const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // participants: array of user ObjectIds
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    // optional metadata
    title: String,
    unreadCounts: {
      // map of userId -> number
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
