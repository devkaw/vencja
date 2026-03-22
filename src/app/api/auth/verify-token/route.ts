import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token é obrigatório' },
        { status: 400 }
      );
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
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

    await supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (tokenData.type === 'verification') {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        tokenData.user_id,
        { email_confirm: true }
      );

      if (updateError) {
        console.error('Error confirming email:', updateError);
        return NextResponse.json(
          { error: 'Erro ao confirmar email' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      type: tokenData.type,
      userId: tokenData.user_id,
    });
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
