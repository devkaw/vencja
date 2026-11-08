'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from 'radix-ui';
import { CornerDownLeft, Plus, Search, UserPlus } from 'lucide-react';
import { Avatar } from '@/components/data/avatar';
import { usePortalContainer } from '@/components/ui/portal-context';
import { useWorkspace, useWorkspaceNav } from '@/components/workspace/workspace-context';
import { chargeVisual } from '@/lib/ui/status';
import { cn, formatCurrency } from '@/lib/utils';

interface Result {
  id: string;
  grupo: 'Ações' | 'Clientes' | 'Cobranças';
  titulo: string;
  sub?: string;
  href: string;
  avatar?: string;
  icon?: React.ReactNode;
}

const normaliza = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function CommandPalette({ open, onOpenChange, shortcut = true }: { open: boolean; onOpenChange: (open: boolean) => void; shortcut?: boolean }) {
  const { summaries, charges } = useWorkspace();
  const nav = useWorkspaceNav();
  const container = usePortalContainer();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const lista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenChange, shortcut]);

  const results = useMemo<Result[]>(() => {
    const q = normaliza(query.trim());
    const acoes: Result[] = [
      { id: 'a-c', grupo: 'Ações' as const, titulo: 'Nova cobrança', href: '/dashboard/charges/new', icon: <Plus className="size-4" /> },
      { id: 'a-n', grupo: 'Ações' as const, titulo: 'Novo cliente', href: '/dashboard/clients/new', icon: <UserPlus className="size-4" /> },
    ].filter((a) => !q || normaliza(a.titulo).includes(q));
    if (!q) return acoes;
    const clientes = summaries
      .filter((s) => normaliza(`${s.client.nome} ${s.client.telefone || ''}`).includes(q))
      .slice(0, 5)
      .map((s) => ({ id: s.client.id, grupo: 'Clientes' as const, titulo: s.client.nome, sub: s.emAtraso > 0 ? `${formatCurrency(s.emAtraso)} em atraso` : 'Em dia', href: `/dashboard/clients/${s.client.id}`, avatar: s.client.nome }));
    const cobrancas = charges
      .filter((c) => normaliza(`${c.client?.nome || ''} ${c.descricao || ''}`).includes(q))
      .slice(0, 6)
      .map((c) => ({ id: c.id, grupo: 'Cobranças' as const, titulo: c.descricao || 'Cobrança', sub: `${c.client?.nome || 'Cliente'} · ${formatCurrency(Number(c.valor))} · ${chargeVisual(c).label}`, href: `/dashboard/charges/${c.id}`, avatar: c.client?.nome || '?' }));
    return [...clientes, ...cobrancas, ...acoes];
  }, [charges, query, summaries]);

  const alternar = (aberto: boolean) => {
    if (!aberto) {
      setQuery('');
      setCursor(0);
    }
    onOpenChange(aberto);
  };

  useEffect(() => {
    lista.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const ir = (r?: Result) => {
    if (!r) return;
    alternar(false);
    nav.push(r.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      ir(results[cursor]);
    }
  };

  let grupoAnterior = '';

  return (
    <Dialog.Root open={open} onOpenChange={alternar}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-[3px] data-[state=open]:animate-fade-in dark:bg-black/60" />
        <Dialog.Content className="glass-strong fixed left-1/2 top-[8vh] z-[61] flex max-h-[70vh] w-[min(36rem,calc(100%-1.5rem))] -translate-x-1/2 flex-col overflow-hidden rounded-3xl focus:outline-none data-[state=open]:animate-scale-in" onKeyDown={onKeyDown}>
          <Dialog.Title className="sr-only">Buscar</Dialog.Title>
          <Dialog.Description className="sr-only">Busque clientes e cobranças, ou crie um novo registro.</Dialog.Description>
          <label className="flex items-center gap-3 border-b border-line/70 px-5">
            <Search className="size-[18px] shrink-0 text-ink-3" />
            <input autoFocus value={query} onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }} placeholder="Buscar cliente ou cobrança" aria-label="Buscar cliente ou cobrança" className="h-14 w-full bg-transparent text-[15px] text-ink placeholder:text-ink-4 focus:outline-none" />
          </label>
          <div ref={lista} className="overflow-y-auto p-2" role="listbox" aria-label="Resultados">
            {results.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-3">Nada encontrado para “{query}”.</p>}
            {results.map((r, i) => {
              const titulo = r.grupo !== grupoAnterior;
              grupoAnterior = r.grupo;
              return (
                <div key={r.id}>
                  {titulo && <p className="px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-4">{r.grupo}</p>}
                  <button
                    role="option"
                    aria-selected={i === cursor}
                    data-active={i === cursor}
                    onPointerMove={() => setCursor(i)}
                    onClick={() => ir(r)}
                    className={cn('flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left', i === cursor && 'bg-brand-soft')}
                  >
                    {r.avatar ? <Avatar name={r.avatar} size="sm" /> : <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white">{r.icon}</span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{r.titulo}</span>
                      {r.sub && <span className="block truncate text-xs text-ink-3">{r.sub}</span>}
                    </span>
                    {i === cursor && <CornerDownLeft className="hidden size-3.5 shrink-0 text-ink-3 sm:block" />}
                  </button>
                </div>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
