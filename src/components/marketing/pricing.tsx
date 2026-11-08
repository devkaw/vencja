'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Minus, RotateCcw, ShieldCheck, Sparkles, Zap, BadgeDollarSign, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { ANNUAL_PER_MONTH, ANNUAL_SAVINGS, PRICE_ANNUAL, PRICE_MONTHLY, brl, comparison } from '@/lib/ui/pricing';
import { cn } from '@/lib/utils';
import { SUPORTE_PRIORITARIO } from '@/lib/legal';
import { useIsLoggedIn } from './use-session';
import { AnimatedWords, GlassPanel, Reveal, Stagger, StaggerItem } from '@/components/motion/primitives';

export function Pricing() {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('annual');
  const [showTable, setShowTable] = useState(false);
  const loggedIn = useIsLoggedIn();
  const annual = cycle === 'annual';

  return (
    <section id="precos" className="relative py-20 lg:py-28" aria-labelledby="precos-title">
      <div className="container-x relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Preços</p>
          <h2 id="precos-title" className="mt-3 font-display text-display-xl font-semibold text-ink">
<AnimatedWords text="Comece grátis. Assine quando crescer." />
</h2>
          <p className="mt-4 text-lg text-ink-2">O plano grátis não tem prazo para acabar. O Pro é para quem tem mais clientes ou quer cobrar pelo WhatsApp com um toque.</p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 flex justify-center">
          <Segmented
            tone="glass"
            aria-label="Ciclo de cobrança"
            value={cycle}
            onChange={setCycle}
            options={[
              { value: 'monthly', label: 'Mensal' },
              {
                value: 'annual',
                label: (
                  <>
                    Anual <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-2xs font-semibold text-white">2 meses grátis</span>
                  </>
                ),
              },
            ]}
          />
        </Reveal>

        <Reveal y={30} className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2 lg:gap-6">
          <GlassPanel className="flex flex-col rounded-3xl p-7" grow={1.03}>
            <p className="font-display text-lg font-semibold text-ink">Grátis</p>
            <p className="mt-1 text-sm text-ink-3">Para organizar os primeiros clientes.</p>
            <p className="mt-6 font-display text-5xl font-semibold tracking-tight text-ink">R$ 0</p>
            <p className="mt-1 text-sm text-ink-3">para sempre</p>
            <ul className="mt-7 space-y-3 text-[15px] text-ink-2">
              {['Até 3 clientes e 10 cobranças', 'Painel, calendário e ranking', 'Score explicado de cada cliente', 'Aviso diário por e-mail', 'Parcelas, recorrência e pagamento parcial'].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="mt-1 size-4 shrink-0 text-ink-3" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <Button asChild variant="secondary" size="lg" className="w-full">
                <Link href={loggedIn ? '/dashboard' : '/register'}>{loggedIn ? 'Abrir meu painel' : 'Criar conta grátis'}</Link>
              </Button>
            </div>
          </GlassPanel>

          <motion.div whileHover={{ scale: 1.03, zIndex: 10 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="relative rounded-[26px] bg-gradient-to-b from-brand-400 via-brand-600/50 to-brand-600/5 p-[1.5px] shadow-float">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[24.5px] bg-surface p-7">
              <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
              <div className="relative flex items-center justify-between">
                <p className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                  Pro <Sparkles className="size-4 text-brand-ink" />
                </p>
                <span className="rounded-full bg-brand-600 px-2.5 py-1 text-2xs font-semibold uppercase tracking-wide text-white">Mais completo</span>
              </div>
              <p className="relative mt-1 text-sm text-ink-3">Para quem quer cobrar sem limite.</p>
              <div className="relative mt-6 flex items-baseline gap-1.5">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={cycle}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.25 }}
                    className="font-display text-5xl font-semibold tracking-tight text-ink tnum"
                  >
                    R$ {brl(annual ? ANNUAL_PER_MONTH : PRICE_MONTHLY)}
                  </motion.span>
                </AnimatePresence>
                <span className="text-sm text-ink-3">/mês</span>
              </div>
              <p className="relative mt-1 text-sm text-ink-3">{annual ? `R$ ${brl(PRICE_ANNUAL)} por ano, com renovação automática · você economiza R$ ${brl(ANNUAL_SAVINGS)}` : 'Cobrado todo mês, com renovação automática'}</p>
              <ul className="relative mt-7 space-y-3 text-[15px] text-ink">
                {[
                  { t: 'Clientes e cobranças ilimitados' },
                  { t: 'Cobrança pelo WhatsApp com mensagem pronta', wa: true },
                  { t: 'Relatórios mensais e anuais' },
                  { t: 'Exportação em CSV' },
                  { t: SUPORTE_PRIORITARIO },
                  { t: 'Tudo do plano grátis' },
                ].map((f) => (
                  <li key={f.t} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                      {f.wa ? <WhatsAppIcon className="size-3" /> : <Check className="size-3" strokeWidth={3} />}
                    </span>
                    {f.t}
                  </li>
                ))}
              </ul>
              <div className="relative mt-auto pt-8">
                <Button asChild size="xl" className="w-full">
                  <Link href={loggedIn ? '/dashboard/upgrade' : '/register'}>Assinar o Pro</Link>
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-3">
                  <RotateCcw className="size-3.5" />Renova automaticamente · 7 dias de garantia · cancele sem multa
                </p>
              </div>
            </div>
          </motion.div>
        </Reveal>

        <Stagger as="ul" className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2" stagger={0.06}>
          {[
            { icon: ShieldCheck, t: 'Baixe ou exclua seus dados' },
            { icon: Zap, t: 'Ativa ao confirmar o pagamento' },
            { icon: BadgeDollarSign, t: 'Sem taxa de setup' },
            { icon: Ban, t: 'Cancele sem multa' },
            { icon: RotateCcw, t: '7 dias de garantia' },
          ].map((x) => (
            <StaggerItem as="li" key={x.t}>
              <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-ink-2 transition-transform duration-300 ease-spring hover:scale-110">
                <x.icon className="size-4 text-brand-ink" />
                {x.t}
              </span>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mx-auto mt-8 max-w-4xl">
          <button
            onClick={() => setShowTable((v) => !v)}
            aria-expanded={showTable}
            className="mx-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-ink/5 hover:text-ink"
          >
            {showTable ? 'Esconder comparação' : 'Ver comparação completa'}
            <ChevronDown className={cn('size-4 transition-transform', showTable && 'rotate-180')} />
          </button>
          <AnimatePresence initial={false}>
            {showTable && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-surface shadow-card">
                  <table className="w-full text-sm">
                    <thead className="border-b border-line bg-surface-2/60 dark:bg-surface-2">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-ink-3">Recurso</th>
                        <th className="w-24 px-3 py-3 text-center text-xs font-medium text-ink-3">Grátis</th>
                        <th className="w-24 px-5 py-3 text-center text-xs font-semibold text-brand-ink">Pro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {comparison.map((row) => (
                        <tr key={row.label}>
                          <td className="px-5 py-3 text-ink-2">{row.label}</td>
                          {[row.free, row.pro].map((v, i) => (
                            <td key={i} className={cn('px-3 py-3 text-center', i === 1 && 'bg-brand-soft/30')}>
                              {typeof v === 'string' ? (
                                <span className={cn('text-xs font-semibold', i === 1 ? 'text-brand-ink' : 'text-ink-2')}>{v}</span>
                              ) : v ? (
                                <Check className={cn('mx-auto size-4', i === 1 ? 'text-brand-ink' : 'text-ink-3')} aria-label="Incluso" />
                              ) : (
                                <Minus className="mx-auto size-4 text-ink-4" aria-label="Não incluso" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
