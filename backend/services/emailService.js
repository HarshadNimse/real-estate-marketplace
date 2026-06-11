const nodemailer = require("nodemailer");
const env = require("../config/env");

function getTransporter() {
  if (!env.email || !env.email.host || !env.email.user) {
    return null;
  }
  return nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port || 587,
    secure: false,
    auth: { user: env.email.user, pass: env.email.pass },
  });
}

async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }
  await transporter.sendMail({
    from: env.email.from || "noreply@estatehub.com",
    to,
    subject,
    html,
  });
}

module.exports = { sendEmail };
