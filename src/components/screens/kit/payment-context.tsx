'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ChargeWithClient } from '@/components/workspace/types';
import { PaymentSheet } from './payment-sheet';

interface PaymentApi {
  open(charge: ChargeWithClient): void;
}

const PaymentContext = createContext<PaymentApi | null>(null);

/**
 * One payment sheet for the whole screen. Rows can unmount the moment a charge turns paid,
 * and the sheet must outlive them to show its confirmation.
 */
export function PaymentProvider({ children }: { children: ReactNode }) {
  const [alvo, setAlvo] = useState<ChargeWithClient | null>(null);
  const [aberto, setAberto] = useState(false);
  const open = useCallback((charge: ChargeWithClient) => {
    setAlvo(charge);
    setAberto(true);
  }, []);
  const api = useMemo(() => ({ open }), [open]);

  return (
    <PaymentContext.Provider value={api}>
      {children}
      {alvo && <PaymentSheet charge={alvo} open={aberto} onClose={() => setAberto(false)} />}
    </PaymentContext.Provider>
  );
}

export function usePayment(): PaymentApi {
  const api = useContext(PaymentContext);
  if (!api) throw new Error('usePayment must be used inside PaymentProvider');
  return api;
}
