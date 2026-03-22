import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendResetPasswordEmail } from '@/lib/email/mailersend';

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RATE_LIMIT_HOURS = 1;
const MAX_REQUESTS_PER_HOUR = 3;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Este email não está cadastrado. Verifique e tente novamente.' },
        { status: 404 }
      );
    }

    let userName = '';
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());
      userName = user?.user_metadata?.name || '';
    } catch (err) {
      console.log('Could not get user metadata:', err);
    }

    try {
      const oneHourAgo = new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('auth_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('type', 'reset')
        .gte('created_at', oneHourAgo)
        .is('used_at', null);

      if (count && count >= MAX_REQUESTS_PER_HOUR) {
        return NextResponse.json(
          { error: 'Muitas tentativas. Aguarde 1 hora antes de tentar novamente.' },
          { status: 429 }
        );
      }

      await supabase
        .from('auth_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('user_id', profile.id)
        .eq('type', 'reset')
        .is('used_at', null);
    } catch (tableError) {
      console.error('Auth tokens table error:', tableError);
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    try {
      const { error: insertError } = await supabase
        .from('auth_tokens')
        .insert({
          user_id: profile.id,
          email,
          token,
          type: 'reset',
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error('Error inserting token:', insertError);
        return NextResponse.json(
          { error: 'Erro ao criar token de recuperação.' },
          { status: 500 }
        );
      }
    } catch (insertError) {
      console.error('Error inserting token:', insertError);
      return NextResponse.json(
        { error: 'Erro ao criar token de recuperação.' },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const result = await sendResetPasswordEmail(email, userName, resetUrl);

    if (!result.success) {
      console.error('Error sending email:', result.error);
      return NextResponse.json(
        { error: 'Erro ao enviar email de recuperação.', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send reset error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}