// src/app.js
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const app = express();

// 🧩 Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// 🧱 Import Routes
const authRoutes = require("./modules/auth/routes/auth.routes");
const postRoutes = require("./modules/post/routes/post.routes");
const jobRoutes = require("./modules/job/routes/job.routes");
const userRoutes = require("./modules/userProfile/userProfile.routes");
const notificationRoutes = require("./modules/notification/routes/notification.routes");

// 🛠 Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);
// app.use(
//   "/api/notifications",
//   require("./modules/notification/routes/notification.routes")
// );
app.use("/api/notifications", notificationRoutes);

// 📁 Serve uploaded media files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🩺 Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "🩺 MediLink API is running fine 🚀" });
});

module.exports = app;
