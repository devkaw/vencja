import { createHmac, timingSafeEqual } from 'crypto';

function assinatura(carga: string, segredo: string) {
  return createHmac('sha256', segredo).update(`descadastro:${carga}`).digest('base64url');
}

/** Signed so the e-mail link works without login and cannot be forged for another user. */
export function assinarDescadastro(userId: string, segredo: string): string {
  const carga = Buffer.from(userId).toString('base64url');
  return `${carga}.${assinatura(carga, segredo)}`;
}

export function verificarDescadastro(token: string, segredo: string): string | null {
  const [carga, recebida, resto] = token.split('.');
  if (!carga || !recebida || resto !== undefined) return null;
  const esperada = Buffer.from(assinatura(carga, segredo));
  const obtida = Buffer.from(recebida);
  if (esperada.length !== obtida.length || !timingSafeEqual(esperada, obtida)) return null;
  return Buffer.from(carga, 'base64url').toString();
}

export function segredoDescadastro(): string | null {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || null;
}
