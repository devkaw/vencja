import { describe, expect, it } from 'vitest';
import { prazoReembolso } from '../reembolso';

// 2026-11-01 13:00 UTC = 10:00 em Brasília.
const compra = new Date('2026-11-01T13:00:00Z');

describe('prazoReembolso', () => {
  it('no dia da compra restam 7 dias', () => {
    expect(prazoReembolso(compra, new Date('2026-11-01T20:00:00Z'))).toMatchObject({ elegivel: true, diasRestantes: 7 });
  });
  it('o sétimo dia corrido ainda vale, mesmo depois do horário da compra', () => {
    expect(prazoReembolso(compra, new Date('2026-11-08T23:00:00Z'))).toMatchObject({ elegivel: true, diasRestantes: 0 });
  });
  it('no oitavo dia o prazo acabou', () => {
    expect(prazoReembolso(compra, new Date('2026-11-09T12:00:00Z')).elegivel).toBe(false);
  });
  it('usa o fuso de Brasília, não UTC', () => {
    // 2026-11-09 02:00 UTC ainda é dia 8 em Brasília.
    expect(prazoReembolso(compra, new Date('2026-11-09T02:00:00Z')).elegivel).toBe(true);
  });
});
