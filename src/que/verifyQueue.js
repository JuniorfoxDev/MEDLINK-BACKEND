// // src/queue/verifyQueue.js
// const Queue = require("bull");
// const autoVerify = require("../utils/autoVerify");

// const verifyQueue = new Queue("verifyUserQueue", {
//   redis: {
//     host: process.env.REDIS_HOST || "127.0.0.1",
//     port: process.env.REDIS_PORT || 6379,
//   },
// });

// verifyQueue.process("verifyUser", async (job) => {
//   console.log("🔍 Verifying user:", job.data.userId);
//   const result = await autoVerify(job.data.userId);
//   console.log("✅ Verification result:", result);
// });

// verifyQueue.on("failed", (job, err) => {
//   console.error(`❌ Job failed [${job.id}]:`, err);
// });

// module.exports = { verifyQueue };
