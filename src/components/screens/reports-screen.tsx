'use client';

import { useMemo, useState } from 'react';
import { endOfDay, endOfMonth, format, isWithinInterval, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CalendarClock, Download, FileBarChart2, Lock, PartyPopper, Percent, Receipt, Users, Wallet } from 'lucide-react';
import { MonthBars } from '@/components/data/bars';
import { EmptyState } from '@/components/data/empty-state';
import { GlassPanel, Stagger } from '@/components/motion/primitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { WLink, useWorkspace } from '@/components/workspace/workspace-context';
import { chargeState, diaLocal, diasDeAtraso, saldoAberto, valorRecebido, type ChargeState } from '@/lib/domain/charges';
import { gerarCsv, moedaCsv } from '@/lib/domain/csv';
import { rankingInadimplencia, resumoAnual, resumoPeriodo, serieMensal } from '@/lib/domain/metrics';
import { scoreTone } from '@/lib/ui/status';
import { cn, formatCurrency, formatDate, formatPhone } from '@/lib/utils';
import { KpiTile } from './kit/kpi-tile';
import { PageHero } from './kit/page-hero';
import { Panel } from './kit/panel';

type Periodo = 'mes' | '3m' | '6m' | '12m' | 'ano' | 'custom';
type Aba = 'resumo' | 'cobrancas' | 'clientes';

const LINHAS = 200;
const th = 'whitespace-nowrap px-4 py-3 text-xs font-medium text-ink-3';
const td = 'whitespace-nowrap px-4 py-3 tnum';

const SITUACAO: Record<ChargeState, { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }> = {
  pago: { label: 'Pago', variant: 'success' },
  atrasado: { label: 'Em atraso', variant: 'danger' },
  hoje: { label: 'Vence hoje', variant: 'warning' },
  a_vencer: { label: 'A vencer', variant: 'default' },
};

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const dataCurta = (d: Date) => format(d, "d 'de' MMM 'de' yyyy", { locale: ptBR });

