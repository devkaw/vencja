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
  title: 'VenceJa - Gestão Empresarial',
  description: 'Centralize clientes, cobranças e relatórios. Gestão completa do seu negócio.',
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