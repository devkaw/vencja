'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { EmptyState } from '@/components/data/empty-state';
import { GlassPanel, Reveal } from '@/components/motion/primitives';
import { Button } from '@/components/ui/button';
import type { ChargeWithClient } from '@/components/workspace/types';
import { useWorkspace } from '@/components/workspace/workspace-context';
import { chargeState, saldoAberto, valorRecebido } from '@/lib/domain/charges';
import { cn, formatCurrency } from '@/lib/utils';
import { ChargeItem } from './kit/charge-list';
import { PageHero } from './kit/page-hero';

type Tipo = 'pago' | 'criado' | 'vencido' | 'pendente';
interface Evento {
  tipo: Tipo;
  charge: ChargeWithClient;
  valor: number;
}

const tipos: Record<Tipo, { label: string; dot: string; soft: string; text: string; icon: typeof CheckCircle2 }> = {
  pendente: { label: 'A vencer', dot: 'bg-warn', soft: 'bg-warn-soft', text: 'text-warn', icon: Clock },
  vencido: { label: 'Vencidas', dot: 'bg-neg', soft: 'bg-neg-soft', text: 'text-neg', icon: AlertTriangle },
  pago: { label: 'Pagamentos', dot: 'bg-pos', soft: 'bg-pos-soft', text: 'text-pos', icon: CheckCircle2 },
  criado: { label: 'Lançadas', dot: 'bg-info', soft: 'bg-info-soft', text: 'text-info', icon: Plus },
};

const ordem: Tipo[] = ['pendente', 'vencido', 'pago', 'criado'];
const chave = (d: Date) => format(d, 'yyyy-MM-dd');

