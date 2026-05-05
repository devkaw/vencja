'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { addToast } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Erro ao criar conta');
      addToast('error', data.error || 'Falha ao criar conta');
      setIsLoading(false);
      return;
    }

    if (data.success && data.user) {
      const emailLower = email.toLowerCase().trim();
      try {
        await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailLower, userId: data.user.id, name }),
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
    if (password.length < 6) return { strength: 1, label: 'Fraca' };
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { strength: 2, label: 'Média' };
    return { strength: 3, label: 'Forte' };
  };

  const strength = passwordStrength();

  if (!mounted) return null;

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Image 
              src="/logo.png" 
              alt="VenceJa" 
              width={48} 
              height={48}
              className="w-12 h-12 rounded-xl object-contain"
            />
            <span className="text-2xl font-light">VenceJa</span>
          </Link>

          <div className="w-20 h-20 mx-auto mb-6 bg-accent/10 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-accent" />
          </div>

          <h1 className="text-2xl font-light mb-2">Verifique seu Email</h1>
          <p className="text-slate-500 font-light mb-4">Enviamos um link de confirmação para:</p>
          <p className="text-lg font-light mb-6">{email}</p>

          <div className="border border-slate-800 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-slate-400 font-light">
              <strong>Importante:</strong> Clique no link enviado para seu email para ativar sua conta. O link expira em 1 hora.
            </p>
          </div>

          <p className="text-sm text-slate-500 font-light mb-6">
            Não recebeu o email? Verifique sua caixa de spam ou{' '}
            <button 
              type="button"
              onClick={async () => {
                setShowEmailConfirmation(false);
                setIsLoading(false);
                try {
                  const supabaseClient = createClient();
                  const { data: { user } } = await supabaseClient.auth.getUser();
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
                    addToast('success', 'Email reenviado!');
                  }
                } catch (err) {
                  console.error('Error resending email:', err);
                }
              }}
              className="text-accent font-light hover:underline"
            >
              tente novamente
            </button>
          </p>

          <Link href="/login">
            <Button variant="outline" className="w-full">
              Ir para Login
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-accent/5 relative overflow-hidden">
        <div className="absolute inset-0 hero-glow opacity-50" />
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md text-center"
          >
            <Image 
              src="/logo.png" 
              alt="VenceJa" 
              width={80} 
              height={80}
              className="w-20 h-20 rounded-2xl object-contain mx-auto mb-8"
            />
            <h2 className="text-3xl font-light mb-4">
              Comece a gerenciar hoje
            </h2>
            <p className="text-lg text-slate-400 font-light">
              Crie sua conta gratuita e tenha controle total do seu negócio.
            </p>
            <div className="mt-8 space-y-3 text-left">
              {['3 clientes grátis', '10 cobranças', 'Dashboard completo'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-accent" />
                  <span className="text-slate-300 font-light">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-accent mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-light">Voltar</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-light mb-2">Criar sua conta</h1>
            <p className="text-slate-500 font-light">É rápido egrátis</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
                <p className="text-sm text-danger">{error}</p>
              </motion.div>
            )}

            <Input
              label="Nome completo"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-5 h-5" />}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                showPasswordToggle
                required
              />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i <= strength.strength
                            ? strength.strength === 1
                              ? 'bg-danger'
                              : strength.strength === 2
                                ? 'bg-warning'
                                : 'bg-accent'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 font-light">
                    Força da senha: {strength.label}
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirmar Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              showPasswordToggle
              required
            />

            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              isLoading={isLoading}
              disabled={!name || !email || !password || !confirmPassword}
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta Grátis'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8 font-light">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-accent font-light hover:underline">
              Entre aqui
            </Link>
          </p>

          <a 
            href="mailto:suporte@venceja.com.br" 
            className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-accent mt-6 transition-colors font-light"
          >
            <Mail className="w-4 h-4" />
            <span>Precisa de ajuda? Fale conosco</span>
          </a>

          <p className="text-center text-xs text-slate-500 mt-6 font-light">
            Ao criar sua conta, você concorda com nossos{' '}
            <Link href="/termos" className="underline">Termos de Uso</Link> e{' '}
            <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}