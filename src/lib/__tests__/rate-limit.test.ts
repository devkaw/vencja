import { describe, expect, it } from 'vitest';
import { contadorLocal } from '../rate-limit-local';

describe('contadorLocal', () => {
  it('permite até o máximo dentro da janela', () => {
    const c = contadorLocal();
    expect(c('a', 2, 60, 0)).toBe(true);
    expect(c('a', 2, 60, 1)).toBe(true);
    expect(c('a', 2, 60, 2)).toBe(false);
  });
  it('libera depois que a janela acaba', () => {
    const c = contadorLocal();
    c('a', 1, 60, 0);
    expect(c('a', 1, 60, 30_000)).toBe(false);
    expect(c('a', 1, 60, 61_000)).toBe(true);
  });
  it('chaves diferentes não se misturam', () => {
    const c = contadorLocal();
    c('a', 1, 60, 0);
    expect(c('b', 1, 60, 0)).toBe(true);
  });
});
