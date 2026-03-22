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

    const { error: deleteNotificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (deleteNotificationsError) {
      console.error('[Delete Account] Error deleting notifications:', deleteNotificationsError);
    }

    const { error: deletePaymentsError } = await supabaseAdmin
      .from('payments')
      .delete()
      .eq('user_id', userId);

    if (deletePaymentsError) {
      console.error('[Delete Account] Error deleting payments:', deletePaymentsError);
    }

    const { error: deletePaymentRequestsError } = await supabaseAdmin
      .from('payment_requests')
      .delete()
      .eq('user_id', userId);

    if (deletePaymentRequestsError) {
      console.error('[Delete Account] Error deleting payment requests:', deletePaymentRequestsError);
    }

    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      console.error('[Delete Account] Error deleting profile:', deleteProfileError);
      return NextResponse.json({ error: 'Erro ao excluir perfil' }, { status: 500 });
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
