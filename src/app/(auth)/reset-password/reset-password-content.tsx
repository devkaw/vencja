'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';

export default function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useAppStore();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setStatus('ready');
    } else {
      setStatus('error');
      setMessage('Link inválido. Solicite uma nova recuperação de senha.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    if (password.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem');
      setIsSubmitting(false);
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
        setMessage(data.error || 'Link expirado ou inválido');
        setIsSubmitting(false);
        return;
      }

      const supabaseResponse = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: data.userId,
          password 
        }),
      });

      const passwordResult = await supabaseResponse.json();

      if (!supabaseResponse.ok) {
        setStatus('error');
        setMessage(passwordResult.error || 'Erro ao redefinir senha');
        setIsSubmitting(false);
        return;
      }

      setStatus('success');
      addToast('success', 'Senha alterada com sucesso!');
    } catch {
      setStatus('error');
      setMessage('Erro de conexão. Tente novamente.');
    }

    setIsSubmitting(false);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-black">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-8 px-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Link Inválido</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link href="/forgot-password">
              <Button>Solicitar novo email</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-black">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-8 px-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Senha Alterada!</h1>
            <p className="text-gray-500 mb-6">Sua senha foi redefinida com sucesso.</p>
            <Link href="/login">
              <Button className="bg-accent">Ir para Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-8 px-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold">VenceJa</span>
            </Link>
            <h1 className="text-2xl font-bold">Nova Senha</h1>
            <p className="text-gray-500 mt-2">Digite sua nova senha abaixo</p>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Nova Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Input
              label="Confirmar Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
