'use client';

import { format } from 'date-fns';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { chargeState, saldoAberto } from '@/lib/domain/charges';
import { gerarLinkWhatsApp } from '@/lib/utils';
import type { ChargeWithClient } from '@/components/workspace/types';
import { useWorkspace } from '@/components/workspace/workspace-context';

export function linkDaCobranca(charge: ChargeWithClient, remetente: string, hoje: Date) {
  return gerarLinkWhatsApp(
    charge.client?.nome || 'Cliente',
    charge.client?.telefone || '',
    saldoAberto(charge),
    charge.data_vencimento.split('T')[0],
    chargeState(charge, hoje) === 'atrasado' ? 'atrasado' : 'pendente',
    charge.descricao || undefined,
    remetente || undefined
  );
}

export function WhatsAppSheet({ charge, open, onClose, onOpened }: { charge: ChargeWithClient; open: boolean; onClose: () => void; onOpened?: () => void }) {
  const { hoje, userName, email, mode } = useWorkspace();
  const link = linkDaCobranca(charge, userName || email.split('@')[0], hoje);
  const texto = new URL(link).searchParams.get('text') || '';

  return (
    <Modal isOpen={open} onClose={onClose} title={`Cobrar ${charge.client?.nome || 'cliente'}`} description="Você revisa e envia do seu próprio número." size="md">
      <div className="dot-grid max-h-72 overflow-y-auto rounded-2xl bg-surface-3 p-4">
        <p className="ml-auto max-w-[92%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-brand-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-ink shadow-xs">{texto}</p>
      </div>
      <p className="mt-2 text-xs text-ink-4">Mensagem gerada em {format(hoje, 'dd/MM/yyyy')}.</p>
      {mode === 'demo' ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-ink-3">Na sua conta, este botão abre o WhatsApp com o texto pronto. Recurso do plano Pro.</p>
          <Button className="w-full" variant="secondary" onClick={onClose}>
            Entendi
          </Button>
        </div>
      ) : (
        <Button asChild variant="whatsapp" size="lg" className="mt-4 w-full">
          <a href={link} target="_blank" rel="noopener noreferrer" onClick={onOpened}>
            <WhatsAppIcon />
            Abrir no WhatsApp
          </a>
        </Button>
      )}
    </Modal>
  );
}
