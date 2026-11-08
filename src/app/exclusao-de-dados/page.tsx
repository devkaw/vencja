import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { EMPRESA } from '@/lib/legal';

export const metadata: Metadata = { title: 'Exclusão de dados', description: 'Como pedir a exclusão dos seus dados na VenceJá.', alternates: { canonical: '/exclusao-de-dados' } };

export default function ExclusaoPage() {
  const assunto = encodeURIComponent('Pedido de exclusão de dados');
  return (
    <LegalPage titulo="Exclusão de dados" resumo="Como apagar seus dados, tendo ou não uma conta na VenceJá." atual="/exclusao-de-dados">
      <h2>1. Se você tem conta</h2>
      <ul>
        <li>Se quiser, baixe uma cópia em Configurações › Seus dados.</li>
        <li>Se tiver assinatura ativa, peça o cancelamento em Configurações › Plano.</li>
        <li>Acesse Configurações › Excluir conta e confirme com sua senha.</li>
      </ul>
      <p>A exclusão é imediata e não pode ser desfeita. Apagamos sua conta, seus clientes, suas cobranças e seus pagamentos do nosso banco de dados.</p>

      <h2>2. Se não consegue entrar na conta</h2>
      <p>
        Escreva para <a href={`mailto:${EMPRESA.emailPrivacidade}?subject=${assunto}`}>{EMPRESA.emailPrivacidade}</a> a partir do e-mail da conta. Respondemos em até 15 dias.
      </p>

      <h2>3. Se alguém cadastrou você como cliente</h2>
      <p>
        Peça primeiro à pessoa ou empresa que cobra você, pois ela é a responsável por esses dados. Se não resolver, escreva para <a href={`mailto:${EMPRESA.emailPrivacidade}?subject=${assunto}`}>{EMPRESA.emailPrivacidade}</a> informando seu nome e telefone, e encaminharemos o pedido.
      </p>

      <h2>4. O que pode continuar guardado</h2>
      <p>Registros que a lei obriga a manter, como dados fiscais de pagamento e registros de acesso, ficam guardados pelo prazo legal e depois são apagados. Cópias de segurança dos fornecedores somem no ciclo normal de cada um.</p>
    </LegalPage>
  );
}
