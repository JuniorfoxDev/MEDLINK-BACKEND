// scripts/test-brevo.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const nodemailer = require("nodemailer");
console.log("SMTP_HOST from env:", process.env.SMTP_HOST);

(async () => {
  try {
    console.log("🧩 Testing SMTP with Brevo...");
    console.log("SMTP_HOST:", process.env.SMTP_HOST); // verify it prints smtp-relay.brevo.com

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: "vaibhavmeshram2908@gmail.com",
      subject: "✅ MediLink SMTP Test (Brevo)",
      text: "If you see this, Brevo SMTP works correctly.",
    });

    console.log("✅ Message sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ SMTP error:", err);
  } finally {
    process.exit(0);
  }
})();
