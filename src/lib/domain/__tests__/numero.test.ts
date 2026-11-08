import { describe, expect, it } from 'vitest';
import { parseValorBR } from '../numero';

describe('parseValorBR', () => {
  it('vírgula decimal sem separador de milhar', () => {
    expect(parseValorBR('1500,50')).toBe(1500.5);
  });
  it('separador de milhar com vírgula decimal', () => {
    expect(parseValorBR('1.500,00')).toBe(1500);
    expect(parseValorBR('2.000,5')).toBe(2000.5);
  });
  it('ponto seguido de três dígitos é milhar, não decimal', () => {
    expect(parseValorBR('1.500')).toBe(1500);
  });
  it('ponto com dois dígitos é decimal', () => {
    expect(parseValorBR('150.5')).toBe(150.5);
  });
  it('entrada inválida vira NaN', () => {
    expect(parseValorBR('abc')).toBeNaN();
    expect(parseValorBR('')).toBeNaN();
  });
});
