import type { Charge } from '@/types';
import { chargeState, diasAteVencimento, saldoAberto } from './charges';

export interface DailyDigest {
  venceHoje: Charge[];
  venceuOntem: Charge[];
  totalAtraso: number;
}

/** Null when nothing new happened, so an old overdue charge does not repeat every morning. */
export function montarDigest(charges: Charge[], hoje: Date): DailyDigest | null {
  const abertas = charges.filter((c) => c.status !== 'pago');
  const venceHoje = abertas.filter((c) => chargeState(c, hoje) === 'hoje');
  const venceuOntem = abertas.filter((c) => diasAteVencimento(c, hoje) === -1);
  if (venceHoje.length === 0 && venceuOntem.length === 0) return null;
  const totalAtraso = abertas.filter((c) => chargeState(c, hoje) === 'atrasado').reduce((s, c) => s + saldoAberto(c), 0);
  return { venceHoje, venceuOntem, totalAtraso };
}

export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora);
}
