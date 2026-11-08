'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/data/avatar';
import { Badge } from '@/components/ui/badge';
import { chargeVisual } from '@/lib/ui/status';
import { cn, formatCurrency } from '@/lib/utils';
import { saldoAberto } from '@/lib/domain/charges';
import type { ChargeWithClient } from '@/components/workspace/types';
import { WLink } from '@/components/workspace/workspace-context';
import { QuickActions } from './quick-actions';

const ease = [0.16, 1, 0.3, 1] as const;

export function ChargeItem({ charge, hideClient, onWhatsApp }: { charge: ChargeWithClient; hideClient?: boolean; onWhatsApp?: () => void }) {
  const v = chargeVisual(charge);
  const aberta = charge.status !== 'pago';
  const nome = charge.client?.nome || 'Cliente';
  const valor = aberta ? saldoAberto(charge) : Number(charge.valor);
  return (
    <div className="@container/item">
      <div className="group flex flex-col gap-1.5 px-4 py-2.5 transition-colors hover:bg-ink/[0.03] @md/item:flex-row @md/item:items-center @md/item:gap-3 @lg/item:px-6">
      <WLink href={`/dashboard/charges/${charge.id}`} className="flex min-h-11 w-full min-w-0 flex-1 items-center gap-3 rounded-lg">
        {hideClient ? (
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', v.soft)}>
            <span className={cn('size-2 rounded-full', v.dot)} />
          </span>
        ) : (
          <Avatar name={nome} />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{hideClient ? charge.descricao || 'Cobrança' : nome}</span>
          <span className="block truncate text-xs text-ink-3">{hideClient ? v.label : charge.descricao || 'Cobrança'}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className={cn('text-sm font-semibold tnum', v.key === 'atrasado' ? 'text-neg' : 'text-ink')}>{formatCurrency(valor)}</span>
          <Badge variant={v.variant} dot>
            {v.short}
          </Badge>
        </span>
      </WLink>
      {aberta ? <QuickActions charge={charge} onWhatsApp={onWhatsApp} className="justify-end" /> : <ChevronRight className="hidden size-4 shrink-0 text-ink-4 @lg/item:block" />}
      </div>
    </div>
  );
}

export function ChargeList({ charges, hideClient, onWhatsApp }: { charges: ChargeWithClient[]; hideClient?: boolean; onWhatsApp?: () => void }) {
  // Layout animation is costly: it is only used on the short lists where rows actually move.
  const animado = charges.length <= 40;
  return (
    <ul className="divide-y divide-line/70">
      <AnimatePresence initial={false}>
        {charges.map((c, i) => (
          <motion.li
            key={c.id}
            layout={animado ? 'position' : false}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24, height: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.03, ease }}
          >
            <ChargeItem charge={c} hideClient={hideClient} onWhatsApp={onWhatsApp} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
