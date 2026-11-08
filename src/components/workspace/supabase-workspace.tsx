'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { hasPremiumAccess } from '@/lib/subscription';
import { LogoMark } from '@/components/brand/logo';
import type { Charge, Client, Profile } from '@/types';
import type { ActionResult, ChargeWithClient, Workspace, WorkspaceActions } from './types';
import { useDerived, WorkspaceProvider } from './workspace-context';

const LIMIT_MESSAGE = 'Você chegou ao limite do plano grátis. Assine o Pro para continuar.';

function erro(error: { code?: string; message?: string } | null, fallback: string): ActionResult<never> {
  if (error?.code === 'P0001' && error.message === 'plan_limit') return { ok: false, error: LIMIT_MESSAGE, code: 'limit' };
  return { ok: false, error: fallback };
}

const PAGINA = 1000;

/** PostgREST caps each response (1000 rows by default); read everything in pages so nothing is silently dropped. */
async function todasLinhas<T>(
  consulta: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<{ data: T[]; error: unknown }> {
  const linhas: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await consulta(de, de + PAGINA - 1);
    if (error) return { data: linhas, error };
    linhas.push(...(data ?? []));
    if (!data || data.length < PAGINA) return { data: linhas, error: null };
  }
}

function stripParcela(descricao: string | null) {
  return (descricao || '').replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
}

/** Pending charges in the same installment group. Older rows are matched by description. */
export function pendentesDaSerie(charges: Charge[], charge: Charge): Charge[] {
  const raiz = charge.charge_original_id || charge.id;
  const base = stripParcela(charge.descricao);
  return charges.filter((c) => {
    if (c.status === 'pago' || c.client_id !== charge.client_id) return false;
    if (c.id === raiz || c.charge_original_id === raiz) return true;
    return Boolean(base) && c.recorrente && stripParcela(c.descricao) === base;
  });
}

