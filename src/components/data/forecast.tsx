'use client';

import { motion } from 'framer-motion';
import type { SemanaPrevisao } from '@/lib/domain/metrics';
import { formatCurrency } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

export function Forecast({ data }: { data: SemanaPrevisao[] }) {
  const max = Math.max(1, ...data.map((d) => d.valor));
  return (
    <ul className="space-y-3.5">
      {data.map((s, i) => (
        <li key={s.semana}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ink-2 tnum">{s.semana}</span>
            <span className="truncate font-semibold text-ink tnum">{formatCurrency(s.valor)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300" initial={{ width: 0 }} whileInView={{ width: `${(s.valor / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.07, ease }} />
          </div>
          <p className="mt-1 text-2xs text-ink-4">{s.qtd === 0 ? 'Nenhum vencimento' : s.qtd === 1 ? '1 cobrança' : `${s.qtd} cobranças`}</p>
        </li>
      ))}
    </ul>
  );
}
