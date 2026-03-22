import type { Profile } from '@/types';

export function hasPremiumAccess(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.plano === 'pro' || profile.acesso_vitalicio === true;
}

export function canAccessFeature(profile: Profile | null, requiresPro: boolean): boolean {
  if (!requiresPro) return true;
  return hasPremiumAccess(profile);
}

export function canUsePartialPayment(profile: Profile | null): boolean {
  return hasPremiumAccess(profile);
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
      'Ranking de inadimplência',
      'Dashboard inteligente',
      'Score de clientes',
      'Notificações automáticas',
      'Suporte via WhatsApp',
    ],
    limits: {
      maxClients: 3,
      maxCharges: 10,
    },
  },
  pro: {
    id: 'pro',
    name: 'Vitalício Pro',
    price: 297,
    description: 'Acesso permanente a todas as funcionalidades',
    features: [
      'Tudo do plano Gratuito',
      'Clientes ilimitados',
      'Cobranças ilimitadas',
      'Cobrança via WhatsApp',
      'Cobranças recorrentes',
      'Pagamento parcial de cobranças',
      'Exportação CSV',
      'Suporte prioritário',
      'Acesso vitalício - pague uma vez!',
    ],
    limits: {
      maxClients: -1,
      maxCharges: -1,
    },
  },
};
