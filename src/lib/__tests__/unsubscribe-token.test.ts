import { describe, expect, it } from 'vitest';
import { assinarDescadastro, verificarDescadastro } from '../email/unsubscribe-token';

const SEGREDO = 'segredo-de-teste';

describe('token de descadastro', () => {
  it('devolve o usuário de um token válido', () => {
    expect(verificarDescadastro(assinarDescadastro('user-1', SEGREDO), SEGREDO)).toBe('user-1');
  });
  it('recusa token adulterado', () => {
    const t = assinarDescadastro('user-1', SEGREDO);
    expect(verificarDescadastro(t.replace('dXNlci0x', 'dXNlci0y'), SEGREDO)).toBeNull();
  });
  it('recusa outro segredo e lixo', () => {
    expect(verificarDescadastro(assinarDescadastro('user-1', SEGREDO), 'outro')).toBeNull();
    expect(verificarDescadastro('lixo', SEGREDO)).toBeNull();
    expect(verificarDescadastro('', SEGREDO)).toBeNull();
  });
});
