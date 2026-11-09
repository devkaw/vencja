import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entre na sua conta da VenceJá e veja quem te deve, o que vence hoje e quem cobrar pelo WhatsApp.',
  alternates: { canonical: '/login' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
