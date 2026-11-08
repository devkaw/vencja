'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/app/auth-shell';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-canvas">
          <Loader2 className="size-7 animate-spin text-ink-4" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

/** Only follow internal paths so the redirect param can't send people off-site. */
function safeRedirect(value: string | null) {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/dashboard';
}

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      setError('E-mail ou senha incorretos. Confira e tente de novo.');
      setIsLoading(false);
      return;
    }

    addToast('success', 'Bem-vindo de volta.');
    router.push(safeRedirect(searchParams.get('redirect')));
    router.refresh();
  };

  return (
    <AuthShell aside={{ title: 'Seu dinheiro na rua, de volta para o caixa.', points: ['Veja quem pagou e quem atrasou', 'Cobre pelo WhatsApp com a mensagem pronta', 'Funciona no celular, sem instalar nada'] }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Entrar</h1>
        <p className="mt-2 text-ink-3">Que bom te ver de novo.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-2.5 rounded-xl border border-neg/25 bg-neg-soft p-3.5 text-sm text-neg"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <Input
            label="E-mail"
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail />}
            autoComplete="email"
            required
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-ink-2">
                Senha
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-brand-ink hover:underline">
                Esqueci a senha
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock />}
              showPasswordToggle
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            {isLoading ? 'Entrando…' : 'Entrar'}
            {!isLoading && <ArrowRight />}
          </Button>
        </form>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-4 text-center text-sm text-ink-3">
          Ainda não tem conta?{' '}
          <Link href="/register" className="font-semibold text-brand-ink hover:underline">
            Crie a sua grátis
          </Link>
        </div>
      </motion.div>
    </AuthShell>
  );
}
