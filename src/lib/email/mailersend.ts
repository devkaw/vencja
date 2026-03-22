import nodemailer from 'nodemailer';
import { verificationEmailTemplate } from '@/emails/templates/verification-email';
import { resetPasswordEmailTemplate } from '@/emails/templates/reset-password-email';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Gmail credentials not configured');
    return { success: false, error: { message: 'Gmail credentials not configured' } };
  }

  try {
    const html = verificationEmailTemplate(name, verifyUrl);

    const info = await transporter.sendMail({
      from: `"VenceJa" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Confirme seu email - VenceJa',
      html,
    });

    console.log('Gmail verification email sent:', info.messageId);
    return { success: true, data: info };
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error('Failed to send verification email:', {
      message: err?.message,
      code: err?.code,
    });
    return {
      success: false,
      error: {
        message: err?.message || 'Unknown error',
        code: err?.code,
      },
    };
  }
}

export async function sendResetPasswordEmail(to: string, name: string, resetUrl: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Gmail credentials not configured');
    return { success: false, error: { message: 'Gmail credentials not configured' } };
  }

  try {
    const html = resetPasswordEmailTemplate(name, resetUrl);

    const info = await transporter.sendMail({
      from: `"VenceJa" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Recuperar senha - VenceJa',
      html,
    });

    console.log('Gmail reset password email sent:', info.messageId);
    return { success: true, data: info };
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error('Failed to send reset password email:', {
      message: err?.message,
      code: err?.code,
    });
    return {
      success: false,
      error: {
        message: err?.message || 'Unknown error',
        code: err?.code,
      },
    };
  }
}

export { transporter };
