'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useWorkspace } from '@/components/workspace/workspace-context';
import { formatCurrency } from '@/lib/utils';

export function TopBar({ onSearch }: { onSearch: () => void }) {
  const { hoje, painel } = useWorkspace();
  // Rendered only after the client-side auth check, so navigator is always available here.
  const mac = /mac/i.test(navigator.platform);

  return (
    <div className="glass sticky top-3 z-30 mb-8 hidden h-[60px] items-center gap-3 rounded-2xl pl-5 pr-2.5 lg:flex">
      <p className="hidden shrink-0 text-sm font-medium text-ink-2 first-letter:uppercase xl:block">{format(hoje, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
      <button onClick={onSearch} className="ml-auto flex h-10 w-full max-w-72 items-center gap-2 rounded-xl bg-ink/[0.05] px-3 text-sm text-ink-3 transition-colors hover:bg-ink/[0.08]">
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">Buscar cliente ou cobrança</span>
        <span className="kbd">{mac ? '⌘' : 'Ctrl'} K</span>
      </button>
      {painel.qtdAtraso > 0 && (
        <Link href="/dashboard/ranking" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-neg-soft px-3 text-sm font-semibold text-neg transition-transform duration-300 ease-spring hover:scale-105 tnum">
          <AlertTriangle className="size-4" />
          {formatCurrency(painel.emAtraso)}
        </Link>
      )}
      <ThemeToggle />
      <Button asChild size="sm" className="h-10 shrink-0">
        <Link href="/dashboard/charges/new">
          <Plus />
          Nova cobrança
        </Link>
      </Button>
    </div>
  );
}
