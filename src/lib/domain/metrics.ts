import { addDays, addMonths, endOfMonth, format, isSameMonth, isWithinInterval, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Charge } from '@/types';
import { chargeState, diaLocal, diasDeAtraso, saldoAberto, valorRecebido } from './charges';
import type { ClientSummary } from './clients';
import { faixaScore, type ScoreFaixa } from './score';

const pagamentoEm = (c: Charge, mes: Date) => c.status === 'pago' && c.data_pagamento && isSameMonth(diaLocal(c.data_pagamento), mes);
const soma = (lista: Charge[], fn: (c: Charge) => number) => lista.reduce((s, c) => s + fn(c), 0);

export interface PainelMetrics {
  recebidoMes: number;
  qtdRecebidoMes: number;
  recebidoMesAnterior: number;
  /** Change against the previous month as a fraction, or null with nothing to compare. */
  variacaoMes: number | null;
  previstoMes: number;
  emAtraso: number;
  qtdAtraso: number;
  aReceber: number;
  qtdAReceber: number;
  venceHoje: { qtd: number; valor: number };
  recebidoTotal: number;
  qtdPagas: number;
  qtdTotal: number;
  /** Paid value over everything already due, or null when nothing is due yet. */
  taxaRecebimento: number | null;
  prazoMedioDias: number | null;
}

export function calcularPainel(charges: Charge[], hoje: Date): PainelMetrics {
  const mesAnterior = subMonths(hoje, 1);
  const pagas = charges.filter((c) => c.status === 'pago');
  const pagasMes = charges.filter((c) => pagamentoEm(c, hoje));
  const atrasadas = charges.filter((c) => chargeState(c, hoje) === 'atrasado');
  const hojeLista = charges.filter((c) => chargeState(c, hoje) === 'hoje');
  const noPrazo = charges.filter((c) => ['hoje', 'a_vencer'].includes(chargeState(c, hoje)));

  const recebidoMes = soma(pagasMes, valorRecebido);
  const recebidoMesAnterior = soma(charges.filter((c) => pagamentoEm(c, mesAnterior)), valorRecebido);
  const abertoNoMes = soma(charges.filter((c) => c.status !== 'pago' && isSameMonth(diaLocal(c.data_vencimento), hoje)), saldoAberto);
  const recebidoTotal = soma(pagas, valorRecebido);
  const emAtraso = soma(atrasadas, saldoAberto);
  const vencido = recebidoTotal + emAtraso;
  const dias = pagas.map((c) => diasDeAtraso(c, hoje));

  return {
    recebidoMes,
    qtdRecebidoMes: pagasMes.length,
    recebidoMesAnterior,
    variacaoMes: recebidoMesAnterior > 0 ? (recebidoMes - recebidoMesAnterior) / recebidoMesAnterior : null,
    previstoMes: recebidoMes + abertoNoMes,
    emAtraso,
    qtdAtraso: atrasadas.length,
    aReceber: soma(noPrazo, saldoAberto),
    qtdAReceber: noPrazo.length,
    venceHoje: { qtd: hojeLista.length, valor: soma(hojeLista, saldoAberto) },
    recebidoTotal,
    qtdPagas: pagas.length,
    qtdTotal: charges.length,
    taxaRecebimento: vencido > 0 ? recebidoTotal / vencido : null,
    prazoMedioDias: dias.length ? Math.round(dias.reduce((s, d) => s + d, 0) / dias.length) : null,
  };
}

export interface MesSerie {
  label: string;
  inicio: Date;
  recebido: number;
  previsto: number;
  atraso: number;
}

export function serieMensal(charges: Charge[], hoje: Date, meses = 12): MesSerie[] {
  return Array.from({ length: meses }, (_, i) => {
    const inicio = startOfMonth(subMonths(hoje, meses - 1 - i));
    const doMes = charges.filter((c) => isSameMonth(diaLocal(c.data_vencimento), inicio));
    return {
      label: format(inicio, 'MMM', { locale: ptBR }).replace('.', ''),
      inicio,
      recebido: soma(charges.filter((c) => pagamentoEm(c, inicio)), valorRecebido),
      previsto: soma(doMes, (c) => Number(c.valor)),
      atraso: soma(doMes.filter((c) => chargeState(c, hoje) === 'atrasado'), saldoAberto),
    };
  });
}

export interface SemanaPrevisao {
  semana: string;
  inicio: Date;
  valor: number;
  qtd: number;
}

export function previsaoCaixa(charges: Charge[], hoje: Date, dias = 30): SemanaPrevisao[] {
  const base = startOfDay(hoje);
  const semanas: SemanaPrevisao[] = Array.from({ length: Math.ceil(dias / 7) }, (_, i) => {
    const inicio = addDays(base, i * 7);
    const fim = addDays(base, Math.min(i * 7 + 6, dias - 1));
    return { semana: `${format(inicio, 'd/MM')} a ${format(fim, 'd/MM')}`, inicio, valor: 0, qtd: 0 };
  });
  for (const c of charges) {
    const estado = chargeState(c, hoje);
    if (estado !== 'hoje' && estado !== 'a_vencer') continue;
    const d = Math.round((diaLocal(c.data_vencimento).getTime() - base.getTime()) / 86400000);
    if (d >= dias) continue;
    const alvo = semanas[Math.floor(d / 7)];
    alvo.valor += saldoAberto(c);
    alvo.qtd += 1;
  }
  return semanas;
}

export { faixaScore, type ScoreFaixa };

