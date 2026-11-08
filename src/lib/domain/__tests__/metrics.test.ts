import { describe, expect, it } from 'vitest';
import { calcularPainel, distribuicaoScore, faixasAtraso, previsaoCaixa, rankingInadimplencia, resumoPeriodo, serieMensal } from '../metrics';
import { resumirClientes, linhaDoTempo } from '../clients';
import { aVencer, charge, client, dia, hoje, paga, vencida } from './helpers';

describe('resumirClientes', () => {
  it('deriva totais e score das cobranças, ignorando colunas salvas', () => {
    const c = client({ id: 'a', score: 12, total_pago: 9999, total_atrasado: 9999 });
    const [s] = resumirClientes([c], [paga(-30, -30), vencida(-5, 250), aVencer(9, 40)].map((x) => ({ ...x, client_id: 'a' })), hoje);
    expect(s).toMatchObject({ pago: 100, emAtraso: 250, aReceber: 40, qtdAtrasadas: 1 });
    expect(s.score.counted).toBe(2);
  });
  it('cliente sem cobranças fica sem histórico', () => {
    const [s] = resumirClientes([client()], [], hoje);
    expect(s).toMatchObject({ pago: 0, pontualidade: null, prazoMedioDias: null, ultimoPagamento: null });
    expect(s.score.value).toBeNull();
  });
  it('pontualidade e prazo médio usam só as pagas', () => {
    const cs = [paga(-20, -20), paga(-10, -4), vencida(-3)].map((x) => ({ ...x, client_id: 'cl' }));
    const [s] = resumirClientes([client()], cs, hoje);
    expect(s.pontualidade).toBe(0.5);
    expect(s.prazoMedioDias).toBe(3);
    expect(s.ultimoPagamento).toBe(dia(-4));
  });
});

describe('calcularPainel', () => {
  it('recebido agrupa por data de pagamento, não por vencimento', () => {
    const p = calcularPainel([paga(-60, -2, 300), paga(-2, -10, 500)], hoje);
    expect(p.recebidoMes).toBe(300);
    expect(p.recebidoMesAnterior).toBe(500);
    expect(p.variacaoMes).toBeCloseTo(-0.4);
  });
  it('variação é nula sem mês anterior', () => {
    expect(calcularPainel([paga(-2, -2)], hoje).variacaoMes).toBeNull();
  });
  it('separa atraso, a receber e vencimentos de hoje', () => {
    const p = calcularPainel([vencida(-3, 200), aVencer(0, 50), aVencer(10, 70)], hoje);
    expect(p).toMatchObject({ emAtraso: 200, qtdAtraso: 1, aReceber: 120, qtdAReceber: 2, venceHoje: { qtd: 1, valor: 50 } });
  });
  it('previsto do mês soma recebido e saldo que vence no mês', () => {
    const p = calcularPainel([paga(-2, -2, 100), aVencer(10, 70), aVencer(40, 900), vencida(-3, 30)], hoje);
    expect(p.previstoMes).toBe(200);
  });
  it('taxa de recebimento ignora o que ainda não venceu', () => {
    expect(calcularPainel([paga(-2, -2, 300), vencida(-3, 100), aVencer(5, 900)], hoje).taxaRecebimento).toBe(0.75);
    expect(calcularPainel([aVencer(5)], hoje).taxaRecebimento).toBeNull();
  });
});

describe('séries', () => {
  it('serieMensal tem doze meses terminando no atual', () => {
    const s = serieMensal([paga(-60, -2, 300)], hoje);
    expect(s).toHaveLength(12);
    expect(s[11].recebido).toBe(300);
    expect(s[9].previsto).toBeGreaterThanOrEqual(0);
  });
  it('previsão ignora vencidas e o que passa do período', () => {
    const p = previsaoCaixa([vencida(-1), aVencer(0, 10), aVencer(8, 20), aVencer(29, 30), aVencer(30, 40)], hoje);
    expect(p.reduce((s, x) => s + x.valor, 0)).toBe(60);
    expect(p.reduce((s, x) => s + x.qtd, 0)).toBe(3);
  });
  it('distribuição separa sem histórico', () => {
    const emDia = [1, 2, 3, 4, 5].map((m) => ({ ...paga(-30 * m, -30 * m), client_id: 'a' }));
    const summaries = resumirClientes([client({ id: 'a' }), client({ id: 'b' }), client({ id: 'c' })], [...emDia, { ...vencida(-120), client_id: 'b' }], hoje);
    expect(distribuicaoScore(summaries)).toEqual({ bom: 1, atencao: 0, risco: 1, sem_historico: 1 });
  });
});

