'use client';

import { ArrowUpDown, LayoutGrid, List, Search } from 'lucide-react';
import { fieldClasses } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
      <input type="search" placeholder={placeholder} aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={cn(fieldClasses, 'h-11 pl-10 text-sm shadow-none focus:scale-100')} />
    </div>
  );
}

export function SortOrder({ order, onToggle }: { order: 'asc' | 'desc'; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex size-11 items-center justify-center rounded-xl border border-line text-ink-3 transition-colors hover:text-ink" aria-label={order === 'asc' ? 'Ordem crescente (inverter)' : 'Ordem decrescente (inverter)'}>
      <ArrowUpDown className={cn('size-4 transition-transform', order === 'desc' && 'rotate-180')} />
    </button>
  );
}

export function ViewToggle({ value, onChange }: { value: 'list' | 'grid'; onChange: (v: 'list' | 'grid') => void }) {
  return (
    <div className="hidden rounded-xl bg-ink/[0.05] p-1 @2xl:flex" role="group" aria-label="Modo de exibição">
      {(['list', 'grid'] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          aria-label={mode === 'list' ? 'Ver em lista' : 'Ver em cartões'}
          className={cn('flex size-9 items-center justify-center rounded-lg transition-colors', value === mode ? 'bg-surface text-ink shadow-xs dark:bg-surface-3' : 'text-ink-3 hover:text-ink')}
        >
          {mode === 'list' ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
        </button>
      ))}
    </div>
  );
}

export const selectClasses = 'h-11 min-w-0 cursor-pointer rounded-xl border border-line bg-surface px-3 text-sm text-ink-2 focus:border-brand-500 focus:outline-none';
