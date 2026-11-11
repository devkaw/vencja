import { ProductPage, productPageMetadata } from '@/components/marketing/page-shell';
import { Benefits, FeatureGrid } from '@/components/marketing/sections';
import { ScoreExplainer } from '@/components/marketing/score-explainer';
import { SpreadsheetVs } from '@/components/marketing/spreadsheet-vs';
import { ScrollSection } from '@/components/motion/primitives';

export const metadata = productPageMetadata({
  path: '/recursos',
  title: 'Recursos',
  description:
    'Cobrança pelo WhatsApp com a mensagem pronta, score de 0 a 100 para cada cliente, parcelas e cobranças recorrentes, calendário, aviso diário por e-mail e relatórios.',
});

export default function RecursosPage() {
  return (
    <ProductPage
      path="/recursos"
      name="Recursos"
      title="Recursos"
      highlight="da VenceJá."
      intro="Mensagem pronta no WhatsApp, score de pagamento por cliente, parcelas, recorrência, calendário e aviso diário por e-mail. Funciona no navegador do celular e do computador."
    >
      <ScrollSection>
        <FeatureGrid />
      </ScrollSection>
      <ScrollSection>
        <ScoreExplainer />
      </ScrollSection>
      <ScrollSection>
        <SpreadsheetVs />
      </ScrollSection>
      <ScrollSection>
        <Benefits />
      </ScrollSection>
    </ProductPage>
  );
}
