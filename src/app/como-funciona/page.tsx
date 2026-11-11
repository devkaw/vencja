import { ProductPage, productPageMetadata } from '@/components/marketing/page-shell';
import { ProductDemo } from '@/components/marketing/product-demo';
import { HowItWorks } from '@/components/marketing/sections';
import { Simulator } from '@/components/marketing/simulator';
import { Reveal, ScrollSection } from '@/components/motion/primitives';

export const metadata = productPageMetadata({
  path: '/como-funciona',
  title: 'Como funciona',
  description:
    'Cadastre seus clientes, lance as cobranças e cobre pelo WhatsApp em dois toques. Experimente a demonstração com dados fictícios antes de criar a conta.',
});

export default function ComoFuncionaPage() {
  return (
    <ProductPage
      path="/como-funciona"
      name="Como funciona"
      title="Como a VenceJá"
      highlight="funciona."
      intro="Cadastre quem compra de você, lance as cobranças (avulsas, parceladas ou recorrentes) e acompanhe tudo num painel. Quando alguém atrasa, a mensagem do WhatsApp já vem pronta."
    >
      <ScrollSection>
        <HowItWorks />
      </ScrollSection>
      <ScrollSection>
        <section id="demo" className="relative py-20 lg:py-28" aria-label="Demonstração">
          <div className="container-x relative">
            <Reveal y={40} scale={0.98}>
              <ProductDemo />
            </Reveal>
          </div>
        </section>
      </ScrollSection>
      <ScrollSection>
        <Simulator />
      </ScrollSection>
    </ProductPage>
  );
}
