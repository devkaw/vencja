'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, FileSpreadsheet, X } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { Segmented } from '@/components/ui/segmented';
import { AnimatedWords, Reveal } from '@/components/motion/primitives';
import { chargeState, diaLocal, diasDeAtraso, saldoAberto } from '@/lib/domain/charges';
import { resumirClientes } from '@/lib/domain/clients';
import { calcularPainel } from '@/lib/domain/metrics';
import { chargeVisual } from '@/lib/ui/status';
import { cn, formatCurrency } from '@/lib/utils';
import { createDemoData } from './demo-data';

const sheetRows = [
  ['Beto (oficina)', '650', '??/10', '', 'cobrar'],
  ['Rafael', '380', '12 dias atrás?', 'não', ''],
  ['Rafael', '220', '', 'NÃO', 'ver depois'],
  ['Carla', '180', 'hoje', '', ''],
  ['Studio Aurora', '420', 'parc 3', 'ok?', ''],
  ['Lucas', '120', '', 'pagou metade', ''],
];

const pains = [
  'Você precisa lembrar de abrir a planilha',
  'Atraso não aparece sozinho: você calcula na mão',
  'Mensagem de cobrança escrita do zero, toda vez',
  'Parcelas viram dezenas de linhas copiadas',
];

const gains = [
  'Aviso por e-mail nos dias de vencimento',
  'Atrasos em vermelho, com totais calculados na hora',
  'Mensagem pronta para o WhatsApp, com valor e dias de atraso',
  'Doze parcelas criadas de uma vez',
];

const moeda = (n: number) => formatCurrency(n).replace(',00', '');

const toneCls: Record<string, string> = {
  neg: 'bg-neg-soft text-neg',
  warn: 'bg-warn-soft text-warn',
  muted: 'bg-surface-3 text-ink-2',
  pos: 'bg-pos-soft text-pos',
};

