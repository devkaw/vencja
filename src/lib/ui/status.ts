import { faixaScore } from '@/lib/domain/score';
import { calcularDiasAtraso, diasAteVencimento, isVencido } from '@/lib/utils';

export type ChargeVisualKey = 'pago' | 'atrasado' | 'hoje' | 'a_vencer' | 'parcial';

export interface ChargeVisual {
  key: ChargeVisualKey;
  label: string;
  /** Short label for tight spaces, e.g. "12d". */
  short: string;
  variant: 'success' | 'danger' | 'warning' | 'default' | 'info';
  text: string;
  soft: string;
  dot: string;
}

/**
 * One place that decides how a charge looks. Mirrors the rules already used
 * across the app: paid wins, then overdue (due date passed), then upcoming.
 */
export function chargeVisual(charge: { status: string; data_vencimento: string; dias_atraso?: number | null }): ChargeVisual {
  if (charge.status === 'pago') {
    return { key: 'pago', label: 'Pago', short: 'Pago', variant: 'success', text: 'text-pos', soft: 'bg-pos-soft', dot: 'bg-pos' };
  }

  if (charge.status === 'parcial') {
    return { key: 'parcial', label: 'Parcial', short: 'Parcial', variant: 'info', text: 'text-info', soft: 'bg-info-soft', dot: 'bg-info' };
  }

  if (isVencido(charge.data_vencimento)) {
    const dias = charge.dias_atraso || calcularDiasAtraso(charge.data_vencimento);
    return {
      key: 'atrasado',
      label: `${dias} ${dias === 1 ? 'dia' : 'dias'} de atraso`,
      short: `${dias}d atraso`,
      variant: 'danger',
      text: 'text-neg',
      soft: 'bg-neg-soft',
      dot: 'bg-neg',
    };
  }

  const dias = diasAteVencimento(charge.data_vencimento);
  if (dias === 0) {
    return { key: 'hoje', label: 'Vence hoje', short: 'Hoje', variant: 'warning', text: 'text-warn', soft: 'bg-warn-soft', dot: 'bg-warn' };
  }

  return {
    key: 'a_vencer',
    label: dias === 1 ? 'Vence amanhã' : `Vence em ${dias} dias`,
    short: dias === 1 ? 'Amanhã' : `${dias} dias`,
    variant: dias <= 3 ? 'warning' : 'default',
    text: dias <= 3 ? 'text-warn' : 'text-ink-2',
    soft: dias <= 3 ? 'bg-warn-soft' : 'bg-surface-3',
    dot: dias <= 3 ? 'bg-warn' : 'bg-ink-4',
  };
}

const tons = {
  bom: { label: 'Bom pagador', text: 'text-pos', soft: 'bg-pos-soft', bar: 'bg-pos', variant: 'success', fill: 'rgb(var(--pos-fill))' },
  atencao: { label: 'Atenção', text: 'text-warn', soft: 'bg-warn-soft', bar: 'bg-warn', variant: 'warning', fill: 'rgb(var(--warn-fill))' },
  risco: { label: 'Risco alto', text: 'text-neg', soft: 'bg-neg-soft', bar: 'bg-neg', variant: 'danger', fill: 'rgb(var(--neg-fill))' },
  sem_historico: { label: 'Sem histórico', text: 'text-ink-3', soft: 'bg-surface-3', bar: 'bg-ink-4', variant: 'default', fill: 'rgb(var(--ink) / 0.2)' },
} as const;

/** Label and colors of a score. The band itself comes from faixaScore, the only place the limits live. */
export function scoreTone(score: number | null) {
  return tons[faixaScore(score)];
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function firstName(name?: string | null): string {
  if (!name) return '';
  return name.trim().split(/\s+/)[0];
}
