'use client';

import { useState } from 'react';
import { Phone, Sparkles, User } from 'lucide-react';
import { Avatar } from '@/components/data/avatar';
import { ScoreRing } from '@/components/data/charts';
import { EmptyState } from '@/components/data/empty-state';
import { GlassPanel } from '@/components/motion/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WLink, useWorkspace, useWorkspaceNav } from '@/components/workspace/workspace-context';
import { PLANS } from '@/lib/subscription';
import { useAppStore } from '@/lib/store';
import { formatPhone, normalizarTelefoneBR } from '@/lib/utils';
import { PageHero } from './kit/page-hero';

export function ClientFormScreen() {
  const { clients, isPro, actions } = useWorkspace();
  const nav = useWorkspaceNav();
  const addToast = useAppStore((s) => s.addToast);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const max = PLANS.free.limits.maxClients;

  if (!isPro && clients.length >= max) {
    return (
      <div className="space-y-6">
        <PageHero title="Novo cliente" backHref="/dashboard/clients" backLabel="Clientes" />
        <GlassPanel lift={false} className="rounded-[28px]">
          <EmptyState
            icon={<Sparkles />}
            title={`Você chegou aos ${max} clientes do plano grátis`}
            description="Assine o Pro para cadastrar clientes sem limite."
            action={
              <Button asChild>
                <WLink href="/dashboard/upgrade">Ver o Pro</WLink>
              </Button>
            }
          />
        </GlassPanel>
      </div>
    );
  }

  const telefoneFormatado = telefone.trim() ? normalizarTelefoneBR(telefone) : '';

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Informe o nome do cliente');
      return;
    }
    setEnviando(true);
    const r = await actions.salvarCliente({ nome: nome.trim(), telefone: telefoneFormatado || null, email: null });
    setEnviando(false);
    if (!r.ok) {
      addToast('error', r.error);
      return;
    }
    addToast('success', `${nome.trim()} foi cadastrado.`);
    nav.push('/dashboard/clients');
  };

  return (
    <div className="space-y-6 @2xl:space-y-8">
      <PageHero eyebrow="Nome e WhatsApp já bastam" title="Novo" highlight="cliente." backHref="/dashboard/clients" backLabel="Clientes" />
      <form onSubmit={enviar} noValidate className="grid gap-6 @4xl:grid-cols-[1fr_360px] @4xl:items-start">
        <GlassPanel lift={false} className="space-y-5 rounded-[28px] p-5 @2xl:p-7">
          <Input
            label="Nome"
            icon={<User />}
            placeholder="Ex.: Carla Mendes"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setErro('');
            }}
            error={erro}
            autoFocus
          />
          <Input label="WhatsApp (opcional)" type="tel" inputMode="tel" icon={<Phone />} placeholder="(11) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} hint="Com DDD. É para esse número que a mensagem de cobrança vai." />
          <div className="flex flex-col-reverse gap-3 border-t border-line/70 pt-5 @2xl:flex-row @2xl:justify-end">
            <Button asChild variant="ghost" type="button">
              <WLink href="/dashboard/clients">Cancelar</WLink>
            </Button>
            <Button type="submit" size="lg" isLoading={enviando}>
              Cadastrar cliente
            </Button>
          </div>
        </GlassPanel>
        <aside aria-label="Prévia do cartão do cliente">
          <GlassPanel strong lift={false} className="rounded-[28px] p-6">
            <p className="eyebrow mb-5">Prévia</p>
            <div className="flex items-center gap-3">
              <Avatar name={nome || '?'} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{nome || 'Nome do cliente'}</p>
                <p className="truncate text-sm text-ink-3">{telefoneFormatado ? formatPhone(telefoneFormatado) : 'Sem WhatsApp'}</p>
              </div>
              <ScoreRing score={null} size={52} stroke={5} />
            </div>
            <p className="mt-4 text-sm text-ink-3">A nota aparece quando a primeira cobrança for paga ou vencer.</p>
          </GlassPanel>
        </aside>
      </form>
    </div>
  );
}
