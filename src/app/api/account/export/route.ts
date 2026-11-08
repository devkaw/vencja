import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dentroDoLimite } from '@/lib/rate-limit';

const PAGINA = 1000;

/** LGPD art. 18, II and V: the person can get a copy of their data in a readable format. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  if (!(await dentroDoLimite(`export:${user.id}`, 5, 3600))) {
    return NextResponse.json({ error: 'Muitas exportações seguidas. Tente de novo em 1 hora.' }, { status: 429 });
  }

  // Reads through the user's session, so RLS decides what is theirs.
  async function todas(tabela: string) {
    const linhas: unknown[] = [];
    for (let de = 0; ; de += PAGINA) {
      const { data, error } = await supabase.from(tabela).select('*').eq('user_id', user!.id).order('id').range(de, de + PAGINA - 1);
      if (error) throw error;
      linhas.push(...(data ?? []));
      if (!data || data.length < PAGINA) return linhas;
    }
  }

  try {
    const [{ data: perfil }, clientes, cobrancas, pagamentos] = await Promise.all([
      supabase.from('profiles').select('email, plano, created_at, subscription_status, subscription_cycle, subscription_started_at, subscription_ends_at').eq('id', user.id).single(),
      todas('clients'),
      todas('charges'),
      todas('payments'),
    ]);
    const corpo = {
      gerado_em: new Date().toISOString(),
      conta: { ...perfil, nome: user.user_metadata?.name ?? null, termos_versao: user.user_metadata?.termos_versao ?? null, termos_aceitos_em: user.user_metadata?.termos_aceitos_em ?? null },
      clientes,
      cobrancas,
      pagamentos,
    };
    return new NextResponse(JSON.stringify(corpo, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="meus-dados-venceja.json"', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Export] Error:', error);
    return NextResponse.json({ error: 'Não foi possível gerar a exportação.' }, { status: 500 });
  }
}
