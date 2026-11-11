import { ProductPage, productPageMetadata } from '@/components/marketing/page-shell';
import { Faq } from '@/components/marketing/faq';
import { faqs } from '@/components/marketing/faq-data';
import { ScrollSection } from '@/components/motion/primitives';

export const metadata = productPageMetadata({
  path: '/perguntas-frequentes',
  title: 'Perguntas frequentes',
  description:
    'A VenceJá recebe o dinheiro por mim? Como funciona a cobrança pelo WhatsApp? Posso cancelar quando quiser? As respostas para as dúvidas mais comuns.',
});

const faqPage = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default function PerguntasFrequentesPage() {
  return (
    <ProductPage
      path="/perguntas-frequentes"
      name="Perguntas frequentes"
      title="Tire suas dúvidas"
      highlight="sobre a VenceJá."
      intro="Pagamento, WhatsApp, score, planos, cancelamento e segurança dos dados. Se a sua dúvida não estiver aqui, fale com a gente em suporte@venceja.com.br."
      structuredData={[faqPage]}
    >
      <ScrollSection>
        <Faq />
      </ScrollSection>
    </ProductPage>
  );
}
