import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/legal-page';
import { EMPRESA, identificacaoEmpresa } from '@/lib/legal';

export const metadata: Metadata = { title: 'Política de Privacidade', description: 'Como a VenceJá trata dados pessoais, conforme a LGPD.', alternates: { canonical: '/privacidade' } };

export default function PrivacidadePage() {
  return (
    <LegalPage titulo="Política de Privacidade" resumo="Quais dados tratamos, por quê, com quem e como você exerce seus direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018)." atual="/privacidade">
      <h2>1. Quem trata seus dados</h2>
      <p>
        <strong>Dados da sua conta:</strong> o responsável pelo tratamento (controlador) é {identificacaoEmpresa()}.
      </p>
      <p>
        <strong>Dados dos seus clientes:</strong> quem os cadastra é você, que é o controlador. A VenceJá atua como operadora e só trata esses dados para prestar o serviço.
      </p>
      <p>
        {EMPRESA.encarregadoNome ? `Encarregado de dados: ${EMPRESA.encarregadoNome}.` : 'Canal de atendimento sobre dados pessoais:'}{' '} <a href={`mailto:${EMPRESA.emailPrivacidade}`}>{EMPRESA.emailPrivacidade}</a>.
      </p>

      <h2>2. Dados que tratamos</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Dados</th>
            <th scope="col">Para quê</th>
            <th scope="col">Base legal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nome, e-mail e senha (guardada só em forma cifrada)</td>
            <td>Criar e proteger sua conta</td>
            <td>Execução de contrato</td>
          </tr>
          <tr>
            <td>Data e versão do aceite dos Termos e declaração de maioridade</td>
            <td>Comprovar o aceite</td>
            <td>Obrigação legal e exercício de direitos</td>
          </tr>
          <tr>
            <td>Clientes (nome e, se você informar, WhatsApp e e-mail), cobranças e pagamentos</td>
            <td>Prestar o serviço de controle de cobranças</td>
            <td>Definida por você, como controlador</td>
          </tr>
          <tr>
            <td>Plano, ciclo, datas da assinatura e pedidos de cancelamento ou reembolso</td>
            <td>Gerir a assinatura</td>
            <td>Execução de contrato</td>
          </tr>
          <tr>
            <td>Endereço IP e registros técnicos</td>
            <td>Segurança, limite de tentativas e diagnóstico de erros</td>
            <td>Legítimo interesse e Marco Civil da Internet</td>
          </tr>
          <tr>
            <td>Páginas visitadas, de forma agregada</td>
            <td>Entender o uso do site</td>
            <td>Consentimento, pelo banner de cookies</td>
          </tr>
        </tbody>
      </table>
      <p>CPF e dados de cartão são informados diretamente à Cakto no pagamento. A VenceJá não recebe nem guarda esses dados.</p>

      <h2>3. E-mails</h2>
      <p>
        Enviamos e-mails necessários para a conta e a assinatura, como confirmação, recuperação de senha e recibos. O aviso diário de vencimentos pode ser desligado em Configurações › Avisos ou pelo link em cada mensagem. Não enviamos propaganda sem o seu consentimento.
      </p>

      <h2>4. Score e decisões automatizadas</h2>
      <p>O score é calculado automaticamente a partir das cobranças registradas por você. Ele serve de apoio e não decide nada sozinho. Quem decide como agir com cada cliente é você.</p>

      <h2>5. Com quem compartilhamos</h2>
      <p>Não vendemos dados pessoais. Compartilhamos apenas com os fornecedores necessários:</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Fornecedor</th>
            <th scope="col">Função</th>
            <th scope="col">Local</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase</td>
            <td>Banco de dados e autenticação</td>
            <td>Brasil (São Paulo)</td>
          </tr>
          <tr>
            <td>Vercel</td>
            <td>Hospedagem do site e medição de visitas</td>
            <td>Estados Unidos e rede global</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Envio de e-mails</td>
            <td>Estados Unidos</td>
          </tr>
          <tr>
            <td>Sentry</td>
            <td>Monitoramento de erros, sem dados de identificação</td>
            <td>Estados Unidos</td>
          </tr>
          <tr>
            <td>Cakto</td>
            <td>Pagamento da assinatura</td>
            <td>Brasil</td>
          </tr>
        </tbody>
      </table>
      <p>Também podemos compartilhar dados por ordem judicial ou obrigação legal.</p>

      <h2>6. Transferência internacional</h2>
      <p>Parte desses fornecedores opera fora do Brasil. Nesses casos, a transferência é necessária para prestar o serviço e segue o art. 33 da LGPD.</p>

      <h2>7. Por quanto tempo guardamos</h2>
      <ul>
        <li>Dados da conta e de clientes: enquanto a conta existir.</li>
        <li>Ao excluir a conta, os dados saem do nosso banco na hora. Cópias de segurança dos fornecedores somem no ciclo normal de cada um.</li>
        <li>Registros de acesso, fiscais e de pagamento: pelo prazo que a lei exigir.</li>
      </ul>

      <h2>8. Seus direitos</h2>
      <p>Você pode pedir confirmação do tratamento, acesso, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamento e revogação do consentimento. Também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>
      <ul>
        <li>
          <strong>Baixar seus dados:</strong> Configurações › Seus dados.
        </li>
        <li>
          <strong>Excluir seus dados:</strong> veja <Link href="/exclusao-de-dados">como pedir a exclusão</Link>.
        </li>
        <li>
          <strong>Outros pedidos:</strong> <a href={`mailto:${EMPRESA.emailPrivacidade}`}>{EMPRESA.emailPrivacidade}</a>. Respondemos em até 15 dias.
        </li>
      </ul>
      <p>Se você é cliente de alguém que usa a VenceJá, procure primeiro essa pessoa, que é quem decide sobre seus dados. Se preferir, fale conosco e encaminharemos o pedido.</p>

      <h2>9. Segurança</h2>
      <ul>
        <li>Conexão criptografada (HTTPS) em todo o site.</li>
        <li>Senhas guardadas apenas em forma cifrada.</li>
        <li>Cada conta enxerga somente os próprios dados, por regras aplicadas no banco.</li>
        <li>Limite de tentativas nas rotas de acesso.</li>
      </ul>
      <p>Nenhum sistema é totalmente imune. Se houver um incidente com risco relevante, avisaremos as pessoas afetadas e a ANPD.</p>

      <h2>10. Menores de idade</h2>
      <p>
        A VenceJá é para maiores de 18 anos, e isso é confirmado no cadastro. Se você souber de uma conta de menor, avise <a href={`mailto:${EMPRESA.emailPrivacidade}`}>{EMPRESA.emailPrivacidade}</a> para removermos. Dados de crianças e adolescentes clientes de um usuário só devem ser cadastrados com a autorização dos responsáveis e no seu melhor interesse.
      </p>

      <h2>11. Cookies</h2>
      <p>
        Veja a <Link href="/cookies">Política de Cookies</Link>.
      </p>

      <h2>12. Mudanças</h2>
      <p>Avisaremos mudanças relevantes por e-mail ou no serviço. A data da versão atual está no topo desta página.</p>
    </LegalPage>
  );
}
