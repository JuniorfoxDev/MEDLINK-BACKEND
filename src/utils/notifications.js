const admin = require("../config/firebaseAdmin");

async function sendPushToTokens(tokens = [], payload = {}) {
  if (!tokens.length) return;
  try {
    await admin.messaging().sendToDevice(tokens, {
      notification: {
        title: payload.title || "MediLink",
        body: payload.body || "",
      },
      data: payload.data || {},
    });
  } catch (err) {
    console.error("❌ FCM Error:", err);
  }
}

module.exports = { sendPushToTokens };
