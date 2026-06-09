const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('./logger');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!config.email.host || !config.email.user) {
    logger.warn('Email not configured - emails will be logged only');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false,
    auth: { user: config.email.user, pass: config.email.pass },
  });
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();
  const mailOptions = { from: config.email.from, to, subject, html, text };

  if (!transport) {
    logger.info(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return { success: true, mock: true };
  }

  const result = await transport.sendMail(mailOptions);
  return { success: true, messageId: result.messageId };
};

module.exports = { sendEmail };
