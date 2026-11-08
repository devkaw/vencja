import type { Charge, Client, Profile } from '@/types';
import type { ClientSummary } from '@/lib/domain/clients';
import type { PainelMetrics } from '@/lib/domain/metrics';

export type ChargeWithClient = Charge & { client?: Client };

export type ActionCode = 'limit' | 'already_paid' | 'invalid';
export type ActionResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string; code?: ActionCode };

export interface PaymentInput {
  chargeId: string;
  valor: number;
  data: string;
}

export interface ChargeDraft {
  client_id: string;
  valor: number;
  data_vencimento: string;
  descricao: string;
  recorrente: boolean;
  periodicidade: 'semanal' | 'quinzenal' | 'mensal' | null;
}

export interface ChargePatch {
  descricao: string | null;
  valor: number;
  data_vencimento: string;
}

export interface ClientDraft {
  id?: string;
  nome: string;
  telefone: string | null;
  email: string | null;
}

export interface WorkspaceActions {
  registrarPagamento(input: PaymentInput): Promise<ActionResult<{ restante: boolean }>>;
  criarCobrancas(drafts: ChargeDraft[]): Promise<ActionResult>;
  atualizarCobranca(id: string, patch: ChargePatch): Promise<ActionResult>;
  excluirCobranca(id: string): Promise<ActionResult>;
  excluirSerie(id: string): Promise<ActionResult<{ removidas: number }>>;
  salvarCliente(draft: ClientDraft): Promise<ActionResult<{ id: string }>>;
  excluirCliente(id: string): Promise<ActionResult>;
  recarregar(): Promise<void>;
}

export interface Workspace {
  mode: 'live' | 'demo';
  profile: Profile | null;
  isPro: boolean;
  userName: string;
  email: string;
  hoje: Date;
  clients: Client[];
  charges: ChargeWithClient[];
  summaries: ClientSummary[];
  painel: PainelMetrics;
  actions: WorkspaceActions;
}
