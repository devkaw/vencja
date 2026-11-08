'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { ANNUAL_PER_MONTH, ANNUAL_SAVINGS, brl } from '@/lib/ui/pricing';

interface PaymentFormProps {
  planType: 'monthly' | 'annual';
  onSuccess?: () => void;
}

const PLANS = {
  monthly: { name: 'Pro mensal', value: 49.9 },
  annual: { name: 'Pro anual', value: 499.0 },
};

export function PaymentForm({ planType }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aceite, setAceite] = useState(false);
  const { addToast } = useAppStore();

  const plan = PLANS[planType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        addToast('info', 'Abrindo o pagamento seguro…');
        window.location.href = data.checkoutUrl;
        return;
      } else {
        addToast('error', data.error || 'Não foi possível iniciar o pagamento.');
      }
    } catch {
      addToast('error', 'Não foi possível iniciar o pagamento. Verifique sua conexão.');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface-2 p-4 dark:bg-surface-3/50">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-ink-2">{plan.name}</span>
          <span className="font-display text-2xl font-semibold text-ink tnum">
            R$ {brl(plan.value)}
            <span className="ml-1 text-sm font-normal text-ink-3">{planType === 'annual' ? '/ano' : '/mês'}</span>
          </span>
        </div>
        {planType === 'annual' && (
          <p className="mt-1 text-right text-sm text-pos">
            Equivale a R$ {brl(ANNUAL_PER_MONTH)}/mês · você economiza R$ {brl(ANNUAL_SAVINGS)}
          </p>
        )}
      </div>

      <ul className="space-y-2 text-sm text-ink-2">
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-pos" />7 dias para pedir reembolso integral, em Configurações › Plano.
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-pos" />
          Peça o cancelamento quando quiser, sem multa.
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-pos" />
          Pagamento processado pela Cakto, em ambiente seguro.
        </li>
      </ul>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl p-1 text-sm text-ink-2">
        <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-600" required />
        <span>
          Entendo que a assinatura de R$ {brl(plan.value)} {planType === 'annual' ? 'por ano' : 'por mês'} renova automaticamente até eu cancelar, e aceito os{' '}
          <Link href="/termos" target="_blank" className="font-medium text-brand-ink underline underline-offset-2">
            Termos
          </Link>{' '}
          e a{' '}
          <Link href="/reembolso" target="_blank" className="font-medium text-brand-ink underline underline-offset-2">
            Política de Reembolso
          </Link>
          .
        </span>
      </label>

      <Button type="submit" size="xl" className="w-full" isLoading={isLoading} disabled={!aceite}>
        {!isLoading && <Lock />}
        {isLoading ? 'Abrindo pagamento…' : `Continuar para o pagamento`}
        {!isLoading && <ArrowRight />}
      </Button>

      <p className="text-center text-xs text-ink-3">Você será levado para a página de pagamento e volta para cá ao concluir.</p>
    </form>
  );
}
