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
  "https://medlink-frontend.vercel.app",
  "https://medlink-frontend-4t49.vercel.app/",
  "https://medlink-production.vercel.app",
  "https://medlink-prod.vercel.app",
  "https://medlink-frontend-4t49-307czvbwn-juniorfoxdevs-projects.vercel.app", // your actual deployed frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow REST tools & local use (no origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // ✅ required if you ever send auth cookies
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

// ================================
// 🛠 Mount Routes
// ================================
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// 📁 Serve uploaded media files (images, profile pics)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================================
// 🩺 Health Check Route
// ================================
app.get("/", (req, res) => {
  res.status(200).json({ message: "🩺 MediLink API is running fine 🚀" });
});

module.exports = app;
