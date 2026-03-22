export type Plano = 'free' | 'pro';
export type StatusPagamento = 'pendente' | 'aprovado' | 'rejeitado';

export interface Profile {
  id: string;
  email: string;
  nome?: string;
  plano: Plano;
  acesso_vitalicio: boolean;
  status_pagamento: StatusPagamento;
  is_admin: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  score: number;
  total_pago: number;
  total_atrasado: number;
  created_at: string;
}

export interface Charge {
  id: string;
  user_id: string;
  client_id: string;
  valor: number;
  valor_pago: number;
  data_vencimento: string;
  status: 'pendente' | 'pago' | 'parcial';
  data_pagamento: string | null;
  dias_atraso: number;
  descricao: string | null;
  recorrente: boolean;
  periodicidade: 'semanal' | 'mensal' | null;
  charge_original_id: string | null;
  created_at: string;
  client?: Client;
}

export interface Payment {
  id: string;
  user_id: string;
  charge_id: string | null;
  valor: number;
  data_pagamento: string;
  comprovante_url: string | null;
  created_at: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  comprovante_url: string | null;
  status: StatusPagamento;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface DashboardMetrics {
  faturamentoMes: number;
  faturamentoProjetado: number;
  totalAtrasado: number;
  taxaInadimplencia: number;
  clienteMaisDeve: Client | null;
  maiorPrejuizo: { cliente: Client; valor: number } | null;
  chargesRecentes: Charge[];
}

export interface ClientRanking {
  client: Client;
  totalAtrasado: number;
  quantidadeAtrasos: number;
  mediaDiasAtraso: number;
}

export interface FaturamentoData {
  labels: string[];
  valores: number[];
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export const PIX_KEY = '00020101021126650014br.gov.bcb.pix0111097354445770228Pagamento Vitalicio  VenceJa5204000053039865406297.005802BR5916KADU A WANDERLEY6008SALVADOR62070503***6304C7AE';

export const PLAN_PRICE = 297;
