import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { isValidEmail } from '@/lib/auth-tokens';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!isValidEmail(email) || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminClient = createAdminClient();

    const { data, error: signUpError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false,
      user_metadata: { name: typeof name === 'string' ? name.slice(0, 120) : '' },
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
