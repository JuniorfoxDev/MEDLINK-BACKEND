const mongoose = require("mongoose");

const connectDB = async () => {
  const MONGO_URI =
    "mongodb+srv://vaibhavmeshram2908:vaibhav123@cluster0.1pkf5.mongodb.net/medilink?retryWrites=true&w=majority&appName=Cluster0";
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
