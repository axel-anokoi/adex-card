import nodemailer from 'nodemailer';

interface MailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: nodemailer.Attachment[];
}

export async function sendMail({ to, subject, text, html, attachments }: MailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: process.env.MAIL_ENCRYPTION === 'ssl',
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
    throw new Error('Failed to send email');
  }
}
