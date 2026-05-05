'use client';

import { useState } from 'react';
import { Lock, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

interface PaymentFormProps {
  planType: 'monthly' | 'annual';
  onSuccess?: () => void;
}

const PLANS = {
  monthly: { name: 'Plano Pro Mensal', value: 49.90 },
  annual: { name: 'Plano Pro Anual', value: 499.00 },
};

export function PaymentForm({ planType, onSuccess }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
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
      console.log('[PaymentForm] Resposta:', data);

      if (data.success && data.checkoutUrl) {
        addToast('info', 'Redirecionando para o pagamento...');
        window.location.href = data.checkoutUrl;
      } else {
        addToast('error', data.error || 'Erro ao processar');
      }
    } catch (err) {
      addToast('error', 'Erro ao processar');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="font-light">{plan.name}</span>
          <span className="text-2xl font-extralight text-accent">
            R$ {plan.value.toFixed(2)}
            {planType === 'annual' && <span className="text-sm text-gray-500">/ano</span>}
          </span>
        </div>
        {planType === 'annual' && (
          <div className="text-right text-sm text-green-500 mt-1">
            Economia de R$ 100,80 (17% off)
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <p>Você será redirecionado para a página de pagamento segura.</p>
      </div>

      <Button 
        type="submit" 
        size="lg" 
        className="w-full bg-accent text-black" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Assinar por R$ {plan.value.toFixed(2)}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        Pagamento 100% seguro. Pode cancelar a qualquer momento.
      </p>
    </form>
  );
}