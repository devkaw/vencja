import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/legal-page';
import { ASSUNTO_SUPORTE_PRO, EMPRESA, PRAZO_ATENDIMENTO, PRAZO_SUPORTE_PRO, identificacaoEmpresa } from '@/lib/legal';

export const metadata: Metadata = { title: 'Ajuda e contato', description: 'Fale com a VenceJá.', alternates: { canonical: '/help' } };

export default function HelpPage() {
  return (
    <LegalPage titulo="Ajuda e contato" resumo="Como falar com a gente e onde resolver os pedidos mais comuns." atual="/help">
      <h2>Fale conosco</h2>
      <p>
        <a href={`mailto:${EMPRESA.emailSuporte}`}>{EMPRESA.emailSuporte}</a>. Respondemos em até {PRAZO_ATENDIMENTO}.
      </p>
      <p>
        <strong>Assinante Pro:</strong> respondemos em até {PRAZO_SUPORTE_PRO}. Escreva pelo botão em Configurações › Plano, ou do e-mail da sua conta com o assunto “{ASSUNTO_SUPORTE_PRO}”.
      </p>

      <h2>Pedidos mais comuns</h2>
      <ul>
        <li>
          <strong>Esqueci a senha:</strong> <Link href="/forgot-password">recuperar senha</Link>.
        </li>
        <li>
          <strong>Cancelar ou pedir reembolso:</strong> Configurações › Plano. Veja a <Link href="/reembolso">Política de Reembolso</Link>.
        </li>
        <li>
          <strong>Baixar ou excluir meus dados:</strong> veja <Link href="/exclusao-de-dados">exclusão de dados</Link>.
        </li>
        <li>
          <strong>Parar o aviso diário:</strong> Configurações › Avisos ou o link em cada e-mail.
        </li>
      </ul>

      <h2>Quem responde pela VenceJá</h2>
      <p>{identificacaoEmpresa()}</p>
    </LegalPage>
  );
}
