import type { DailyDigest } from '@/lib/domain/digest';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Charge } from '@/types';
import { APP_URL, C, button, emailLayout, esc, p } from '../layout';

type DigestCharge = Charge & { client?: { nome?: string | null } | null };

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function grupo(titulo: string, cor: string, fundo: string, charges: DigestCharge[]) {
  if (charges.length === 0) return '';
  const itens = charges
    .map(
      (c) => `
        <tr>
          <td style="padding:12px 0;border-top:1px solid ${C.line};font-family:${FONT};">
            <span style="display:block;color:${C.ink};font-size:14px;font-weight:600;">${esc(c.client?.nome || 'Cliente')}</span>
            <span style="display:block;margin-top:2px;color:${C.ink3};font-size:13px;">${esc(c.descricao || 'Cobrança')} &middot; vence ${formatDate(c.data_vencimento)}</span>
          </td>
          <td align="right" valign="middle" style="padding:12px 0 12px 12px;border-top:1px solid ${C.line};color:${C.ink};font-family:${FONT};font-size:15px;font-weight:700;white-space:nowrap;">${formatCurrency(Number(c.valor) - Number(c.valor_pago || 0))}</td>
        </tr>`
    )
    .join('');
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
      <tr><td colspan="2" style="padding-bottom:10px;">
        <span style="display:inline-block;padding:4px 10px;border-radius:999px;background-color:${fundo};color:${cor};font-family:${FONT};font-size:12px;font-weight:700;">${titulo} &middot; ${charges.length}</span>
      </td></tr>
      ${itens}
    </table>`;
}

export function dailyDigestEmailTemplate(digest: DailyDigest, linkDescadastro: string | null) {
  const total = digest.venceHoje.length + digest.venceuOntem.length;
  const descadastro = linkDescadastro || `${APP_URL}/dashboard/settings?secao=avisos`;
  return emailLayout({
    preheader: `${total} ${total === 1 ? 'cobrança pede' : 'cobranças pedem'} atenção hoje. Em atraso: ${formatCurrency(digest.totalAtraso)}.`,
    eyebrow: 'Aviso do dia',
    tone: 'warn',
    title: 'Suas cobranças de hoje.',
    body: `
      ${p(`Total em atraso: <strong style="color:${C.neg};font-weight:700;">${formatCurrency(digest.totalAtraso)}</strong>`, { mt: 10 })}
      ${grupo('Vencem hoje', C.warn, C.warnSoft, digest.venceHoje)}
      ${grupo('Venceram ontem sem pagamento', C.neg, C.negSoft, digest.venceuOntem)}
      ${button(`${APP_URL}/dashboard`, 'Abrir meu painel')}
    `,
    footnote: `Você recebe este aviso só nos dias com vencimento. <a href="${descadastro}" style="color:${C.ink3};">Parar de receber</a>.`,
  });
}
