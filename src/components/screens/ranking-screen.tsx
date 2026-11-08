'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, ChevronDown, Clock, PartyPopper, Receipt, Users } from 'lucide-react';
import { AnimatedNumber } from '@/components/data/animated-number';
import { Avatar } from '@/components/data/avatar';
import { ScoreRing } from '@/components/data/charts';
import { EmptyState } from '@/components/data/empty-state';
import { GlassPanel, Reveal, Stagger, StaggerItem } from '@/components/motion/primitives';
import { WLink, useWorkspace } from '@/components/workspace/workspace-context';
import { faixasAtraso, rankingInadimplencia, type RankingItem } from '@/lib/domain/metrics';
import { cn, formatCurrency } from '@/lib/utils';
import { ChargeList } from './kit/charge-list';
import { LeadPanel } from './kit/lead-panel';
import { PageHero } from './kit/page-hero';
import { Panel } from './kit/panel';

const ease = [0.16, 1, 0.3, 1] as const;

export function RankingScreen({ onWhatsApp }: { onWhatsApp?: () => void }) {
  const { summaries, hoje, painel, charges } = useWorkspace();
  const [aberto, setAberto] = useState<string | null>(null);

  const ranking = useMemo(() => rankingInadimplencia(summaries, hoje), [summaries, hoje]);
  const faixas = useMemo(() => faixasAtraso(ranking), [ranking]);
  const total = painel.emAtraso;
  const mediaDias = ranking.length ? Math.round(ranking.reduce((s, r) => s + r.mediaDias, 0) / ranking.length) : 0;
  const podio = ranking.slice(0, 3);
  const maiorFaixa = Math.max(1, ...faixas.map((f) => f.valor));
  const comCliente = (item: RankingItem) => item.charges.map((c) => charges.find((x) => x.id === c.id) ?? c);

  return (
    <div className="space-y-6 @2xl:space-y-8">
      <PageHero eyebrow="Inadimplência" title="Por onde começar" highlight="a cobrar." description="Quem está devendo, quanto e há quanto tempo. Comece pelo topo." />

      {ranking.length === 0 ? (
        <GlassPanel lift={false} className="rounded-[28px]">
          <EmptyState icon={<PartyPopper />} title="Ninguém em atraso" description="Todas as cobranças vencidas foram pagas. Quando alguém atrasar, aparece aqui em ordem de prioridade." />
        </GlassPanel>
      ) : (
        <>
          <div className="grid gap-4 @4xl:grid-cols-12 @4xl:gap-6">
            <LeadPanel icon={AlertTriangle} label="Total em atraso" className="min-h-[240px] @4xl:col-span-5">
              <p className="mt-auto truncate pt-8 font-display text-[clamp(2.2rem,6cqw,3.4rem)] font-bold leading-none tracking-[-0.03em] tnum">
                <AnimatedNumber value={total} format={formatCurrency} />
              </p>
              <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                {[
                  { icon: Users, n: ranking.length, l: ranking.length === 1 ? 'cliente' : 'clientes' },
                  { icon: Receipt, n: painel.qtdAtraso, l: painel.qtdAtraso === 1 ? 'cobrança' : 'cobranças' },
                  { icon: Clock, n: mediaDias, l: 'dias em média' },
                ].map((x) => (
                  <div key={x.l} className="min-w-0">
                    <dt className="truncate text-xs text-white/70">{x.l}</dt>
                    <dd className="font-display text-xl font-semibold tnum">{x.n}</dd>
                  </div>
                ))}
              </dl>
            </LeadPanel>

            <Panel className="@4xl:col-span-7" eyebrow="Idade da dívida" title="Faixas de atraso" hint="Quanto mais antiga, mais difícil de receber">
              <ul className="space-y-4">
                {faixas.map((f, i) => (
                  <li key={f.label}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink-2">
                        {f.label} <span className="text-ink-4">· {f.qtd}</span>
                      </span>
                      <span className="truncate font-semibold text-ink tnum">{formatCurrency(f.valor)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-ink/[0.06]">
                      <motion.div className={cn('h-full rounded-full', ['bg-warn', 'bg-neg/70', 'bg-neg'][i])} initial={{ width: 0 }} whileInView={{ width: `${(f.valor / maiorFaixa) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.1, ease }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Stagger as="ol" className={cn('grid gap-3 @4xl:gap-4', podio.length === 2 ? '@2xl:grid-cols-2' : podio.length > 2 && '@4xl:grid-cols-3')} stagger={0.1}>
            {podio.map((item, i) => (
              <StaggerItem as="li" key={item.summary.client.id}>
                <GlassPanel strong={i === 0} className="flex h-full flex-col rounded-[28px] p-5">
                  <span className="pointer-events-none absolute -right-2 -top-6 select-none font-display text-[7rem] font-bold leading-none text-neg/[0.08]" aria-hidden>
                    {i + 1}
                  </span>
                  <div className="relative flex items-center gap-3">
                    <Avatar name={item.summary.client.nome} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{item.summary.client.nome}</p>
                      <p className="text-xs text-ink-3">
                        {item.qtd} {item.qtd === 1 ? 'vencida' : 'vencidas'} · até {item.maiorAtraso} dias
                      </p>
                    </div>
                  </div>
                  <p className="relative mt-4 truncate font-display text-2xl font-semibold text-neg tnum">{formatCurrency(item.total)}</p>
                  <p className="relative text-xs text-ink-3 tnum">{((item.total / total) * 100).toFixed(1).replace('.', ',')}% do total em atraso</p>
                  <WLink href={`/dashboard/clients/${item.summary.client.id}`} className="relative mt-auto inline-flex min-h-11 items-center gap-1.5 pt-3 text-sm font-semibold text-brand-ink">
                    Abrir cliente e cobrar
                    <ArrowUpRight className="size-4" />
                  </WLink>
                </GlassPanel>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal y={26}>
            <GlassPanel lift={false} className="rounded-[28px]">
              <ol className="divide-y divide-line/70">
                {ranking.map((item, index) => {
                  const pct = total > 0 ? (item.total / total) * 100 : 0;
                  const open = aberto === item.summary.client.id;
                  return (
                    <li key={item.summary.client.id}>
                      <button onClick={() => setAberto(open ? null : item.summary.client.id)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-ink/[0.03] @2xl:gap-4 @2xl:px-6">
                        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold tnum', index === 0 ? 'bg-neg text-white dark:text-canvas' : index < 3 ? 'bg-neg-soft text-neg' : 'bg-surface-3 text-ink-3')}>{index + 1}</span>
                        <Avatar name={item.summary.client.nome} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{item.summary.client.nome}</p>
                          <p className="truncate text-xs text-ink-3">
                            {item.qtd} {item.qtd === 1 ? 'cobrança vencida' : 'cobranças vencidas'} · {item.mediaDias} dias em média
                          </p>
                          <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-ink/[0.06]">
                            <motion.div className="h-full rounded-full bg-neg" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 + Math.min(index, 10) * 0.04, ease }} />
                          </div>
                        </div>
                        <div className="hidden @2xl:block">
                          <ScoreRing score={item.summary.score.value} size={40} />
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-neg tnum @2xl:text-base">{formatCurrency(item.total)}</p>
                          <p className="text-2xs text-ink-4 tnum">{pct.toFixed(1).replace('.', ',')}% do total</p>
                        </div>
                        <ChevronDown className={cn('size-4 shrink-0 text-ink-4 transition-transform', open && 'rotate-180')} />
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease }} className="overflow-hidden">
                            <div className="mx-3 mb-3 overflow-hidden rounded-2xl bg-surface/70 @2xl:mx-6">
                              <ChargeList charges={comCliente(item)} hideClient onWhatsApp={onWhatsApp} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ol>
            </GlassPanel>
          </Reveal>
        </>
      )}
    </div>
  );
}
