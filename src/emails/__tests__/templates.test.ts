import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dailyDigestEmailTemplate } from '../templates/daily-digest-email';
import { orderReceivedEmailTemplate } from '../templates/order-received-email';
import {
  cancellationRequestReceivedEmailTemplate,
  paymentConfirmedEmailTemplate,
  paymentRejectedEmailTemplate,
  refundRequestReceivedEmailTemplate,
  subscriptionCanceledEmailTemplate,
} from '../templates/payment-email';
import { refundEmailTemplate, refundRequestEmailToAdminTemplate } from '../templates/refund-email';
import { renewalConfirmedEmailTemplate, renewalReminderEmailTemplate } from '../templates/renewal-email';
import { resetPasswordEmailTemplate } from '../templates/reset-password-email';
import { verificationEmailTemplate } from '../templates/verification-email';
import type { Charge } from '@/types';

const XSS = '<script>alert(1)</script>';
const charge = (over: Partial<Charge>) =>
  ({ id: 'c', valor: 350, valor_pago: 0, status: 'pendente', descricao: 'Mensalidade', data_vencimento: '2026-11-09', client: { nome: 'Carla Mendes' }, ...over }) as unknown as Charge;

const emails: Record<string, string> = {
  verificacao: verificationEmailTemplate('Kadu Teste', 'https://www.venceja.com.br/auth/callback?token=abc'),
  'nova-senha': resetPasswordEmailTemplate('Kadu Teste', 'https://www.venceja.com.br/reset-password?token=abc'),
  'pedido-recebido': orderReceivedEmailTemplate('Kadu Teste', 'monthly', 49.9, 'A1B2C3'),
  'pagamento-confirmado': paymentConfirmedEmailTemplate('Kadu Teste', 'annual', 499),
  'pagamento-recusado': paymentRejectedEmailTemplate('Kadu Teste', 'Cartão sem limite'),
  'assinatura-cancelada': subscriptionCanceledEmailTemplate('Kadu Teste', '04/12/2026'),
  'cancelamento-recebido': cancellationRequestReceivedEmailTemplate('Kadu Teste', 'monthly', '04/12/2026'),
  'reembolso-recebido': refundRequestReceivedEmailTemplate('Kadu Teste', 'monthly', 49.9, 5),
  reembolso: refundEmailTemplate('Kadu Teste', 49.9, 'Não era o que eu esperava'),
  'reembolso-admin': refundRequestEmailToAdminTemplate('Kadu Teste', 'kadu@example.com', 49.9, 'Motivo', 'sub_123'),
  'renovacao-aviso': renewalReminderEmailTemplate('Kadu Teste', 'monthly', 49.9, '2026-12-04T12:00:00Z'),
  'renovacao-ok': renewalConfirmedEmailTemplate('Kadu Teste', 'annual', 499, '2027-11-04T12:00:00Z'),
  'aviso-diario': dailyDigestEmailTemplate(
    { venceHoje: [charge({}), charge({ id: 'd', valor: 120, client: { nome: 'Lucas Prado' } } as Partial<Charge>)], venceuOntem: [charge({ id: 'e', valor: 800, valor_pago: 200, data_vencimento: '2026-11-08', client: { nome: 'Oficina do Beto' } } as Partial<Charge>)], totalAtraso: 1250 },
    'https://www.venceja.com.br/descadastrar?t=abc'
  ),
};

describe('e-mails', () => {
  it.each(Object.entries(emails))('%s usa a marca nova', (_, html) => {
    expect(html).not.toMatch(/VenceJa(?!\w)/);
    expect(html).not.toContain('#000000');
    expect(html).not.toContain('logo.png');
  });

  it.each(Object.entries(emails).filter(([k]) => k !== 'reembolso-admin'))('%s tem logo, pré-cabeçalho e contato', (_, html) => {
    expect(html).toContain('/logo-email.png');
    expect(html).toContain('suporte@venceja.com.br');
    expect(html).toContain('lang="pt-BR"');
  });

  it('escapa o que vem de fora', () => {
    const htmls = [
      verificationEmailTemplate(XSS, 'https://x'),
      paymentRejectedEmailTemplate(XSS, XSS),
      refundEmailTemplate(XSS, 10, XSS),
      refundRequestEmailToAdminTemplate(XSS, XSS, 10, XSS, XSS),
      orderReceivedEmailTemplate(XSS, 'monthly', 10, XSS),
      dailyDigestEmailTemplate({ venceHoje: [charge({ descricao: XSS, client: { nome: XSS } } as Partial<Charge>)], venceuOntem: [], totalAtraso: 0 }, null),
    ];
    for (const html of htmls) expect(html).not.toContain('<script>');
  });

  it('grava as prévias quando EMAIL_PREVIEW_DIR está definido', () => {
    const dir = process.env.EMAIL_PREVIEW_DIR;
    if (!dir) return;
    mkdirSync(dir, { recursive: true });
    for (const [nome, html] of Object.entries(emails)) writeFileSync(join(dir, `${nome}.html`), html);
  });
});
