const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports (like 587)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Define email options
    const mailOptions = {
      from: process.env.FROM_EMAIL, // e.g., "MediLink <no-reply@medlink.com>"
      to: options.to,
      subject: options.subject,
      html: options.html, // Use HTML for beautiful templates
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw new Error("Failed to send email");
  }
};

module.exports = sendEmail;
