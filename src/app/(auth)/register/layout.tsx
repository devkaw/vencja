import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar conta grátis',
  description: 'Crie sua conta grátis na VenceJá em menos de um minuto. Até 3 clientes e 10 cobranças sem pagar nada e sem cartão de crédito.',
  alternates: { canonical: '/register' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
