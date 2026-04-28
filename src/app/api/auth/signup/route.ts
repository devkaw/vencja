import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
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

    const adminClient = createAdminClient();

    try {
      const { data: users } = await adminClient.auth.admin.listUsers();
      const existingUser = users?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado. Faça login ou recupere sua senha.' },
          { status: 400 }
        );
      }
    } catch (listErr) {
      console.log('List users error (ignoring):', listErr);
    }

    console.log('Creating user with email:', email);
    
    const { data, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { name },
    });

    if (signUpError) {
      console.error('SignUp error:', signUpError);
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: data.user.id,
        email: email.toLowerCase().trim(),
        plano: 'free',
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
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