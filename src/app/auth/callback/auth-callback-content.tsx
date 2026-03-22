'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, AlertCircle, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function handleCallback() {
      const token = searchParams.get('token');
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorCode = searchParams.get('error_code');

      if (error || errorCode) {
        setStatus('error');
        if (errorCode === 'otp_expired') {
          setMessage('O link de confirmação expirou. Por favor, solicite um novo email de verificação.');
        } else {
          setMessage('Ocorreu um erro ao confirmar. Tente novamente.');
        }
        return;
      }

      if (code) {
        try {
          const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error || !user) {
            setStatus('error');
            setMessage('Não foi possível confirmar seu email. O link pode ter expirado.');
            return;
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (!profile) {
            await supabase.from('profiles').insert({
              id: user.id,
              email: user.email || '',
              plano: 'free',
              acesso_vitalicio: false,
              status_pagamento: 'pendente',
              is_admin: false,
            });
          }

          setStatus('success');
          setMessage('Email confirmado com sucesso!');
        } catch {
          setStatus('error');
          setMessage('Ocorreu um erro inesperado. Tente novamente.');
        }
        return;
      }

      if (!token) {
        setStatus('error');
        setMessage('Token de confirmação não encontrado.');
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
          setMessage(data.error || 'Não foi possível confirmar. O link pode ter expirado.');
          return;
        }

        if (data.type === 'verification') {
          setStatus('success');
          setMessage('Email confirmado com sucesso!');
        } else if (data.type === 'reset') {
          window.location.href = `/dashboard/settings?reset_token=${token}`;
          return;
        }
      } catch {
        setStatus('error');
        setMessage('Ocorreu um erro inesperado. Tente novamente.');
      }
    }

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-[#000000]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-8 px-8">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
              status === 'loading' ? 'bg-blue-100' :
              status === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {status === 'loading' ? (
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              ) : status === 'success' ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <AlertCircle className="w-10 h-10 text-red-600" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {status === 'loading' ? 'Confirmando...' :
               status === 'success' ? 'Confirmado!' : 'Erro na Confirmação'}
            </h1>
            
            <p className={`text-sm ${status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {message || (status === 'loading' ? 'Aguarde um momento...' : '')}
            </p>
          </div>

          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Sua conta foi confirmada!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Agora você pode fazer login e começar a usar o VenceJa.
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/dashboard" className="block">
                <button className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
                  Ir para o Dashboard
                </button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Se você já confirmou seu email, pode fazer login normalmente.
                  Caso contrário, tente fazer login para receber um novo email.
                </p>
              </div>

              <div className="flex gap-3">
                <Link href="/login" className="flex-1">
                  <button className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
                    Ir para Login
                  </button>
                </Link>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Você será redirecionado em breve...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
