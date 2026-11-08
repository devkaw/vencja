import Link from 'next/link';
import { ArrowLeft, Check, Mail } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ProductGlimpse } from '@/components/marketing/glimpse';

interface AuthShellProps {
  children: React.ReactNode;
  /** Short line under the showcase title on large screens. */
  aside?: { title: string; points: string[] };
  backHref?: string;
}

/** Split layout for auth screens: form on the left, a calm product glimpse on the right. */
export function AuthShell({ children, aside, backHref = '/' }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <div className="relative flex w-full flex-col px-5 py-6 sm:px-10 lg:w-[52%] lg:px-16">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="VenceJá — página inicial">
            <Logo markSize={40} />
          </Link>
          <Link href={backHref} className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-ink-3 hover:text-ink">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </div>
        <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">{children}</main>
        <a href="mailto:suporte@venceja.com.br" className="mx-auto inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink">
          <Mail className="size-4" />
          Precisa de ajuda? suporte@venceja.com.br
        </a>
      </div>

      <aside className="relative hidden flex-1 overflow-hidden border-l border-line bg-surface-2 lg:block" aria-hidden inert>
        <div className="absolute inset-0 aurora opacity-90" />
        <div className="absolute inset-0 dot-grid opacity-40 fade-mask-b" />
        <div className="relative flex h-full flex-col justify-center px-12 xl:px-20">
          {aside && (
            <div className="mb-10 max-w-md">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{aside.title}</h2>
              <ul className="mt-5 space-y-2.5">
                {aside.points.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-[15px] text-ink-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ProductGlimpse />
        </div>
      </aside>
    </div>
  );
}
