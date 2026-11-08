import { describe, expect, it } from 'vitest';
import { chargeState, diasDeAtraso, planejarPagamento, saldoAberto, valorRecebido } from '../charges';
import { aVencer, charge, dia, hoje, paga, vencida } from './helpers';

describe('chargeState', () => {
  it('vencimento hoje nunca está atrasado, em qualquer horário', () => {
    const c = aVencer(0);
    expect(chargeState(c, new Date(2026, 10, 6, 0, 1))).toBe('hoje');
    expect(chargeState(c, new Date(2026, 10, 6, 23, 59))).toBe('hoje');
  });
  it('ontem está atrasado e amanhã a vencer', () => {
    expect(chargeState(vencida(-1), hoje)).toBe('atrasado');
    expect(chargeState(aVencer(1), hoje)).toBe('a_vencer');
  });
  it('paga vence qualquer data', () => {
    expect(chargeState(paga(-10, -2), hoje)).toBe('pago');
  });
  it('aceita data com horário', () => {
    expect(chargeState(charge({ data_vencimento: `${dia(0)}T23:30:00.000Z` }), hoje)).toBe('hoje');
  });
});

describe('valores', () => {
  it('parcial usa o saldo restante', () => {
    expect(saldoAberto(charge({ status: 'parcial', valor: 100, valor_pago: 30 }))).toBe(70);
    expect(valorRecebido(charge({ status: 'parcial', valor: 100, valor_pago: 30 }))).toBe(30);
  });
  it('valores do Postgres chegam como texto', () => {
    expect(saldoAberto(charge({ valor: '150.50' as unknown as number, valor_pago: '0.25' as unknown as number }))).toBe(150.25);
  });
  it('paga não tem saldo e conta o valor inteiro mesmo sem valor_pago', () => {
    expect(saldoAberto(paga(-1, -1))).toBe(0);
    expect(valorRecebido(charge({ status: 'pago', valor: 80, valor_pago: 0, data_pagamento: dia(-1) }))).toBe(80);
  });
});

describe('diasDeAtraso', () => {
  it('aberta conta até hoje e paga até o pagamento', () => {
    expect(diasDeAtraso(vencida(-12), hoje)).toBe(12);
    expect(diasDeAtraso(paga(-10, -4), hoje)).toBe(6);
    expect(diasDeAtraso(paga(-10, -12), hoje)).toBe(0);
    expect(diasDeAtraso(aVencer(5), hoje)).toBe(0);
  });
});

describe('planejarPagamento', () => {
  it('pagamento total não cria restante', () => {
    const p = planejarPagamento(vencida(-3), 100, dia(0));
    expect(p).toMatchObject({ ok: true, restante: null, valorRecebido: 100, update: { status: 'pago', valor_pago: 100, dias_atraso: 3, data_pagamento: dia(0) } });
  });
  it('pagamento parcial reduz a cobrança e cria o restante', () => {
    const c = charge({ valor: 100, descricao: 'Aula', data_vencimento: dia(-3) });
    const p = planejarPagamento(c, 30.1, dia(0));
    expect(p).toMatchObject({
      ok: true,
      valorRecebido: 30.1,
      update: { valor: 30.1, valor_pago: 30.1, status: 'pago', descricao: 'Aula (parcial)' },
      restante: { valor: 69.9, status: 'pendente', valor_pago: 0, descricao: 'Aula (restante)', data_vencimento: c.data_vencimento, charge_original_id: c.id },
    });
  });
  it('recusa cobrança já paga, valor inválido e data vazia', () => {
    expect(planejarPagamento(paga(-1, -1), 100, dia(0))).toMatchObject({ ok: false, code: 'already_paid' });
    expect(planejarPagamento(aVencer(1), 0, dia(0))).toMatchObject({ ok: false, code: 'invalid_value' });
    expect(planejarPagamento(aVencer(1), 101, dia(0))).toMatchObject({ ok: false, code: 'invalid_value' });
    expect(planejarPagamento(aVencer(1), 50, '')).toMatchObject({ ok: false, code: 'invalid_date' });
  });
});
