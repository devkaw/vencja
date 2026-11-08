import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/client';
import { planejarPagamento } from '@/lib/domain/charges';
import type { Charge } from '@/types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { valor?: unknown; data?: unknown } | null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Read through the user's session so RLS proves ownership before the service role writes.
  const { data: charge } = await supabase.from('charges').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!charge) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const plano = planejarPagamento(charge as Charge, Number(body?.valor), String(body?.data ?? ''));
  if (!plano.ok) return NextResponse.json({ error: plano.code }, { status: plano.code === 'already_paid' ? 409 : 422 });

  // The remainder may exceed the free plan limit: it is the same debt, not a new charge.
  const admin = createAdminClient();
  let restante: Charge | null = null;

  if (plano.restante) {
    const { data, error } = await admin.from('charges').insert(plano.restante).select('*').single();
    if (error || !data) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    restante = data as Charge;
  }

  // The status guard turns a second click into a no-op instead of a duplicate payment.
  const { data: atualizada, error } = await admin.from('charges').update(plano.update).eq('id', id).neq('status', 'pago').select('*').maybeSingle();

  if (error || !atualizada) {
    if (restante) await admin.from('charges').delete().eq('id', restante.id);
    return NextResponse.json({ error: error ? 'save_failed' : 'already_paid' }, { status: error ? 500 : 409 });
  }

  await admin.from('payments').insert({ user_id: user.id, charge_id: id, valor: plano.valorRecebido, data_pagamento: plano.update.data_pagamento });

  return NextResponse.json({ charge: atualizada, restante });
}
