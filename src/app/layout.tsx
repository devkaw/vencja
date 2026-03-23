import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import './globals.css';
import { ToastContainer } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const sora = Sora({ 
  subsets: ['latin'], 
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VenceJa - Gestão Inteligente de Cobranças',
  description: 'Controle suas cobranças, reduza inadimplência e aumenta seu faturamento com inteligência financeira.',
  icons: {
    icon: '/favicon.ico',
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
        <template dangerouslySetInnerHTML={{
          __html: `
            document.documentElement.classList.add('dark');
          `,
        }} />
      </head>
      <body className={cn(sora.variable, 'font-sans antialiased bg-black text-white overflow-x-hidden')}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}