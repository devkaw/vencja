import { describe, expect, it } from 'vitest';
import { HISTORICO_COMPLETO, NOTA_NEUTRA, calcularScore, faixaScore } from '../score';
import { aVencer, charge, dia, hoje, paga, vencida } from './helpers';

/** n monthly charges paid on their due date, the most recent `inicio` days ago. */
const emDia = (n: number, inicio = 30, valor = 100) => Array.from({ length: n }, (_, i) => paga(-inicio - i * 30, -inicio - i * 30, valor));

describe('calcularScore: o básico', () => {
  it('sem cobranças que contam não há nota', () => {
    expect(calcularScore([], hoje).value).toBeNull();
    expect(calcularScore([aVencer(30)], hoje).value).toBeNull();
    expect(calcularScore([aVencer(0)], hoje).value).toBeNull();
  });
  it('parcelas futuras são neutras', () => {
    const futuras = Array.from({ length: 11 }, (_, i) => aVencer(30 * (i + 1)));
    expect(calcularScore([...emDia(5), ...futuras], hoje).value).toBe(calcularScore(emDia(5), hoje).value);
  });
  it('histórico completo e todo em dia dá 100', () => {
    expect(calcularScore(emDia(HISTORICO_COMPLETO), hoje).value).toBe(100);
  });
  it('critérios têm os pontos máximos do spec e somam a soma informada', () => {
    const r = calcularScore([...emDia(4), vencida(-10)], hoje);
    expect(r.criteria.map((c) => c.max)).toEqual([35, 30, 20, 15]);
    expect(Math.round(r.criteria.reduce((s, c) => s + c.points, 0))).toBe(r.soma);
  });
  it('parcial vencida conta pelo saldo', () => {
    const r = calcularScore([charge({ status: 'parcial', valor: 100, valor_pago: 75, data_vencimento: dia(-5) })], hoje);
    expect(r.counted).toBe(1);
    expect(r.criteria.find((c) => c.key === 'valor')?.points).toBeCloseTo(11.25);
  });
});

describe('calcularScore: confiança pelo tamanho do histórico', () => {
  it('uma única cobrança paga em dia não vira 100', () => {
    const r = calcularScore([paga(-10, -10)], hoje);
    expect(r).toMatchObject({ soma: 100, confianca: 1 / HISTORICO_COMPLETO, poucoHistorico: true });
    expect(r.value).toBe(Math.round(NOTA_NEUTRA + (100 - NOTA_NEUTRA) / HISTORICO_COMPLETO));
  });
  it('um único atraso pequeno não derruba a nota para risco alto', () => {
    expect(faixaScore(calcularScore([vencida(-3)], hoje).value)).toBe('atencao');
  });
  it('a partir de 5 cobranças a nota fica livre', () => {
    const r = calcularScore(emDia(5), hoje);
    expect(r).toMatchObject({ confianca: 1, poucoHistorico: false });
    expect(r.value).toBe(r.soma);
  });
  it('mais histórico bom dá nota maior que pouco histórico bom', () => {
    expect(calcularScore(emDia(5), hoje).value!).toBeGreaterThan(calcularScore(emDia(2), hoje).value!);
  });
});

describe('calcularScore: peso por data', () => {
  it('atraso de dois anos atrás pesa menos que atraso do mês passado', () => {
    const antigo = [...emDia(5), paga(-730, -700)];
    const recente = [...emDia(5, 60), paga(-30, 0)];
    expect(calcularScore(antigo, hoje).value!).toBeGreaterThan(calcularScore(recente, hoje).value!);
  });
  it('cliente que melhorou sobe: atrasos antigos e pagamentos recentes em dia', () => {
    const atrasosAntigos = Array.from({ length: 6 }, (_, i) => paga(-500 - i * 30, -460 - i * 30));
    const melhorou = calcularScore([...atrasosAntigos, ...emDia(6)], hoje);
    const piorou = calcularScore([...emDia(6, 500), ...Array.from({ length: 6 }, (_, i) => paga(-60 - i * 30, -20 - i * 30))], hoje);
    expect(melhorou.value!).toBeGreaterThan(piorou.value!);
    expect(faixaScore(melhorou.value)).toBe('bom');
  });
  it('dívida em aberto não perde peso com o tempo', () => {
    const r = calcularScore([...emDia(5, 60), vencida(-400)], hoje);
    expect(r.value).toBeLessThanOrEqual(49);
  });
});

describe('calcularScore: peso por valor', () => {
  it('atrasar a cobrança grande pesa mais que pagar em dia várias pequenas', () => {
    const pequenasEmDia = Array.from({ length: 10 }, (_, i) => paga(-30 - i * 3, -30 - i * 3, 20));
    const r = calcularScore([...pequenasEmDia, paga(-40, -10, 3000)], hoje);
    expect(faixaScore(r.value)).not.toBe('bom');
  });
  it('atrasar uma cobrança pequena pesa pouco entre cobranças grandes em dia', () => {
    const grandes = Array.from({ length: 10 }, (_, i) => paga(-30 - i * 3, -30 - i * 3, 3000));
    const r = calcularScore([...grandes, paga(-40, -10, 20)], hoje);
    expect(faixaScore(r.value)).toBe('bom');
  });
});

describe('calcularScore: teto por cobrança vencida', () => {
  it('o teto fica em 79 até 30 dias e cai gradualmente até 49 aos 90 dias', () => {
    const teto = (dias: number) => calcularScore([vencida(-dias)], hoje).cap;
    expect(teto(1)).toBe(79);
    expect(teto(30)).toBe(79);
    expect(teto(60)).toBe(64);
    expect(teto(90)).toBe(49);
    expect(teto(400)).toBe(49);
    const sequencia = [30, 40, 50, 60, 70, 80, 90].map(teto) as number[];
    expect([...sequencia].sort((x, y) => y - x)).toEqual(sequencia);
  });
  it('com cobrança vencida em aberto nunca é bom pagador', () => {
    expect(faixaScore(calcularScore([...emDia(20), vencida(-2)], hoje).value)).toBe('atencao');
  });
  it('um dia a mais de atraso não derruba a nota de forma brusca', () => {
    const cs = (d: number) => [...emDia(6, 60), vencida(-d)];
    expect(calcularScore(cs(30), hoje).value! - calcularScore(cs(31), hoje).value!).toBeLessThanOrEqual(1);
  });
  it('histórico longo em dia com uma cobrança de 31 dias continua em atenção', () => {
    expect(faixaScore(calcularScore([...emDia(30, 60), vencida(-31)], hoje).value)).toBe('atencao');
  });
  it('informa há quantos dias está a cobrança vencida mais antiga', () => {
    expect(calcularScore([paga(-40, -40), vencida(-12), vencida(-45)], hoje).maiorAtrasoAberto).toBe(45);
    expect(calcularScore([paga(-40, -40)], hoje).maiorAtrasoAberto).toBe(0);
  });
});

describe('faixaScore', () => {
  it('é a única definição das faixas', () => {
    expect(faixaScore(100)).toBe('bom');
    expect(faixaScore(80)).toBe('bom');
    expect(faixaScore(79)).toBe('atencao');
    expect(faixaScore(50)).toBe('atencao');
    expect(faixaScore(49)).toBe('risco');
    expect(faixaScore(0)).toBe('risco');
    expect(faixaScore(null)).toBe('sem_historico');
  });
});
