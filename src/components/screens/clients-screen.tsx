'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight, Gauge, Plus, Sparkles, Users, Wallet, X } from 'lucide-react';
import { Avatar } from '@/components/data/avatar';
import { ScoreRing } from '@/components/data/charts';
import { EmptyState } from '@/components/data/empty-state';
import { GlassPanel, Reveal, Stagger } from '@/components/motion/primitives';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { WLink, useWorkspace } from '@/components/workspace/workspace-context';
import { FAIXA_ATENCAO, FAIXA_BOM, faixaScore, type ScoreFaixa } from '@/lib/domain/score';
import { PLANS } from '@/lib/subscription';
import { scoreTone } from '@/lib/ui/status';
import { cn, formatCurrency, formatPhone } from '@/lib/utils';
import { KpiTile } from './kit/kpi-tile';
import { LimitBanner } from './kit/limit-banner';
import { PageHero } from './kit/page-hero';
import { SearchField, SortOrder, ViewToggle, selectClasses } from './kit/toolbar';

type FiltroDivida = '' | 'yes' | 'no';
const PAGINA_CLIENTES = 60;
type Ordem = 'nome' | 'score' | 'pago' | 'atraso';

export function ClientsScreen() {
  const { summaries, isPro } = useWorkspace();
  const [busca, setBusca] = useState('');
  const [vista, setVista] = useState<'list' | 'grid'>('grid');
  const [ordem, setOrdem] = useState<Ordem>('nome');
  const [sentido, setSentido] = useState<'asc' | 'desc'>('asc');
  const [filtroScore, setFiltroScore] = useState<'' | ScoreFaixa>('');
  const [filtroDivida, setFiltroDivida] = useState<FiltroDivida>('');
  const [limite, setLimite] = useState(PAGINA_CLIENTES);

  const stats = useMemo(() => {
    const comNota = summaries.filter((s) => s.score.value !== null);
    return {
      devendo: summaries.filter((s) => s.emAtraso > 0).length,
      pago: summaries.reduce((t, s) => t + s.pago, 0),
      atraso: summaries.reduce((t, s) => t + s.emAtraso, 0),
      media: comNota.length ? Math.round(comNota.reduce((t, s) => t + (s.score.value as number), 0) / comNota.length) : null,
      semNota: summaries.length - comNota.length,
    };
  }, [summaries]);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return summaries
      .filter((s) => {
        if (q && !s.client.nome.toLowerCase().includes(q) && !s.client.telefone?.includes(q)) return false;
        if (filtroScore && faixaScore(s.score.value) !== filtroScore) return false;
        if (filtroDivida === 'yes') return s.emAtraso > 0;
        if (filtroDivida === 'no') return s.emAtraso === 0;
        return true;
      })
      .sort((a, b) => {
        // Clients without a grade stay at the end in both directions.
        if (ordem === 'score') {
          if (a.score.value === null) return b.score.value === null ? 0 : 1;
          if (b.score.value === null) return -1;
        }
        const d = ordem === 'nome' ? a.client.nome.localeCompare(b.client.nome) : ordem === 'score' ? (a.score.value as number) - (b.score.value as number) : ordem === 'pago' ? a.pago - b.pago : a.emAtraso - b.emAtraso;
        return sentido === 'asc' ? d : -d;
      });
  }, [busca, filtroDivida, filtroScore, ordem, sentido, summaries]);

  const max = PLANS.free.limits.maxClients;
  const podeCriar = isPro || summaries.length < max;
  const temFiltro = Boolean(busca || filtroScore || filtroDivida);
  const limpar = () => {
    setBusca('');
    setFiltroScore('');
    setFiltroDivida('');
  };

  return (
    <div className="space-y-6 @2xl:space-y-8">
      <PageHero
        eyebrow="Clientes"
        title="Quem paga em dia"
        highlight="e quem precisa de atenção."
        description={summaries.length > 0 ? `${summaries.length} ${summaries.length === 1 ? 'cliente' : 'clientes'}${isPro ? '' : ` de ${max} no plano grátis`}.` : 'Cadastre quem compra de você para começar a lançar cobranças.'}
        actions={
          podeCriar ? (
            <Button asChild>
              <WLink href="/dashboard/clients/new">
                <Plus />
                Novo cliente
              </WLink>
            </Button>
          ) : (
            <Button asChild variant="secondary">
              <WLink href="/dashboard/upgrade">
                <Sparkles />
                Liberar clientes ilimitados
              </WLink>
            </Button>
          )
        }
      />

      {!podeCriar && <LimitBanner title={`Você chegou aos ${max} clientes do plano grátis.`} description="No Pro você cadastra quantos clientes quiser." />}

      <Stagger onMount className="grid grid-cols-2 gap-3 @4xl:grid-cols-4 @4xl:gap-4">
        <KpiTile label="Já recebido" value={stats.pago} tone="pos" icon={<Wallet />} sub="Soma de todos os clientes" />
        <KpiTile label="Em atraso" value={stats.atraso} tone="neg" icon={<AlertTriangle />} sub={`${stats.devendo} ${stats.devendo === 1 ? 'cliente devendo' : 'clientes devendo'}`} />
        <KpiTile label="Score médio" value={stats.media} kind="number" tone="warn" icon={<Gauge />} sub={stats.semNota > 0 ? `${stats.semNota} sem histórico` : 'Quanto maior, mais pontual'} />
        <KpiTile label="Clientes" value={summaries.length} kind="number" icon={<Users />} sub={isPro ? 'Ilimitados no Pro' : `Limite de ${max} no grátis`} />
      </Stagger>

      <Reveal y={26}>
        <GlassPanel lift={false} className="rounded-[28px]">
          <div className="flex flex-col gap-3 border-b border-line/70 p-4 @2xl:p-5 @5xl:flex-row @5xl:items-center">
            <SearchField value={busca} onChange={setBusca} placeholder="Buscar por nome ou telefone" />
            <div className="flex flex-wrap items-center gap-2">
              <Segmented<FiltroDivida>
                aria-label="Filtrar por dívida"
                value={filtroDivida}
                onChange={setFiltroDivida}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'yes', label: 'Devendo', count: stats.devendo },
                  { value: 'no', label: 'Em dia' },
                ]}
              />
              <label className="sr-only" htmlFor="filtro-score">
                Filtrar por score
              </label>
              <select id="filtro-score" value={filtroScore} onChange={(e) => setFiltroScore(e.target.value as '' | ScoreFaixa)} className={selectClasses}>
                <option value="">Qualquer score</option>
                <option value="bom">Bom pagador ({FAIXA_BOM}+)</option>
                <option value="atencao">Atenção ({FAIXA_ATENCAO} a {FAIXA_BOM - 1})</option>
                <option value="risco">Risco alto (até {FAIXA_ATENCAO - 1})</option>
                <option value="sem_historico">Sem histórico</option>
              </select>
              <label className="sr-only" htmlFor="ordem-clientes">
                Ordenar por
              </label>
              <select id="ordem-clientes" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className={selectClasses}>
                <option value="nome">Nome</option>
                <option value="score">Score</option>
                <option value="pago">Quem mais pagou</option>
                <option value="atraso">Maior atraso</option>
              </select>
              <SortOrder order={sentido} onToggle={() => setSentido((s) => (s === 'asc' ? 'desc' : 'asc'))} />
              <ViewToggle value={vista} onChange={setVista} />
            </div>
          </div>

          {filtrados.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title={temFiltro ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              description={temFiltro ? 'Tente outro termo ou limpe os filtros.' : 'Cadastre quem compra de você para começar a lançar cobranças.'}
              action={
                temFiltro ? (
                  <Button variant="secondary" size="sm" onClick={limpar}>
                    <X />
                    Limpar filtros
                  </Button>
                ) : podeCriar ? (
                  <Button asChild size="sm">
                    <WLink href="/dashboard/clients/new">
                      <Plus />
                      Cadastrar cliente
                    </WLink>
                  </Button>
                ) : undefined
              }
            />
          ) : vista === 'grid' ? (
            <div className="grid gap-3 p-4 @2xl:grid-cols-2 @2xl:p-5 @5xl:grid-cols-3">
              {filtrados.slice(0, limite).map((s, i) => {
                const tom = scoreTone(s.score.value);
                return (
                  <motion.div key={s.client.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.035, ease: [0.16, 1, 0.3, 1], duration: 0.5 }}>
                    <WLink href={`/dashboard/clients/${s.client.id}`} className="group flex h-full flex-col rounded-3xl bg-surface/70 p-4 shadow-xs transition-transform duration-300 ease-spring hover:scale-[1.03]">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.client.nome} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-ink">{s.client.nome}</p>
                          <p className={cn('truncate text-xs font-medium', tom.text)}>
                            {tom.label}
                            {s.score.value !== null && s.score.poucoHistorico && <span className="font-normal text-ink-3"> · pouco histórico</span>}
                          </p>
                        </div>
                        <ScoreRing score={s.score.value} size={52} stroke={5} />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line/70 pt-3">
                        <Dado label="Já pagou" valor={formatCurrency(s.pago)} />
                        <Dado label="Em atraso" valor={formatCurrency(s.emAtraso)} forte={s.emAtraso > 0} />
                        <Dado label="Em dia" valor={s.pontualidade === null ? '—' : `${Math.round(s.pontualidade * 100)}%`} />
                      </div>
                    </WLink>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <ul className="divide-y divide-line/70">
              {filtrados.slice(0, limite).map((s, i) => (
                <motion.li key={s.client.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.03, ease: [0.16, 1, 0.3, 1] }}>
                  <WLink href={`/dashboard/clients/${s.client.id}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink/[0.03] @2xl:px-6">
                    <Avatar name={s.client.nome} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{s.client.nome}</p>
                      <p className="truncate text-xs text-ink-3">{s.client.telefone ? formatPhone(s.client.telefone) : 'Sem WhatsApp'}</p>
                    </div>
                    <div className="hidden w-32 text-right @2xl:block">
                      <Dado label="Já pagou" valor={formatCurrency(s.pago)} />
                    </div>
                    <div className="w-24 text-right @2xl:w-32">
                      <Dado label="Em atraso" valor={formatCurrency(s.emAtraso)} forte={s.emAtraso > 0} />
                    </div>
                    <ScoreRing score={s.score.value} size={40} />
                    <ChevronRight className="hidden size-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5 @2xl:block" />
                  </WLink>
                </motion.li>
              ))}
            </ul>
          )}
          {filtrados.length > limite && (
            <div className="border-t border-line/70 p-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setLimite((l) => l + PAGINA_CLIENTES)}>
                Mostrar mais ({filtrados.length - limite} restantes)
              </Button>
            </div>
          )}
        </GlassPanel>
      </Reveal>
    </div>
  );
}

function Dado({ label, valor, forte }: { label: string; valor: string; forte?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-2xs uppercase tracking-wide text-ink-4">{label}</p>
      <p className={cn('truncate text-sm font-semibold tnum', forte ? 'text-neg' : 'text-ink')}>{valor}</p>
    </div>
  );
}
