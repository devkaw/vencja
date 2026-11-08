import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { isValidEmail } from '@/lib/auth-tokens';
import { erroDeSenha } from '@/lib/domain/senha';
import { VERSAO_TERMOS } from '@/lib/legal';
import { dentroDoLimite, ipDaRequisicao } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    if (!(await dentroDoLimite(`signup:${ipDaRequisicao(request)}`, 5, 3600))) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um pouco antes de tentar de novo.' }, { status: 429 });
    }

    const { email, password, name, aceite } = await request.json();

    if (!isValidEmail(email) || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const erroSenha = erroDeSenha(password);
    if (erroSenha) {
      return NextResponse.json({ error: erroSenha }, { status: 400 });
    }

    if (aceite !== true) {
      return NextResponse.json({ error: 'Para criar a conta, aceite os Termos e confirme que tem 18 anos ou mais.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminClient = createAdminClient();

    const { data, error: signUpError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false,
      user_metadata: {
        name: typeof name === 'string' ? name.slice(0, 120) : '',
        // Proof of consent: what was accepted and when (LGPD art. 8, § 2º).
        termos_versao: VERSAO_TERMOS,
        termos_aceitos_em: new Date().toISOString(),
        maior_de_18: true,
      },
    });

    if (signUpError) {
      const alreadyExists = signUpError.status === 422 || /already/i.test(signUpError.message);
      if (!alreadyExists) {
        console.error('SignUp error:', signUpError.message);
      }
      return NextResponse.json(
        {
          error: alreadyExists
            ? 'Este email já está cadastrado. Faça login ou recupere sua senha.'
            : 'Não foi possível criar a conta',
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // The on_auth_user_created trigger normally creates the profile; this covers it if not.
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert(
        { id: data.user.id, email: normalizedEmail, plano: 'free' },
        { onConflict: 'id', ignoreDuplicates: true }
      );

    if (profileError) {
      console.error('Profile creation error:', profileError.message);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
