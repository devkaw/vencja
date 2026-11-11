import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MarketingNav } from './nav';
import { FinalCta, Footer } from './sections';
import { AnimatedWords, Reveal, ScrollSection } from '@/components/motion/primitives';

const SITE = 'https://www.venceja.com.br';

/** Metadata for a public product page: own title, description, canonical and share card. */
export function productPageMetadata({ path, title, description }: { path: string; title: string; description: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: `${SITE}${path}`,
      siteName: 'VenceJá',
      title: `${title} | VenceJá`,
      description,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'VenceJá: painel de cobranças e mensagem pronta para o WhatsApp' }],
    },
    twitter: { card: 'summary_large_image', title: `${title} | VenceJá`, description, images: ['/og-image.png'] },
  };
}

interface ProductPageProps {
  path: string;
  /** Short name used in the breadcrumb, e.g. "Preços". */
  name: string;
  title: string;
  highlight?: string;
  intro: string;
  children: React.ReactNode;
  /** Extra JSON-LD objects for this page. */
  structuredData?: object[];
}

/** Shell for the public pages that sit beside the home: same nav, background and footer. */
export function ProductPage({ path, name, title, highlight, intro, children, structuredData = [] }: ProductPageProps) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'VenceJá', item: SITE },
      { '@type': 'ListItem', position: 2, name, item: `${SITE}${path}` },
    ],
  };

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-canvas text-ink">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-[10%] -top-[10%] size-[55vw] animate-drift rounded-full bg-brand-500/[0.14] blur-[90px] dark:bg-brand-500/30" />
        <div className="absolute -right-[12%] top-[8%] size-[45vw] animate-drift rounded-full bg-brand-300/25 blur-[100px] [animation-delay:-7s] dark:bg-brand-400/15" />
      </div>

      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lift">
        Pular para o conteúdo
      </a>
      <MarketingNav />

      <main id="conteudo" className="relative z-10">
        <header className="container-x pt-32 sm:pt-36">
          <Reveal className="mx-auto max-w-3xl text-center">
            <nav aria-label="Você está em" className="mb-5 flex items-center justify-center gap-1.5 text-sm text-ink-3">
              <Link href="/" className="transition-colors hover:text-ink">
                Início
              </Link>
              <ChevronRight className="size-3.5 text-ink-4" aria-hidden />
              <span className="font-medium text-ink-2" aria-current="page">
                {name}
              </span>
            </nav>
            <h1 className="font-display text-display-xl font-bold text-ink">
              <AnimatedWords text={title} />
              {highlight && (
                <>
                  {' '}
                  <AnimatedWords text={highlight} delay={0.18} wordClassName="bg-gradient-to-br from-brand-500 to-brand-800 bg-clip-text pb-[0.1em] text-transparent dark:from-brand-ink dark:to-brand-ink" />
                </>
              )}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-2">{intro}</p>
          </Reveal>
        </header>

        {children}

        <ScrollSection>
          <FinalCta />
        </ScrollSection>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>

      {[breadcrumb, ...structuredData].map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
    </div>
  );
}
