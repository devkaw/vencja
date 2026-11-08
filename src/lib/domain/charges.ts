import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import type { Charge } from '@/types';

export type ChargeLike = Pick<Charge, 'valor' | 'valor_pago' | 'status' | 'data_vencimento' | 'data_pagamento'>;
export type ChargeState = 'pago' | 'atrasado' | 'hoje' | 'a_vencer';

/** Due and payment dates are calendar days: never interpret them in UTC. */
export function diaLocal(value: string): Date {
  return parseISO(value.split('T')[0]);
}

export const centavos = (n: number) => Math.round(n * 100) / 100;

export function diasAteVencimento(c: Pick<ChargeLike, 'data_vencimento'>, hoje: Date): number {
  return differenceInCalendarDays(diaLocal(c.data_vencimento), startOfDay(hoje));
}

export function chargeState(c: ChargeLike, hoje: Date): ChargeState {
  if (c.status === 'pago') return 'pago';
  const dias = diasAteVencimento(c, hoje);
  if (dias < 0) return 'atrasado';
  return dias === 0 ? 'hoje' : 'a_vencer';
}

export function saldoAberto(c: ChargeLike): number {
  if (c.status === 'pago') return 0;
  return Math.max(0, centavos(Number(c.valor) - Number(c.valor_pago || 0)));
}

export function valorRecebido(c: ChargeLike): number {
  return c.status === 'pago' ? Number(c.valor) : Number(c.valor_pago || 0);
}

export function diasDeAtraso(c: ChargeLike, hoje: Date): number {
  if (c.status === 'pago') {
    if (!c.data_pagamento) return 0;
    return Math.max(0, differenceInCalendarDays(diaLocal(c.data_pagamento), diaLocal(c.data_vencimento)));
  }
  return Math.max(0, -diasAteVencimento(c, hoje));
}

export type PaymentError = 'already_paid' | 'invalid_value' | 'invalid_date';

export type PaymentPlan =
  | {
      ok: true;
      valorRecebido: number;
      update: Pick<Charge, 'valor_pago' | 'status' | 'data_pagamento' | 'dias_atraso'> & Partial<Pick<Charge, 'valor' | 'descricao'>>;
      restante: Pick<Charge, 'user_id' | 'client_id' | 'valor' | 'valor_pago' | 'data_vencimento' | 'status' | 'descricao' | 'recorrente' | 'periodicidade' | 'charge_original_id'> | null;
    }
  | { ok: false; code: PaymentError };

/** Single rule for full and partial payments, used by the API route and by the demo. */
export function planejarPagamento(charge: Charge, valor: number, data: string): PaymentPlan {
  if (charge.status === 'pago') return { ok: false, code: 'already_paid' };
  if (!dataValida(data)) return { ok: false, code: 'invalid_date' };

  const pendente = saldoAberto(charge);
  const recebido = centavos(valor);
  if (!Number.isFinite(recebido) || recebido <= 0 || recebido > pendente) return { ok: false, code: 'invalid_value' };

  const jaPago = Number(charge.valor_pago || 0);
  const dias_atraso = Math.max(0, differenceInCalendarDays(diaLocal(data), diaLocal(charge.data_vencimento)));
  const nome = charge.descricao || 'Cobrança';

  if (recebido === pendente) {
    return {
      ok: true,
      valorRecebido: recebido,
      restante: null,
      update: { valor_pago: Number(charge.valor), status: 'pago', data_pagamento: data, dias_atraso },
    };
  }

  const total = centavos(jaPago + recebido);
  return {
    ok: true,
    valorRecebido: recebido,
    update: { valor: total, valor_pago: total, status: 'pago', data_pagamento: data, dias_atraso, descricao: `${nome} (parcial)` },
    restante: {
      user_id: charge.user_id,
      client_id: charge.client_id,
      valor: centavos(pendente - recebido),
      valor_pago: 0,
      data_vencimento: charge.data_vencimento,
      status: 'pendente',
      descricao: `${nome} (restante)`,
      recorrente: charge.recorrente,
      periodicidade: charge.recorrente ? charge.periodicidade : null,
      charge_original_id: charge.charge_original_id || charge.id,
    },
  };
}

/** Accepts only a real calendar day in yyyy-MM-dd, so bad input never reaches the database. */
export function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [y, m, d] = valor.split('-').map(Number);
  const data = new Date(y, m - 1, d);
  return data.getFullYear() === y && data.getMonth() === m - 1 && data.getDate() === d;
}
