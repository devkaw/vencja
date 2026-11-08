import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { hashToken } from '@/lib/auth-tokens';
import { erroDeSenha } from '@/lib/domain/senha';
import { dentroDoLimite, ipDaRequisicao } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    if (!(await dentroDoLimite(`verify:${ipDaRequisicao(request)}`, 20, 3600))) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um pouco antes de tentar de novo.' }, { status: 429 });
    }

    const { token, newPassword } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: tokenData } = await supabase
      .from('auth_tokens')
      .select('id, user_id, type, used_at, expires_at')
      .eq('token', hashToken(token))
      .maybeSingle();

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 404 }
      );
    }

    if (tokenData.used_at) {
      return NextResponse.json(
        { error: 'Este link já foi utilizado' },
        { status: 400 }
      );
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Este link expirou' },
        { status: 400 }
      );
    }

    // Validate input before consuming the token, so a bad request doesn't burn the link.
    const erroSenha = tokenData.type === 'reset' ? erroDeSenha(newPassword) : null;
    if (erroSenha) {
      return NextResponse.json({ error: erroSenha }, { status: 400 });
    }

    // Conditional update makes consumption single-use even under concurrent requests.
    const { data: consumed } = await supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)
      .is('used_at', null)
      .select('id');

    if (!consumed || consumed.length === 0) {
      return NextResponse.json(
        { error: 'Este link já foi utilizado' },
        { status: 400 }
      );
    }

    if (tokenData.type === 'verification') {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        tokenData.user_id,
        { email_confirm: true }
      );

      if (updateError) {
        console.error('Error confirming email:', updateError.message);
        return NextResponse.json(
          { error: 'Erro ao confirmar email' },
          { status: 500 }
        );
      }
    }

    if (tokenData.type === 'reset') {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        tokenData.user_id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Error resetting password:', updateError.message);
        return NextResponse.json(
          { error: 'Erro ao redefinir senha' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      type: tokenData.type,
    });
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
