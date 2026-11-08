'use client';

import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { useWorkspace } from '@/components/workspace/workspace-context';
import { GlassCard } from './glass-card';

export function NotificationSettings() {
  const { profile, email } = useWorkspace();
  const addToast = useAppStore((s) => s.addToast);
  const [supabase] = useState(() => createClient());
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'indisponivel'>('carregando');
  const [ligado, setLigado] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('notification_settings')
      .select('daily_email')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return setEstado('indisponivel');
        setLigado(data?.daily_email ?? true);
        setEstado('pronto');
      });
  }, [profile, supabase]);

  const alterar = async (valor: boolean) => {
    if (!profile) return;
    setLigado(valor);
    const { error } = await supabase.from('notification_settings').upsert({ user_id: profile.id, daily_email: valor }, { onConflict: 'user_id' });
    if (error) {
      setLigado(!valor);
      addToast('error', 'Não foi possível salvar a preferência.');
      return;
    }
    addToast('success', valor ? 'Aviso diário ligado.' : 'Aviso diário desligado.');
  };

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
          <BellRing className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="aviso-diario" className="font-display text-lg font-semibold text-ink">
              Aviso diário por e-mail
            </label>
            <Switch id="aviso-diario" checked={ligado} onCheckedChange={alterar} disabled={estado !== 'pronto'} />
          </div>
          <p className="mt-1 text-sm text-ink-3">Às 8h, nos dias em que uma cobrança vence ou acabou de vencer. Nos outros dias, nada chega na sua caixa de entrada.</p>
          <p className="mt-2 truncate text-xs text-ink-4">Enviado para {email}</p>
          {estado === 'indisponivel' && (
            <p className="mt-3 rounded-xl bg-warn-soft p-3 text-sm text-warn" role="status">
              Os avisos ainda não estão disponíveis nesta conta. Tente de novo mais tarde.
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
