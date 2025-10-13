const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // change to true if using 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send verification email directly (no Redis/Bull)
 */
async function sendVerificationEmail(email, token) {
  const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: "Verify your MediLink Account",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f9fafb;">
        <h2 style="color:#2563eb;">Welcome to MediLink 👋</h2>
        <p>Click the button below to verify your account:</p>
        <a href="${verifyLink}" style="background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:10px;">
          Verify Email
        </a>
        <p style="font-size:12px;color:#6b7280;margin-top:15px;">
          If you didn’t request this, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Verification email sent to: ${email}`);
}

module.exports = { sendVerificationEmail };
