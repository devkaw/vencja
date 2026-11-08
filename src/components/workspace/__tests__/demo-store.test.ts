import { describe, expect, it } from 'vitest';
import { demoCriarCobrancas, demoExcluirSerie, demoPagar, type DemoState } from '../demo-store';
import { charge, client, dia, hoje } from '@/lib/domain/__tests__/helpers';
import { resumirClientes } from '@/lib/domain/clients';
import { calcularPainel } from '@/lib/domain/metrics';

const base = (): DemoState => ({
  clients: [client({ id: 'a' })],
  charges: [charge({ id: 'v', client_id: 'a', valor: 100, data_vencimento: dia(-4), descricao: 'Aula' })],
});

describe('demoPagar', () => {
  it('pagamento atualiza score e painel', () => {
    const r = demoPagar(base(), { chargeId: 'v', valor: 100, data: dia(0) }, hoje);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(calcularPainel(r.state.charges, hoje).emAtraso).toBe(0);
    expect(resumirClientes(r.state.clients, r.state.charges, hoje)[0].pago).toBe(100);
  });
  it('parcial cria o restante', () => {
    const r = demoPagar(base(), { chargeId: 'v', valor: 40, data: dia(0) }, hoje);
    expect(r.ok && r.state.charges).toHaveLength(2);
    expect(r.ok && r.state.charges.find((c) => c.status === 'pendente')?.valor).toBe(60);
  });
  it('pagar duas vezes é recusado', () => {
    const r = demoPagar(base(), { chargeId: 'v', valor: 100, data: dia(0) }, hoje);
    if (!r.ok) throw new Error('falhou');
    expect(demoPagar(r.state, { chargeId: 'v', valor: 100, data: dia(0) }, hoje)).toMatchObject({ ok: false, code: 'already_paid' });
  });
});

describe('série', () => {
  it('excluir série remove só as parcelas pendentes do grupo', () => {
    const s = demoCriarCobrancas(base(), [1, 2, 3].map((i) => ({ client_id: 'a', valor: 10, data_vencimento: dia(i * 30), descricao: `Plano (${i}/3)`, recorrente: true, periodicidade: 'mensal' as const })), hoje);
    const raiz = s.charges.find((c) => c.descricao === 'Plano (1/3)')!;
    expect(s.charges.filter((c) => c.charge_original_id === raiz.id)).toHaveLength(2);
    const pago = demoPagar(s, { chargeId: raiz.id, valor: 10, data: dia(0) }, hoje);
    if (!pago.ok) throw new Error('falhou');
    const final = demoExcluirSerie(pago.state, raiz.id);
    expect(final.charges.map((c) => c.descricao).sort()).toEqual(['Aula', 'Plano (1/3)']);
  });
});
