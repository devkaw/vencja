import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/legal-page';
import { EMPRESA, PRAZO_ATENDIMENTO, PRAZO_SUPORTE_PRO, identificacaoEmpresa } from '@/lib/legal';
import { PLANS } from '@/lib/subscription';
import { brl } from '@/lib/ui/pricing';

export const metadata: Metadata = { title: 'Termos de Uso', description: 'As regras de uso da VenceJá.', alternates: { canonical: '/termos' } };

export default function TermosPage() {
  const { maxClients, maxCharges } = PLANS.free.limits;
  return (
    <LegalPage titulo="Termos de Uso" resumo="As regras para usar a VenceJá, escritas para serem entendidas." atual="/termos">
      <h2>1. Quem somos</h2>
      <p>
        A VenceJá é um serviço online de controle de cobranças, oferecido em {EMPRESA.site} por {identificacaoEmpresa()}. Fale conosco em <a href={`mailto:${EMPRESA.emailSuporte}`}>{EMPRESA.emailSuporte}</a>.
      </p>

      <h2>2. O que a VenceJá faz e o que não faz</h2>
      <ul>
        <li>Organiza clientes e cobranças, mostra vencimentos e atrasos, calcula um score por cliente e monta mensagens de cobrança.</li>
        <li>A VenceJá não recebe, não intermedia e não garante pagamentos. O dinheiro vai direto do seu cliente para você.</li>
        <li>A mensagem do WhatsApp é aberta no seu aparelho. Quem revisa e envia é você, do seu número.</li>
        <li>O score é um indicador calculado pelo histórico que você registrou. Ele não é análise de crédito nem consulta a birôs.</li>
      </ul>

      <h2>3. Quem pode usar</h2>
      <p>Você precisa ter 18 anos ou mais e capacidade para contratar. Ao usar a conta em nome de uma empresa, você declara que pode representá-la.</p>

      <h2>4. Sua conta</h2>
      <p>Mantenha seus dados corretos e sua senha em sigilo. Você responde pelo que for feito na sua conta. Avise-nos logo se suspeitar de uso indevido.</p>

      <h2>5. Planos e preços</h2>
      <ul>
        <li>
          <strong>Grátis:</strong> até {maxClients} clientes e {maxCharges} cobranças, sem prazo para acabar.
        </li>
        <li>
          <strong>Pro:</strong> R$ {brl(PLANS.pro.price)} por mês ou R$ {brl(PLANS.pro.priceAnnual)} por ano, com clientes e cobranças ilimitados, cobrança pelo WhatsApp, relatórios, exportação em CSV e suporte prioritário: respondemos as mensagens de assinantes Pro em até {PRAZO_SUPORTE_PRO}, contra até {PRAZO_ATENDIMENTO} no plano Grátis.
        </li>
      </ul>
      <p>Não cobramos taxa de adesão nem percentual sobre o que você recebe. O pagamento do Pro é processado pela Cakto, que pode oferecer condições próprias de parcelamento, sempre mostradas antes de você confirmar.</p>

      <h2>6. Renovação e cancelamento</h2>
      <p>
        A assinatura renova automaticamente no fim de cada ciclo, pelo mesmo valor, até ser cancelada. Se o preço mudar, avisaremos antes da renovação. Você pode pedir o cancelamento a qualquer momento, sem multa, em Configurações › Plano. Tratamos o pedido em até {PRAZO_ATENDIMENTO} e confirmamos por e-mail. O acesso ao Pro continua até o fim do período já pago.
      </p>

      <h2>7. Reembolso</h2>
      <p>
        Você pode desistir em até 7 dias da compra e receber o valor integral. Veja a <Link href="/reembolso">Política de Reembolso</Link>.
      </p>

      <h2>8. Dados dos seus clientes</h2>
      <p>
        Os dados de clientes que você cadastra são tratados sob a sua responsabilidade. Você é o controlador desses dados, e a VenceJá atua como operadora, seguindo suas instruções. Cadastre apenas o necessário, tenha base legal para isso e atenda aos pedidos dos seus clientes. Saiba mais na <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>9. Uso permitido</h2>
      <p>Você se compromete a não:</p>
      <ul>
        <li>Expor ao ridículo, constranger ou ameaçar quem deve, como proíbe o art. 42 do Código de Defesa do Consumidor.</li>
        <li>Enviar spam ou usar a VenceJá para fraude ou qualquer atividade ilegal.</li>
        <li>Tentar acessar dados de outras contas, burlar limites dos planos ou prejudicar o funcionamento do serviço.</li>
      </ul>

      <h2>10. Disponibilidade e responsabilidade</h2>
      <p>
        Trabalhamos para manter o serviço disponível e correto, mas podem ocorrer interrupções e manutenções. Confira os valores antes de cobrar alguém: quem decide e envia a cobrança é você. A VenceJá não responde por valores que você deixar de receber de seus clientes. Nada nestes Termos limita direitos garantidos pelo Código de Defesa do Consumidor.
      </p>

      <h2>11. Suspensão e encerramento</h2>
      <p>
        Você pode excluir sua conta em Configurações › Excluir conta. Podemos suspender uma conta que viole estes Termos ou a lei. Sempre que possível, avisaremos antes e explicaremos o motivo.
      </p>

      <h2>12. Propriedade intelectual</h2>
      <p>A marca, o software e o conteúdo da VenceJá nos pertencem. Os dados que você cadastra continuam seus, e você pode exportá-los quando quiser.</p>

      <h2>13. Mudanças nestes Termos</h2>
      <p>Mudanças relevantes serão avisadas por e-mail ou no próprio serviço antes de valerem. Se não concordar, você pode cancelar e excluir sua conta.</p>

      <h2>14. Lei e foro</h2>
      <p>Aplicam-se as leis do Brasil. Se você for consumidor, pode propor ação no foro do seu domicílio.</p>
    </LegalPage>
  );
}
