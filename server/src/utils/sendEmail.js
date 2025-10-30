import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.office365.com',
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn('E-mail credentials are not configured. Skipping email dispatch.');
    return;
  }

  const mailer = getTransporter();
  await mailer.sendMail({
    from: `"Portal de Cotacoes" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
}

