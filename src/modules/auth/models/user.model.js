const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String },
    provider: {
      type: String,
      enum: ["email", "google", "apple"],
      default: "email",
    },
    providerId: { type: String },

    role: {
      type: String,
      enum: ["doctor", "student", "staff"],
      required: true,
    },

    bio: String,
    headline: String,
    profilePic: String,
    location: String,
    skills: [String],

    // Role-specific
    specialization: String,
    experienceYears: String,

    university: String,
    degree: String,
    yearOfStudy: String,

    department: String,
    position: String,

    // Extras
    institute: String,
    uploadId: String,
    phone: String,
    address: String,
    qualification: String,

    isActive: { type: Boolean, default: true },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    isVerified: { type: Boolean, default: true },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verificationHistory: [
      {
        at: Date,
        result: String,
      reason: String,
      },
    ],
    emailVerified: { type: Boolean, default: false },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
