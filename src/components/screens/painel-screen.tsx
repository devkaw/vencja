'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, ArrowUpRight, CalendarClock, Check, Clock, Gauge, PartyPopper, Percent, Plus, Receipt, Timer, TrendingDown, UserPlus, Wallet } from 'lucide-react';
import { AnimatedNumber } from '@/components/data/animated-number';
import { Avatar } from '@/components/data/avatar';
import { MonthBars } from '@/components/data/bars';
import { EmptyState } from '@/components/data/empty-state';
import { Forecast } from '@/components/data/forecast';
import { ScoreDistribution } from '@/components/data/score-distribution';
import { Stagger } from '@/components/motion/primitives';
import { Button } from '@/components/ui/button';
import { WLink, useWorkspace } from '@/components/workspace/workspace-context';
import { chargeState, diaLocal, diasDeAtraso } from '@/lib/domain/charges';
import { linhaDoTempo } from '@/lib/domain/clients';
import { distribuicaoScore, previsaoCaixa, rankingInadimplencia, serieMensal } from '@/lib/domain/metrics';
import { firstName, greeting } from '@/lib/ui/status';
import { cn, formatCurrency } from '@/lib/utils';
import { ChargeList } from './kit/charge-list';
import { KpiTile } from './kit/kpi-tile';
import { LeadPanel } from './kit/lead-panel';
import { PageHero } from './kit/page-hero';
import { Panel, PanelLink } from './kit/panel';
import { Timeline } from './kit/timeline';

const ease = [0.16, 1, 0.3, 1] as const;

