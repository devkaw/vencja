'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { isVencido } from '@/lib/utils';

async function notificationExists(title: string): Promise<boolean> {
  const res = await fetch('/api/notifications/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  return data.exists;
}

export function NotificationsChecker() {
  const { loadNotifications } = useAppStore();
  const [hasChecked, setHasChecked] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (hasChecked) return;

    async function checkNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[NotificationsChecker] No user, skipping');
        return;
      }

      await loadNotifications();

      const { data: profile } = await supabase.from('profiles').select('plano').eq('id', user.id).single();
      const isPremium = profile?.plano === 'pro' || profile?.plano === 'lifetime';

      const { data: charges, error: chargesError } = await supabase
        .from('charges')
        .select('*, client:clients(nome)')
        .eq('user_id', user.id)
        .eq('status', 'pendente');

      if (chargesError) {
        console.error('[NotificationsChecker] Error fetching charges:', chargesError);
        return;
      }

      if (charges && charges.length > 0) {
        const overdue = charges.filter(c => isVencido(c.data_vencimento));
        
        if (overdue.length > 0) {
          const title = `${overdue.length} cobrança${overdue.length > 1 ? 's' : ''} em atraso`;
          const exists = await notificationExists(title);
          if (!exists) {
            const res = await fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.id,
                type: 'danger',
                title,
                message: `Você tem ${overdue.length} cobrança${overdue.length > 1 ? 's' : ''} em atraso. Clique para ver.`,
                link: '/dashboard/notifications'
              })
            });
            console.log('[NotificationsChecker] Overdue notification response:', res.status);
          }
        }

        const upcoming = charges.filter(c => {
          const daysUntil = Math.ceil((new Date(c.data_vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysUntil <= 3 && daysUntil > 0;
        });

        if (upcoming.length > 0) {
          const title = `${upcoming.length} cobrança${upcoming.length > 1 ? 's' : ''} vencendo em breve`;
          const exists = await notificationExists(title);
          if (!exists) {
            const res = await fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.id,
                type: 'warning',
                title,
                message: `Você tem cobrança${upcoming.length > 1 ? 's' : ''} para os próximos dias.`,
                link: '/dashboard/notifications'
              })
            });
            console.log('[NotificationsChecker] Upcoming notification response:', res.status);
          }
        }
      }

      if (!isPremium) {
        const title = 'Desbloqueie todos os recursos';
        const exists = await notificationExists(title);
        if (!exists) {
          const res = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              type: 'plan',
              title,
              message: 'Faça upgrade para vitalício e tenha clientes e cobranças ilimitados.',
              link: '/dashboard/upgrade'
            })
          });
          console.log('[NotificationsChecker] Upgrade notification response:', res.status);
        }
      }

      setHasChecked(true);
    }

    checkNotifications();
  }, [hasChecked]);

  return null;
}
