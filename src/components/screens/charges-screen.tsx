'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CalendarClock, Hash, Plus, Receipt, Sparkles, Wallet, X } from 'lucide-react';
import { Avatar } from '@/components/data/avatar';
import { StackedBar } from '@/components/data/charts';
import { EmptyState } from '@/components/data/empty-state';
import { GlassPanel, Reveal, Stagger } from '@/components/motion/primitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { WLink, useWorkspace, useWorkspaceNav } from '@/components/workspace/workspace-context';
import { chargeState, diaLocal, saldoAberto, valorRecebido } from '@/lib/domain/charges';
import { PLANS } from '@/lib/subscription';
import { chargeVisual } from '@/lib/ui/status';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { ChargeList } from './kit/charge-list';
import { KpiTile } from './kit/kpi-tile';
import { LimitBanner } from './kit/limit-banner';
import { PageHero } from './kit/page-hero';
import { QuickActions } from './kit/quick-actions';
import { SearchField, SortOrder, ViewToggle, selectClasses } from './kit/toolbar';

type Filtro = '' | 'atrasada' | 'pendente' | 'pago';
const PAGINA = 50;

export function ChargesScreen({ onWhatsApp }: { onWhatsApp?: () => void }) {
  const { charges, isPro, painel, hoje } = useWorkspace();
  const nav = useWorkspaceNav();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>(() => {
    const inicial = nav.params.get('status');
    return inicial === 'atrasada' || inicial === 'pendente' || inicial === 'pago' ? inicial : '';
  });
  const [vista, setVista] = useState<'list' | 'grid'>('list');
  const [ordem, setOrdem] = useState<'prioridade' | 'data_vencimento' | 'valor' | 'cliente'>('prioridade');
  const [sentido, setSentido] = useState<'asc' | 'desc'>('asc');
  const [limite, setLimite] = useState(PAGINA);

  const contagem = useMemo(() => {
    const pagas = charges.filter((c) => c.status === 'pago');
    return { total: charges.length, pagas: pagas.length, recebido: pagas.reduce((s, c) => s + valorRecebido(c), 0) };
  }, [charges]);

  const filtradas = useMemo(() => {
    const q = busca.toLowerCase();
    return charges
      .filter((c) => {
        if (q && !c.client?.nome?.toLowerCase().includes(q) && !c.descricao?.toLowerCase().includes(q)) return false;
        const e = chargeState(c, hoje);
        if (filtro === 'atrasada') return e === 'atrasado';
        if (filtro === 'pendente') return e === 'hoje' || e === 'a_vencer';
        if (filtro === 'pago') return e === 'pago';
        return true;
      })
      .sort((a, b) => {
        // Open charges first, oldest due date on top; paid ones after, most recent first.
        if (ordem === 'prioridade') {
          const pagaA = a.status === 'pago';
          if (pagaA !== (b.status === 'pago')) return pagaA ? 1 : -1;
          const p = diaLocal(a.data_pagamento || a.data_vencimento).getTime() - diaLocal(b.data_pagamento || b.data_vencimento).getTime();
          return (pagaA ? -p : p) * (sentido === 'asc' ? 1 : -1);
        }
        const d =
          ordem === 'data_vencimento'
            ? diaLocal(a.data_vencimento).getTime() - diaLocal(b.data_vencimento).getTime()
            : ordem === 'valor'
              ? Number(a.valor) - Number(b.valor)
              : (a.client?.nome || '').localeCompare(b.client?.nome || '');
        return sentido === 'asc' ? d : -d;
      });
  }, [busca, charges, filtro, hoje, ordem, sentido]);

  const max = PLANS.free.limits.maxCharges;
  const podeCriar = isPro || charges.length < max;
  const temFiltro = Boolean(busca || filtro);
  const visiveis = filtradas.slice(0, limite);

  return (
    <div className="space-y-6 @2xl:space-y-8">
      <PageHero
        eyebrow="Cobranças"
        title="Tudo o que você"
        highlight="tem a receber."
        description={contagem.total > 0 ? `${contagem.total} ${contagem.total === 1 ? 'cobrança' : 'cobranças'}${isPro ? '' : ` de ${max} no plano grátis`}.` : 'Lance a primeira cobrança e acompanhe o vencimento por aqui.'}
        actions={
          podeCriar ? (
            <Button asChild>
              <WLink href="/dashboard/charges/new">
                <Plus />
                Nova cobrança
              </WLink>
            </Button>
          ) : (
            <Button asChild variant="secondary">
              <WLink href="/dashboard/upgrade">
                <Sparkles />
                Liberar cobranças ilimitadas
              </WLink>
            </Button>
          )
        }
      />

      {!podeCriar && <LimitBanner title={`Você usou as ${max} cobranças do plano grátis.`} description="Suas cobranças continuam aqui. Para lançar novas, assine o Pro." />}

      <Stagger onMount className="grid grid-cols-2 gap-3 @4xl:grid-cols-4 @4xl:gap-4">
        <KpiTile label="Recebido" value={contagem.recebido} tone="pos" icon={<Wallet />} sub={`${contagem.pagas} ${contagem.pagas === 1 ? 'paga' : 'pagas'}`} />
        <KpiTile label="Em atraso" value={painel.emAtraso} tone="neg" icon={<AlertTriangle />} sub={`${painel.qtdAtraso} ${painel.qtdAtraso === 1 ? 'vencida' : 'vencidas'}`} />
        <KpiTile label="A vencer" value={painel.aReceber} tone="warn" icon={<CalendarClock />} sub={`${painel.qtdAReceber} no prazo`} />
        <KpiTile label="Cobranças" value={contagem.total} kind="number" icon={<Hash />} sub={isPro ? 'Ilimitadas no Pro' : `Limite de ${max} no grátis`} />
      </Stagger>

      <Reveal y={26}>
        <GlassPanel lift={false} className="rounded-[28px]">
          <div className="space-y-3 border-b border-line/70 p-4 @2xl:p-5">
            <StackedBar
              segments={[
                { label: 'Pagas', value: contagem.recebido, color: 'rgb(var(--pos-fill))' },
                { label: 'A vencer', value: painel.aReceber, color: 'rgb(var(--warn-fill))' },
                { label: 'Em atraso', value: painel.emAtraso, color: 'rgb(var(--neg-fill))' },
              ]}
            />
            <div className="flex flex-col gap-3 @4xl:flex-row @4xl:items-center">
              <SearchField value={busca} onChange={setBusca} placeholder="Buscar por cliente ou descrição" />
              <div className="flex flex-wrap items-center gap-2">
                <Segmented<Filtro>
                  aria-label="Filtrar por situação"
                  value={filtro}
                  onChange={(v) => {
                    setFiltro(v);
                    setLimite(PAGINA);
                  }}
                  options={[
                    { value: '', label: 'Todas', count: contagem.total },
                    { value: 'atrasada', label: 'Em atraso', count: painel.qtdAtraso },
                    { value: 'pendente', label: 'A vencer', count: painel.qtdAReceber },
                    { value: 'pago', label: 'Pagas', count: contagem.pagas },
                  ]}
                />
                <label className="sr-only" htmlFor="ordem-cobrancas">
                  Ordenar por
                </label>
                <select id="ordem-cobrancas" value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)} className={selectClasses}>
                  <option value="prioridade">Prioridade</option>
                  <option value="data_vencimento">Vencimento</option>
                  <option value="valor">Valor</option>
                  <option value="cliente">Cliente</option>
                </select>
                <SortOrder order={sentido} onToggle={() => setSentido((s) => (s === 'asc' ? 'desc' : 'asc'))} />
                <ViewToggle value={vista} onChange={setVista} />
              </div>
            </div>
          </div>

          {filtradas.length === 0 ? (
            <EmptyState
              icon={<Receipt />}
              title={temFiltro ? 'Nenhuma cobrança encontrada' : 'Nenhuma cobrança lançada'}
              description={temFiltro ? 'Tente outro termo ou limpe os filtros.' : 'Lance sua primeira cobrança e acompanhe o vencimento por aqui.'}
              action={
                temFiltro ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setBusca('');
                      setFiltro('');
                    }}
                  >
                    <X />
                    Limpar filtros
                  </Button>
                ) : podeCriar ? (
                  <Button asChild size="sm">
                    <WLink href="/dashboard/charges/new">
                      <Plus />
                      Lançar cobrança
                    </WLink>
                  </Button>
                ) : undefined
              }
            />
          ) : vista === 'grid' ? (
            <div className="grid gap-3 p-4 @2xl:grid-cols-2 @2xl:p-5 @5xl:grid-cols-3">
              {visiveis.map((c, i) => {
                const v = chargeVisual(c);
                const aberta = c.status !== 'pago';
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}>
                    <div className="group flex h-full flex-col rounded-2xl bg-surface/70 p-4 shadow-xs transition-transform duration-300 ease-spring hover:scale-[1.02]">
                      <WLink href={`/dashboard/charges/${c.id}`} className="block">
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Avatar name={c.client?.nome || 'Cliente'} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-ink">{c.client?.nome || 'Cliente'}</p>
                              <p className="truncate text-xs text-ink-3">{c.descricao || 'Cobrança'}</p>
                            </div>
                          </div>
                          <Badge variant={v.variant} dot>
                            {v.short}
                          </Badge>
                        </div>
                        <p className={cn('truncate font-display text-xl font-semibold tnum', v.key === 'atrasado' ? 'text-neg' : 'text-ink')}>{formatCurrency(aberta ? saldoAberto(c) : Number(c.valor))}</p>
                        <p className="text-xs text-ink-3 tnum">Vencimento {formatDate(c.data_vencimento)}</p>
                      </WLink>
                      {aberta && <QuickActions charge={c} className="mt-3 justify-end" onWhatsApp={onWhatsApp} />}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="@4xl:hidden">
                <ChargeList charges={visiveis} onWhatsApp={onWhatsApp} />
              </div>
              <div className="hidden @4xl:block">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b border-line/70 text-left text-xs font-medium text-ink-3">
                      <th className="w-[30%] px-6 py-3 font-medium">Cliente</th>
                      <th className="px-3 py-3 font-medium">Descrição</th>
                      <th className="w-28 px-3 py-3 font-medium">Vencimento</th>
                      <th className="w-32 px-3 py-3 text-right font-medium">Valor</th>
                      <th className="w-32 px-3 py-3 text-right font-medium">Situação</th>
                      <th className="w-28 px-6 py-3" aria-label="Ações" />
                    </tr>
                  </thead>
                  <tbody key={`${filtro}-${ordem}-${sentido}`} className="divide-y divide-line/70">
                    {visiveis.map((c, i) => {
                      const v = chargeVisual(c);
                      const aberta = c.status !== 'pago';
                      return (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0, x: -14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                          onClick={() => nav.push(`/dashboard/charges/${c.id}`)}
                          className="group cursor-pointer transition-colors hover:bg-ink/[0.03]"
                        >
                          <td className="px-6 py-2.5">
                            <WLink href={`/dashboard/charges/${c.id}`} className="flex min-w-0 items-center gap-3 rounded-md" onClick={(e) => e.stopPropagation()}>
                              <Avatar name={c.client?.nome || 'Cliente'} size="sm" />
                              <span className="truncate font-medium text-ink">{c.client?.nome || 'Cliente'}</span>
                            </WLink>
                          </td>
                          <td className="truncate px-3 py-2.5 text-ink-2">{c.descricao || 'Cobrança'}</td>
                          <td className={cn('px-3 py-2.5 tnum', v.key === 'atrasado' ? 'text-neg' : 'text-ink-2')}>{formatDate(c.data_vencimento)}</td>
                          <td className={cn('truncate px-3 py-2.5 text-right font-semibold tnum', v.key === 'atrasado' ? 'text-neg' : 'text-ink')}>{formatCurrency(aberta ? saldoAberto(c) : Number(c.valor))}</td>
                          <td className="px-3 py-2.5 text-right">
                            <Badge variant={v.variant} dot>
                              {v.short}
                            </Badge>
                          </td>
                          <td className="px-6 py-2.5">{aberta && <QuickActions charge={c} className="justify-end" onWhatsApp={onWhatsApp} />}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {filtradas.length > limite && (
            <div className="border-t border-line/70 p-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setLimite((l) => l + PAGINA)}>
                Mostrar mais ({filtradas.length - limite} restantes)
              </Button>
            </div>
          )}
        </GlassPanel>
      </Reveal>
    </div>
  );
}
