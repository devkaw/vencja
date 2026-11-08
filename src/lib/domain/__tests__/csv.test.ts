import { describe, expect, it } from 'vitest';
import { gerarCsv } from '../csv';

describe('gerarCsv', () => {
  it('usa BOM, ponto e vírgula e CRLF', () => {
    expect(gerarCsv(['A', 'B'], [['x', 'y']])).toBe('﻿A;B\r\nx;y');
  });
  it('escapa separador, aspas e quebra de linha', () => {
    expect(gerarCsv(['Nome'], [['A;B "C"\nD']])).toBe('﻿Nome\r\n"A;B ""C""\nD"');
  });
  it('neutraliza fórmulas de planilha', () => {
    expect(gerarCsv(['N'], [['=1+1'], ['+55'], ['-x'], ['@y']])).toBe("﻿N\r\n'=1+1\r\n'+55\r\n'-x\r\n'@y");
  });
  it('números usam vírgula decimal e nulo vira vazio', () => {
    expect(gerarCsv(['V', 'N'], [[1234.5, null], [10, 0]])).toBe('﻿V;N\r\n1234,50;\r\n10;0');
  });
});

describe('gerarCsv, fórmulas com caracteres de controle', () => {
  it('neutraliza tab e retorno de carro antes de sinal de fórmula', () => {
    expect(gerarCsv(['N'], [['\t=1+1'], ['\r=2']])).toBe("﻿N\r\n'\t=1+1\r\n\"'\r=2\"");
  });
});

describe('moedaCsv', () => {
  it('sempre com duas casas e vírgula', async () => {
    const { moedaCsv } = await import('../csv');
    expect(moedaCsv(180)).toBe('180,00');
    expect(moedaCsv(1234.5)).toBe('1234,50');
    expect(moedaCsv(0.1 + 0.2)).toBe('0,30');
    expect(gerarCsv(['V'], [[moedaCsv(180)]])).toBe('﻿V\r\n180,00');
  });
});
