// Sends the forgot-password PIN by email (Gmail SMTP by default — see
// backend/.env.example). If SMTP_* isn't configured, the PIN is logged to
// the server console instead, so the flow still works in local dev.
const nodemailer = require('nodemailer');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) !== 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporter;
}

async function sendPinEmail(toEmail, pin) {
  const t = getTransporter();
  if (!t) {
    console.log(`[DEV EMAIL] RESCOM password reset PIN for ${toEmail}: ${pin}`);
    return { delivered: false, dev: true };
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: 'RESCOM password reset PIN',
    text: `Your RESCOM password reset PIN is ${pin}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
    html: `<p>Your RESCOM password reset PIN is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${pin}</p><p>It expires in 10 minutes. If you didn't request this, ignore this email.</p>`
  });
  return { delivered: true, dev: false };
}

module.exports = { sendPinEmail };
