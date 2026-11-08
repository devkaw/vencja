type Cell = string | number | null | undefined;

function celula(value: Cell): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
  // A leading = + - @ would run as a formula when the file is opened in a spreadsheet.
  const texto = /^[\t\r=+\-@]/.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** Semicolon-separated with BOM: the format Excel opens correctly in pt-BR. */
export function gerarCsv(headers: string[], rows: Cell[][]): string {
  return '﻿' + [headers, ...rows].map((row) => row.map(celula).join(';')).join('\r\n');
}

/** Money always with two decimals ("180,00"), so a column reads the same in every row. */
export function moedaCsv(valor: number): string {
  return (Math.round(valor * 100) / 100).toFixed(2).replace('.', ',');
}
