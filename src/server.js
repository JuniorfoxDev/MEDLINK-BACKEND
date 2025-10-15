// ================================
// 🌍 MediLink Server Setup
// ================================
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const errorHandler = require("./middlewares/error.middleware");

// 🌍 Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// 🧩 Connect to MongoDB
connectDB();

// 🚀 Import Express App (which has all routes)
const app = require("./app");

// ⚙️ Create HTTP Server
const server = http.createServer(app);

// ✅ Define allowed origins for Socket.io + CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "https://medlink-frontend-4t49-dmzbgsaxu-juniorfoxdevs-projects.vercel.app",
  "https://medlink-frontend-4t49-dmzbgsaxu-juniorfoxdevs-projects.vercel.app"
  "https://medlink-frontend.vercel.app",
  "http://localhost:3000",
];

// ⚡ Initialize Socket.IO with secure CORS config
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// 🔁 Attach io instance to Express app (for controller access)
app.set("io", io);

// ================================
// 🧠 Socket.IO Events
// ================================
io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // ✅ Register user when frontend connects (each user joins their own room)
  socket.on("registerUser", (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`👤 User joined their personal room: ${userId}`);
    }
  });

  // 💬 Typing indicators (for chat, optional)
  socket.on("typing", (payload) => io.emit("typing", payload));
  socket.on("stopTyping", (payload) => io.emit("stopTyping", payload));

  // 📰 Real-time post updates (like, comment, delete)
  socket.on("postLiked", (data) => {
    // { postId, likedBy, ownerId }
    console.log(`❤️ Post liked by ${data.likedBy}`);
    io.to(data.ownerId).emit("notification", {
      type: "like",
      message: `${data.likedByName} liked your post.`,
      postId: data.postId,
    });
  });

  socket.on("postCommented", (data) => {
    // { postId, commentBy, ownerId, commentText }
    console.log(`💬 Comment added by ${data.commentBy}`);
    io.to(data.ownerId).emit("notification", {
      type: "comment",
      message: `${data.commentByName} commented on your post.`,
      postId: data.postId,
    });
  });

  // 🧩 Real-time connection requests
  socket.on("sendNotification", (data) => {
    // data = { toUserId, notification }
    if (data?.toUserId) {
      console.log(`📨 Sending notification to: ${data.toUserId}`);
      io.to(data.toUserId.toString()).emit("notification", data.notification);
    }
  });

  // ❌ Disconnect event
  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

// ================================
// ⚠️ Global Error Handler
// ================================
app.use(errorHandler);

// ================================
// 🩺 Start Server
// ================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("====================================");
  console.log(`🚀 MediLink backend running on: http://localhost:${PORT}`);
  console.log(`🌐 Accessible at: ${process.env.FRONTEND_URL || "default"}`);
  console.log("====================================");
});