export function CalendarScreen({ onWhatsApp }: { onWhatsApp?: () => void }) {
  const { charges, hoje } = useWorkspace();
  const [mes, setMes] = useState(() => startOfMonth(hoje));
  const [direcao, setDirecao] = useState(1);
  const [selecionado, setSelecionado] = useState<Date | null>(hoje);
  const [filtros, setFiltros] = useState<Record<Tipo, boolean>>({ pendente: true, vencido: true, pago: true, criado: false });

  const porDia = useMemo(() => {
    const mapa = new Map<string, Evento[]>();
    const adicionar = (dia: string, e: Evento) => {
      const lista = mapa.get(dia);
      if (lista) lista.push(e);
      else mapa.set(dia, [e]);
    };
    for (const c of charges) {
      const estado = chargeState(c, hoje);
      adicionar(chave(new Date(c.created_at)), { tipo: 'criado', charge: c, valor: Number(c.valor) });
      if (estado === 'pago') {
        if (c.data_pagamento) adicionar(c.data_pagamento.split('T')[0], { tipo: 'pago', charge: c, valor: valorRecebido(c) });
      } else {
        adicionar(c.data_vencimento.split('T')[0], { tipo: estado === 'atrasado' ? 'vencido' : 'pendente', charge: c, valor: saldoAberto(c) });
      }
    }
    return mapa;
  }, [charges, hoje]);

  const dias = useMemo(() => eachDayOfInterval({ start: startOfWeek(startOfMonth(mes)), end: endOfWeek(endOfMonth(mes)) }), [mes]);

  const totais = useMemo(() => {
    const t: Record<Tipo, { qtd: number; valor: number }> = { pago: { qtd: 0, valor: 0 }, vencido: { qtd: 0, valor: 0 }, pendente: { qtd: 0, valor: 0 }, criado: { qtd: 0, valor: 0 } };
    for (const d of dias) {
      if (!isSameMonth(d, mes)) continue;
      for (const e of porDia.get(chave(d)) || []) {
        t[e.tipo].qtd += 1;
        t[e.tipo].valor += e.valor;
      }
    }
    return t;
  }, [dias, mes, porDia]);

  const navegar = (d: number) => {
    setDirecao(d);
    setMes((m) => (d < 0 ? subMonths(m, 1) : addMonths(m, 1)));
    setSelecionado(null);
  };

  const irParaHoje = () => {
    setMes(startOfMonth(hoje));
    setSelecionado(hoje);
  };

  const eventosDoDia = selecionado ? (porDia.get(chave(selecionado)) || []).filter((e) => filtros[e.tipo]) : [];

  return (
    <div className="space-y-6 @2xl:space-y-8">
      <PageHero
        eyebrow="Calendário"
        title="Seu mês"
        highlight="em uma tela."
        description="Vencimentos, pagamentos e lançamentos, dia a dia."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={irParaHoje}>
              Hoje
            </Button>
            <div className="glass flex items-center rounded-xl">
              <button onClick={() => navegar(-1)} className="flex size-11 items-center justify-center rounded-l-xl text-ink-3 hover:text-ink" aria-label="Mês anterior">
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-[132px] text-center text-sm font-semibold capitalize text-ink" aria-live="polite">
                {format(mes, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button onClick={() => navegar(1)} className="flex size-11 items-center justify-center rounded-r-xl text-ink-3 hover:text-ink" aria-label="Próximo mês">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 @4xl:grid-cols-4 @4xl:gap-4" role="group" aria-label="Filtrar eventos do calendário">
        {ordem.map((tipo) => {
          const t = tipos[tipo];
          return (
            <button
              key={tipo}
              onClick={() => setFiltros((f) => ({ ...f, [tipo]: !f[tipo] }))}
              aria-pressed={filtros[tipo]}
              className={cn('glass flex min-w-0 items-center gap-3 rounded-2xl p-3 text-left transition-[opacity,transform] duration-300 ease-spring hover:scale-[1.04] active:scale-95 @2xl:p-4', !filtros[tipo] && 'opacity-50')}
            >
              <span className={cn('hidden size-10 shrink-0 items-center justify-center rounded-2xl @md:flex', t.soft, t.text)}>
                <t.icon className="size-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-ink-3">
                  {t.label} · {totais[tipo].qtd}
                </span>
                <span className="block truncate text-sm font-semibold text-ink tnum">{formatCurrency(totais[tipo].valor)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 @4xl:grid-cols-[1fr_360px] @4xl:items-start">
        <Reveal y={26}>
          <GlassPanel lift={false} className="rounded-[28px] p-2 @2xl:p-4">
            <div className="grid grid-cols-7 pb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="py-1 text-center text-2xs font-semibold uppercase tracking-wide text-ink-4">
                  {d}
                </div>
              ))}
            </div>
            <motion.div key={chave(mes)} initial={{ opacity: 0, x: direcao * 36 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="grid grid-cols-7 gap-1">
              {dias.map((dia) => {
                const doMes = isSameMonth(dia, mes);
                const sel = selecionado ? isSameDay(dia, selecionado) : false;
                const eHoje = isSameDay(dia, hoje);
                const eventos = (porDia.get(chave(dia)) || []).filter((e) => filtros[e.tipo]);
                const presentes = ordem.filter((t) => eventos.some((e) => e.tipo === t));
                const valor = eventos.filter((e) => e.tipo !== 'criado').reduce((s, e) => s + e.valor, 0);
                return (
                  <button
                    key={chave(dia)}
                    onClick={() => doMes && setSelecionado(sel ? null : dia)}
                    disabled={!doMes}
                    aria-pressed={sel}
                    aria-label={`${format(dia, "d 'de' MMMM", { locale: ptBR })}${eventos.length ? `, ${eventos.length} ${eventos.length === 1 ? 'evento' : 'eventos'}` : ''}${valor > 0 ? `, ${formatCurrency(valor)}` : ''}`}
                    className={cn(
                      'relative flex min-h-12 flex-col items-center rounded-2xl p-1 text-left transition-[background-color,transform] duration-300 ease-spring @2xl:h-24 @2xl:items-stretch @2xl:p-2',
                      doMes ? 'hover:z-10 hover:scale-105 hover:bg-ink/[0.05] active:scale-95' : 'cursor-default opacity-30',
                      sel && 'bg-brand-soft ring-1 ring-inset ring-brand-500/40 hover:bg-brand-soft'
                    )}
                  >
                    <span className={cn('flex size-7 items-center justify-center rounded-full text-[13px] tnum', eHoje ? 'bg-brand-600 font-semibold text-white' : sel ? 'font-semibold text-brand-ink' : 'text-ink-2')}>{format(dia, 'd')}</span>
                    {presentes.length > 0 && (
                      <>
                        <span className="mt-auto flex gap-0.5 @2xl:hidden">
                          {presentes.map((t) => (
                            <span key={t} className={cn('size-1.5 rounded-full', tipos[t].dot)} />
                          ))}
                        </span>
                        <span className="mt-auto hidden space-y-1 @2xl:block">
                          <span className="flex gap-1">
                            {presentes.map((t) => (
                              <span key={t} className={cn('h-1 flex-1 rounded-full', tipos[t].dot)} />
                            ))}
                          </span>
                          {valor > 0 && <span className="block truncate text-2xs font-medium text-ink-3 tnum">{formatCurrency(valor)}</span>}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </GlassPanel>
        </Reveal>

        <aside className="@4xl:sticky @4xl:top-24" aria-live="polite">
          <GlassPanel strong lift={false} className="overflow-hidden rounded-[28px]">
            <div className="border-b border-line/70 px-5 py-4">
              <p className="text-xs text-ink-3 first-letter:uppercase">{selecionado ? format(selecionado, 'EEEE', { locale: ptBR }) : 'Nenhum dia selecionado'}</p>
              <p className="font-display text-xl font-semibold text-ink">{selecionado ? format(selecionado, "d 'de' MMMM", { locale: ptBR }) : 'Escolha um dia'}</p>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={selecionado?.toDateString() || 'nenhum'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                {!selecionado ? (
                  <EmptyState compact icon={<CalendarDays />} title="Toque em um dia" description="Os vencimentos e pagamentos daquele dia aparecem aqui." />
                ) : eventosDoDia.length === 0 ? (
                  <EmptyState compact icon={<CalendarDays />} title="Nada neste dia" description="Nenhum evento com os filtros atuais." />
                ) : (
                  <ul className="max-h-[28rem] divide-y divide-line/70 overflow-y-auto">
                    {eventosDoDia.map((e) => (
                      <li key={`${e.charge.id}-${e.tipo}`}>
                        <p className={cn('flex items-center gap-1.5 px-4 pt-2.5 text-2xs font-semibold @2xl:px-6', tipos[e.tipo].text)}>
                          <span className={cn('size-1.5 rounded-full', tipos[e.tipo].dot)} />
                          {tipos[e.tipo].label}
                        </p>
                        <ChargeItem charge={e.charge} onWhatsApp={onWhatsApp} />
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>
          </GlassPanel>
        </aside>
      </div>
    </div>
  );
}
