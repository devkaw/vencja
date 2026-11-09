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

const SITE = 'https://www.venceja.com.br';
const title = 'VenceJá: controle de cobranças e cobrança pelo WhatsApp';
const description =
  'Saiba quem te deve, acompanhe vencimentos e cobre pelo WhatsApp com a mensagem pronta. Para autônomos e pequenos negócios que querem largar o caderno e a planilha. Grátis para começar.';
const shareTitle = 'VenceJá: saiba quem te deve. Cobre em dois toques.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  applicationName: 'VenceJá',
  title: {
    default: title,
    template: '%s | VenceJá',
  },
  description,
  keywords: [
    'VenceJá',
    'Vence Já',
    'controle de cobranças',
    'cobrança pelo WhatsApp',
    'controle de inadimplência',
    'contas a receber',
    'controle de clientes que devem',
    'cobrança recorrente',
    'mensalidade de alunos',
    'controle financeiro para autônomos',
    'planilha de cobrança',
    'score de clientes',
  ],
  authors: [{ name: 'VenceJá', url: SITE }],
  creator: 'VenceJá',
  publisher: 'VenceJá',
  category: 'finance',
  formatDetection: { telephone: false, email: false, address: false },
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
    url: SITE,
    siteName: 'VenceJá',
    title: shareTitle,
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, type: 'image/png', alt: 'VenceJá: painel de cobranças e mensagem pronta para o WhatsApp' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: shareTitle,
    description,
    images: [{ url: '/og-image.png', alt: 'VenceJá: painel de cobranças e mensagem pronta para o WhatsApp' }],
  },
  alternates: {
    canonical: '/',
    languages: { 'pt-BR': '/' },
  },
  // Google picks the favicon from these links; it needs a square image in a multiple of 48px.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/logo-mark.svg', type: 'image/svg+xml' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: { capable: true, title: 'VenceJá', statusBarStyle: 'default' },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
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
