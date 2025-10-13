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

// ⚡ Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
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
    socket.join(userId); // join personal notification room
    console.log(`👤 User registered in room: ${userId}`);
  });

  // 💬 Typing indicators (for chat, optional)
  socket.on("typing", (payload) => io.emit("typing", payload));
  socket.on("stopTyping", (payload) => io.emit("stopTyping", payload));

  // 📰 Real-time post updates (like, comment, delete)
  socket.on("postUpdated", (post) => io.emit("postUpdated", post));
  socket.on("postDeleted", (id) => io.emit("postDeleted", id));

  // 🧩 Real-time notifications (connection requests, likes, etc.)
  socket.on("sendNotification", (data) => {
    // data = { toUserId, notification }
    console.log(`📨 Notification sent to: ${data.toUserId}`);
    io.to(data.toUserId).emit("notification", data.notification);
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

server.listen(PORT, () => {
  console.log("====================================");
  console.log(`🚀 MediLink backend running at: http://localhost:${PORT}`);
  console.log("====================================");
});
