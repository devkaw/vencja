'use client';

import Link from 'next/link';
import { ArrowRight, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsLoggedIn } from './use-session';

export function HeroCtas() {
  const loggedIn = useIsLoggedIn();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {loggedIn ? (
        <Button asChild size="xl">
          <Link href="/dashboard">
            Abrir meu painel
            <ArrowRight />
          </Link>
        </Button>
      ) : (
        <Button asChild size="xl">
          <Link href="/register">
            Criar conta grátis
            <ArrowRight />
          </Link>
        </Button>
      )}
      <Button asChild size="xl" variant="glass">
        <a href="#demo">
          <MousePointerClick />
          Experimentar a demonstração
        </a>
      </Button>
    </div>
  );
}

export function PrimaryCta({ label = 'Criar conta grátis', className, variant }: { label?: string; className?: string; variant?: 'onDark' }) {
  const loggedIn = useIsLoggedIn();
  return (
    <Button asChild size="xl" className={className} {...(variant === 'onDark' ? { variant: 'secondary' as const } : {})}>
      <Link href={loggedIn ? '/dashboard' : '/register'}>
        {loggedIn ? 'Abrir meu painel' : label}
        <ArrowRight />
      </Link>
    </Button>
  );
}
