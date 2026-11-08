import type { Metadata } from 'next';
import { CookiePreferencesButton } from '@/components/legal/cookie-consent';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = { title: 'Política de Cookies', description: 'Quais cookies e tecnologias parecidas a VenceJá usa.', alternates: { canonical: '/cookies' } };

export default function CookiesPage() {
  return (
    <LegalPage titulo="Política de Cookies" resumo="O que guardamos no seu navegador, para quê, e como você controla isso." atual="/cookies">
      <h2>1. O que são</h2>
      <p>Cookies e armazenamento local são pequenos dados guardados pelo navegador. Usamos o mínimo. Não usamos cookies de publicidade nem de rastreamento entre sites.</p>

      <h2>2. O que usamos</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Tipo</th>
            <th scope="col">Para quê</th>
            <th scope="col">Duração</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>sb-*-auth-token</td>
            <td>Cookie essencial (Supabase)</td>
            <td>Manter você conectado</td>
            <td>Até sair ou a sessão expirar</td>
          </tr>
          <tr>
            <td>venceja-cookies</td>
            <td>Armazenamento local essencial</td>
            <td>Lembrar sua escolha neste aviso</td>
            <td>Até você limpar o navegador</td>
          </tr>
          <tr>
            <td>theme, sidebar-collapsed</td>
            <td>Armazenamento local de preferência</td>
            <td>Lembrar tema e menu</td>
            <td>Até você limpar o navegador</td>
          </tr>
          <tr>
            <td>Vercel Web Analytics</td>
            <td>Medição, sem cookies</td>
            <td>Contar visitas de forma agregada. Só carrega se você aceitar</td>
            <td>Não guarda identificador no navegador</td>
          </tr>
        </tbody>
      </table>
      <p>As fontes do site são servidas pelo nosso próprio domínio, sem chamadas ao Google.</p>

      <h2>3. Como controlar</h2>
      <p>
        Você pode mudar sua escolha a qualquer momento: <CookiePreferencesButton className="font-medium text-brand-ink underline underline-offset-2" />. Também pode apagar cookies nas configurações do navegador. Sem os essenciais, não é possível entrar na conta.
      </p>
    </LegalPage>
  );
}
