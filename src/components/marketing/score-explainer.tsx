'use client';

import { useMemo, useState } from 'react';
import { calcularScore } from '@/lib/domain/score';
import { motion } from 'framer-motion';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertTriangle, MousePointerClick } from 'lucide-react';
import { AnimatedNumber } from '@/components/data/animated-number';
import { Avatar } from '@/components/data/avatar';
import { scoreTone } from '@/lib/ui/status';
import { AnimatedWords, GlassPanel, Reveal } from '@/components/motion/primitives';
import { ScoreBreakdown } from '@/components/screens/kit/score-breakdown';
import { cn } from '@/lib/utils';
import type { Charge } from '@/types';

type State = 'em_dia' | 'atrasou' | 'aberto';

const order: State[] = ['em_dia', 'atrasou', 'aberto'];

const stateUi: Record<State, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  em_dia: { label: 'Pagou em dia', cls: 'bg-pos-soft text-pos ring-pos/20', icon: CheckCircle2 },
  atrasou: { label: 'Pagou com 15 dias de atraso', cls: 'bg-warn-soft text-warn ring-warn/25', icon: Clock },
  aberto: { label: 'Não pagou', cls: 'bg-neg-soft text-neg ring-neg/20', icon: AlertTriangle },
};

const criteria = [
  { label: 'Cobranças pagas, entre as que já venceram', weight: 35 },
  { label: 'Pontualidade: quanto do valor foi pago em dia', weight: 30 },
  { label: 'Tamanho dos atrasos, pesados pelo valor, inclusive os abertos', weight: 20 },
  { label: 'Valor vencido que continua em aberto', weight: 15 },
];

export function ScoreExplainer() {
  const [states, setStates] = useState<State[]>(['em_dia', 'em_dia', 'atrasou', 'em_dia', 'em_dia', 'aberto']);

  const charges: Charge[] = useMemo(
    () =>
      states.map((s, i) => {
        const venc = addDays(new Date(), -30 * (states.length - i));
        const v = format(venc, 'yyyy-MM-dd');
        return {
          id: String(i),
          user_id: 'demo',
          client_id: 'demo',
          valor: 300,
          valor_pago: s === 'aberto' ? 0 : 300,
          data_vencimento: v,
          status: s === 'aberto' ? 'pendente' : 'pago',
          data_pagamento: s === 'aberto' ? null : format(addDays(venc, s === 'atrasou' ? 15 : 0), 'yyyy-MM-dd'),
          dias_atraso: 0,
          descricao: null,
          recorrente: false,
          periodicidade: null,
          charge_original_id: null,
          created_at: v,
        };
      }),
    [states]
  );

  // Same function the app uses for every real client.
  const resultado = calcularScore(charges);
  const score = resultado.value ?? 0;
  const tone = scoreTone(score);
  const r = 70;
  const c = 2 * Math.PI * r;
  const color = tone.fill;

  const cycle = (i: number) => setStates((prev) => prev.map((s, j) => (j === i ? order[(order.indexOf(s) + 1) % order.length] : s)));

  return (
    <section className="relative overflow-hidden py-20 lg:py-28" aria-labelledby="score-title">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal x={-24} y={0}>
          <p className="eyebrow">Score do cliente</p>
          <h2 id="score-title" className="mt-3 font-display text-display-lg font-semibold text-ink">
<AnimatedWords text="Saiba quem paga em dia antes de fechar o próximo serviço." />
</h2>
          <p className="mt-4 text-lg text-ink-2">
            Cada cliente recebe uma nota de 0 a 100, calculada pelo histórico real de pagamentos. Ela é refeita sozinha a cada pagamento e a cada vencimento. Cobrança no prazo não conta contra ninguém.
          </p>
          <ul className="mt-8 space-y-3">
            {criteria.map((cr) => (
              <li key={cr.label} className="flex items-center gap-4">
                <span className="w-10 text-right font-display text-lg font-semibold text-brand-ink tnum">{cr.weight}</span>
                <div className="flex-1">
                  <p className="text-sm text-ink">{cr.label}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div className="h-full rounded-full bg-brand-500/70" style={{ width: `${(cr.weight / 35) * 100}%` }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-3">Pontos máximos de cada critério. A soma dá até 100. O que aconteceu recentemente pesa mais: o histórico pago perde metade do peso a cada 6 meses. Com menos de 5 cobranças, a nota fica mais perto de 70. Enquanto houver cobrança vencida em aberto, a nota não passa de 79, e esse limite desce aos poucos até 49 quando o atraso chega a 90 dias. Quem ainda não tem cobrança paga ou vencida aparece como “Sem histórico”.</p>
        </Reveal>

        <Reveal x={24} y={0}>
        <GlassPanel strong lift={false} className="rounded-[30px] p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <Avatar name="Rafael Lima" size="lg" />
            <div className="flex-1">
              <p className="font-semibold text-ink">Rafael Lima</p>
              <p className="text-xs text-ink-3">Cliente fictício · cobranças mensais dos últimos 6 meses</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div className="relative size-40 shrink-0">
              <svg viewBox="0 0 160 160" className="size-40 -rotate-90" aria-hidden>
                <circle cx="80" cy="80" r={r} fill="none" stroke="rgb(var(--ink) / 0.07)" strokeWidth="12" />
                <motion.circle
                  cx="80"
                  cy="80"
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth="12"
                  strokeLinecap="round"
                  animate={{ strokeDasharray: `${(score / 100) * c} ${c}` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center" aria-live="polite">
                <span className="font-display text-5xl font-semibold tracking-tight text-ink tnum">
                  <AnimatedNumber value={score} duration={600} />
                </span>
                <span className={cn('text-xs font-semibold', tone.text)}>{tone.label}</span>
              </div>
            </div>

            <ol className="grid w-full grid-cols-2 gap-2 sm:grid-cols-1">
              {states.map((s, i) => {
                const ui = stateUi[s];
                const month = format(addDays(new Date(), -30 * (states.length - i)), 'MMM', { locale: ptBR });
                return (
                  <li key={i}>
                    <button
                      onClick={() => cycle(i)}
                      className={cn('flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium ring-1 ring-inset transition-transform duration-300 ease-spring hover:scale-105 active:scale-95', ui.cls)}
                      aria-label={`Cobrança de ${month}: ${ui.label}. Toque para mudar.`}
                    >
                      <ui.icon className="size-3.5 shrink-0" />
                      <span className="w-8 shrink-0 capitalize opacity-70">{month}</span>
                      <span className="truncate">{ui.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="mt-6 border-t border-line/70 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">Por que esta nota</p>
            <ScoreBreakdown score={resultado} />
          </div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink-3">
            <MousePointerClick className="size-3.5" />
            Toque nas cobranças para mudar o histórico e ver o score reagir.
          </p>
        </GlassPanel>
        </Reveal>
      </div>
    </section>
  );
}
