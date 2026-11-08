'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { AnimatedNumber } from '@/components/data/animated-number';
import { Spark } from '@/components/data/spark';
import { GlassPanel, StaggerItem } from '@/components/motion/primitives';
import { cn, formatCurrency } from '@/lib/utils';

type Tone = 'brand' | 'pos' | 'neg' | 'warn' | 'neutral';

const chips: Record<Tone, string> = {
  brand: 'bg-brand-600 text-white',
  pos: 'bg-pos-soft text-pos',
  neg: 'bg-neg-soft text-neg',
  warn: 'bg-warn-soft text-warn',
  neutral: 'bg-surface-3 text-ink-2',
};

interface KpiTileProps {
  label: string;
  value: number | null;
  kind?: 'currency' | 'number' | 'percent' | 'days';
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  /** Change as a fraction. Positive is shown as good unless invertDelta is set. */
  delta?: number | null;
  invertDelta?: boolean;
  spark?: number[];
  sparkColor?: string;
}

const formatos = {
  currency: formatCurrency,
  number: (n: number) => Math.round(n).toLocaleString('pt-BR'),
  percent: (n: number) => `${Math.round(n * 100)}%`,
  days: (n: number) => (Math.round(n) === 1 ? '1 dia' : `${Math.round(n)} dias`),
};

export function KpiTile({ label, value, kind = 'currency', sub, icon, tone = 'neutral', delta, invertDelta, spark, sparkColor }: KpiTileProps) {
  const subiu = (delta ?? 0) >= 0;
  const bom = invertDelta ? !subiu : subiu;
  return (
    <StaggerItem className="min-w-0">
      <GlassPanel className="flex h-full flex-col rounded-3xl p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-[13px] font-medium leading-snug text-ink-3">{label}</p>
          {icon && <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ease-spring [&_svg]:size-4', chips[tone])}>{icon}</span>}
        </div>
        <p className={cn('mt-3 truncate font-display text-[clamp(1.2rem,3.4cqw,1.7rem)] font-semibold tracking-tight tnum', tone === 'neg' && (value ?? 0) > 0 ? 'text-neg' : 'text-ink')}>
          {value === null ? '—' : <AnimatedNumber value={value} format={formatos[kind]} />}
        </p>
        <div className="mt-1 flex min-h-5 items-center gap-2 text-xs text-ink-3">
          {typeof delta === 'number' && (
            <span className={cn('inline-flex shrink-0 items-center gap-0.5 font-semibold tnum', bom ? 'text-pos' : 'text-neg')}>
              {subiu ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(Math.round(delta * 100))}%
            </span>
          )}
          {sub && <span className="min-w-0 truncate">{sub}</span>}
        </div>
        {spark && <Spark values={spark} color={sparkColor} className="mt-3" />}
      </GlassPanel>
    </StaggerItem>
  );
}