describe('inadimplência', () => {
  const summaries = resumirClientes(
    [client({ id: 'a', nome: 'A' }), client({ id: 'b', nome: 'B' })],
    [{ ...vencida(-5, 100), client_id: 'a' }, { ...vencida(-40, 900), client_id: 'b' }, { ...vencida(-20, 50), client_id: 'b' }],
    hoje
  );
  it('ordena por valor e calcula média de dias', () => {
    const r = rankingInadimplencia(summaries, hoje);
    expect(r.map((x) => x.summary.client.id)).toEqual(['b', 'a']);
    expect(r[0]).toMatchObject({ total: 950, qtd: 2, mediaDias: 30, maiorAtraso: 40 });
  });
  it('faixas de atraso somam valor', () => {
    expect(faixasAtraso(rankingInadimplencia(summaries, hoje)).map((f) => f.valor)).toEqual([100, 50, 900]);
  });
});

describe('resumoPeriodo', () => {
  it('recebido por pagamento e atraso por vencimento dentro do intervalo', () => {
    const r = resumoPeriodo([paga(-60, -2, 300), paga(-2, -60, 111), vencida(-3, 40), vencida(-90, 500)], new Date(2026, 10, 1), new Date(2026, 10, 30), hoje);
    expect(r).toMatchObject({ recebido: 300, qtdPagas: 1, emAtraso: 40, qtdAtraso: 1 });
  });
});

describe('linhaDoTempo', () => {
  it('lista pagamentos e lançamentos do mais recente para o mais antigo', () => {
    const c = charge({ status: 'pago', data_pagamento: dia(-1), data_vencimento: dia(-5), created_at: `${dia(-9)}T12:00:00.000Z`, descricao: 'Aula' });
    const ev = linhaDoTempo([c], hoje);
    expect(ev.map((e) => e.kind)).toEqual(['pagamento', 'lancamento']);
  });
  it('mostra quando uma cobrança venceu sem pagamento', () => {
    expect(linhaDoTempo([vencida(-5)], hoje).map((e) => e.kind)).toContain('vencimento');
  });
});

describe('relatórios com intervalo', () => {
  it('linha do mês é recortada ao intervalo escolhido', () => {
    const c = [aVencer(20, 100)];
    const r = resumoPeriodo(c, new Date(2026, 10, 1), new Date(2026, 10, 10, 23, 59), hoje);
    expect(r.meses[0].aVencer).toBe(0);
    expect(r.aReceber).toBe(0);
  });
  it('totais batem com a soma das linhas mensais', () => {
    const c = [paga(-40, -40, 300), paga(-10, -2, 200), vencida(-3, 50), aVencer(12, 70), aVencer(45, 900)];
    const inicio = new Date(2026, 9, 1);
    const fim = new Date(2026, 11, 31, 23, 59);
    const r = resumoPeriodo(c, inicio, fim, hoje);
    expect(r.recebido).toBe(r.meses.reduce((s, m) => s + m.valorPago, 0));
    expect(r.aReceber).toBe(r.meses.reduce((s, m) => s + m.valorAVencer, 0));
  });
  it('intervalo com ano absurdo não gera milhares de linhas', () => {
    const r = resumoPeriodo([], new Date(2, 0, 1), new Date(2026, 0, 1), hoje);
    expect(r.meses.length).toBeLessThanOrEqual(120);
  });
});
