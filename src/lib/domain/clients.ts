import { format } from 'date-fns';
import type { Charge, Client } from '@/types';
import { chargeState, diaLocal, diasDeAtraso, saldoAberto, valorRecebido } from './charges';
import { calcularScore, type ScoreResult } from './score';

export interface ClientSummary {
  client: Client;
  charges: Charge[];
  score: ScoreResult;
  pago: number;
  emAtraso: number;
  aReceber: number;
  qtdAtrasadas: number;
  /** Share of paid charges settled on time (0 to 1), or null with no paid charge. */
  pontualidade: number | null;
  /** Average days paid after the due date, or null with no paid charge. */
  prazoMedioDias: number | null;
  ultimoPagamento: string | null;
}

export function resumirCliente(client: Client, charges: Charge[], hoje: Date): ClientSummary {
  const pagas = charges.filter((c) => c.status === 'pago');
  const atrasadas = charges.filter((c) => chargeState(c, hoje) === 'atrasado');
  const noPrazo = charges.filter((c) => ['hoje', 'a_vencer'].includes(chargeState(c, hoje)));
  const dias = pagas.map((c) => diasDeAtraso(c, hoje));
  const datasPagamento = pagas.map((c) => c.data_pagamento).filter((d): d is string => Boolean(d)).sort();

  return {
    client,
    charges,
    score: calcularScore(charges, hoje),
    pago: pagas.reduce((s, c) => s + valorRecebido(c), 0),
    emAtraso: atrasadas.reduce((s, c) => s + saldoAberto(c), 0),
    aReceber: noPrazo.reduce((s, c) => s + saldoAberto(c), 0),
    qtdAtrasadas: atrasadas.length,
    pontualidade: pagas.length ? dias.filter((d) => d === 0).length / pagas.length : null,
    prazoMedioDias: pagas.length ? Math.round(dias.reduce((s, d) => s + d, 0) / pagas.length) : null,
    ultimoPagamento: datasPagamento.at(-1) ?? null,
  };
}

export function resumirClientes(clients: Client[], charges: Charge[], hoje: Date): ClientSummary[] {
  const porCliente = new Map<string, Charge[]>();
  for (const c of charges) {
    const lista = porCliente.get(c.client_id);
    if (lista) lista.push(c);
    else porCliente.set(c.client_id, [c]);
  }
  return clients.map((client) => resumirCliente(client, porCliente.get(client.id) || [], hoje));
}

export interface TimelineEvent {
  id: string;
  kind: 'pagamento' | 'lancamento' | 'vencimento';
  /** Calendar day, yyyy-MM-dd. */
  date: string;
  chargeId: string;
  titulo: string;
  valor: number;
}

export function linhaDoTempo(charges: Charge[], hoje: Date): TimelineEvent[] {
  const eventos: TimelineEvent[] = [];
  for (const c of charges) {
    const titulo = c.descricao || 'Cobrança';
    eventos.push({ id: `${c.id}-l`, kind: 'lancamento', date: format(new Date(c.created_at), 'yyyy-MM-dd'), chargeId: c.id, titulo, valor: Number(c.valor) });
    if (c.status === 'pago' && c.data_pagamento) {
      eventos.push({ id: `${c.id}-p`, kind: 'pagamento', date: c.data_pagamento.split('T')[0], chargeId: c.id, titulo, valor: valorRecebido(c) });
    }
    if (chargeState(c, hoje) === 'atrasado') {
      eventos.push({ id: `${c.id}-v`, kind: 'vencimento', date: c.data_vencimento.split('T')[0], chargeId: c.id, titulo, valor: saldoAberto(c) });
    }
  }
  return eventos.sort((a, b) => diaLocal(b.date).getTime() - diaLocal(a.date).getTime());
}
