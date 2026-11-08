import { describe, expect, it } from 'vitest';
import { cpfValido, formatarDocumento, montarIdentificacao } from '../legal';

describe('cpfValido', () => {
  it('aceita CPF com dígitos verificadores corretos', () => {
    expect(cpfValido('529.982.247-25')).toBe(true);
    expect(cpfValido('52998224725')).toBe(true);
  });
  it('recusa dígito errado, sequência repetida e tamanho errado', () => {
    expect(cpfValido('529.982.247-24')).toBe(false);
    expect(cpfValido('111.111.111-11')).toBe(false);
    expect(cpfValido('123')).toBe(false);
  });
});

describe('formatarDocumento', () => {
  it('reconhece CPF e CNPJ pela quantidade de dígitos', () => {
    expect(formatarDocumento('52998224725')).toBe('CPF 529.982.247-25');
    expect(formatarDocumento('11222333000181')).toBe('CNPJ 11.222.333/0001-81');
  });
  it('sem documento não mostra nada', () => {
    expect(formatarDocumento('')).toBe('');
  });
});

describe('montarIdentificacao', () => {
  it('junta nome, documento e endereço', () => {
    expect(montarIdentificacao('Ana Lima', '52998224725', 'Rua A, 1, São Paulo, SP')).toBe('Ana Lima · CPF 529.982.247-25 · Rua A, 1, São Paulo, SP');
  });
  it('sem dados, usa só a marca', () => {
    expect(montarIdentificacao('', '', '')).toBe('VenceJá');
  });
});
