import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas px-6 text-center">
      <div className="pointer-events-none absolute inset-0 aurora" aria-hidden />
      <div className="relative">
        <Link href="/" aria-label="VenceJá — início">
          <Logo markSize={32} />
        </Link>
        <p className="mt-10 font-display text-7xl font-semibold tracking-tight text-ink tnum">404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Esta página não existe</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-3">O endereço pode ter mudado ou foi digitado errado.</p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard">Ir para o painel</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">
              <ArrowLeft />
              Página inicial
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
