// middlewares/error.middleware.js
const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error caught by middleware:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = errorHandler;
