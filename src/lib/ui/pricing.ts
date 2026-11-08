import { PLANS } from '@/lib/subscription';
import { PRAZO_ATENDIMENTO, PRAZO_SUPORTE_PRO } from '@/lib/legal';

// Display copy for plans. Prices and limits come from PLANS so the UI never
// drifts from what the app enforces.
export const PRICE_MONTHLY = PLANS.pro.price; // 49.9
export const PRICE_ANNUAL = PLANS.pro.priceAnnual; // 499
export const ANNUAL_PER_MONTH = PRICE_ANNUAL / 12;
export const ANNUAL_SAVINGS = PRICE_MONTHLY * 12 - PRICE_ANNUAL;

export const brl = (n: number, decimals = 2) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const comparison: { label: string; free: string | boolean; pro: string | boolean; hint?: string }[] = [
  { label: 'Clientes', free: `Até ${PLANS.free.limits.maxClients}`, pro: 'Ilimitados' },
  { label: 'Cobranças', free: `Até ${PLANS.free.limits.maxCharges}`, pro: 'Ilimitadas' },
  { label: 'Painel com recebido, a receber e em atraso', free: true, pro: true },
  { label: 'Score automático de cada cliente', free: true, pro: true },
  { label: 'Calendário de vencimentos', free: true, pro: true },
  { label: 'Ranking de inadimplência', free: true, pro: true },
  { label: 'Cobranças parceladas e recorrentes', free: true, pro: true },
  { label: 'Pagamento parcial', free: true, pro: true },
  { label: 'Aviso diário por e-mail', free: true, pro: true },
  { label: 'Busca e ações rápidas', free: true, pro: true },
  { label: 'Previsão de caixa de 30 dias', free: true, pro: true },
  { label: 'Cobrança pelo WhatsApp com mensagem pronta', free: false, pro: true },
  { label: 'Relatórios mensais e anuais', free: false, pro: true },
  { label: 'Exportação em CSV (planilha)', free: false, pro: true },
  { label: 'Resposta do suporte por e-mail', free: `Até ${PRAZO_ATENDIMENTO}`, pro: `Até ${PRAZO_SUPORTE_PRO}` },
];
