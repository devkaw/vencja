'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, MessageSquare } from 'lucide-react';
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
    console.log('Signup response:', response.status, data);

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

  if (!mounted) return null;

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-black">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="text-2xl font-bold">VenceJa</span>
          </Link>

          <div className="w-20 h-20 mx-auto mb-6 bg-accent/10 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-accent" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Verifique seu Email</h1>
          <p className="text-gray-500 mb-4">Enviamos um link de confirmação para:</p>
          <p className="text-lg font-medium mb-6">{email}</p>

          <div className="border border-gray-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-400">
              <strong>Importante:</strong> Clique no link enviado para seu email para ativar sua conta. O link expira em 1 hora.
            </p>
          </div>

          <p className="text-sm text-gray-500 mb-6">
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
              className="text-accent font-medium hover:underline"
            >
              tente novamente
            </button>
          </p>

          <Link href="/login">
            <Button className="bg-accent">Ir para Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-black font-bold text-xl">V</span>
            </div>
            <span className="text-2xl font-bold">VenceJa</span>
          </Link>
          <h1 className="text-3xl font-bold">Crie sua conta</h1>
          <p className="text-gray-500 mt-2">Comece gratuitamente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 border border-danger/20 rounded-lg">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <Input
            label="Nome"
            type="text"
            placeholder="Seu nome completo"
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
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <Input
            label="Confirmar Senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            required
          />

          <Button type="submit" className="w-full bg-accent" size="lg" isLoading={isLoading}>
            Criar Conta Grátis
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Entre aqui
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

        <p className="text-center text-xs text-gray-500">
          Ao criar sua conta, você concorda com nossos{' '}
          <Link href="#" className="underline">Termos de Uso</Link> e{' '}
          <Link href="#" className="underline">Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  );
}