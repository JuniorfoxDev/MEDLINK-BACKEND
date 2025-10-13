const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    hospital: { type: String, required: true },
    location: { type: String, required: true },
    type: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract", "Remote"],
      default: "Full-Time",
    },
    description: { type: String, required: true },
    tags: [String],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        resume: { type: String }, // resume file path
        appliedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
