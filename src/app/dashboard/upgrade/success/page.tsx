'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Loader2, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard as Card } from '@/components/screens/kit/glass-card';
import { createClient } from '@/lib/supabase/client';
import { hasPremiumAccess } from '@/lib/subscription';

export default function SuccessPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProAccess, setHasProAccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, plano, is_admin, created_at, subscription_status, subscription_ends_at')
        .eq('id', user.id)
        .single();

      const pro = hasPremiumAccess(profile as any);
      setHasProAccess(pro);
      setIsLoading(false);
      return pro;
    }

    let pollCount = 0;
    const maxPolls = 30;

    async function pollAndCheck() {
      const result = await checkStatus();
      if (!result && pollCount < maxPolls) {
        pollCount++;
        setTimeout(pollAndCheck, 3000);
      }
    }

    pollAndCheck();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center" role="status">
        <Loader2 className="mb-4 size-8 animate-spin text-brand-ink" />
        <p className="text-ink-3">Conferindo seu pagamento…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-6 sm:py-12">
      <Card className="relative overflow-hidden p-8 text-center sm:p-10">
        <div className="pointer-events-none absolute inset-0 aurora opacity-70" aria-hidden />
        <div className="relative">
          {hasProAccess ? (
            <>
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="glass-brand mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl text-white"
              >
                <Check className="size-8" strokeWidth={3} />
              </motion.span>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Pro ativado</h1>
              <p className="mx-auto mt-2 max-w-sm text-ink-3">Pronto. Clientes e cobranças ilimitados, WhatsApp, relatórios e exportação já estão liberados.</p>
              <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
                <Link href="/dashboard">
                  Ir para o painel
                  <ArrowRight />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl bg-warn-soft text-warn">
                <Loader2 className="size-7 animate-spin" />
              </span>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Aguardando a confirmação</h1>
              <p className="mx-auto mt-2 max-w-sm text-ink-3">
                Recebemos seu pedido. Assim que o pagamento for confirmado, o Pro é ativado e você recebe um e-mail. Esta página atualiza sozinha.
              </p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-3">
                <Mail className="size-4" />
                Dúvidas? suporte@venceja.com.br
              </p>
              <Button asChild variant="secondary" size="lg" className="mt-8 w-full sm:w-auto">
                <Link href="/dashboard">
                  Voltar ao painel
                  <ArrowRight />
                </Link>
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
