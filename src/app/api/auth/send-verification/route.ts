import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email/mailersend';
import { issueAuthToken } from '@/lib/issue-auth-token';
import { isValidEmail } from '@/lib/auth-tokens';
import { dentroDoLimite, ipDaRequisicao } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    if (!(await dentroDoLimite(`verificacao:${ipDaRequisicao(request)}`, 10, 3600))) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde 1 hora antes de tentar novamente.' }, { status: 429 });
    }

    const { email } = await request.json();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Informe um email válido' },
        { status: 400 }
      );
    }

    const result = await issueAuthToken(email, 'verification');

    // Same response whether or not the email exists, to avoid account enumeration.
    if (result.status === 'no_user') {
      return NextResponse.json({ success: true });
    }

    if (result.status === 'rate_limited') {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde 1 hora antes de tentar novamente.' },
        { status: 429 }
      );
    }

    if (result.status === 'error') {
      return NextResponse.json(
        { error: 'Erro ao criar token de verificação.' },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.venceja.com.br';
    const verifyUrl = `${appUrl}/auth/callback?token=${result.token}`;

    const sent = await sendVerificationEmail(email.toLowerCase().trim(), result.userName, verifyUrl);

    if (!sent.success) {
      console.error('Error sending verification email:', sent.error?.message);
      return NextResponse.json(
        { error: 'Erro ao enviar email de verificação.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
