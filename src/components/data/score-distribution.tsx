'use client';

import type { ScoreFaixa } from '@/lib/domain/metrics';
import { DonutChart } from './charts';

const faixas: { key: ScoreFaixa; label: string; color: string; dot: string }[] = [
  { key: 'bom', label: 'Bom pagador', color: 'rgb(var(--pos-fill))', dot: 'bg-pos' },
  { key: 'atencao', label: 'Atenção', color: 'rgb(var(--warn-fill))', dot: 'bg-warn' },
  { key: 'risco', label: 'Risco alto', color: 'rgb(var(--neg-fill))', dot: 'bg-neg' },
  { key: 'sem_historico', label: 'Sem histórico', color: 'rgb(var(--ink) / 0.18)', dot: 'bg-ink-4' },
];

export function ScoreDistribution({ data }: { data: Record<ScoreFaixa, number> }) {
  const total = Object.values(data).reduce((s, n) => s + n, 0);
  return (
    <div className="flex items-center gap-5">
      <DonutChart size={132} thickness={16} segments={faixas.map((f) => ({ label: f.label, value: data[f.key], color: f.color }))} centerValue={total} centerLabel={total === 1 ? 'cliente' : 'clientes'} />
      <ul className="min-w-0 flex-1 space-y-2">
        {faixas.map((f) => (
          <li key={f.key} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-ink-2">
              <span className={`size-2 shrink-0 rounded-full ${f.dot}`} />
              <span className="truncate">{f.label}</span>
            </span>
            <span className="font-semibold text-ink tnum">{data[f.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
