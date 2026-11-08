import { differenceInCalendarDays } from 'date-fns';
import { diaLocal } from './charges';
import { hojeEmSaoPaulo } from './digest';

export const PRAZO_REEMBOLSO_DIAS = 7;

/**
 * Direito de arrependimento (CDC, art. 49): 7 dias corridos contados da compra, no fuso de Brasília.
 * Quem comprou no dia 1 pode pedir até o fim do dia 8. `diasRestantes` é 0 no último dia.
 */
export function prazoReembolso(compra: Date, agora: Date = new Date()) {
  const diasDesdeCompra = Math.max(0, differenceInCalendarDays(diaLocal(hojeEmSaoPaulo(agora)), diaLocal(hojeEmSaoPaulo(compra))));
  const diasRestantes = PRAZO_REEMBOLSO_DIAS - diasDesdeCompra;
  return { elegivel: diasRestantes >= 0, diasRestantes: Math.max(0, diasRestantes), diasDesdeCompra };
}
