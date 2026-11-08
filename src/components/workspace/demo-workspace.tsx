'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { Charge, Client } from '@/types';
import { demoCriarCobrancas, demoExcluirSerie, demoPagar, type DemoState } from './demo-store';
import type { Workspace, WorkspaceActions } from './types';
import { useDerived, WorkspaceProvider } from './workspace-context';

const DEMO_PROFILE = { id: 'demo', email: 'demo@venceja.com.br', plano: 'pro', is_admin: false, created_at: new Date(0).toISOString() } as const;

interface DemoWorkspaceProps {
  initial: () => { clients: Client[]; charges: Charge[] };
  /** Changes when the visitor resets the demo. */
  resetKey: number;
  /** Lets the landing track the guided goals. */
  onEvent?: (event: 'pagamento' | 'cobranca') => void;
  children: ReactNode;
}

export function DemoWorkspace({ initial, resetKey, onEvent, children }: DemoWorkspaceProps) {
  const [state, setState] = useState<DemoState & { resetKey: number }>(() => ({ ...initial(), resetKey }));
  const [hoje] = useState(() => new Date());

  // Resetting during render keeps the demo from showing one stale frame.
  if (state.resetKey !== resetKey) setState({ ...initial(), resetKey });

  const derived = useDerived(state.clients, state.charges, hoje);

  const actions = useMemo<WorkspaceActions>(() => {
    const atualizar = (fn: (s: DemoState) => DemoState) => setState((s) => ({ ...fn(s), resetKey: s.resetKey }));
    return {
      recarregar: async () => {},
      async registrarPagamento(input) {
        const r = demoPagar(state, input, hoje);
        if (!r.ok) return { ok: false, code: r.code, error: r.code === 'already_paid' ? 'Esta cobrança já estava paga.' : 'Valor inválido.' };
        atualizar(() => r.state);
        onEvent?.('pagamento');
        return { ok: true, restante: r.restante };
      },
      async criarCobrancas(drafts) {
        atualizar((s) => demoCriarCobrancas(s, drafts, hoje));
        onEvent?.('cobranca');
        return { ok: true };
      },
      async atualizarCobranca(id, patch) {
        atualizar((s) => ({ ...s, charges: s.charges.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
        return { ok: true };
      },
      async excluirCobranca(id) {
        atualizar((s) => ({ ...s, charges: s.charges.filter((c) => c.id !== id) }));
        return { ok: true };
      },
      async excluirSerie(id) {
        const antes = state.charges.length;
        const proximo = demoExcluirSerie(state, id);
        atualizar(() => proximo);
        return { ok: true, removidas: antes - proximo.charges.length };
      },
      async salvarCliente({ id, ...dados }) {
        const novoId = id ?? `cl-${Date.now()}`;
        atualizar((s) => ({
          ...s,
          clients: id
            ? s.clients.map((c) => (c.id === id ? { ...c, ...dados } : c))
            : [...s.clients, { ...dados, id: novoId, user_id: 'demo', score: 70, total_pago: 0, total_atrasado: 0, created_at: new Date().toISOString() }],
        }));
        return { ok: true, id: novoId };
      },
      async excluirCliente(id) {
        atualizar((s) => ({ clients: s.clients.filter((c) => c.id !== id), charges: s.charges.filter((c) => c.client_id !== id) }));
        return { ok: true };
      },
    };
  }, [hoje, onEvent, state]);

  const value = useMemo<Workspace>(
    () => ({ mode: 'demo', profile: DEMO_PROFILE, isPro: true, userName: 'Seu Negócio', email: DEMO_PROFILE.email, hoje, clients: state.clients, ...derived, actions }),
    [actions, derived, hoje, state.clients]
  );

  return <WorkspaceProvider value={value}>{children}</WorkspaceProvider>;
}
