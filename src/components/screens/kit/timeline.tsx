'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Receipt } from 'lucide-react';
import type { TimelineEvent } from '@/lib/domain/clients';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { WLink } from '@/components/workspace/workspace-context';

const tipos = {
  pagamento: { icon: CheckCircle2, cls: 'bg-pos-soft text-pos', label: 'Pagamento recebido' },
  lancamento: { icon: Receipt, cls: 'bg-surface-3 text-ink-2', label: 'Cobrança lançada' },
  vencimento: { icon: AlertTriangle, cls: 'bg-neg-soft text-neg', label: 'Venceu sem pagamento' },
};

export function Timeline({ events, showLink = true }: { events: TimelineEvent[]; showLink?: boolean }) {
  return (
    <ol className="relative space-y-1">
      <span className="absolute bottom-4 left-[19px] top-4 w-px bg-line" aria-hidden />
      {events.map((e, i) => {
        const t = tipos[e.kind];
        const corpo = (
          <>
            <span className={cn('relative flex size-10 shrink-0 items-center justify-center rounded-2xl ring-4 ring-surface/60', t.cls)}>
              <t.icon className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{t.label}</span>
              <span className="block truncate text-xs text-ink-3">
                {formatDate(e.date)} · {e.titulo}
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-ink tnum">{formatCurrency(e.valor)}</span>
          </>
        );
        return (
          <motion.li key={e.id} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04 }}>
            {showLink ? (
              <WLink href={`/dashboard/charges/${e.chargeId}`} className="flex items-center gap-3 rounded-2xl py-1.5 transition-colors hover:bg-ink/[0.03]">
                {corpo}
              </WLink>
            ) : (
              <div className="flex items-center gap-3 py-1.5">{corpo}</div>
            )}
          </motion.li>
        );
      })}
    </ol>
  );
}
