'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, MailCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/app/auth-shell';
import { useAppStore } from '@/lib/store';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = 'Não foi possível enviar o e-mail de recuperação.';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // Response is not JSON
        }

        if (response.status === 429) {
          setError('Muitas tentativas seguidas. Aguarde 1 hora e tente de novo.');
        } else if (response.status === 404) {
          setError('Não encontramos uma conta com esse e-mail. Confira se digitou certo.');
        } else {
          setError(errorMessage);
        }
        setIsLoading(false);
        return;
      }

      setIsSent(true);
      addToast('success', 'E-mail de recuperação enviado.');
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Sem conexão. Verifique sua internet e tente de novo.');
    }

    setIsLoading(false);
  };

  return (
    <AuthShell backHref="/login">
      {isSent ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <span className="glass-brand mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl text-white">
            <MailCheck className="size-7" />
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Confira seu e-mail</h1>
          <p className="mt-2 text-ink-3">
            Enviamos as instruções para <strong className="text-ink">{email}</strong>. Se não aparecer em alguns minutos, olhe o spam.
          </p>
          <Button asChild variant="secondary" size="lg" className="mt-8 w-full">
            <Link href="/login">
              <ArrowLeft />
              Voltar para o login
            </Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Esqueceu a senha?</h1>
          <p className="mt-2 text-ink-3">Informe o e-mail da sua conta e enviamos um link para criar uma nova.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-neg/25 bg-neg-soft p-3.5 text-sm text-neg" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            )}
            <Input label="E-mail" type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail />} autoComplete="email" required />
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Enviar link de recuperação
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-3">
            Lembrou?{' '}
            <Link href="/login" className="font-semibold text-brand-ink hover:underline">
              Voltar para o login
            </Link>
          </p>
        </motion.div>
      )}
    </AuthShell>
  );
}
