export const SENHA_MINIMA = 8;

const COMUNS = new Set(['12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', 'password', 'password1', 'senha123', 'senha1234', 'qwerty123', 'abc12345', 'abcd1234', 'venceja1', 'venceja123', 'iloveyou', 'admin123']);

/** Same rule on the client and on the API, so the form never accepts what the server refuses. */
export function erroDeSenha(senha: unknown): string | null {
  if (typeof senha !== 'string' || senha.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  if (senha.length > 72) return 'A senha pode ter no máximo 72 caracteres.';
  if (COMUNS.has(senha.toLowerCase())) return 'Essa senha é muito comum. Escolha outra.';
  return null;
}
