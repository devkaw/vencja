'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        let errorMessage = 'Não foi possível enviar o email de recuperação.';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // Response is not JSON
        }
        
        if (response.status === 429) {
          setError('Muitas tentativas. Aguarde 1 hora antes de tentar novamente.');
          addToast('error', 'Muitas tentativas. Aguarde.');
        } else if (response.status === 404) {
          setError('Este email não está cadastrado. Verifique e tente novamente.');
          addToast('error', 'Email não encontrado');
        } else {
          setError(errorMessage);
          addToast('error', 'Erro ao enviar email');
        }
        setIsLoading(false);
        return;
      }

      setIsSent(true);
      addToast('success', 'Email de recuperação enviado!');
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
      addToast('error', 'Erro de conexão');
    }

    setIsLoading(false);
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-black">
        <div className="absolute top-4 right-4">
          <Link href="/login" className="text-gray-500 hover:text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="w-full max-w-md text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">VenceJa</span>
          </Link>
          <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success-600 dark:text-success-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email enviado!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Enviamos instruções para <strong>{email}</strong>.
            <br />
            Verifique sua caixa de entrada ou spam.
          </p>
          <Link href="/login">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <div className="absolute top-4 right-4">
        <Link href="/login" className="text-gray-500 hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">VenceJa</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Esqueceu a senha?</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Digite seu email para receber instruções de recuperação.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
              <p className="text-sm text-danger">{error}</p>
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

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Enviar Instruções
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Lembrou a senha?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Voltar para Login
          </Link>
        </p>
      </div>
    </div>
  );
}
