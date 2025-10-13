// src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const User = require("../modules/auth/models/user.model");

/**
 * 🔐 Authentication Middleware
 * Verifies JWT token, attaches user to request object.
 * Protects all private routes.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 🛑 1. Validate Bearer Header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("🚫 No Bearer token found in headers");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1].trim();
    console.log("🧩 Received JWT Token:", token.slice(0, 20) + "...");

    // 🛑 2. Validate Secret Key
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing in .env");
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration: JWT_SECRET missing",
      });
    }

    // 🧠 3. Verify Token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("❌ JWT Verification Failed:", err.message);
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({
            success: false,
            message: "Session expired. Please log in again.",
          });
      }
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Invalid token" });
    }

    // ✅ 4. Fetch User
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.warn("⚠️ User not found or deleted:", decoded.id);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ✅ 5. Attach to Request Object
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    console.log(`✅ Authenticated User: ${user.email} (${user.role})`);

    next();
  } catch (err) {
    console.error("💥 Auth Middleware Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error in authentication middleware",
    });
  }
};

module.exports = authMiddleware;
