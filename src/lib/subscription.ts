import type { Profile } from '@/types';

export function hasPremiumAccess(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.plano !== 'pro') return false;

  if (profile.subscription_ends_at) {
    const endsAt = new Date(profile.subscription_ends_at);
    if (endsAt < new Date()) {
      return false;
    }
  }

  return true;
}

export function canAccessFeature(profile: Profile | null, requiresPro: boolean): boolean {
  if (!requiresPro) return true;
  return hasPremiumAccess(profile);
}

export function canUsePartialPayment(profile: Profile | null): boolean {
  return true;
}

export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    description: 'Para quem está começando',
    features: [
      '3 clientes',
      '10 cobranças',
      'Dashboard inteligente',
      'Score de clientes',
      'Ranking de inadimplência',
      'Calendário financeiro',
      'Suporte por email',
      'Cobranças recorrentes',
      'Pagamento parcial',
    ],
    limits: {
      maxClients: 3,
      maxCharges: 10,
    },
  },
  pro: {
    id: 'pro',
    name: 'Plano Pro',
    price: 49.9,
    priceAnnual: 499,
    description: 'Acesso completo a todas as funcionalidades',
    features: [
      'Clientes ilimitados',
      'Cobranças ilimitadas',
      'Cobrança via WhatsApp',
      'Relatórios completos',
      'Exportação CSV',
      'Suporte prioritário',
    ],
    limits: {
      maxClients: -1,
      maxCharges: -1,
    },
  },
};