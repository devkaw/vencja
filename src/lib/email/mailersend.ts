import { Resend } from 'resend';
import { verificationEmailTemplate } from '@/emails/templates/verification-email';
import { resetPasswordEmailTemplate } from '@/emails/templates/reset-password-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('Resend credentials not configured');
    return { success: false, error: { message: 'Resend credentials not configured' } };
  }

  try {
    const html = verificationEmailTemplate(name, verifyUrl);

    const data = await resend.emails.send({
      from: `"VenceJa" <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject: 'Confirme seu email - VenceJa',
      html,
    });

    console.log('Resend verification email sent:', data.data?.id);
    return { success: true, data };
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
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('Resend credentials not configured');
    return { success: false, error: { message: 'Resend credentials not configured' } };
  }

  try {
    const html = resetPasswordEmailTemplate(name, resetUrl);

    const data = await resend.emails.send({
      from: `"VenceJa" <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject: 'Recuperar senha - VenceJa',
      html,
    });

    console.log('Resend reset password email sent:', data.data?.id);
    return { success: true, data };
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