import { describe, expect, it } from 'vitest';
import { createDemoData } from '../demo-data';
import { resumirClientes } from '@/lib/domain/clients';
import { chargeState } from '@/lib/domain/charges';
import { distribuicaoScore, serieMensal } from '@/lib/domain/metrics';

const hoje = new Date();
const { clients, charges } = createDemoData();
const summaries = resumirClientes(clients, charges, hoje);

describe('dados da demonstração', () => {
  it('mostra todas as faixas de score', () => {
    const d = distribuicaoScore(summaries);
    expect(d.bom).toBeGreaterThan(0);
    expect(d.atencao).toBeGreaterThan(0);
    expect(d.risco).toBeGreaterThan(0);
    expect(d.sem_historico).toBeGreaterThan(0);
  });
  it('tem atraso, vencimento hoje e cobrança no prazo', () => {
    const estados = charges.map((c) => chargeState(c, hoje));
    expect(estados).toContain('atrasado');
    expect(estados).toContain('hoje');
    expect(estados).toContain('a_vencer');
  });
  it('tem pagamentos nos últimos 12 meses', () => {
    expect(serieMensal(charges, hoje).filter((m) => m.recebido > 0).length).toBeGreaterThanOrEqual(11);
  });
  it('toda cobrança pertence a um cliente da demonstração', () => {
    expect(charges.every((c) => clients.some((cl) => cl.id === c.client_id))).toBe(true);
  });
});
