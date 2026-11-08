'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

function Conteudo() {
  const token = useSearchParams().get('token') || '';
  const [estado, setEstado] = useState<'inicio' | 'enviando' | 'feito' | 'erro'>('inicio');

  const confirmar = async () => {
    setEstado('enviando');
    const r = await fetch(`/api/email/descadastrar?token=${encodeURIComponent(token)}`, { method: 'POST' }).catch(() => null);
    setEstado(r?.ok ? 'feito' : 'erro');
  };

  return (
    <div className="glass-strong w-full max-w-md rounded-[28px] p-7 text-center">
      <Link href="/" className="inline-block" aria-label="VenceJá — início">
        <Logo markSize={36} />
      </Link>
      {estado === 'feito' ? (
        <>
          <h1 className="mt-6 font-display text-2xl font-semibold text-ink">Pronto, aviso desligado</h1>
          <p className="mt-2 text-sm text-ink-3">Você não vai mais receber o aviso diário. Para ligar de novo, acesse Configurações › Avisos.</p>
        </>
      ) : (
        <>
          <h1 className="mt-6 font-display text-2xl font-semibold text-ink">Descadastrar do aviso diário</h1>
          <p className="mt-2 text-sm text-ink-3">Você para de receber o e-mail com os vencimentos do dia. E-mails sobre sua conta e seu pagamento continuam chegando.</p>
          {estado === 'erro' && (
            <p className="mt-3 text-sm text-neg" role="alert">
              Este link não é válido. Desligue o aviso em Configurações › Avisos ou fale com o suporte.
            </p>
          )}
          <Button className="mt-6 w-full" size="lg" onClick={confirmar} isLoading={estado === 'enviando'} disabled={!token}>
            Confirmar descadastro
          </Button>
        </>
      )}
    </div>
  );
}

export default function DescadastrarPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <Suspense fallback={null}>
        <Conteudo />
      </Suspense>
    </main>
  );
}
