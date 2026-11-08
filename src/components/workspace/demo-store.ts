import { planejarPagamento } from '@/lib/domain/charges';
import type { Charge, Client } from '@/types';
import type { ActionCode, ChargeDraft, PaymentInput } from './types';

export interface DemoState {
  clients: Client[];
  charges: Charge[];
}

let seq = 0;
const novoId = (prefixo: string) => `${prefixo}-${Date.now()}-${++seq}`;

const novaCobranca = (d: Partial<Charge> & Pick<Charge, 'client_id' | 'valor' | 'data_vencimento'>): Charge => ({
  id: novoId('c'),
  user_id: 'demo',
  valor_pago: 0,
  status: 'pendente',
  data_pagamento: null,
  dias_atraso: 0,
  descricao: null,
  recorrente: false,
  periodicidade: null,
  charge_original_id: null,
  created_at: new Date().toISOString(),
  ...d,
});

export function demoPagar(state: DemoState, input: PaymentInput, _hoje: Date): { ok: true; state: DemoState; restante: boolean } | { ok: false; code: ActionCode } {
  const alvo = state.charges.find((c) => c.id === input.chargeId);
  if (!alvo) return { ok: false, code: 'invalid' };
  const plano = planejarPagamento(alvo, input.valor, input.data);
  if (!plano.ok) return { ok: false, code: plano.code === 'already_paid' ? 'already_paid' : 'invalid' };
  const charges = state.charges.map((c) => (c.id === alvo.id ? { ...c, ...plano.update } : c));
  if (plano.restante) charges.unshift(novaCobranca(plano.restante));
  return { ok: true, state: { ...state, charges }, restante: Boolean(plano.restante) };
}

export function demoCriarCobrancas(state: DemoState, drafts: ChargeDraft[], _hoje: Date): DemoState {
  const criadas = drafts.map((d) => novaCobranca(d));
  const raiz = criadas[0]?.id ?? null;
  const ligadas = criadas.map((c, i) => (i === 0 ? c : { ...c, charge_original_id: raiz }));
  return { ...state, charges: [...ligadas, ...state.charges] };
}

export function demoExcluirSerie(state: DemoState, id: string): DemoState {
  const alvo = state.charges.find((c) => c.id === id);
  if (!alvo) return state;
  const raiz = alvo.charge_original_id || alvo.id;
  return { ...state, charges: state.charges.filter((c) => c.status === 'pago' || (c.id !== raiz && c.charge_original_id !== raiz)) };
}
