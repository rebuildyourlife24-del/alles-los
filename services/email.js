const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

async function sendMail({ to, subject, html }) {
  if (!transporter) {
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }
  await transporter.sendMail({
    from: `REBUILD <${env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };
