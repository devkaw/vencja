import { describe, expect, it } from 'vitest';
import { dataValida } from '../charges';

describe('dataValida', () => {
  it('aceita yyyy-MM-dd real', () => {
    expect(dataValida('2026-11-06')).toBe(true);
  });
  it('rejeita texto, data inexistente e formato errado', () => {
    expect(dataValida('abc')).toBe(false);
    expect(dataValida('2026-02-30')).toBe(false);
    expect(dataValida('06/11/2026')).toBe(false);
    expect(dataValida('')).toBe(false);
  });
});
