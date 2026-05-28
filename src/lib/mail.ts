import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

interface MailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: Mail.Attachment[];
}

export async function sendMail({ to, subject, text, html, attachments }: MailOptions) {
  const port = parseInt(process.env.MAIL_PORT || '587');
  const isSSL = process.env.MAIL_ENCRYPTION === 'ssl';

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure: isSSL,
    requireTLS: !isSSL,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const fromAddress = process.env.MAIL_FROM_ADDRESS;
  if (!fromAddress) {
    throw new Error('MAIL_FROM_ADDRESS is not defined in environment variables');
  }

  const mailOptions = {
    from: {
      name: process.env.MAIL_FROM_NAME || 'Adex Card',
      address: fromAddress,
    },
    to,
    subject,
    text,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
