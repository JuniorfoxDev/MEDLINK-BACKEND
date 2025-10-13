// models/verificationToken.model.js
const mongoose = require("mongoose");
const tokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    type: { type: String, enum: ["email"], default: "email" },
    expiresAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("VerificationToken", tokenSchema);
