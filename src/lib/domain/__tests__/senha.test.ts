import { describe, expect, it } from 'vitest';
import { erroDeSenha } from '../senha';

describe('erroDeSenha', () => {
  it('recusa menos de 8 caracteres', () => {
    expect(erroDeSenha('abc1234')).toMatch(/8 caracteres/);
  });
  it('recusa senhas muito comuns', () => {
    expect(erroDeSenha('12345678')).toMatch(/comum/);
    expect(erroDeSenha('Password')).toMatch(/comum/);
  });
  it('recusa valores que não são texto', () => {
    expect(erroDeSenha(undefined)).toBeTruthy();
  });
  it('aceita senha razoável', () => {
    expect(erroDeSenha('cavalo-azul-22')).toBeNull();
  });
});