export function distribuicaoScore(summaries: ClientSummary[]): Record<ScoreFaixa, number> {
  const total: Record<ScoreFaixa, number> = { bom: 0, atencao: 0, risco: 0, sem_historico: 0 };
  for (const s of summaries) total[faixaScore(s.score.value)] += 1;
  return total;
}

export interface RankingItem {
  summary: ClientSummary;
  total: number;
  qtd: number;
  mediaDias: number;
  maiorAtraso: number;
  charges: (Charge & { diasAtraso: number })[];
}

export function rankingInadimplencia(summaries: ClientSummary[], hoje: Date): RankingItem[] {
  return summaries
    .filter((s) => s.qtdAtrasadas > 0)
    .map((summary) => {
      const charges = summary.charges
        .filter((c) => chargeState(c, hoje) === 'atrasado')
        .map((c) => ({ ...c, diasAtraso: diasDeAtraso(c, hoje) }))
        .sort((a, b) => b.diasAtraso - a.diasAtraso);
      return {
        summary,
        charges,
        total: summary.emAtraso,
        qtd: charges.length,
        mediaDias: Math.round(charges.reduce((s, c) => s + c.diasAtraso, 0) / charges.length),
        maiorAtraso: charges[0].diasAtraso,
      };
    })
    .sort((a, b) => b.total - a.total || b.qtd - a.qtd || b.mediaDias - a.mediaDias);
}

export interface FaixaAtraso {
  label: string;
  valor: number;
  qtd: number;
}

export function faixasAtraso(ranking: RankingItem[]): FaixaAtraso[] {
  const faixas: (FaixaAtraso & { ate: number })[] = [
    { label: '1 a 15 dias', ate: 15, valor: 0, qtd: 0 },
    { label: '16 a 30 dias', ate: 30, valor: 0, qtd: 0 },
    { label: 'Mais de 30 dias', ate: Infinity, valor: 0, qtd: 0 },
  ];
  for (const item of ranking) {
    for (const c of item.charges) {
      const f = faixas.find((x) => c.diasAtraso <= x.ate)!;
      f.valor += saldoAberto(c);
      f.qtd += 1;
    }
  }
  return faixas.map(({ label, valor, qtd }) => ({ label, valor, qtd }));
}

export interface LinhaPeriodo {
  label: string;
  pagas: number;
  aVencer: number;
  atrasadas: number;
  valorPago: number;
  valorAVencer: number;
  valorAtraso: number;
}

export interface PeriodoResumo {
  recebido: number;
  qtdPagas: number;
  emAtraso: number;
  qtdAtraso: number;
  aReceber: number;
  qtdAReceber: number;
  taxa: number | null;
  meses: LinhaPeriodo[];
}

function linha(label: string, charges: Charge[], inicio: Date, fim: Date, hoje: Date): LinhaPeriodo {
  const intervalo = { start: startOfDay(inicio), end: fim };
  const noIntervalo = (dia: string) => isWithinInterval(diaLocal(dia), intervalo);
  const pagas = charges.filter((c) => c.status === 'pago' && c.data_pagamento && noIntervalo(c.data_pagamento));
  const vencimentos = charges.filter((c) => c.status !== 'pago' && noIntervalo(c.data_vencimento));
  const atrasadas = vencimentos.filter((c) => chargeState(c, hoje) === 'atrasado');
  const aVencer = vencimentos.filter((c) => chargeState(c, hoje) !== 'atrasado');
  return {
    label,
    pagas: pagas.length,
    aVencer: aVencer.length,
    atrasadas: atrasadas.length,
    valorPago: soma(pagas, valorRecebido),
    valorAVencer: soma(aVencer, saldoAberto),
    valorAtraso: soma(atrasadas, saldoAberto),
  };
}

/** Upper bound on months in one report, so a mistyped year can never build thousands of rows. */
export const MAX_MESES_RELATORIO = 120;

export function resumoPeriodo(charges: Charge[], inicio: Date, fim: Date, hoje: Date): PeriodoResumo {
  const total = linha('', charges, inicio, fim, hoje);
  const meses: LinhaPeriodo[] = [];
  for (let m = startOfMonth(inicio), i = 0; m <= fim && i < MAX_MESES_RELATORIO; m = addMonths(m, 1), i++) {
    // Each row is clipped to the chosen interval, so rows add up to the totals above.
    const ini = m < inicio ? inicio : m;
    const fimMes = endOfMonth(m);
    const fimLinha = fimMes > fim ? fim : fimMes;
    meses.push(linha(format(m, 'MMMM yyyy', { locale: ptBR }), charges, ini, fimLinha, hoje));
  }
  const vencido = total.valorPago + total.valorAtraso;
  return {
    recebido: total.valorPago,
    qtdPagas: total.pagas,
    emAtraso: total.valorAtraso,
    qtdAtraso: total.atrasadas,
    aReceber: total.valorAVencer,
    qtdAReceber: total.aVencer,
    taxa: vencido > 0 ? total.valorPago / vencido : null,
    meses,
  };
}

export function resumoAnual(charges: Charge[], hoje: Date): LinhaPeriodo[] {
  const anos = new Set<number>();
  for (const c of charges) {
    anos.add(diaLocal(c.data_vencimento).getFullYear());
    if (c.data_pagamento) anos.add(diaLocal(c.data_pagamento).getFullYear());
  }
  return [...anos].sort((a, b) => b - a).map((ano) => linha(String(ano), charges, new Date(ano, 0, 1), new Date(ano, 11, 31, 23, 59, 59), hoje));
}
