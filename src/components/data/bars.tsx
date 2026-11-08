'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MesSerie } from '@/lib/domain/metrics';
import { cn, formatCurrency } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

/** Received money per month over what was expected, with a detail line for the focused month. */
export function MonthBars({ data, height = 200 }: { data: MesSerie[]; height?: number }) {
  const [ativo, setAtivo] = useState(data.length - 1);
  const max = Math.max(1, ...data.flatMap((d) => [d.recebido, d.previsto]));
  const atual = data[Math.min(ativo, data.length - 1)];

  return (
    <figure>
      <figcaption className="sr-only">Recebido por mês: {data.map((d) => `${d.label} ${formatCurrency(d.recebido)}`).join(', ')}.</figcaption>
      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-1" aria-live="polite">
        <div>
          <p className="text-xs text-ink-3">Recebido em {atual.label}</p>
          <p className="font-display text-2xl font-semibold text-ink tnum">{formatCurrency(atual.recebido)}</p>
        </div>
        <p className="pb-1 text-xs text-ink-3 tnum">
          Previsto {formatCurrency(atual.previsto)}
          {atual.atraso > 0 && <span className="text-neg"> · {formatCurrency(atual.atraso)} em atraso</span>}
        </p>
      </div>
      <div className="flex items-end gap-1 @2xl:gap-2" style={{ height }} onPointerLeave={() => setAtivo(data.length - 1)}>
        {data.map((d, i) => (
          <button
            key={d.inicio.toISOString()}
            type="button"
            onPointerEnter={() => setAtivo(i)}
            onFocus={() => setAtivo(i)}
            onClick={() => setAtivo(i)}
            aria-label={`${d.label}: ${formatCurrency(d.recebido)}`}
            className="group relative flex h-full min-w-0 flex-1 flex-col justify-end rounded-lg"
          >
            <motion.span
              className="absolute inset-x-0 bottom-0 rounded-t-lg bg-ink/[0.06]"
              initial={{ height: 0 }}
              whileInView={{ height: `${(d.previsto / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.03, ease }}
            />
            <motion.span
              className={cn('relative block rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 transition-[filter] dark:from-brand-500 dark:to-brand-300', i === ativo ? 'brightness-110' : 'opacity-80')}
              initial={{ height: 0 }}
              whileInView={{ height: `${(d.recebido / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1 + i * 0.03, ease }}
            />
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-1 @2xl:gap-2" aria-hidden>
        {data.map((d, i) => (
          <span key={d.inicio.toISOString()} className={cn('min-w-0 flex-1 text-center text-2xs capitalize text-ink-4', i === ativo && 'font-semibold text-ink-2', data.length > 8 && i % 2 === 1 && 'max-[28rem]:invisible')}>
            {d.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
