const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('Warning: RESEND_API_KEY not configured. Email sending will fail.');
}

const resend = new Resend(resendApiKey || 'placeholder');

module.exports = resend;
