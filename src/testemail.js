const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

transporter
  .sendMail({
    from: process.env.FROM_EMAIL,
    to: "youremail@gmail.com",
    subject: "Test Email",
    text: "This is a MediLink test email.",
  })
  .then(() => console.log("✅ Email sent"))
  .catch((err) => console.error("❌ Email failed:", err));
