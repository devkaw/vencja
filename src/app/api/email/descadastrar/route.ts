import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { segredoDescadastro, verificarDescadastro } from '@/lib/email/unsubscribe-token';

// GET only opens the confirmation page: e-mail scanners follow links and must not unsubscribe anyone.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  return NextResponse.redirect(new URL(`/descadastrar?token=${encodeURIComponent(token)}`, request.url));
}

// POST is both the page's button and the mail app's one-click request (RFC 8058).
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const segredo = segredoDescadastro();
  const userId = segredo ? verificarDescadastro(token, segredo) : null;
  if (!userId) return NextResponse.json({ error: 'invalid_token' }, { status: 400 });

  const { error } = await createAdminClient().from('notification_settings').upsert({ user_id: userId, daily_email: false }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}