export function SupabaseWorkspace({ children }: { children: ReactNode }) {
  const router = useRouter();
  const addToast = useAppStore((st) => st.addToast);
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [charges, setCharges] = useState<ChargeWithClient[]>([]);
  const [hoje, setHoje] = useState(() => new Date());

  const recarregar = useCallback(async () => {
    const { data: { user }, error: erroAuth } = await supabase.auth.getUser();
    if (!user) {
      // A missing user with an HTTP status is a real sign-out; without one it is a network failure, and the session is kept.
      if (erroAuth && !('status' in erroAuth && erroAuth.status)) {
        addToast('error', 'Sem conexão. Os dados na tela podem estar desatualizados.');
        setReady(true);
        return;
      }
      router.replace('/login');
      return;
    }
    const [profileRes, clientsRes, chargesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      todasLinhas<Client>((de, ate) => supabase.from('clients').select('*').eq('user_id', user.id).order('id').range(de, ate)),
      todasLinhas<Charge>((de, ate) => supabase.from('charges').select('*').eq('user_id', user.id).order('id').range(de, ate)),
    ]);
    // A failed read keeps what is on screen; replacing it would show zero totals and an empty account.
    if (profileRes.error || clientsRes.error || chargesRes.error) {
      addToast('error', 'Não foi possível atualizar agora. Mostrando os últimos dados carregados.');
      setReady(true);
      return;
    }
    setUserId(user.id);
    setProfile(profileRes.data);
    setUserName(user.user_metadata?.name || user.user_metadata?.full_name || '');
    setEmail(user.email || profileRes.data?.email || '');
    setClients(clientsRes.data);
    setCharges(chargesRes.data);
    setHoje(new Date());
    setReady(true);
  }, [addToast, router, supabase]);

  useEffect(() => {
    // State only changes after the awaited requests, so this does not cascade renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recarregar();
  }, [recarregar]);

  // Overdue status depends on today's date, and another device may have changed the data.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') recarregar();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [recarregar]);

  const derived = useDerived(clients, charges, hoje);

  const actions = useMemo<WorkspaceActions>(
    () => ({
      recarregar,

      async registrarPagamento({ chargeId, valor, data }) {
        const res = await fetch(`/api/charges/${chargeId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor, data }),
        }).catch(() => null);
        if (!res) return { ok: false, error: 'Sem conexão. Tente de novo.' };
        const body = await res.json().catch(() => ({}));
        if (res.status === 409) {
          await recarregar();
          return { ok: false, code: 'already_paid', error: 'Esta cobrança já estava paga.' };
        }
        if (!res.ok) return { ok: false, code: 'invalid', error: 'Não foi possível registrar o pagamento.' };
        setCharges((prev) => [...(body.restante ? [body.restante] : []), ...prev.map((c) => (c.id === chargeId ? body.charge : c))]);
        return { ok: true, restante: Boolean(body.restante) };
      },

      async criarCobrancas(drafts) {
        const rows = drafts.map((d) => ({ ...d, user_id: userId, status: 'pendente' as const }));
        const [primeira, ...demais] = rows;
        const { data: raiz, error } = await supabase.from('charges').insert(primeira).select('*').single();
        if (error || !raiz) return erro(error, 'Não foi possível criar a cobrança. Tente de novo.');
        let resto: Charge[] = [];
        if (demais.length > 0) {
          const { data, error: restoError } = await supabase
            .from('charges')
            .insert(demais.map((c) => ({ ...c, charge_original_id: raiz.id })))
            .select('*');
          if (restoError || !data) {
            await supabase.from('charges').delete().eq('id', raiz.id);
            return erro(restoError, 'Não foi possível criar as parcelas. Nada foi salvo.');
          }
          resto = data;
        }
        setCharges((prev) => [raiz, ...resto, ...prev]);
        return { ok: true };
      },

      async atualizarCobranca(id, patch) {
        const { data, error } = await supabase.from('charges').update(patch).eq('id', id).select('*').single();
        if (error || !data) return erro(error, 'Não foi possível salvar as alterações.');
        setCharges((prev) => prev.map((c) => (c.id === id ? data : c)));
        return { ok: true };
      },

      async excluirCobranca(id) {
        const { error } = await supabase.from('charges').delete().eq('id', id);
        if (error) return erro(error, 'Não foi possível excluir a cobrança.');
        setCharges((prev) => prev.filter((c) => c.id !== id));
        return { ok: true };
      },

      async excluirSerie(id) {
        const alvo = charges.find((c) => c.id === id);
        if (!alvo) return { ok: false, error: 'Cobrança não encontrada.' };
        const ids = pendentesDaSerie(charges, alvo).map((c) => c.id);
        if (ids.length > 0) {
          const { error } = await supabase.from('charges').delete().in('id', ids);
          if (error) return erro(error, 'Não foi possível excluir as parcelas.');
          setCharges((prev) => prev.filter((c) => !ids.includes(c.id)));
        }
        return { ok: true, removidas: ids.length };
      },

      async salvarCliente({ id, ...dados }) {
        if (id) {
          const { data, error } = await supabase.from('clients').update(dados).eq('id', id).select('*').single();
          if (error || !data) return erro(error, 'Não foi possível salvar o cliente.');
          setClients((prev) => prev.map((c) => (c.id === id ? data : c)));
          return { ok: true, id };
        }
        const { data, error } = await supabase.from('clients').insert({ ...dados, user_id: userId }).select('*').single();
        if (error || !data) return erro(error, 'Não foi possível cadastrar o cliente.');
        setClients((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
        return { ok: true, id: data.id };
      },

      async excluirCliente(id) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) return erro(error, 'Não foi possível excluir o cliente.');
        setClients((prev) => prev.filter((c) => c.id !== id));
        setCharges((prev) => prev.filter((c) => c.client_id !== id));
        return { ok: true };
      },
    }),
    [charges, recarregar, supabase, userId]
  );

  const value = useMemo<Workspace>(
    () => ({ mode: 'live', profile, isPro: hasPremiumAccess(profile), userName, email, hoje, clients, ...derived, actions }),
    [actions, clients, derived, email, hoje, profile, userName]
  );

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas" role="status" aria-label="Carregando sua conta">
        <LogoMark size={44} className="animate-pulse-soft" />
      </div>
    );
  }

  return <WorkspaceProvider value={value}>{children}</WorkspaceProvider>;
}
