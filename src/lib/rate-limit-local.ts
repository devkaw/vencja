/** In-memory counter. Used only when the shared limiter is unreachable; each server instance counts alone. */
export function contadorLocal() {
  const janelas = new Map<string, { contagem: number; reiniciaEm: number }>();
  return (chave: string, maximo: number, janelaSegundos: number, agora: number = Date.now()): boolean => {
    const atual = janelas.get(chave);
    if (!atual || atual.reiniciaEm <= agora) {
      if (janelas.size > 10_000) janelas.clear();
      janelas.set(chave, { contagem: 1, reiniciaEm: agora + janelaSegundos * 1000 });
      return true;
    }
    atual.contagem += 1;
    return atual.contagem <= maximo;
  };
}