export function PainelScreen({ onWhatsApp }: { onWhatsApp?: () => void }) {
  const { charges, clients, summaries, painel, hoje, userName, mode } = useWorkspace();

  const dados = useMemo(() => {
    const abertas = charges.filter((c) => c.status !== 'pago');
    const atrasadas = abertas.filter((c) => chargeState(c, hoje) === 'atrasado').sort((a, b) => diasDeAtraso(b, hoje) - diasDeAtraso(a, hoje));
    const noPrazo = abertas.filter((c) => chargeState(c, hoje) !== 'atrasado').sort((a, b) => diaLocal(a.data_vencimento).getTime() - diaLocal(b.data_vencimento).getTime());
    const serie = serieMensal(charges, hoje);
    return {
      atrasadas,
      noPrazo,
      hojeLista: [...noPrazo.filter((c) => chargeState(c, hoje) === 'hoje'), ...atrasadas].slice(0, 4),
      serie,
      previsao: previsaoCaixa(charges, hoje),
      distribuicao: distribuicaoScore(summaries),
      ranking: rankingInadimplencia(summaries, hoje).slice(0, 5),
      atividade: linhaDoTempo(charges, hoje).slice(0, 6),
    };
  }, [charges, hoje, summaries]);

  const nome = mode === 'demo' ? '' : firstName(userName);
  const novo = clients.length === 0 || charges.length === 0 || painel.qtdPagas === 0;
  const progresso = painel.previstoMes > 0 ? Math.min(1, painel.recebidoMes / painel.previstoMes) : 0;
  const totalPrevisao = dados.previsao.reduce((s, x) => s + x.valor, 0);
  const maiorDivida = dados.ranking[0]?.total || 1;

  const descricao =
    painel.qtdAtraso > 0
      ? `${painel.qtdAtraso} ${painel.qtdAtraso === 1 ? 'cobrança precisa' : 'cobranças precisam'} da sua atenção.`
      : charges.length > 0
        ? 'Nenhuma cobrança em atraso. Bom trabalho.'
        : 'Vamos organizar suas cobranças.';

  return (
    <div className="space-y-6 @2xl:space-y-8">
      <PageHero
        eyebrow={format(hoje, "EEEE, d 'de' MMMM", { locale: ptBR })}
        title={nome ? `${greeting(hoje)}, ${nome}.` : `${greeting(hoje)}.`}
        description={descricao}
        actions={
          <>
            <Button asChild variant="secondary">
              <WLink href="/dashboard/clients/new">
                <UserPlus />
                Novo cliente
              </WLink>
            </Button>
            <Button asChild>
              <WLink href="/dashboard/charges/new">
                <Plus />
                Nova cobrança
              </WLink>
            </Button>
          </>
        }
      />

      {novo && <Onboarding hasClient={clients.length > 0} hasCharge={charges.length > 0} hasPayment={painel.qtdPagas > 0} />}

      <div className="grid gap-4 @4xl:grid-cols-12 @4xl:gap-6">
        <LeadPanel icon={Wallet} label="Recebido este mês" className="min-h-[300px] @4xl:col-span-7">
          <p className="mt-auto truncate pt-8 font-display text-[clamp(2.3rem,7cqw,4rem)] font-bold leading-none tracking-[-0.03em] tnum">
            <AnimatedNumber value={painel.recebidoMes} format={formatCurrency} />
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
            <span>
              {painel.qtdRecebidoMes} {painel.qtdRecebidoMes === 1 ? 'pagamento' : 'pagamentos'}
            </span>
            {painel.variacaoMes !== null && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold tnum">
                {painel.variacaoMes >= 0 ? '+' : '−'}
                {Math.abs(Math.round(painel.variacaoMes * 100))}% sobre o mês passado
              </span>
            )}
          </div>
          <div className="mt-6">
            <div className="mb-1.5 flex justify-between gap-3 text-xs text-white/70 tnum">
              <span>Previsto no mês</span>
              <span className="truncate">{formatCurrency(painel.previstoMes)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Recebido frente ao previsto" aria-valuenow={Math.round(progresso * 100)} aria-valuemin={0} aria-valuemax={100}>
              <motion.div className="h-full rounded-full bg-white" initial={{ width: 0 }} animate={{ width: `${progresso * 100}%` }} transition={{ duration: 1.1, delay: 0.3, ease }} />
            </div>
          </div>
        </LeadPanel>

        <Panel
          className="@4xl:col-span-5"
          title="Para resolver hoje"
          hint={painel.venceHoje.qtd > 0 ? `${painel.venceHoje.qtd} ${painel.venceHoje.qtd === 1 ? 'vence' : 'vencem'} hoje · ${formatCurrency(painel.venceHoje.valor)}` : 'Nada vence hoje'}
          icon={<Clock />}
          flush
          strong
          action={
            <WLink href="/dashboard/ranking">
              <PanelLink>Ver atrasos</PanelLink>
            </WLink>
          }
        >
          {dados.hojeLista.length === 0 ? <EmptyState compact icon={<PartyPopper />} title="Dia tranquilo" description="Nenhum vencimento hoje e ninguém em atraso." /> : <ChargeList charges={dados.hojeLista} onWhatsApp={onWhatsApp} />}
        </Panel>
      </div>

      <Stagger onMount className="grid grid-cols-2 gap-3 @4xl:grid-cols-4 @4xl:gap-4">
        <KpiTile label="A receber no prazo" value={painel.aReceber} tone="warn" icon={<CalendarClock />} sub={`${painel.qtdAReceber} ${painel.qtdAReceber === 1 ? 'cobrança' : 'cobranças'}`} spark={dados.serie.map((m) => m.previsto)} sparkColor="rgb(var(--warn-fill))" />
        <KpiTile label="Em atraso" value={painel.emAtraso} tone="neg" icon={<AlertTriangle />} sub={`${painel.qtdAtraso} ${painel.qtdAtraso === 1 ? 'vencida' : 'vencidas'}`} spark={dados.serie.map((m) => m.atraso)} sparkColor="rgb(var(--neg-fill))" />
        <KpiTile label="Taxa de recebimento" value={painel.taxaRecebimento} kind="percent" tone="pos" icon={<Percent />} sub="Do que já venceu" spark={dados.serie.map((m) => m.recebido)} />
        <KpiTile label="Atraso médio ao pagar" value={painel.prazoMedioDias} kind="days" tone="brand" icon={<Timer />} sub={`${painel.qtdPagas} ${painel.qtdPagas === 1 ? 'cobrança paga' : 'cobranças pagas'}`} />
      </Stagger>

      <div className="grid gap-4 @4xl:grid-cols-12 @4xl:gap-6">
        <Panel
          className="@4xl:col-span-7"
          eyebrow="Precisa de atenção"
          title="Cobranças vencidas"
          hint="Das mais antigas para as mais recentes"
          icon={<AlertTriangle />}
          flush
          action={
            dados.atrasadas.length > 0 ? (
              <WLink href="/dashboard/charges?status=atrasada">
                <PanelLink>Ver todas</PanelLink>
              </WLink>
            ) : undefined
          }
        >
          {dados.atrasadas.length === 0 ? <EmptyState compact icon={<PartyPopper />} title="Ninguém em atraso" description="Quando uma cobrança vencer sem pagamento, ela aparece aqui." /> : <ChargeList charges={dados.atrasadas.slice(0, 5)} onWhatsApp={onWhatsApp} />}
        </Panel>
        <Panel
          className="@4xl:col-span-5"
          eyebrow="Próximos dias"
          title="Vence em breve"
          hint="Ainda no prazo"
          icon={<CalendarClock />}
          flush
          action={
            <WLink href="/dashboard/calendar">
              <PanelLink>Calendário</PanelLink>
            </WLink>
          }
        >
          {dados.noPrazo.length === 0 ? <EmptyState compact icon={<CalendarClock />} title="Nada vencendo" description="Lance uma cobrança e acompanhe o vencimento por aqui." /> : <ChargeList charges={dados.noPrazo.slice(0, 5)} onWhatsApp={onWhatsApp} />}
        </Panel>
      </div>

      <div className="grid gap-4 @4xl:grid-cols-12 @4xl:gap-6">
        <Panel className="@4xl:col-span-8" eyebrow="Últimos 12 meses" title="Recebimentos" hint="Barra verde: recebido. Fundo: previsto no mês.">
          <MonthBars data={dados.serie} />
        </Panel>
        <Panel className="@4xl:col-span-4" eyebrow="Próximos 30 dias" title="Previsão de caixa" hint={`${formatCurrency(totalPrevisao)} previstos`}>
          <Forecast data={dados.previsao} />
        </Panel>
      </div>

      <div className="grid gap-4 @4xl:grid-cols-12 @4xl:gap-6">
        <Panel className="@4xl:col-span-4" eyebrow="Carteira" title="Saúde dos clientes" icon={<Gauge />}>
          <ScoreDistribution data={dados.distribuicao} />
        </Panel>
        <Panel
          className="@4xl:col-span-4"
          eyebrow="Inadimplência"
          title="Quem mais deve"
          icon={<TrendingDown />}
          flush
          action={
            <WLink href="/dashboard/ranking">
              <PanelLink>Ranking</PanelLink>
            </WLink>
          }
        >
          {dados.ranking.length === 0 ? (
            <EmptyState compact icon={<Check />} title="Tudo em dia" description="Nenhum cliente com valor em atraso." />
          ) : (
            <ol className="space-y-1 px-3 pb-3">
              {dados.ranking.map((item, i) => (
                <li key={item.summary.client.id}>
                  <WLink href={`/dashboard/clients/${item.summary.client.id}`} className="group flex items-center gap-3 rounded-2xl p-2 transition-[background-color,transform] duration-300 ease-spring hover:scale-[1.02] hover:bg-ink/[0.03]">
                    <Avatar name={item.summary.client.nome} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">{item.summary.client.nome}</p>
                        <p className="shrink-0 text-sm font-semibold text-neg tnum">{formatCurrency(item.total)}</p>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink/[0.06]">
                        <motion.div className="h-full rounded-full bg-neg/70" initial={{ width: 0 }} whileInView={{ width: `${(item.total / maiorDivida) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.05, ease }} />
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </WLink>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel
          className="@4xl:col-span-4"
          eyebrow="Movimento"
          title="Atividade recente"
          icon={<Receipt />}
          action={
            <WLink href="/dashboard/charges">
              <PanelLink>Ver todas</PanelLink>
            </WLink>
          }
        >
          {dados.atividade.length === 0 ? <EmptyState compact icon={<Receipt />} title="Nenhuma cobrança ainda" /> : <Timeline events={dados.atividade} />}
        </Panel>
      </div>
    </div>
  );
}

function Onboarding({ hasClient, hasCharge, hasPayment }: { hasClient: boolean; hasCharge: boolean; hasPayment: boolean }) {
  const steps = [
    { done: hasClient, title: 'Cadastre um cliente', desc: 'Nome e WhatsApp já bastam.', href: '/dashboard/clients/new', cta: 'Cadastrar cliente' },
    { done: hasCharge, title: 'Lance a primeira cobrança', desc: 'Avulsa, parcelada ou recorrente.', href: '/dashboard/charges/new', cta: 'Lançar cobrança' },
    { done: hasPayment, title: 'Registre um pagamento', desc: 'Toque no botão de marcar como pago.', href: '/dashboard/charges', cta: 'Ver cobranças' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong relative overflow-hidden rounded-[28px] p-5 @2xl:p-6" aria-label="Primeiros passos">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-brand-400/15 blur-3xl" aria-hidden />
      <div className="relative">
        <p className="eyebrow mb-2">Primeiros passos · {doneCount}/3</p>
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Seu controle de cobranças em 3 passos</h2>
        <ol className="mt-4 grid gap-2 @2xl:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <WLink
                href={s.href}
                className={cn('flex h-full flex-col rounded-2xl border p-3.5 transition-transform duration-300 ease-spring hover:scale-[1.03]', s.done ? 'border-transparent bg-pos-soft/70' : s === next ? 'border-brand-500/40 bg-surface shadow-ring-brand' : 'border-line bg-surface-2')}
              >
                <span className={cn('mb-3 flex size-6 items-center justify-center rounded-full text-xs font-semibold', s.done ? 'bg-pos text-white dark:text-canvas' : 'bg-ink/[0.07] text-ink-2')}>{s.done ? <Check className="size-3.5" /> : i + 1}</span>
                <span className={cn('text-sm font-semibold', s.done ? 'text-ink-2 line-through decoration-ink-4' : 'text-ink')}>{s.title}</span>
                <span className="mt-0.5 text-xs text-ink-3">{s.desc}</span>
                {s === next && <span className="mt-3 text-xs font-semibold text-brand-ink">{s.cta} →</span>}
              </WLink>
            </li>
          ))}
        </ol>
      </div>
    </motion.section>
  );
}
