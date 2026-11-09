import { APP_URL, button, callout, emailLayout, esc, firstName, p, receipt, strong } from '../layout';
import { escapeHtml, formatCurrency } from '@/lib/utils';

export const refundEmailTemplate = (name: string, price: number, reason?: string) =>
  emailLayout({
    preheader: `Reembolso de ${formatCurrency(price)} processado. O valor volta em até 5 dias úteis.`,
    eyebrow: 'Reembolso',
    tone: 'info',
    title: 'Seu reembolso foi processado.',
    body: `
      ${p(`Oi, ${strong(firstName(name))}. O estorno da sua assinatura já foi feito.`)}
      ${receipt({
        label: 'Valor estornado',
        value: formatCurrency(price),
        note: 'Cai na sua conta ou fatura em até 5 dias úteis, conforme o banco.',
        tone: 'info',
        rows: reason ? [['Motivo', esc(reason)]] : undefined,
      })}
      ${p('Sua conta continua ativa no plano grátis, com seus clientes e cobranças guardados. Se quiser voltar ao Pro, é só assinar de novo.', { muted: true, size: 14 })}
      ${button(`${APP_URL}/dashboard`, 'Abrir minha conta', 'secondary')}
      ${callout('neutral', 'Ficou alguma dúvida?', 'Responda pelo e-mail de suporte abaixo que a gente explica.')}
    `,
    footnote: 'Obrigado por ter usado o Pro. Se algo não funcionou como esperava, conte pra gente: isso ajuda muito.',
  });

/** Internal notice to the team. Plain on purpose. */
export const refundRequestEmailToAdminTemplate = (name: string, email: string, price: number, reason: string, subscriptionId: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px;background-color:#F3F5F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0E1A14;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8E3;border-radius:16px;padding:24px;">
    <p style="margin:0;color:#3E5BD8;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Interno</p>
    <h2 style="margin:8px 0 16px;font-size:20px;">Nova solicitação de reembolso</h2>
    <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;line-height:1.6;">
      <tr><td style="color:#627168;width:140px;">Cliente</td><td>${escapeHtml(name)}</td></tr>
      <tr><td style="color:#627168;">E-mail</td><td>${escapeHtml(email)}</td></tr>
      <tr><td style="color:#627168;">Valor</td><td>${formatCurrency(price)}</td></tr>
      <tr><td style="color:#627168;">ID da assinatura</td><td>${escapeHtml(subscriptionId)}</td></tr>
      <tr><td style="color:#627168;vertical-align:top;">Motivo</td><td>${escapeHtml(reason)}</td></tr>
    </table>
    <p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #E2E8E3;font-size:14px;">Processe o reembolso no painel da Cakto (prazo de 7 dias).</p>
  </div>
</body>
</html>
`;
