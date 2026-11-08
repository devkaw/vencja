import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ATUALIZACAO_LEGAL } from '@/lib/legal';
import { cn } from '@/lib/utils';

const paginas = [
  { href: '/termos', label: 'Termos de Uso' },
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/reembolso', label: 'Reembolso' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/exclusao-de-dados', label: 'Exclusão de dados' },
  { href: '/licencas', label: 'Licenças' },
];

export function LegalPage({ titulo, resumo, atual, children }: { titulo: string; resumo: string; atual: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="VenceJá — início" className="rounded-lg">
            <Logo markSize={34} />
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            Voltar
          </Link>
        </div>

        <main id="conteudo" className="mt-8">
          <p className="eyebrow">Atualizada em {ATUALIZACAO_LEGAL}</p>
          <h1 className="mt-2 font-display text-[clamp(2rem,6vw,3rem)] font-bold leading-[1.05] tracking-[-0.03em] text-ink">{titulo}</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-2">{resumo}</p>

          <nav aria-label="Documentos legais" className="mt-6 flex flex-wrap gap-2">
            {paginas.map((p) => (
              <Link key={p.href} href={p.href} aria-current={p.href === atual ? 'page' : undefined} className={cn('inline-flex min-h-9 items-center rounded-full px-3 text-sm font-medium transition-colors', p.href === atual ? 'bg-brand-600 text-white' : 'bg-ink/[0.05] text-ink-2 hover:text-ink')}>
                {p.label}
              </Link>
            ))}
          </nav>

          <article className="mt-8 rounded-3xl border border-line bg-surface p-5 leading-relaxed text-ink-2 shadow-card sm:p-9 [&_a]:font-medium [&_a]:text-brand-ink [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink first:[&_h2]:mt-0 [&_li]:mt-1.5 [&_p]:mt-3 [&_strong]:text-ink [&_table]:mt-4 [&_table]:w-full [&_table]:text-left [&_table]:text-sm [&_td]:border-t [&_td]:border-line [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_th]:pb-2 [&_th]:pr-3 [&_th]:font-semibold [&_th]:text-ink [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">{children}</article>
        </main>
      </div>
    </div>
  );
}
