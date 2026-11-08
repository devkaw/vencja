'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Circle, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type Goal = 'pago' | 'whatsapp' | 'nova' | 'score';

const goals: { id: Goal; label: string }[] = [
  { id: 'pago', label: 'Registrar um pagamento' },
  { id: 'whatsapp', label: 'Ver a mensagem do WhatsApp' },
  { id: 'nova', label: 'Lançar uma cobrança' },
  { id: 'score', label: 'Ver o score dos clientes' },
];

// The real dashboard screens are heavy: they load only when this section renders.
const DemoApp = dynamic(() => import('./demo-app'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[720px] gap-4 p-6 md:grid-cols-[200px_1fr]" role="status" aria-label="Carregando demonstração">
      <Skeleton className="hidden rounded-2xl md:block" />
      <Skeleton className="rounded-2xl" />
    </div>
  ),
});

export function ProductDemo() {
  const [explored, setExplored] = useState<Set<Goal>>(new Set());
  const [resetKey, setResetKey] = useState(0);

  const onGoal = useCallback((g: Goal) => setExplored((prev) => (prev.has(g) ? prev : new Set(prev).add(g))), []);
  const reset = () => {
    setExplored(new Set());
    setResetKey((k) => k + 1);
  };

  return (
    <div className="relative">
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2" aria-label="O que experimentar">
        {goals.map((g) => {
          const done = explored.has(g.id);
          return (
            <span key={g.id} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors', done ? 'bg-brand-600 text-white' : 'glass text-ink-2')}>
              {done ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5 text-ink-4" />}
              {g.label}
            </span>
          );
        })}
      </div>

      <div className="glass-strong relative overflow-hidden rounded-[28px]">
        <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-ink/15" />
            <span className="size-3 rounded-full bg-ink/15" />
            <span className="size-3 rounded-full bg-ink/15" />
            <span className="ml-3 hidden text-xs font-medium text-ink-3 sm:inline">app.venceja.com.br</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" dot>
              Demonstração · dados fictícios
            </Badge>
            <button onClick={reset} className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-3 hover:bg-ink/5 hover:text-ink" aria-label="Reiniciar demonstração">
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>
          </div>
        </div>
        <DemoApp resetKey={resetKey} onGoal={onGoal} />
      </div>

      <p className="mt-3 text-center text-xs text-ink-2">São as mesmas telas e os mesmos cálculos da sua conta, no plano Pro. Planos e configurações ficam só na conta.</p>

      <AnimatePresence>
        {explored.size >= 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-6 flex max-w-2xl flex-col items-center justify-between gap-3 rounded-2xl border border-brand-500/25 bg-surface p-4 text-center shadow-card sm:flex-row sm:text-left">
            <p className="text-sm text-ink-2">
              <strong className="text-ink">Viu como funciona?</strong> Faça o mesmo com os seus clientes de verdade. É grátis até 3 clientes.
            </p>
            <Button asChild className="shrink-0">
              <Link href="/register">
                Criar conta grátis
                <ArrowRight />
              </Link>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
