/**
 * Building blocks for every e-mail the VenceJá sends, in the same language as the site:
 * calm "paper" canvas, white card, deep money green, Bricolage-style headings.
 * E-mail clients ignore most CSS, so everything is inline and laid out with tables.
 */
import { EMPRESA } from '@/lib/legal';
import { escapeHtml } from '@/lib/utils';

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
/** Images always come from the public site, so they load even when the e-mail is sent from a preview. */
const ASSET_URL = EMPRESA.site;

/** Light-theme tokens from globals.css. */
export const C = {
  canvas: '#F3F5F1',
  surface: '#FFFFFF',
  surface2: '#F7F9F6',
  ink: '#0E1A14',
  ink2: '#3A4A41',
  ink3: '#627168',
  ink4: '#8F9C94',
  line: '#E2E8E3',
  greenFrom: '#0F7550',
  greenTo: '#084D33',
  brandInk: '#085438',
  brandSoft: '#DBF0E8',
  pos: '#0C6A47',
  posSoft: '#DBF0E8',
  warn: '#B25E05',
  warnSoft: '#FFF3DC',
  neg: '#C92F28',
  negSoft: '#FDECEA',
  info: '#3E5BD8',
  infoSoft: '#EAEEFD',
} as const;

export type Tone = 'brand' | 'pos' | 'warn' | 'neg' | 'info' | 'neutral';

