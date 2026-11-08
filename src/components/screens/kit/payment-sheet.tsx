'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Segmented } from '@/components/ui/segmented';
import { chargeState, saldoAberto } from '@/lib/domain/charges';
import { parseValorBR } from '@/lib/domain/numero';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ChargeWithClient } from '@/components/workspace/types';
import { useWorkspace } from '@/components/workspace/workspace-context';

function PagoConfirmado() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 text-center" role="status">
      <span className="relative flex size-20 items-center justify-center">
        <motion.span className="absolute inset-0 rounded-full bg-pos-soft" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} />
        <svg viewBox="0 0 24 24" className="relative size-10 text-pos" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <motion.path d="M5 12.5 10 17.5 19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.15 }} />
        </svg>
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-ink">Pagamento registrado</p>
      <p className="mt-1 text-sm text-ink-3">O painel e o score do cliente já foram atualizados.</p>
    </motion.div>
  );
}

/** Mounted once per screen (see PaymentProvider), so it survives the row becoming paid. */
export function PaymentSheet({ charge, open, onClose }: { charge: ChargeWithClient; open: boolean; onClose: () => void }) {
  const { actions, hoje } = useWorkspace();
  const addToast = useAppStore((s) => s.addToast);
  // Reset on each opening: the sheet is kept mounted, so state is rebuilt when open flips to true.
  const [aberturaId, setAberturaId] = useState(0);
  const [estado, setEstado] = useState({ data: format(hoje, 'yyyy-MM-dd'), modo: 'total' as 'total' | 'parcial', parcial: '', erro: '', enviando: false, concluido: false });
  const atualizar = (patch: Partial<typeof estado>) => setEstado((e) => ({ ...e, ...patch }));

  if (open && aberturaId === 0) setAberturaId(1);
  if (!open && aberturaId !== 0) {
    setAberturaId(0);
    setEstado({ data: format(hoje, 'yyyy-MM-dd'), modo: 'total', parcial: '', erro: '', enviando: false, concluido: false });
  }

  const pendente = saldoAberto(charge);
  const valorDigitado = estado.modo === 'total' ? pendente : parseValorBR(estado.parcial);
  const valorValido = Number.isFinite(valorDigitado) && valorDigitado > 0 && valorDigitado <= pendente;

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorValido) {
      atualizar({ erro: `Informe um valor entre R$ 0,01 e ${formatCurrency(pendente)}.` });
      return;
    }
    if (!estado.data) {
      atualizar({ erro: 'Informe a data do pagamento.' });
      return;
    }
    atualizar({ enviando: true, erro: '' });
    const r = await actions.registrarPagamento({ chargeId: charge.id, valor: valorDigitado, data: estado.data });
    atualizar({ enviando: false });
    if (!r.ok) {
      if (r.code === 'already_paid') {
        addToast('info', r.error);
        onClose();
      } else atualizar({ erro: r.error });
      return;
    }
    if (r.restante) addToast('success', 'O restante virou uma nova cobrança.');
    else addToast('success', 'Pagamento registrado.');
    atualizar({ concluido: true });
    window.setTimeout(onClose, 1100);
  };

  const { concluido } = estado;
  return (
    <Modal isOpen={open} onClose={onClose} title={concluido ? undefined : 'Registrar pagamento'} description={concluido ? undefined : `${charge.client?.nome || 'Cliente'} · ${charge.descricao || 'Cobrança'}`} size="sm">
      {concluido ? (
        <PagoConfirmado />
      ) : (
        <form onSubmit={confirmar} className="space-y-4">
          <div className="rounded-2xl bg-surface/70 p-4">
            <p className="text-xs text-ink-3">
              Valor em aberto · {chargeState(charge, hoje) === 'atrasado' ? 'venceu' : 'vence'} em {formatDate(charge.data_vencimento)}
            </p>
            <p className="mt-1 truncate font-display text-2xl font-semibold text-ink tnum">{formatCurrency(pendente)}</p>
          </div>
          <Segmented
            className="w-full [&>button]:flex-1"
            aria-label="Tipo de pagamento"
            value={estado.modo}
            onChange={(modo) => atualizar({ modo, erro: '' })}
            options={[
              { value: 'total', label: 'Valor total' },
              { value: 'parcial', label: 'Valor parcial' },
            ]}
          />
          <AnimatePresence initial={false}>
            {estado.modo === 'parcial' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden p-1">
                <Input label="Valor recebido" prefix="R$" inputMode="decimal" placeholder="0,00" value={estado.parcial} onChange={(e) => atualizar({ parcial: e.target.value, erro: '' })} hint="Use vírgula para os centavos. O restante vira uma nova cobrança, com o mesmo vencimento." autoFocus />
                {Number.isFinite(valorDigitado) && valorDigitado > 0 && valorDigitado <= pendente && (
                  <p className="text-sm text-ink-2" aria-live="polite">
                    Fica em aberto: <strong className="tnum">{formatCurrency(pendente - valorDigitado)}</strong>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <Input label="Data do pagamento" type="date" value={estado.data} onChange={(e) => atualizar({ data: e.target.value, erro: '' })} />
          {estado.erro && (
            <p className="text-sm text-neg" role="alert">
              {estado.erro}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" isLoading={estado.enviando}>
            Confirmar pagamento
          </Button>
        </form>
      )}
    </Modal>
  );
}