function baixarCsv(nome: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `venceja-${nome}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReportsScreen() {
  const { charges, summaries, isPro, hoje, painel } = useWorkspace();
  const [periodo, setPeriodo] = useState<Periodo>('12m');
  const [aba, setAba] = useState<Aba>('resumo');
  const [de, setDe] = useState(format(subMonths(hoje, 1), 'yyyy-MM-dd'));
  const [ate, setAte] = useState(format(hoje, 'yyyy-MM-dd'));

  // Presets run to the end of the current month, so a row and its totals always cover the same days.
  const anoMinimo = 2000;
  const anoMaximo = hoje.getFullYear() + 10;
  const datasCustom = useMemo(() => {
    const inicio = diaLocal(de || format(hoje, 'yyyy-MM-dd'));
    const fim = diaLocal(ate || format(hoje, 'yyyy-MM-dd'));
    const dentro = (d: Date) => d.getFullYear() >= anoMinimo && d.getFullYear() <= anoMaximo;
    return { inicio, fim, valido: dentro(inicio) && dentro(fim) && inicio <= fim };
  }, [ate, de, hoje, anoMaximo]);

  const intervalo = useMemo(() => {
    if (periodo === 'custom') {
      if (!datasCustom.valido) return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
      return { inicio: datasCustom.inicio, fim: endOfDay(datasCustom.fim) };
    }
    const inicios: Record<Exclude<Periodo, 'custom'>, Date> = {
      mes: startOfMonth(hoje),
      '3m': startOfMonth(subMonths(hoje, 2)),
      '6m': startOfMonth(subMonths(hoje, 5)),
      '12m': startOfMonth(subMonths(hoje, 11)),
      ano: startOfYear(hoje),
    };
    return { inicio: inicios[periodo], fim: endOfDay(endOfMonth(hoje)) };
  }, [datasCustom, hoje, periodo]);

  const resumo = useMemo(() => resumoPeriodo(charges, intervalo.inicio, intervalo.fim, hoje), [charges, hoje, intervalo]);
  const anual = useMemo(() => resumoAnual(charges, hoje), [charges, hoje]);
  const ranking = useMemo(() => rankingInadimplencia(summaries, hoje), [hoje, summaries]);
  const inadimplentes = ranking.slice(0, 50);
  const serie = useMemo(() => serieMensal(charges, hoje), [charges, hoje]);

  // Same rule as the monthly summary: a charge belongs to the period by its due date or its payment date.
  const cobrancas = useMemo(() => {
    const faixa = { start: intervalo.inicio, end: intervalo.fim };
    const dentro = (dia: string | null) => Boolean(dia) && isWithinInterval(diaLocal(dia as string), faixa);
    return charges
      .filter((c) => dentro(c.data_vencimento) || dentro(c.data_pagamento))
      .sort((a, b) => b.data_vencimento.localeCompare(a.data_vencimento) || (a.client?.nome || '').localeCompare(b.client?.nome || '', 'pt-BR'));
  }, [charges, intervalo]);
  // Who paid what in the period, by payment date (the same rule as "Recebido no período").
  const porCliente = useMemo(() => {
    const faixa = { start: intervalo.inicio, end: intervalo.fim };
    const mapa = new Map<string, { id: string; nome: string; telefone: string | null; valor: number; qtd: number }>();
    for (const c of charges) {
      if (c.status !== 'pago' || !c.data_pagamento || !isWithinInterval(diaLocal(c.data_pagamento), faixa)) continue;
      const atual = mapa.get(c.client_id) ?? { id: c.client_id, nome: c.client?.nome || 'Cliente removido', telefone: c.client?.telefone ?? null, valor: 0, qtd: 0 };
      atual.valor += valorRecebido(c);
      atual.qtd += 1;
      mapa.set(c.client_id, atual);
    }
    return [...mapa.values()].sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [charges, intervalo]);
  const clientes = useMemo(() => [...summaries].sort((a, b) => a.client.nome.localeCompare(b.client.nome, 'pt-BR')), [summaries]);

  if (!isPro) {
    return (
      <div className="space-y-6 @2xl:space-y-8">
        <PageHero eyebrow="Relatórios" title="Seus números," highlight="prontos para analisar." />
        <GlassPanel lift={false} className="rounded-[28px]">
          <EmptyState
            icon={<Lock />}
            title="Relatórios são do plano Pro"
            description="Resumo mensal e anual, filtro por período e exportação em CSV para planilha ou contador."
            action={
              <Button asChild>
                <WLink href="/dashboard/upgrade">Ver o Pro</WLink>
              </Button>
            }
          />
        </GlassPanel>
      </div>
    );
  }

  const dia = format(hoje, 'yyyy-MM-dd');
  const faixaArquivo = `${format(intervalo.inicio, 'yyyy-MM-dd')}-a-${format(intervalo.fim, 'yyyy-MM-dd')}`;
  const textoPeriodo = `${dataCurta(intervalo.inicio)} a ${dataCurta(intervalo.fim)}`;
  const linhaResumo = (m: { label: string; pagas: number; aVencer: number; atrasadas: number; valorPago: number; valorAVencer: number; valorAtraso: number }) => [capitalizar(m.label), m.pagas, m.aVencer, m.atrasadas, moedaCsv(m.valorPago), moedaCsv(m.valorAVencer), moedaCsv(m.valorAtraso)];
  const cabecalhoResumo = (primeira: string) => [primeira, 'Pagas', 'A vencer', 'Em atraso', 'Valor pago (R$)', 'Valor a vencer (R$)', 'Valor em atraso (R$)'];
  const totalPeriodo = { label: 'Total', pagas: resumo.qtdPagas, aVencer: resumo.qtdAReceber, atrasadas: resumo.qtdAtraso, valorPago: resumo.recebido, valorAVencer: resumo.aReceber, valorAtraso: resumo.emAtraso };

  const exportar = {
    resumo_mensal: () => baixarCsv(`resumo-mensal-${faixaArquivo}`, gerarCsv(cabecalhoResumo('Mês'), [...resumo.meses, totalPeriodo].map(linhaResumo))),
    recebido_cliente: () =>
      baixarCsv(
        `recebido-por-cliente-${faixaArquivo}`,
        gerarCsv(
          ['Cliente', 'Telefone', 'Recebido (R$)', 'Cobranças pagas', '% do recebido'],
          porCliente.map((r) => [r.nome, r.telefone ? formatPhone(r.telefone) : '', moedaCsv(r.valor), r.qtd, resumo.recebido > 0 ? moedaCsv((r.valor / resumo.recebido) * 100) : ''])
        )
      ),
    resumo_anual: () => baixarCsv(`resumo-anual-${dia}`, gerarCsv(cabecalhoResumo('Ano'), anual.map(linhaResumo))),
    inadimplentes: () =>
      baixarCsv(
        `inadimplentes-${dia}`,
        gerarCsv(
          ['Posição', 'Cliente', 'Telefone', 'Total em atraso (R$)', 'Cobranças vencidas', 'Média de dias de atraso', 'Maior atraso (dias)'],
          ranking.map((r, i) => [i + 1, r.summary.client.nome, r.summary.client.telefone ? formatPhone(r.summary.client.telefone) : '', moedaCsv(r.total), r.qtd, r.mediaDias, r.maiorAtraso])
        )
      ),
    cobrancas: () =>
      baixarCsv(
        `cobrancas-${faixaArquivo}`,
        gerarCsv(
          ['Cliente', 'Descrição', 'Valor (R$)', 'Recebido (R$)', 'Em aberto (R$)', 'Vencimento', 'Situação', 'Dias de atraso', 'Data de pagamento'],
          cobrancas.map((c) => [c.client?.nome || '', c.descricao || '', moedaCsv(Number(c.valor)), moedaCsv(valorRecebido(c)), moedaCsv(saldoAberto(c)), formatDate(c.data_vencimento), SITUACAO[chargeState(c, hoje)].label, diasDeAtraso(c, hoje), c.data_pagamento ? formatDate(c.data_pagamento) : ''])
        )
      ),
    clientes: () =>
      baixarCsv(
        `clientes-${dia}`,
        gerarCsv(
          ['Nome', 'E-mail', 'Telefone', 'Score', 'Faixa', 'Já pagou (R$)', 'Em atraso (R$)', 'A receber (R$)', 'Cliente desde'],
          clientes.map((s) => [s.client.nome, s.client.email, s.client.telefone ? formatPhone(s.client.telefone) : '', s.score.value, scoreTone(s.score.value).label, moedaCsv(s.pago), moedaCsv(s.emAtraso), moedaCsv(s.aReceber), formatDate(s.client.created_at)])
        )
      ),
  };

  const botao = (tipo: keyof typeof exportar) => (
    <Button variant="secondary" size="sm" onClick={exportar[tipo]}>
      <Download />
      Exportar CSV
    </Button>
  );

  return (
    <div className="space-y-6 @2xl:space-y-8">
      <PageHero eyebrow="Relatórios" title="Seus números," highlight="prontos para analisar." description="Para acompanhar o negócio ou levar ao contador." />

      <div className="flex flex-wrap items-end gap-3">
        <Segmented<Periodo>
          tone="glass"
          aria-label="Período"
          value={periodo}
          onChange={setPeriodo}
          options={[
            { value: 'mes', label: 'Este mês' },
            { value: '3m', label: '3 meses' },
            { value: '6m', label: '6 meses' },
            { value: '12m', label: '12 meses' },
            { value: 'ano', label: 'Este ano' },
            { value: 'custom', label: 'Intervalo' },
          ]}
        />
        {periodo === 'custom' && (
          <div className="flex gap-2">
            <Input label="De" type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-11 text-sm" />
            <Input label="Até" type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-11 text-sm" />
          </div>
        )}
        {periodo === 'custom' && !datasCustom.valido && (
          <p className="w-full text-sm text-warn" role="alert">
            Use datas entre {anoMinimo} e {anoMaximo}, com a data inicial antes da final. Mostrando o mês atual até lá.
          </p>
        )}
      </div>

      <Stagger onMount className="grid grid-cols-2 gap-3 @4xl:grid-cols-4 @4xl:gap-4">
        <KpiTile label="Recebido no período" value={resumo.recebido} tone="pos" icon={<Wallet />} sub={`${resumo.qtdPagas} ${resumo.qtdPagas === 1 ? 'cobrança paga' : 'cobranças pagas'}`} />
        <KpiTile label="Venceu e não foi pago" value={resumo.emAtraso} tone="neg" icon={<AlertTriangle />} sub={`${resumo.qtdAtraso} ${resumo.qtdAtraso === 1 ? 'vencida' : 'vencidas'}`} />
        <KpiTile label="A vencer no período" value={resumo.aReceber} tone="warn" icon={<CalendarClock />} sub={`${resumo.qtdAReceber} no prazo`} />
        <KpiTile label="Taxa de recebimento" value={resumo.taxa} kind="percent" tone="brand" icon={<Percent />} sub="Do que venceu no período" />
      </Stagger>

      <Segmented<Aba>
        aria-label="Seção do relatório"
        value={aba}
        onChange={setAba}
        options={[
          { value: 'resumo', label: 'Resumo' },
          { value: 'cobrancas', label: 'Cobranças', count: cobrancas.length },
          { value: 'clientes', label: 'Clientes', count: summaries.length },
        ]}
      />

      {aba === 'resumo' && (
        <div className="space-y-6">
          <Panel eyebrow="Últimos 12 meses" title="Recebido por mês" hint="Pela data do pagamento">
            <MonthBars data={serie} />
          </Panel>

          <Panel eyebrow={textoPeriodo} title="Resumo por mês" hint="Recebido pela data do pagamento; o restante, pelo vencimento" flush action={botao('resumo_mensal')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y border-line/70">
                  <tr>
                    <th className={cn(th, 'text-left')}>Mês</th>
                    <th className={cn(th, 'text-right')}>Pagas</th>
                    <th className={cn(th, 'text-right')}>A vencer</th>
                    <th className={cn(th, 'text-right')}>Em atraso</th>
                    <th className={cn(th, 'text-right')}>Valor pago</th>
                    <th className={cn(th, 'text-right')}>Valor a vencer</th>
                    <th className={cn(th, 'text-right')}>Valor em atraso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {resumo.meses.map((m) => (
                    <tr key={m.label} className="transition-colors hover:bg-ink/[0.03]">
                      <td className={cn(td, 'capitalize text-ink')}>{m.label}</td>
                      <td className={cn(td, 'text-right text-ink-2')}>{m.pagas}</td>
                      <td className={cn(td, 'text-right text-ink-2')}>{m.aVencer}</td>
                      <td className={cn(td, 'text-right', m.atrasadas > 0 ? 'text-neg' : 'text-ink-2')}>{m.atrasadas}</td>
                      <td className={cn(td, 'text-right font-medium text-pos')}>{formatCurrency(m.valorPago)}</td>
                      <td className={cn(td, 'text-right text-ink-2')}>{formatCurrency(m.valorAVencer)}</td>
                      <td className={cn(td, 'text-right', m.valorAtraso > 0 ? 'font-medium text-neg' : 'text-ink-2')}>{formatCurrency(m.valorAtraso)}</td>
                    </tr>
                  ))}
                </tbody>
                {resumo.meses.length > 1 && (
                  <tfoot className="border-t border-line">
                    <tr className="font-semibold">
                      <td className={cn(td, 'text-ink')}>Total</td>
                      <td className={cn(td, 'text-right text-ink')}>{resumo.qtdPagas}</td>
                      <td className={cn(td, 'text-right text-ink')}>{resumo.qtdAReceber}</td>
                      <td className={cn(td, 'text-right', resumo.qtdAtraso > 0 ? 'text-neg' : 'text-ink')}>{resumo.qtdAtraso}</td>
                      <td className={cn(td, 'text-right text-pos')}>{formatCurrency(resumo.recebido)}</td>
                      <td className={cn(td, 'text-right text-ink')}>{formatCurrency(resumo.aReceber)}</td>
                      <td className={cn(td, 'text-right', resumo.emAtraso > 0 ? 'text-neg' : 'text-ink')}>{formatCurrency(resumo.emAtraso)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Panel>

          <Panel eyebrow={textoPeriodo} title="Recebido por cliente" hint="Pela data do pagamento" flush action={porCliente.length > 0 ? botao('recebido_cliente') : undefined}>
            {porCliente.length === 0 ? (
              <EmptyState compact icon={<Wallet />} title="Nenhum pagamento neste período" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y border-line/70">
                    <tr>
                      <th className={cn(th, 'text-left')}>Cliente</th>
                      <th className={cn(th, 'text-right')}>Pagas</th>
                      <th className={cn(th, 'text-right')}>Recebido</th>
                      <th className={cn(th, 'w-[38%] text-left')}>Participação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/70">
                    {porCliente.slice(0, 10).map((r) => {
                      const parte = resumo.recebido > 0 ? r.valor / resumo.recebido : 0;
                      return (
                        <tr key={r.id} className="transition-colors hover:bg-ink/[0.03]">
                          <td className={cn(td, 'max-w-[14rem] truncate font-medium text-ink')}>{r.nome}</td>
                          <td className={cn(td, 'text-right text-ink-2')}>{r.qtd}</td>
                          <td className={cn(td, 'text-right font-medium text-pos')}>{formatCurrency(r.valor)}</td>
                          <td className={td}>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
                                <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(2, parte * 100)}%` }} />
                              </div>
                              <span className="w-10 text-right text-xs text-ink-3">{Math.round(parte * 100)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {porCliente.length > 10 && <p className="px-4 py-3 text-xs text-ink-3">Mostrando os 10 que mais pagaram de {porCliente.length}. O CSV traz todos.</p>}
              </div>
            )}
          </Panel>

          <div className="grid gap-6 @5xl:grid-cols-2">
            <Panel title="Resumo anual" flush action={anual.length > 0 ? botao('resumo_anual') : undefined}>
              {anual.length === 0 ? (
                <EmptyState compact icon={<FileBarChart2 />} title="Sem dados ainda" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-y border-line/70">
                      <tr>
                        <th className={cn(th, 'text-left')}>Ano</th>
                        <th className={cn(th, 'text-right')}>Pago</th>
                        <th className={cn(th, 'text-right')}>A vencer</th>
                        <th className={cn(th, 'text-right')}>Em atraso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/70">
                      {anual.map((a) => (
                        <tr key={a.label} className="transition-colors hover:bg-ink/[0.03]">
                          <td className={cn(td, 'font-medium text-ink')}>{a.label}</td>
                          <td className={cn(td, 'text-right font-medium text-pos')}>{formatCurrency(a.valorPago)}</td>
                          <td className={cn(td, 'text-right text-ink-2')}>{formatCurrency(a.valorAVencer)}</td>
                          <td className={cn(td, 'text-right', a.valorAtraso > 0 ? 'font-medium text-neg' : 'text-ink-2')}>{formatCurrency(a.valorAtraso)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel title="Inadimplentes" hint={`${painel.qtdAtraso} ${painel.qtdAtraso === 1 ? 'cobrança vencida' : 'cobranças vencidas'} hoje`} flush action={ranking.length > 0 ? botao('inadimplentes') : undefined}>
              {inadimplentes.length === 0 ? (
                <EmptyState compact icon={<PartyPopper />} title="Ninguém em atraso" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-y border-line/70">
                      <tr>
                        <th className={cn(th, 'text-left')}>Cliente</th>
                        <th className={cn(th, 'text-right')}>Em atraso</th>
                        <th className={cn(th, 'text-right')}>Média</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/70">
                      {inadimplentes.map((r) => (
                        <tr key={r.summary.client.id} className="transition-colors hover:bg-ink/[0.03]">
                          <td className={cn(td, 'max-w-[14rem] truncate font-medium text-ink')}>{r.summary.client.nome}</td>
                          <td className={cn(td, 'text-right font-medium text-neg')}>{formatCurrency(r.total)}</td>
                          <td className={cn(td, 'text-right text-ink-2')}>{r.mediaDias}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ranking.length > inadimplentes.length && <p className="px-4 py-3 text-xs text-ink-3">Mostrando os {inadimplentes.length} maiores de {ranking.length}. O CSV traz todos.</p>}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      {aba === 'cobrancas' && (
        <Panel eyebrow={textoPeriodo} title="Cobranças do período" hint={`${cobrancas.length} ${cobrancas.length === 1 ? 'cobrança' : 'cobranças'} com vencimento ou pagamento no período`} flush action={cobrancas.length > 0 ? botao('cobrancas') : undefined}>
          {cobrancas.length === 0 ? (
            <EmptyState compact icon={<Receipt />} title={charges.length === 0 ? 'Nenhuma cobrança ainda' : 'Nenhuma cobrança neste período'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y border-line/70">
                  <tr>
                    <th className={cn(th, 'text-left')}>Cliente</th>
                    <th className={cn(th, 'text-left')}>Descrição</th>
                    <th className={cn(th, 'text-right')}>Valor</th>
                    <th className={cn(th, 'text-right')}>Vencimento</th>
                    <th className={cn(th, 'text-center')}>Situação</th>
                    <th className={cn(th, 'text-right')}>Pagamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {cobrancas.slice(0, LINHAS).map((c) => {
                    const v = SITUACAO[chargeState(c, hoje)];
                    return (
                      <tr key={c.id} className="transition-colors hover:bg-ink/[0.03]">
                        <td className={cn(td, 'max-w-[14rem] truncate font-medium text-ink')}>{c.client?.nome || '—'}</td>
                        <td className={cn(td, 'max-w-[14rem] truncate text-ink-2')}>{c.descricao || '—'}</td>
                        <td className={cn(td, 'text-right font-medium text-ink')}>{formatCurrency(Number(c.valor))}</td>
                        <td className={cn(td, 'text-right text-ink-2')}>{formatDate(c.data_vencimento)}</td>
                        <td className={cn(td, 'text-center')}>
                          <Badge variant={v.variant} dot>
                            {v.label}
                          </Badge>
                        </td>
                        <td className={cn(td, 'text-right text-ink-3')}>{c.data_pagamento ? formatDate(c.data_pagamento) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {cobrancas.length > LINHAS && <p className="px-4 py-3 text-xs text-ink-3">Mostrando {LINHAS} de {cobrancas.length}. O CSV traz todas.</p>}
            </div>
          )}
        </Panel>
      )}

      {aba === 'clientes' && (
        <Panel title="Todos os clientes" hint={`${summaries.length} ${summaries.length === 1 ? 'cliente' : 'clientes'} · totais desde o início, sem filtro de período`} flush action={summaries.length > 0 ? botao('clientes') : undefined}>
          {summaries.length === 0 ? (
            <EmptyState compact icon={<Users />} title="Nenhum cliente ainda" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y border-line/70">
                  <tr>
                    <th className={cn(th, 'text-left')}>Nome</th>
                    <th className={cn(th, 'text-left')}>Telefone</th>
                    <th className={cn(th, 'text-center')}>Score</th>
                    <th className={cn(th, 'text-right')}>Já pagou</th>
                    <th className={cn(th, 'text-right')}>Em atraso</th>
                    <th className={cn(th, 'text-right')}>Cliente desde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {clientes.slice(0, LINHAS).map((s) => (
                    <tr key={s.client.id} className="transition-colors hover:bg-ink/[0.03]">
                      <td className={cn(td, 'max-w-[16rem] truncate font-medium text-ink')}>{s.client.nome}</td>
                      <td className={cn(td, 'text-ink-3')}>{s.client.telefone ? formatPhone(s.client.telefone) : '—'}</td>
                      <td className={cn(td, 'text-center')}>
                        <Badge variant={scoreTone(s.score.value).variant}>{s.score.value ?? 'Sem histórico'}</Badge>
                      </td>
                      <td className={cn(td, 'text-right font-medium text-pos')}>{formatCurrency(s.pago)}</td>
                      <td className={cn(td, 'text-right', s.emAtraso > 0 ? 'font-medium text-neg' : 'text-ink-3')}>{formatCurrency(s.emAtraso)}</td>
                      <td className={cn(td, 'text-right text-ink-3')}>{formatDate(s.client.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clientes.length > LINHAS && <p className="px-4 py-3 text-xs text-ink-3">Mostrando {LINHAS} de {clientes.length}. O CSV traz todos.</p>}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
