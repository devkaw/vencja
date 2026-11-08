import { NextRequest, NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';
import { createAdminClient } from '@/lib/supabase/client';
import { diaLocal } from '@/lib/domain/charges';
import { hojeEmSaoPaulo, montarDigest } from '@/lib/domain/digest';
import { sendDailyDigestEmail } from '@/lib/email/payment-notifications';
import { assinarDescadastro, segredoDescadastro } from '@/lib/email/unsubscribe-token';
import type { Charge } from '@/types';

const PAGINA = 1000;
const LOTE = 500;

/** Reads every row of a query in pages, so the PostgREST row cap cannot drop users silently. */
async function todas<T>(consulta: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<{ data: T[]; error: unknown }> {
  const linhas: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await consulta(de, de + PAGINA - 1);
    if (error) return { data: linhas, error };
    linhas.push(...(data ?? []));
    if (!data || data.length < PAGINA) return { data: linhas, error: null };
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const dia = hojeEmSaoPaulo();
  const hoje = diaLocal(dia);
  const ontem = format(subDays(hoje, 1), 'yyyy-MM-dd');
  const admin = createAdminClient();

  const alvos = await todas<{ user_id: string }>((de, ate) =>
    admin.from('charges').select('user_id').neq('status', 'pago').gte('data_vencimento', ontem).lte('data_vencimento', dia).order('id').range(de, ate)
  );
  if (alvos.error) return NextResponse.json({ error: 'charges_unavailable' }, { status: 500 });

  const usuarios = [...new Set(alvos.data.map((c) => c.user_id))];
  const resultado = { sent: 0, failed: 0, skipped: 0 };

  for (let i = 0; i < usuarios.length; i += LOTE) {
    const lote = usuarios.slice(i, i + LOTE);

    // Preferences are read only for this batch, so an opted-out user is never missed past a row cap.
    const { data: prefs, error: prefsError } = await admin.from('notification_settings').select('user_id, daily_email, last_sent_on').in('user_id', lote);
    if (prefsError) {
      // Without a readable preference the safe choice is to send nothing for this batch.
      return NextResponse.json({ sent: resultado.sent, failed: resultado.failed, error: 'notification_settings_unavailable' }, { status: 500 });
    }
    const prefPorUsuario = new Map((prefs ?? []).map((p) => [p.user_id as string, p]));

    const { data: perfis } = await admin.from('profiles').select('id, email').in('id', lote);
    const emailPorUsuario = new Map((perfis ?? []).map((p) => [p.id as string, p.email as string]));

    const { data: cobrancas } = await admin.from('charges').select('*, client:clients(nome)').in('user_id', lote).neq('status', 'pago');
    const porUsuario = new Map<string, Charge[]>();
    for (const c of (cobrancas ?? []) as (Charge & { user_id: string })[]) {
      const lista = porUsuario.get(c.user_id);
      if (lista) lista.push(c);
      else porUsuario.set(c.user_id, [c]);
    }

    for (const userId of lote) {
      const pref = prefPorUsuario.get(userId);
      if (pref?.daily_email === false || pref?.last_sent_on === dia) {
        resultado.skipped += 1;
        continue;
      }
      const digest = montarDigest(porUsuario.get(userId) ?? [], hoje);
      const email = emailPorUsuario.get(userId);
      if (!digest || !email) {
        resultado.skipped += 1;
        continue;
      }

      if (process.env.DIGEST_DRY_RUN === '1') {
        resultado.sent += 1;
        continue;
      }

      const segredo = segredoDescadastro();
      const app = process.env.NEXT_PUBLIC_APP_URL || 'https://www.venceja.com.br';
      const link = segredo ? `${app}/api/email/descadastrar?token=${assinarDescadastro(userId, segredo)}` : null;
      const envio = await sendDailyDigestEmail(email, digest, link);
      if (!envio.success) {
        resultado.failed += 1;
        continue;
      }

      // Only the fields this job owns are written, so a switch flipped mid-run is kept.
      await admin.from('notification_settings').upsert({ user_id: userId, last_sent_on: dia }, { onConflict: 'user_id' });
      resultado.sent += 1;
    }
  }

  return NextResponse.json(resultado);
}
