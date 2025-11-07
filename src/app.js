// src/app.js
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const app = express();

// ================================
// 🛡️ CORS Configuration (Fix for Render + Vercel)
// ================================


const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://medlink-prod.vercel.app", // main production
  "https://medlink-production.vercel.app",
  "https://probable-memory-qxvp69x649v367g4-5173.app.github.dev", // github production
  "http://127.0.0.1:5173",
];

// ✅ Custom CORS logic
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow REST tools & server-to-server (no origin)
      if (!origin) return callback(null, true);

      // ✅ Allow all vercel.app subdomains (even random preview URLs)
      const hostname = new URL(origin).hostname;
      if (
        allowedOrigins.includes(origin) ||
        hostname.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      // ❌ Otherwise reject
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true, // ✅ allows cookies/tokens
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ================================
// 🧩 General Middlewares
// ================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ================================
// 🧱 Import Routes
// ================================
const authRoutes = require("./modules/auth/routes/auth.routes");
const postRoutes = require("./modules/post/routes/post.routes");
const jobRoutes = require("./modules/job/routes/job.routes");
const userRoutes = require("./modules/userProfile/userProfile.routes");
const notificationRoutes = require("./modules/notification/routes/notification.routes");
const chatRoutes = require("./modules/chat/routes/chat.routes");
const messageRoutes = require("./modules/chat/routes/message.routes");
// ================================
// 🛠 Mount Routes
// ================================
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chats",chatRoutes);
app.use("/api/messages",messageRoutes)
// 📁 Serve uploaded media files (images, profile pics)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================================
// 🩺 Health Check Route
// ================================
app.get("/", (req, res) => {
  res.status(200).json({ message: "🩺 MediLink API is running fine 🚀" });
});

module.exports = app;
