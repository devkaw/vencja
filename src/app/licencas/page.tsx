import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = { title: 'Licenças', description: 'Fontes, ícones e software usados pela VenceJá.', alternates: { canonical: '/licencas' } };

export default function LicencasPage() {
  return (
    <LegalPage titulo="Licenças" resumo="Fontes, ícones e software de terceiros usados no site." atual="/licencas">
      <h2>1. Fontes</h2>
      <ul>
        <li>Geist e Geist Mono, da Vercel: SIL Open Font License 1.1.</li>
        <li>Bricolage Grotesque, de Mathieu Triay: SIL Open Font License 1.1.</li>
      </ul>

      <h2>2. Ícones</h2>
      <ul>
        <li>Lucide: licença ISC.</li>
      </ul>

      <h2>3. Marcas</h2>
      <p>WhatsApp é marca da Meta Platforms, Inc., citada apenas para indicar a compatibilidade do serviço. A VenceJá não é afiliada à Meta. Cakto, Supabase, Vercel, Resend e Sentry são marcas de seus titulares.</p>

      <h2>4. Imagens</h2>
      <p>O logotipo e as imagens do site foram criados para a VenceJá. Não usamos banco de imagens de terceiros.</p>

      <h2>5. Software</h2>
      <p>O site usa software de código aberto, como Next.js, React, Tailwind CSS, Radix UI, Framer Motion, date-fns e as bibliotecas do Supabase, sob licenças MIT, Apache 2.0, ISC e semelhantes.</p>
    </LegalPage>
  );
}
