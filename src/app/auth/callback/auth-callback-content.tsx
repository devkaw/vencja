'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/app/auth-shell';

export default function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function handleCallback() {
      const token = searchParams.get('token');
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorCode = searchParams.get('error_code');

      if (error || errorCode) {
        setStatus('error');
        if (errorCode === 'otp_expired') {
          setMessage('O link de confirmação expirou. Peça um novo e-mail de verificação.');
        } else {
          setMessage('Ocorreu um erro ao confirmar. Tente novamente.');
        }
        return;
      }

      if (code) {
        try {
          const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error || !user) {
            setStatus('error');
            setMessage('Não foi possível confirmar seu email. O link pode ter expirado.');
            return;
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (!profile) {
            await supabase.from('profiles').insert({
              id: user.id,
              email: (user.email || '').toLowerCase(),
            });
          }

          setStatus('success');
          setMessage('E-mail confirmado.');
        } catch {
          setStatus('error');
          setMessage('Ocorreu um erro inesperado. Tente novamente.');
        }
        return;
      }

      if (!token) {
        setStatus('error');
        setMessage('Token de confirmação não encontrado.');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setMessage(data.error || 'Não foi possível confirmar. O link pode ter expirado.');
          return;
        }

        if (data.type === 'verification') {
          setStatus('success');
          setMessage('E-mail confirmado.');
        } else if (data.type === 'reset') {
          window.location.href = `/dashboard/settings?reset_token=${token}`;
          return;
        }
      } catch {
        setStatus('error');
        setMessage('Ocorreu um erro inesperado. Tente novamente.');
      }
    }

    handleCallback();
  }, [searchParams]);

  return (
    <AuthShell backHref="/login">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center" aria-live="polite">
        {status === 'loading' && (
          <>
            <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl bg-surface-3 text-ink-3">
              <Loader2 className="size-7 animate-spin" />
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Confirmando…</h1>
            <p className="mt-2 text-ink-3">{message || 'Só um instante.'}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <span className="glass-brand mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl text-white">
              <CheckCircle2 className="size-7" />
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">E-mail confirmado</h1>
            <p className="mt-2 text-ink-3">Sua conta está ativa. Vamos cadastrar seu primeiro cliente?</p>
            <Button asChild size="lg" className="mt-8 w-full">
              <Link href="/dashboard">
                Ir para o painel
                <ArrowRight />
              </Link>
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl bg-neg-soft text-neg">
              <AlertCircle className="size-7" />
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Não deu para confirmar</h1>
            <p className="mt-2 text-ink-3">{message}</p>
            <div className="mt-6 rounded-2xl border border-line bg-surface p-4 text-left text-sm text-ink-2">
              Se você já confirmou antes, é só entrar normalmente. Se não, entre com seu e-mail e senha para receber um novo link.
            </div>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link href="/login">Ir para o login</Link>
            </Button>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
}
