import type { DailyDigest } from '@/lib/domain/digest';
import { EMPRESA } from '@/lib/legal';
import { escapeHtml, formatCurrency, formatDate } from '@/lib/utils';
import type { Charge } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

type DigestCharge = Charge & { client?: { nome?: string | null } | null };

function linhas(titulo: string, cor: string, charges: DigestCharge[]) {
  if (charges.length === 0) return '';
  const itens = charges
    .map(
      (c) => `
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #e2e8e3; color: #0e1a14; font-size: 14px;">
            <strong>${escapeHtml(c.client?.nome || 'Cliente')}</strong><br />
            <span style="color: #627168; font-size: 13px;">${escapeHtml(c.descricao || 'Cobrança')} · ${formatDate(c.data_vencimento)}</span>
          </td>
          <td align="right" style="padding: 10px 0; border-top: 1px solid #e2e8e3; color: #0e1a14; font-size: 14px; font-weight: 600; white-space: nowrap;">${formatCurrency(Number(c.valor) - Number(c.valor_pago || 0))}</td>
        </tr>`
    )
    .join('');
  return `
    <p style="margin: 24px 0 8px; color: ${cor}; font-size: 13px; font-weight: 700;">${titulo}</p>
    <table width="100%" cellpadding="0" cellspacing="0">${itens}</table>`;
}

export function dailyDigestEmailTemplate(digest: DailyDigest, linkDescadastro: string | null) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f5f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 12px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; padding: 32px;">
        <tr><td>
          <p style="margin: 0; color: #0a5f40; font-size: 18px; font-weight: 700;">VenceJá</p>
          <h1 style="margin: 16px 0 4px; color: #0e1a14; font-size: 22px;">Suas cobranças de hoje</h1>
          <p style="margin: 0; color: #627168; font-size: 14px;">Total em atraso: <strong style="color: #c92f28;">${formatCurrency(digest.totalAtraso)}</strong></p>
          ${linhas('Vencem hoje', '#b25e05', digest.venceHoje)}
          ${linhas('Venceram ontem sem pagamento', '#c92f28', digest.venceuOntem)}
          <table cellpadding="0" cellspacing="0" style="margin-top: 28px;"><tr><td style="background-color: #0f7550; border-radius: 12px;">
            <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 12px 20px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">Abrir meu painel</a>
          </td></tr></table>
          <p style="margin: 24px 0 0; color: #8f9c94; font-size: 12px;">Você recebe este aviso só nos dias com vencimento. <a href="${linkDescadastro || `${APP_URL}/dashboard/settings?secao=avisos`}" style="color: #627168;">Descadastrar deste aviso</a>.</p>
          <p style="margin: 8px 0 0; color: #8f9c94; font-size: 12px;">${EMPRESA.marca} · <a href="${EMPRESA.site}/help" style="color: #627168;">Ajuda e contato</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
