import { MarketingNav } from '@/components/marketing/nav';
import { Hero } from '@/components/marketing/hero';
import { SpreadsheetVs } from '@/components/marketing/spreadsheet-vs';
import { ProductDemo } from '@/components/marketing/product-demo';
import { ScoreExplainer } from '@/components/marketing/score-explainer';
import { Benefits, HowItWorks, FeatureGrid, FinalCta, Footer } from '@/components/marketing/sections';
import { Simulator } from '@/components/marketing/simulator';
import { Pricing } from '@/components/marketing/pricing';
import { Faq } from '@/components/marketing/faq';
import { faqs } from '@/components/marketing/faq-data';
import { AnimatedWords, Reveal, ScrollSection } from '@/components/motion/primitives';
import { PRICE_ANNUAL, PRICE_MONTHLY } from '@/lib/ui/pricing';

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'VenceJá',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://www.venceja.com.br',
    description: 'Controle de cobranças para autônomos e pequenos negócios, com cobrança pelo WhatsApp.',
    offers: [
      { '@type': 'Offer', name: 'Grátis', price: '0', priceCurrency: 'BRL' },
      { '@type': 'Offer', name: 'Pro mensal', price: PRICE_MONTHLY.toFixed(2), priceCurrency: 'BRL' },
      { '@type': 'Offer', name: 'Pro anual', price: PRICE_ANNUAL.toFixed(2), priceCurrency: 'BRL' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-canvas text-ink">
      {/* Color field that the glass surfaces refract; drifts slowly */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-[10%] -top-[10%] size-[55vw] animate-drift rounded-full bg-brand-500/[0.14] blur-[90px] dark:bg-brand-500/30" />
        <div className="absolute -right-[12%] top-[8%] size-[45vw] animate-drift rounded-full bg-brand-300/25 blur-[100px] [animation-delay:-7s] dark:bg-brand-400/15" />
        <div className="absolute -bottom-[15%] left-[25%] size-[50vw] animate-drift rounded-full bg-brand-400/[0.12] blur-[110px] [animation-delay:-14s] dark:bg-brand-500/15" />
      </div>

      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lift">
        Pular para o conteúdo
      </a>
      <MarketingNav />
      <main id="conteudo" className="relative z-10">
        <Hero />
        <ScrollSection>
          <SpreadsheetVs />
        </ScrollSection>

        <ScrollSection>
        <section id="demo" className="relative py-20 lg:py-28" aria-labelledby="demo-title">
          <div className="container-x relative">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">Experimente agora</p>
              <h2 id="demo-title" className="mt-3 font-display text-display-xl font-bold text-ink">
<AnimatedWords text="Mexa no produto antes de criar a conta." />
</h2>
              <p className="mt-4 text-lg text-ink-2">
                Uma demonstração com dados fictícios. Marque pagamentos, filtre atrasos, lance uma cobrança e veja a mensagem que vai para o WhatsApp.
              </p>
            </Reveal>
            <Reveal className="mt-10" y={40} scale={0.98}>
              <ProductDemo />
            </Reveal>
          </div>
        </section>
        </ScrollSection>

        <ScrollSection>
          <Benefits />
        </ScrollSection>
        <ScrollSection>
          <HowItWorks />
        </ScrollSection>
        <ScrollSection>
          <ScoreExplainer />
        </ScrollSection>
        <ScrollSection>
          <FeatureGrid />
        </ScrollSection>
        <ScrollSection>
          <Simulator />
        </ScrollSection>
        <ScrollSection>
          <Pricing />
        </ScrollSection>
        <ScrollSection>
          <Faq />
        </ScrollSection>
        <ScrollSection>
          <FinalCta />
        </ScrollSection>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
      {structuredData.map((data) => (
        <script key={data['@type']} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
    </div>
  );
}
