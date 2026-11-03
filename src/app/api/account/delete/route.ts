import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = user.id;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('plano, subscription_status, subscription_ends_at')
      .eq('id', userId)
      .maybeSingle();

    // Deleting the account doesn't stop billing at Cakto, so require the subscription to be canceled first.
    const hasActiveSubscription =
      profile?.plano === 'pro' &&
      profile.subscription_status !== 'canceled' &&
      (!profile.subscription_ends_at || new Date(profile.subscription_ends_at) > new Date());

    if (hasActiveSubscription) {
      return NextResponse.json(
        { error: 'Cancele sua assinatura Pro em Configurações > Plano antes de excluir a conta.' },
        { status: 409 }
      );
    }

    console.log('[Delete Account] Deleting user:', userId);

    const { error: deleteChargesError } = await supabaseAdmin
      .from('charges')
      .delete()
      .eq('user_id', userId);

    if (deleteChargesError) {
      console.error('[Delete Account] Error deleting charges:', deleteChargesError);
    }

    const { error: deleteClientsError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('user_id', userId);

    if (deleteClientsError) {
      console.error('[Delete Account] Error deleting clients:', deleteClientsError);
    }

    const { error: deletePaymentsError } = await supabaseAdmin
      .from('payments')
      .delete()
      .eq('user_id', userId);

    if (deletePaymentsError) {
      console.error('[Delete Account] Error deleting payments:', deletePaymentsError);
    }

    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      console.error('[Delete Account] Error deleting profile:', deleteProfileError);
      return NextResponse.json({ error: 'Erro ao excluir perfil' }, { status: 500 });
    }

    const { error: deleteAuthTokensError } = await supabaseAdmin
      .from('auth_tokens')
      .delete()
      .eq('user_id', userId);

    if (deleteAuthTokensError) {
      console.error('[Delete Account] Error deleting auth_tokens:', deleteAuthTokensError);
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('[Delete Account] Error deleting auth:', deleteAuthError);
      return NextResponse.json({ error: 'Erro ao excluir conta' }, { status: 500 });
    }

    console.log('[Delete Account] User deleted successfully:', userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Delete Account] Catch error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
