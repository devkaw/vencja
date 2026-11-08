import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { chargeState, diaLocal, diasDeAtraso, saldoAberto, type ChargeLike } from './charges';

export interface ScoreCriterion {
  key: 'pagas' | 'pontualidade' | 'atrasos' | 'valor';
  label: string;
  points: number;
  max: number;
}

export interface ScoreResult {
  /** Final grade, or null when the client has no paid or overdue charge yet. */
  value: number | null;
  /** Raw sum of the four criteria, before confidence and cap. */
  soma: number | null;
  /** Grade after pulling short histories toward NOTA_NEUTRA, before the cap. */
  base: number | null;
  /** 0 to 1: how much the history is trusted, by number of charges that count. */
  confianca: number;
  /** Fewer than HISTORICO_COMPLETO charges count: the grade is pulled toward NOTA_NEUTRA. */
  poucoHistorico: boolean;
  /** Ceiling imposed while a charge is overdue and unpaid, or null when none is. */
  cap: number | null;
  /** Days the oldest unpaid overdue charge has been late (0 when there is none). */
  maiorAtrasoAberto: number;
  /** Charges that count: paid or overdue. Charges still within their term are neutral. */
  counted: number;
  criteria: ScoreCriterion[];
}

export const SCORE_MAX_DIAS = 30;

/** Paid history loses half its weight every 6 months, so the grade follows how the client pays now. */
export const MEIA_VIDA_DIAS = 180;
/** From this many charges on, the history is trusted fully. */
export const HISTORICO_COMPLETO = 5;
/** Where a short history is pulled to, in both directions. */
export const NOTA_NEUTRA = 70;

/** Bands are defined here only: every screen reads them from faixaScore. */
export const FAIXA_BOM = 80;
export const FAIXA_ATENCAO = 50;
export type ScoreFaixa = 'bom' | 'atencao' | 'risco' | 'sem_historico';

export function faixaScore(value: number | null): ScoreFaixa {
  if (value === null) return 'sem_historico';
  if (value >= FAIXA_BOM) return 'bom';
  return value >= FAIXA_ATENCAO ? 'atencao' : 'risco';
}

/** An unpaid overdue charge keeps the client out of "Bom pagador": 79 up to 30 days late. */
export const TETO_ATRASO_RECENTE = 79;
/** After 90 days unpaid the client is "Risco alto": 49. */
export const TETO_ATRASO_ANTIGO = 49;
export const DIAS_ATRASO_ANTIGO = 90;

/** Between 30 and 90 days the ceiling slides from 79 to 49, so one more day never costs a whole band. */
export function tetoPorAtraso(dias: number): number {
  if (dias <= SCORE_MAX_DIAS) return TETO_ATRASO_RECENTE;
  if (dias >= DIAS_ATRASO_ANTIGO) return TETO_ATRASO_ANTIGO;
  const andamento = (dias - SCORE_MAX_DIAS) / (DIAS_ATRASO_ANTIGO - SCORE_MAX_DIAS);
  return Math.round(TETO_ATRASO_RECENTE - (TETO_ATRASO_RECENTE - TETO_ATRASO_ANTIGO) * andamento);
}

export const SCORE_CRITERIOS: Omit<ScoreCriterion, 'points'>[] = [
  { key: 'pagas', label: 'Cobranças pagas', max: 35 },
  { key: 'pontualidade', label: 'Pontualidade', max: 30 },
  { key: 'atrasos', label: 'Tamanho dos atrasos', max: 20 },
  { key: 'valor', label: 'Valor vencido em aberto', max: 15 },
];

function pesoPorData(c: ChargeLike, hoje: Date): number {
  // Unpaid overdue debt is a problem of today: it never fades.
  if (c.status !== 'pago') return 1;
  const referencia = diaLocal(c.data_pagamento || c.data_vencimento);
  const idade = Math.max(0, differenceInCalendarDays(startOfDay(hoje), referencia));
  return Math.pow(0.5, idade / MEIA_VIDA_DIAS);
}

const somar = <T,>(lista: T[], fn: (x: T) => number) => lista.reduce((s, x) => s + fn(x), 0);

export function calcularScore(charges: ChargeLike[], hoje: Date = new Date()): ScoreResult {
  const pagas = charges.filter((c) => chargeState(c, hoje) === 'pago');
  const abertas = charges.filter((c) => chargeState(c, hoje) === 'atrasado');
  const contam = [...pagas, ...abertas];
  const counted = contam.length;

  if (counted === 0) {
    return { value: null, soma: null, base: null, cap: null, confianca: 0, poucoHistorico: true, maiorAtrasoAberto: 0, counted: 0, criteria: SCORE_CRITERIOS.map((c) => ({ ...c, points: 0 })) };
  }

  // Each charge weighs by recency; the timing criteria also weigh by amount, so a large late charge counts more than many small ones.
  const data = (c: ChargeLike) => pesoPorData(c, hoje);
  const reais = (c: ChargeLike) => data(c) * Number(c.valor);

  const pagasPeso = somar(pagas, data) / somar(contam, data);
  const pagasEmReais = somar(pagas, reais);
  const emDiaEmReais = somar(pagas.filter((c) => diasDeAtraso(c, hoje) === 0), reais);
  const totalEmReais = somar(contam, reais);
  const mediaDias = totalEmReais > 0 ? somar(contam, (c) => reais(c) * diasDeAtraso(c, hoje)) / totalEmReais : 0;
  const valorAberto = somar(abertas, saldoAberto);
  const maiorAberto = abertas.reduce((maior, c) => Math.max(maior, diasDeAtraso(c, hoje)), 0);

  const points: Record<ScoreCriterion['key'], number> = {
    pagas: 35 * pagasPeso,
    pontualidade: pagasEmReais > 0 ? 30 * (emDiaEmReais / pagasEmReais) : 0,
    atrasos: 20 * (1 - Math.min(1, mediaDias / SCORE_MAX_DIAS)),
    valor: totalEmReais > 0 ? 15 * Math.max(0, 1 - valorAberto / totalEmReais) : 15,
  };

  const soma = Math.round(points.pagas + points.pontualidade + points.atrasos + points.valor);
  const confianca = Math.min(1, counted / HISTORICO_COMPLETO);
  const base = Math.round(NOTA_NEUTRA + (soma - NOTA_NEUTRA) * confianca);
  const cap = abertas.length === 0 ? null : tetoPorAtraso(maiorAberto);
  const value = Math.max(0, Math.min(100, cap === null ? base : Math.min(base, cap)));

  return {
    value,
    soma,
    base,
    cap,
    confianca,
    poucoHistorico: counted < HISTORICO_COMPLETO,
    maiorAtrasoAberto: maiorAberto,
    counted,
    criteria: SCORE_CRITERIOS.map((c) => ({ ...c, points: points[c.key] })),
  };
}
