import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { ToastContainer } from '@/components/ui/toast';

const sora = Sora({ 
  subsets: ['latin'], 
  variable: '--font-sora',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.venceja.com.br'),
  title: {
    default: 'VenceJa - Gestão empresarial para autônomos e pequenas empresas',
    template: '%s | VenceJa',
  },
  description: 'VenceJa: software de gestão empresarial completo. Centralize clientes, cobranças e relatórios. Ideal para autônomos e pequenas empresas. Score automático, calendário financeiro e cobrança recorrente.',
  keywords: ['VenceJa', 'vencja', 'gestão empresarial', 'controle de cobrança', 'gestão de clientes', 'software para autônomos', 'controle financeiro', 'inadimplência', 'LGPD', 'cobrança recorrente', 'dashboard financeiro', 'relatório financeiro', 'gerenciar clientes', 'cobrar clientes', 'controle de inadimplentes', '软件', 'gestão financeira', 'fatura', 'boleto', 'pix'],
  authors: [{ name: 'VenceJa' }],
  creator: 'VenceJa',
  publisher: 'VenceJa',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://www.venceja.com.br',
    siteName: 'VenceJa',
    title: 'VenceJa - Software de gestão empresarial para autônomos',
    description: 'VenceJa: software de gestão empresarial completo. Centralize clientes, cobranças e relatórios. Ideal para autônomos e pequenas empresas.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VenceJa - Gestão Empresarial',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VenceJa - Gestão empresarial',
    description: 'VenceJa: software de gestão empresarial completo. Centralize clientes, cobranças e relatórios.',
    images: ['/og-image.png'],
    creator: '@venceja',
  },
  alternates: {
    canonical: 'https://www.venceja.com.br',
    languages: {
      'pt-BR': 'https://www.venceja.com.br',
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            document.documentElement.classList.add('dark');
          `,
        }} />
      </head>
      <body className={`${sora.variable} font-sans antialiased bg-black text-white`}>
        <Analytics />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}