const TONES: Record<Tone, { fg: string; bg: string }> = {
  brand: { fg: C.brandInk, bg: C.brandSoft },
  pos: { fg: C.pos, bg: C.posSoft },
  warn: { fg: C.warn, bg: C.warnSoft },
  neg: { fg: C.neg, bg: C.negSoft },
  info: { fg: C.info, bg: C.infoSoft },
  neutral: { fg: C.ink2, bg: C.surface2 },
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const DISPLAY = "'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const esc = (v: string | null | undefined) => escapeHtml(String(v ?? ''));
export const firstName = (name: string | null | undefined) => esc((name || '').trim().split(/\s+/)[0] || 'tudo bem');

/** Plain paragraph. Pass already-escaped HTML. */
export function p(html: string, opts: { muted?: boolean; size?: number; mt?: number } = {}) {
  const { muted, size = 15, mt = 14 } = opts;
  return `<p style="margin:${mt}px 0 0;color:${muted ? C.ink3 : C.ink2};font-family:${FONT};font-size:${size}px;line-height:1.6;">${html}</p>`;
}

export function strong(html: string) {
  return `<strong style="color:${C.ink};font-weight:600;">${html}</strong>`;
}

/** Main call to action: the green glass button of the site, with a flat fallback for Outlook. */
export function button(href: string, label: string, variant: 'primary' | 'secondary' = 'primary') {
  const primary = variant === 'primary';
  const bg = primary ? C.greenFrom : C.surface;
  const style = primary
    ? `background-color:${C.greenFrom};background-image:linear-gradient(180deg,${C.greenFrom},${C.greenTo});color:#FFFFFF;border:1px solid ${C.greenTo};`
    : `background-color:${C.surface};color:${C.ink};border:1px solid ${C.line};`;
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
    <tr><td bgcolor="${bg}" style="border-radius:14px;${primary ? `background-color:${C.greenFrom};` : ''}">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 26px;border-radius:14px;font-family:${FONT};font-size:15px;font-weight:600;line-height:1;text-decoration:none;${style}">${label}&nbsp;&rarr;</a>
    </td></tr>
  </table>`;
}

/** "If the button does not work" line with the raw link. */
export function linkFallback(href: string) {
  return `<p style="margin:16px 0 0;color:${C.ink4};font-family:${FONT};font-size:12px;line-height:1.5;">Se o botão não abrir, copie e cole no navegador:<br /><a href="${href}" style="color:${C.brandInk};word-break:break-all;">${esc(href)}</a></p>`;
}

/** Soft colored box with a short title, like the app's banners. */
export function callout(tone: Tone, title: string, html: string) {
  const t = TONES[tone];
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
    <tr><td style="background-color:${t.bg};border-radius:16px;padding:16px 18px;">
      <p style="margin:0;color:${t.fg};font-family:${FONT};font-size:13px;font-weight:700;">${title}</p>
      <p style="margin:6px 0 0;color:${C.ink2};font-family:${FONT};font-size:14px;line-height:1.55;">${html}</p>
    </td></tr>
  </table>`;
}

/** The "receipt": a quiet panel with label/value rows and an optional big figure on top. */
export function receipt(opts: { label: string; value: string; note?: string; rows?: [string, string][]; tone?: Tone }) {
  const t = TONES[opts.tone ?? 'brand'];
  const rows = (opts.rows ?? [])
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:10px 0 0;border-top:1px solid ${C.line};color:${C.ink3};font-family:${FONT};font-size:13px;">${k}</td>
        <td align="right" style="padding:10px 0 0;border-top:1px solid ${C.line};color:${C.ink};font-family:${FONT};font-size:13px;font-weight:600;">${v}</td>
      </tr>`
    )
    .join('');
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
    <tr><td style="background-color:${C.surface2};border:1px solid ${C.line};border-radius:18px;padding:20px;">
      <p style="margin:0;color:${t.fg};font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${opts.label}</p>
      <p style="margin:6px 0 0;color:${C.ink};font-family:${DISPLAY};font-size:30px;font-weight:700;letter-spacing:-0.02em;line-height:1.1;">${opts.value}</p>
      ${opts.note ? `<p style="margin:4px 0 0;color:${C.ink3};font-family:${FONT};font-size:13px;">${opts.note}</p>` : ''}
      ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">${rows}</table>` : ''}
    </td></tr>
  </table>`;
}

/** List with green check marks (or numbered steps). */
export function list(items: string[], opts: { title?: string; numbered?: boolean; tone?: Tone } = {}) {
  const t = TONES[opts.tone ?? 'brand'];
  const rows = items
    .map(
      (item, i) => `
      <tr>
        <td width="30" valign="top" style="padding:8px 0 0;">
          <div style="width:22px;height:22px;border-radius:11px;background-color:${t.bg};color:${t.fg};font-family:${FONT};font-size:12px;font-weight:700;line-height:22px;text-align:center;">${opts.numbered ? i + 1 : '&#10003;'}</div>
        </td>
        <td valign="top" style="padding:9px 0 0;color:${C.ink2};font-family:${FONT};font-size:14px;line-height:1.5;">${item}</td>
      </tr>`
    )
    .join('');
  return `
  ${opts.title ? `<p style="margin:26px 0 2px;color:${C.ink};font-family:${FONT};font-size:14px;font-weight:700;">${opts.title}</p>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:${opts.title ? 0 : 20}px;">${rows}</table>`;
}

/** What the Pro adds, same list as PLANS.pro in lib/subscription. */
export const PRO_FEATURES = (suporte: string) => [
  'Clientes e cobranças ilimitados',
  'Cobrança pelo WhatsApp com a mensagem pronta',
  'Relatórios completos e exportação em CSV',
  suporte,
];

interface LayoutOptions {
  /** Hidden line shown by the inbox next to the subject. */
  preheader: string;
  eyebrow: string;
  tone?: Tone;
  title: string;
  /** Body HTML, already escaped. */
  body: string;
  /** Small print under the card (why this e-mail was sent). */
  footnote?: string;
}

export function emailLayout({ preheader, eyebrow, tone = 'brand', title, body, footnote }: LayoutOptions) {
  const t = TONES[tone];
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${esc(title)}</title>
  <style>
    @media (max-width: 600px) {
      .vj-card { padding: 28px 22px !important; border-radius: 20px !important; }
      .vj-title { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.canvas};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.canvas};">${esc(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.canvas}" style="background-color:${C.canvas};">
    <tr><td align="center" style="padding:36px 14px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr><td style="padding:0 6px 20px;">
          <a href="${EMPRESA.site}" target="_blank" style="text-decoration:none;">
            <img src="${ASSET_URL}/logo-email.png" width="83" height="36" alt="VenceJá" style="display:block;width:83px;height:36px;border:0;outline:none;" />
          </a>
        </td></tr>
        <tr><td class="vj-card" style="background-color:${C.surface};border:1px solid ${C.line};border-radius:24px;padding:36px 36px 34px;">
          <span style="display:inline-block;padding:5px 11px;border-radius:999px;background-color:${t.bg};color:${t.fg};font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">${eyebrow}</span>
          <h1 class="vj-title" style="margin:16px 0 0;color:${C.ink};font-family:${DISPLAY};font-size:28px;font-weight:700;letter-spacing:-0.025em;line-height:1.15;">${title}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:24px 10px 0;color:${C.ink4};font-family:${FONT};font-size:12px;line-height:1.6;">
          ${footnote ? `<p style="margin:0 0 10px;">${footnote}</p>` : ''}
          <p style="margin:0;">Dúvidas? Escreva para <a href="mailto:${EMPRESA.emailSuporte}" style="color:${C.ink3};">${EMPRESA.emailSuporte}</a> ou veja a <a href="${EMPRESA.site}/help" style="color:${C.ink3};">central de ajuda</a>.</p>
          <p style="margin:10px 0 0;">&copy; ${year} ${EMPRESA.marca} &middot; Controle de cobranças para autônomos e pequenos negócios</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
