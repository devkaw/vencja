import { describe, expect, it } from 'vitest';
import { hojeEmSaoPaulo, montarDigest } from '../digest';
import { aVencer, hoje, paga, vencida } from './helpers';

describe('montarDigest', () => {
  it('não envia nada sem eventos do dia', () => {
    expect(montarDigest([], hoje)).toBeNull();
    expect(montarDigest([aVencer(5)], hoje)).toBeNull();
  });
  it('atraso antigo sozinho não dispara, para não repetir o aviso todo dia', () => {
    expect(montarDigest([vencida(-5)], hoje)).toBeNull();
  });
  it('cobrança paga é ignorada', () => {
    expect(montarDigest([paga(0, 0), paga(-1, -3)], hoje)).toBeNull();
  });
  it('lista o que vence hoje e o que venceu ontem, com o total em atraso', () => {
    const d = montarDigest([aVencer(0, 50), vencida(-1, 70), vencida(-9, 30)], hoje);
    expect(d?.venceHoje).toHaveLength(1);
    expect(d?.venceuOntem).toHaveLength(1);
    expect(d?.totalAtraso).toBe(100);
  });
});

describe('hojeEmSaoPaulo', () => {
  it('usa o dia de Brasília, não o de UTC', () => {
    expect(hojeEmSaoPaulo(new Date('2026-11-06T02:00:00Z'))).toBe('2026-11-05');
    expect(hojeEmSaoPaulo(new Date('2026-11-06T11:00:00Z'))).toBe('2026-11-06');
  });
});