// Same fictional data and same calculations as the product demo, so the numbers always add up.
function useAppView() {
  return useMemo(() => {
    const hoje = new Date();
    const { clients, charges } = createDemoData();
    const painel = calcularPainel(charges, hoje);
    const rows = resumirClientes(clients, charges, hoje)
      .map((s) => {
        const proxima = s.charges.filter((c) => c.status !== 'pago').sort((a, b) => diaLocal(a.data_vencimento).getTime() - diaLocal(b.data_vencimento).getTime())[0];
        if (s.qtdAtrasadas > 0) {
          const atraso = s.charges.reduce((m, c) => (c.status === 'pago' ? m : Math.max(m, diasDeAtraso(c, hoje))), 0);
          return { n: s.client.nome, valor: s.emAtraso, s: s.qtdAtrasadas > 1 ? `${s.qtdAtrasadas} vencidas · ${atraso} dias` : `${atraso} dias de atraso`, t: 'neg', cta: true };
        }
        if (!proxima) return null;
        const hojeVence = chargeState(proxima, hoje) === 'hoje';
        return { n: s.client.nome, valor: saldoAberto(proxima), s: hojeVence ? 'Vence hoje' : `${proxima.descricao} · ${chargeVisual(proxima).label.toLowerCase()}`, t: hojeVence ? 'warn' : 'muted', cta: false };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => Number(b.cta) - Number(a.cta) || (a.t === 'warn' ? -1 : b.t === 'warn' ? 1 : 0))
      .slice(0, 5);
    return { painel, rows };
  }, []);
}

export function SpreadsheetVs() {
  const [view, setView] = useState<'sheet' | 'app'>('sheet');
  const { painel, rows: appRows } = useAppView();

  return (
    <section className="relative py-20 lg:py-28" aria-labelledby="problema-title">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">O problema</p>
          <h2 id="problema-title" className="mt-3 font-display text-display-xl font-semibold text-ink">
<AnimatedWords text="Planilha não cobra ninguém." />
</h2>
          <p className="mt-4 text-lg text-ink-2">
            Ela guarda números, mas não avisa quem atrasou, não calcula quanto está parado e não escreve a mensagem. A VenceJá faz essa parte por você.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 flex flex-col items-center gap-2">
          <Segmented
            tone="glass"
            aria-label="Comparar"
            value={view}
            onChange={setView}
            options={[
              { value: 'sheet', label: 'Na planilha', icon: <FileSpreadsheet /> },
              { value: 'app', label: 'Na VenceJá', icon: <LogoMark size={14} /> },
            ]}
          />
          <p className="text-xs text-ink-3">Exemplo ilustrativo, com dados fictícios.</p>
        </Reveal>

        <Reveal y={30} className="mt-8 grid items-start gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
          <div className="relative min-h-[380px]">
            <AnimatePresence mode="wait" initial={false}>
              {view === 'sheet' ? (
                <motion.div
                  key="sheet"
                  initial={{ opacity: 0, rotate: -1.5, y: 12 }}
                  animate={{ opacity: 1, rotate: -0.6, y: 0 }}
                  exit={{ opacity: 0, rotate: 1, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
                >
                  <div className="flex items-center gap-2 border-b border-line bg-surface-3 px-4 py-2 text-xs font-medium text-ink-2">
                    <FileSpreadsheet className="size-4" />
                    cobrancas_FINAL_v3 (1).xlsx
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse font-mono text-[12px]">
                      <thead>
                        <tr className="bg-surface-2 text-ink-3">
                          <th className="w-8 border border-line px-2 py-1 font-normal" />
                          {['A · cliente', 'B · valor', 'C · venc.', 'D · pago?', 'E · obs'].map((h) => (
                            <th key={h} className="border border-line px-2 py-1 text-left font-normal">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sheetRows.map((r, i) => (
                          <tr key={i}>
                            <td className="border border-line bg-surface-2 px-2 py-1.5 text-center text-ink-4">{i + 2}</td>
                            {r.map((c, j) => (
                              <td
                                key={j}
                                className={cn(
                                  'border border-line px-2 py-1.5 text-ink-2',
                                  (c === 'NÃO' || c === 'não') && 'bg-[#FDECEA] text-[#C92F28] dark:bg-neg-soft dark:text-neg',
                                  c === '' && 'bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgb(var(--ink)/0.03)_4px,rgb(var(--ink)/0.03)_8px)]'
                                )}
                              >
                                {c}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr>
                          <td className="border border-line bg-surface-2 px-2 py-1.5 text-center text-ink-4">8</td>
                          <td className="border border-line px-2 py-1.5 text-ink-3">TOTAL</td>
                          <td className="border-2 border-brand-500 px-2 py-1.5 text-[#C92F28]">#REF!</td>
                          <td className="border border-line" colSpan={3} />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="app"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="glass rounded-[26px] p-4"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['Em atraso', moeda(painel.emAtraso), 'text-neg'],
                      ['A receber', moeda(painel.aReceber), 'text-ink'],
                      ['Recebido no mês', moeda(painel.recebidoMes), 'text-pos'],
                    ].map(([l, v, c]) => (
                      <div key={l} className="rounded-2xl bg-surface/80 p-3 shadow-xs">
                        <p className="text-2xs font-medium text-ink-3">{l}</p>
                        <p className={cn('mt-1 font-display text-lg font-semibold tnum', c)}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <ul className="mt-3 space-y-2">
                    {appRows.map((r) => (
                      <li key={r.n} className="flex items-center gap-3 rounded-2xl bg-surface/80 px-3.5 py-2.5 shadow-xs">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{r.n}</p>
                          <span className={cn('mt-0.5 inline-block rounded-full px-2 py-0.5 text-2xs font-medium', toneCls[r.t])}>{r.s}</span>
                        </div>
                        <span className="text-sm font-semibold text-ink tnum">{formatCurrency(r.valor)}</span>
                        {r.cta ? (
                          <span className="flex h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 text-xs font-semibold text-white">
                            <WhatsAppIcon className="size-3.5" />
                            Cobrar
                          </span>
                        ) : (
                          <span className="w-[74px]" />
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.ul key={view} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }} className="space-y-3 lg:pt-4">
              {(view === 'sheet' ? pains : gains).map((t) => (
                <li key={t} className="glass flex items-start gap-3 rounded-2xl p-4 transition-transform duration-300 ease-spring hover:scale-[1.04]">
                  <span
                    className={cn(
                      'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
                      view === 'sheet' ? 'bg-neg-soft text-neg' : 'bg-brand-600 text-white'
                    )}
                  >
                    {view === 'sheet' ? <X className="size-3.5" strokeWidth={3} /> : <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="text-[15px] text-ink">{t}</span>
                </li>
              ))}
              {view === 'sheet' && (
                <li>
                  <button onClick={() => setView('app')} className="mt-1 text-sm font-semibold text-brand-ink hover:underline">
                    Ver o mesmo controle na VenceJá →
                  </button>
                </li>
              )}
            </motion.ul>
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  );
}
