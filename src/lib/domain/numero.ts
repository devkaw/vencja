/**
 * Reads a money value typed by a Brazilian user.
 * "1.500,00" and "1500,5" are decimal with comma; "1.500" (dot + 3 digits) is thousands.
 */
export function parseValorBR(entrada: string): number {
  const limpo = entrada.trim().replace(/\s/g, '');
  if (!limpo) return NaN;
  if (limpo.includes(',')) {
    return Number(limpo.replace(/\./g, '').replace(',', '.'));
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    return Number(limpo.replace(/\./g, ''));
  }
  return Number(limpo);
}
