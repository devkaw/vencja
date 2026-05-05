export type Plano = 'free' | 'pro';

export interface Profile {
  id: string;
  email: string;
  nome?: string;
  plano: Plano;
  is_admin: boolean;
  created_at: string;
  subscription_id?: string;
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  subscription_cycle?: 'monthly' | 'annual';
  subscription_started_at?: string;
  subscription_ends_at?: string;
  cancellation_requested_at?: string;
  cancellation_type?: 'cancel' | 'refund';
  cancellation_reason?: string;
  cancellation_status?: 'pending' | 'approved' | 'rejected';
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