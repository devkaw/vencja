'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, ArrowRight, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/app/auth-shell';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { erroDeSenha } from '@/lib/domain/senha';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aceite, setAceite] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const { addToast } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não são iguais.');
      setIsLoading(false);
      return;
    }

    const erroSenha = erroDeSenha(password);
    if (erroSenha) {
      setError(erroSenha);
      setIsLoading(false);
      return;
    }

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password, name, aceite }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Não foi possível criar a conta.');
      setIsLoading(false);
      return;
    }

    if (data.success && data.user) {
      const emailLower = email.toLowerCase().trim();
      try {
        await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailLower }),
        });
      } catch (err) {
        console.error('Error sending verification email:', err);
      }

      setShowEmailConfirmation(true);
    }

    setIsLoading(false);
  };

  const passwordStrength = () => {
    if (!password) return { strength: 0, label: '' };
    if (password.length < 8) return { strength: 1, label: 'Fraca' };
    if ( !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { strength: 2, label: 'Média' };
    return { strength: 3, label: 'Forte' };
  };

  const strength = passwordStrength();

  if (showEmailConfirmation) {
    return (
      <AuthShell backHref="/login">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <span className="glass-brand mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl text-white">
            <MailCheck className="size-7" />
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Confirme seu e-mail</h1>
          <p className="mt-2 text-ink-3">Enviamos um link de confirmação para</p>
          <p className="mt-1 font-semibold text-ink">{email}</p>

          <div className="mt-6 rounded-2xl border border-line bg-surface p-4 text-left text-sm text-ink-2">
            Abra o e-mail e toque no link para ativar a conta. Ele vale por 1 hora. Não achou? Olhe a caixa de spam ou promoções.
          </div>

          <p className="mt-6 text-sm text-ink-3">
            Não chegou?{' '}
            <button
              type="button"
              onClick={async () => {
                setShowEmailConfirmation(false);
                setIsLoading(false);
                try {
                  const supabaseClient = createClient();
                  const {
                    data: { user },
                  } = await supabaseClient.auth.getUser();
                  if (user) {
                    await fetch('/api/auth/send-verification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: user.email,
                        userId: user.id,
                        name: user.user_metadata?.name || '',
                      }),
                    });
                    setShowEmailConfirmation(true);
                    addToast('success', 'Enviamos o e-mail de novo.');
                  }
                } catch (err) {
                  console.error('Error resending email:', err);
                }
              }}
              className="font-semibold text-brand-ink hover:underline"
            >
              Reenviar e-mail
            </button>
          </p>

          <Button asChild variant="secondary" size="lg" className="mt-6 w-full">
            <Link href="/login">Ir para o login</Link>
          </Button>
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      aside={{
        title: 'Comece grátis. Assine só se fizer sentido.',
        points: ['Até 3 clientes e 10 cobranças sem pagar nada', 'Sem cartão de crédito para criar a conta', 'Seus dados protegidos de acordo com a LGPD'],
      }}
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Crie sua conta grátis</h1>
        <p className="mt-2 text-ink-3">Sem cartão de crédito. Você organiza suas primeiras cobranças hoje.</p>

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

          <Input label="Seu nome" type="text" placeholder="Como você quer ser chamado" value={name} onChange={(e) => setName(e.target.value)} icon={<User />} autoComplete="name" required />

          <Input label="E-mail" type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail />} autoComplete="email" required />

          <div>
            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock />}
              showPasswordToggle
              autoComplete="new-password"
              required
            />
            {password && (
              <div className="mt-2 flex items-center gap-3" aria-live="polite">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        i <= strength.strength ? (strength.strength === 1 ? 'bg-neg' : strength.strength === 2 ? 'bg-warn' : 'bg-pos') : 'bg-ink/10'
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-ink-3">Senha {strength.label.toLowerCase()}</span>
              </div>
            )}
          </div>

          <Input
            label="Confirme a senha"
            type="password"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock />}
            showPasswordToggle
            autoComplete="new-password"
            error={confirmPassword && confirmPassword !== password ? 'As senhas não são iguais.' : undefined}
            required
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-xl p-1 text-sm text-ink-2">
            <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-600" required />
            <span>
              Tenho 18 anos ou mais e li e aceito os{' '}
              <Link href="/termos" target="_blank" className="font-medium text-brand-ink underline underline-offset-2">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/privacidade" target="_blank" className="font-medium text-brand-ink underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading} disabled={!name || !email || !password || !confirmPassword || !aceite}>
            {isLoading ? 'Criando sua conta…' : 'Criar conta grátis'}
            {!isLoading && <ArrowRight />}
          </Button>


        </form>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-4 text-center text-sm text-ink-3">
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold text-brand-ink hover:underline">
            Entrar
          </Link>
        </div>
      </motion.div>
    </AuthShell>
  );
}
