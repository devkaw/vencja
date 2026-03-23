'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

export default function LoginPage() {
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
      email,
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <Image 
              src="/logo.png" 
              alt="VenceJa" 
              width={48} 
              height={48}
              className="w-12 h-12 rounded-xl object-contain bg-black"
            />
            <span className="text-2xl font-bold">VenceJa</span>
          </Link>
          <h1 className="text-3xl font-bold">Bem-vindo de volta</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Entre para acessar suas cobranças</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 border border-danger/20 dark:border-danger/40 rounded-lg">
              <p className="text-sm text-danger dark:text-danger">{error}</p>
            </div>
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
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="text-sm text-accent hover:underline">
              Esqueceu a senha?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-accent font-medium hover:underline">
            Cadastre-se grátis
          </Link>
        </p>

        <a 
          href="https://wa.me/5579991526467" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-accent transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Precisa de ajuda? Fale conosco</span>
        </a>
      </div>
    </div>
  );
}
