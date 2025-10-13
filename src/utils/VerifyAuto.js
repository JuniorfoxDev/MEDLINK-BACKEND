// src/utils/verifyAuto.js
const vision = require("@google-cloud/vision");
const path = require("path");
const fs = require("fs");
const User = require("../modules/auth/models/user.model");

// Create Google Vision client
const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, "../../config/googleVisionKey.json"),
});

exports.autoVerifyID = async (user) => {
  try {
    if (!user.uploadId) {
      console.log("⚠️ No ID uploaded for verification.");
      return;
    }

    const filePath = path.join(__dirname, "../../", user.uploadId);

    console.log("🔍 Running AI verification for:", user.email);

    // Analyze the uploaded ID card
    const [result] = await client.textDetection(filePath);
    const detections = result.textAnnotations;

    const fullText = detections.length
      ? detections[0].description.toLowerCase()
      : "";
    console.log("🧾 Extracted text:", fullText);

    // Simple logic: if “college”, “university”, or “student id” appear → verify
    if (
      fullText.includes("college") ||
      fullText.includes("university") ||
      fullText.includes("student id") ||
      fullText.includes("institute")
    ) {
      console.log("✅ Legitimate ID detected. Marking verified.");

      user.isVerified = true;
      user.verificationStatus = "verified";
      user.verificationHistory.push({
        at: new Date(),
        result: "verified",
        reason: "Auto verified using Google Vision API",
      });
    } else {
      console.log("❌ ID seems invalid or unrecognized text.");

      user.isVerified = false;
      user.verificationStatus = "rejected";
      user.verificationHistory.push({
        at: new Date(),
        result: "rejected",
        reason: "Could not detect legitimate college ID",
      });
    }

    await user.save();
  } catch (err) {
    console.error("❌ Auto Verification Error:", err.message);
  }
};
