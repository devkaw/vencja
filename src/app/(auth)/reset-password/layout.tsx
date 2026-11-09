import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar nova senha',
  description: 'Crie uma senha nova para sua conta da VenceJá.',
  alternates: { canonical: '/reset-password' },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
