'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { addToast } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      setError('Email ou senha incorretos');
      addToast('error', 'Falha ao fazer login');
      setIsLoading(false);
      return;
    }

    addToast('success', 'Login realizado com sucesso!');
    router.push('/dashboard');
    router.refresh();
  };

  if (!mounted) return null;

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
              Bem-vindo de volta
            </h2>
            <p className="text-lg text-slate-400 font-light">
              Acesse sua conta e gerencie seus clientes e cobranças de forma simples e eficiente.
            </p>
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
            <h1 className="text-2xl font-light mb-2">Entrar na sua conta</h1>
            <p className="text-slate-500 font-light">Informe seus dados para acessar</p>
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                showPasswordToggle
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm font-light text-accent hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8 font-light">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-accent font-light hover:underline">
              Cadastre-se grátis
            </Link>
          </p>

          <a 
            href="mailto:suporte@venceja.com.br" 
            className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-accent mt-6 transition-colors font-light"
          >
            <Mail className="w-4 h-4" />
            <span>Precisa de ajuda? Fale conosco</span>
          </a>
        </motion.div>
      </div>
    </div>
  );
}