'use client';

import { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { Tooltip } from '@/components/ui/tooltip';
import type { ChargeWithClient } from '@/components/workspace/types';
import { useWorkspace, WLink } from '@/components/workspace/workspace-context';
import { cn } from '@/lib/utils';
import { usePayment } from './payment-context';
import { WhatsAppSheet } from './whatsapp-sheet';

const botao = 'flex size-11 shrink-0 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-300 ease-spring hover:scale-110 active:scale-95 @md/item:size-9 @2xl:size-9';

export function QuickActions({ charge, className, onWhatsApp }: { charge: ChargeWithClient; className?: string; onWhatsApp?: () => void }) {
  const { isPro } = useWorkspace();
  const pagamento = usePayment();
  const [whats, setWhats] = useState(false);
  const nome = charge.client?.nome || 'cliente';
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className={cn('flex shrink-0 gap-1.5', className)} onClick={stop}>
      {!isPro ? (
        <Tooltip content="Cobrança pelo WhatsApp é do plano Pro">
          <WLink href="/dashboard/upgrade" className={cn(botao, 'bg-surface-3 text-ink-3')} aria-label="Cobrar no WhatsApp, recurso do plano Pro">
            <Lock className="size-4" />
          </WLink>
        </Tooltip>
      ) : charge.client?.telefone ? (
        <Tooltip content="Cobrar no WhatsApp">
          <button
            type="button"
            onClick={() => {
              setWhats(true);
              onWhatsApp?.();
            }}
            className={cn(botao, 'bg-brand-soft text-brand-ink hover:bg-brand-600 hover:text-white')}
            aria-label={`Cobrar ${nome} no WhatsApp`}
          >
            <WhatsAppIcon className="size-4" />
          </button>
        </Tooltip>
      ) : (
        <Tooltip content="Cadastre o WhatsApp do cliente para cobrar">
          <WLink href={`/dashboard/clients/${charge.client_id}?edit=true`} className={cn(botao, 'bg-surface-3 text-ink-4')} aria-label={`Cadastrar WhatsApp de ${nome}`}>
            <WhatsAppIcon className="size-4" />
          </WLink>
        </Tooltip>
      )}
      <Tooltip content="Marcar como pago">
        <button type="button" onClick={() => pagamento.open(charge)} className={cn(botao, 'bg-pos-soft text-pos hover:bg-pos hover:text-white dark:hover:text-canvas')} aria-label={`Marcar cobrança de ${nome} como paga`}>
          <Check className="size-4" strokeWidth={2.6} />
        </button>
      </Tooltip>
      {whats && <WhatsAppSheet charge={charge} open={whats} onClose={() => setWhats(false)} />}
    </div>
  );
}
