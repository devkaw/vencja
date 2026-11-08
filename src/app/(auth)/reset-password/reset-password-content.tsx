'use client';

import { erroDeSenha } from '@/lib/domain/senha';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/app/auth-shell';
import { useAppStore } from '@/lib/store';

export default function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>(token ? 'ready' : 'error');
  const [message, setMessage] = useState(token ? '' : 'Este link não é válido. Peça um novo e-mail de recuperação.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const erroSenha = erroDeSenha(password);
    if (erroSenha) {
      setMessage(erroSenha);
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('As senhas não são iguais.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'O link expirou ou não é válido.');
        setIsSubmitting(false);
        return;
      }

      setStatus('success');
      addToast('success', 'Senha alterada.');
    } catch {
      setStatus('error');
      setMessage('Sem conexão. Tente de novo.');
    }

    setIsSubmitting(false);
  };

  return (
    <AuthShell backHref="/login">
      {status === 'loading' && (
        <div className="text-center" role="status">
          <Loader2 className="mx-auto mb-4 size-8 animate-spin text-ink-4" />
          <p className="text-ink-3">Verificando o link…</p>
        </div>
      )}

      {status === 'error' && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl bg-neg-soft text-neg">
            <AlertCircle className="size-7" />
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Link inválido</h1>
          <p className="mt-2 text-ink-3">{message}</p>
          <Button asChild size="lg" className="mt-8 w-full">
            <Link href="/forgot-password">Pedir um novo link</Link>
          </Button>
        </motion.div>
      )}

      {status === 'success' && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <span className="glass-brand mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl text-white">
            <CheckCircle2 className="size-7" />
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Senha alterada</h1>
          <p className="mt-2 text-ink-3">Agora é só entrar com a nova senha.</p>
          <Button asChild size="lg" className="mt-8 w-full">
            <Link href="/login">Entrar</Link>
          </Button>
        </motion.div>
      )}

      {status === 'ready' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Crie uma nova senha</h1>
          <p className="mt-2 text-ink-3">Use pelo menos 8 caracteres.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {message && (
              <div className="flex items-start gap-2.5 rounded-xl border border-neg/25 bg-neg-soft p-3.5 text-sm text-neg" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {message}
              </div>
            )}
            <Input label="Nova senha" type="password" icon={<Lock />} showPasswordToggle placeholder="Mínimo de 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
            <Input label="Confirme a nova senha" type="password" icon={<Lock />} showPasswordToggle placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Salvar nova senha
            </Button>
          </form>
        </motion.div>
      )}
    </AuthShell>
  );
}
