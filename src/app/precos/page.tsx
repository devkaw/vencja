import { ProductPage, productPageMetadata } from '@/components/marketing/page-shell';
import { Pricing } from '@/components/marketing/pricing';
import { Faq } from '@/components/marketing/faq';
import { ScrollSection } from '@/components/motion/primitives';
import { PRICE_ANNUAL, PRICE_MONTHLY } from '@/lib/ui/pricing';

const brl = (v: number) => v.toFixed(2).replace('.', ',');

export const metadata = productPageMetadata({
  path: '/precos',
  title: 'Preços e planos',
  description: `Comece grátis com até 3 clientes e 10 cobranças, sem cartão. O Pro libera tudo por R$ ${brl(PRICE_MONTHLY)} por mês ou R$ ${brl(PRICE_ANNUAL)} por ano, com garantia de 7 dias.`,
});

export default function PrecosPage() {
  return (
    <ProductPage
      path="/precos"
      name="Preços"
      title="Preços e planos"
      highlight="da VenceJá."
      intro="Grátis para até 3 clientes e 10 cobranças, sem cartão. Sem taxa sobre o que você recebe e com 7 dias de garantia no Pro."
    >
      <ScrollSection>
        <Pricing />
      </ScrollSection>
      <ScrollSection>
        <Faq />
      </ScrollSection>
    </ProductPage>
  );
}
