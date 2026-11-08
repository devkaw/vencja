import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import { ToastContainer } from '@/components/ui/toast';
import { CookieConsent } from '@/components/legal/cookie-consent';
import { MotionProvider } from '@/components/motion/primitives';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
  display: 'swap',
});

const description =
  'Controle quem te deve, acompanhe vencimentos e cobre pelo WhatsApp com a mensagem pronta. Para autônomos e pequenos negócios que querem sair do caderno e da planilha. Comece grátis.';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.venceja.com.br'),
  title: {
    default: 'VenceJá — Controle de cobranças para autônomos e pequenos negócios',
    template: '%s | VenceJá',
  },
  description,
  keywords: [
    'VenceJá',
    'VenceJa',
    'controle de cobrança',
    'controle de inadimplência',
    'cobrança pelo WhatsApp',
    'gestão de clientes',
    'cobrança recorrente',
    'controle financeiro para autônomos',
    'substituir planilha de cobrança',
    'contas a receber',
  ],
  authors: [{ name: 'VenceJá' }],
  creator: 'VenceJá',
  publisher: 'VenceJá',
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
    siteName: 'VenceJá',
    title: 'VenceJá — Saiba quem te deve. Cobre em dois toques.',
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'VenceJá — controle de cobranças' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VenceJá — Saiba quem te deve. Cobre em dois toques.',
    description,
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.venceja.com.br',
    languages: { 'pt-BR': 'https://www.venceja.com.br' },
  },
  icons: {
    icon: [{ url: '/logo-mark.svg', type: 'image/svg+xml' }, { url: '/favicon.ico' }],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F5F1' },
    { media: '(prefers-color-scheme: dark)', color: '#070C0A' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Runs before paint so the stored (or system) theme never flashes.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} ${display.variable} font-sans antialiased`}>
        <MotionProvider>
          {children}
          <ToastContainer />
          <CookieConsent />
        </MotionProvider>
      </body>
    </html>
  );
}
