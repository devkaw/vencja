import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { EMPRESA, PRAZO_ATENDIMENTO } from '@/lib/legal';

export const metadata: Metadata = { title: 'Política de Reembolso', description: 'Como pedir reembolso e cancelar a assinatura da VenceJá.', alternates: { canonical: '/reembolso' } };

export default function ReembolsoPage() {
  return (
    <LegalPage titulo="Política de Reembolso" resumo="Como desistir da compra, cancelar a assinatura e receber seu dinheiro de volta." atual="/reembolso">
      <h2>1. Garantia de 7 dias</h2>
      <p>Você pode desistir do Plano Pro em até 7 dias da compra, sem precisar justificar, e receber 100% do valor pago, como prevê o art. 49 do Código de Defesa do Consumidor.</p>

      <h2>2. Como pedir</h2>
      <ul>
        <li>Acesse Configurações › Plano e toque em pedir reembolso.</li>
        <li>
          Se não conseguir acessar a conta, escreva para <a href={`mailto:${EMPRESA.emailSuporte}`}>{EMPRESA.emailSuporte}</a> com o e-mail da compra.
        </li>
      </ul>
      <p>Confirmamos o recebimento por e-mail e tratamos o pedido em até {PRAZO_ATENDIMENTO}.</p>

      <h2>3. Quando o dinheiro volta</h2>
      <p>O estorno é feito pela Cakto, na mesma forma de pagamento. O prazo para aparecer depende do meio usado e do seu banco ou operadora. No cartão, pode levar até duas faturas. No PIX, costuma ser mais rápido.</p>

      <h2>4. Depois dos 7 dias</h2>
      <p>Após esse prazo não há reembolso do período já pago, exceto por falha técnica comprovada que tenha impedido o uso do serviço ou nos casos previstos em lei.</p>

      <h2>5. Cancelamento</h2>
      <p>Cancelar interrompe as próximas renovações e não tem multa. Peça em Configurações › Plano. Tratamos o pedido em até {PRAZO_ATENDIMENTO}, confirmamos por e-mail, e você mantém o Pro até o fim do período já pago. Depois disso, a conta volta ao plano Grátis e seus dados continuam lá.</p>

      <h2>6. Sem custos escondidos</h2>
      <p>O valor do plano é o que aparece antes de você pagar. Não há taxa de adesão, de cancelamento nem percentual sobre o que você recebe dos seus clientes.</p>
    </LegalPage>
  );
}
