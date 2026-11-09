import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recuperar senha',
  description: 'Receba um link por e-mail para criar uma senha nova na VenceJá.',
  alternates: { canonical: '/forgot-password' },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
