'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Clock, Mail, Pencil, Percent, Phone, Plus, Receipt, Trash2, User, Users, Wallet } from 'lucide-react';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { Avatar } from '@/components/data/avatar';
import { EmptyState } from '@/components/data/empty-state';
import { GlassPanel, Stagger } from '@/components/motion/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { WLink, useWorkspace, useWorkspaceNav } from '@/components/workspace/workspace-context';
import { chargeState, diaLocal, diasAteVencimento, saldoAberto } from '@/lib/domain/charges';
import { linhaDoTempo } from '@/lib/domain/clients';
import { useAppStore } from '@/lib/store';
import { ProTag } from '@/components/ui/pro-tag';
import { cn, formatCurrency, formatPhone, gerarLinkWhatsAppCobranca, normalizarTelefoneBR } from '@/lib/utils';
import { ChargeList } from './kit/charge-list';
import { KpiTile } from './kit/kpi-tile';
import { PageHero } from './kit/page-hero';
import { Panel } from './kit/panel';
import { ScoreCard } from './kit/score-card';
import { Timeline } from './kit/timeline';

export function ClientDetailScreen({ id, onWhatsApp }: { id: string; onWhatsApp?: () => void }) {
  const { summaries, charges, isPro, hoje, actions, userName, email, mode } = useWorkspace();
  const nav = useWorkspaceNav();
  const addToast = useAppStore((s) => s.addToast);
  const summary = summaries.find((s) => s.client.id === id);
  const dadosDoCliente = () => ({ nome: summary?.client.nome || '', telefone: summary?.client.telefone || '', email: summary?.client.email || '' });
  const [editando, setEditando] = useState(() => nav.params.get('edit') === 'true');
  const [excluir, setExcluir] = useState(false);
  const [limitePagas, setLimitePagas] = useState(12);
  const [form, setForm] = useState(dadosDoCliente);

  const alternarEdicao = (aberto: boolean) => {
    setForm(dadosDoCliente());
    setEditando(aberto);
  };

  const doCliente = useMemo(() => charges.filter((c) => c.client_id === id), [charges, id]);
  const eventos = useMemo(() => linhaDoTempo(doCliente, hoje), [doCliente, hoje]);

  if (!summary) {
    return (
      <div className="space-y-6">
        <PageHero title="Cliente não encontrado" backHref="/dashboard/clients" backLabel="Clientes" />
        <GlassPanel lift={false} className="rounded-[28px]">
          <EmptyState icon={<Users />} title="Este cliente não existe mais" description="Ele pode ter sido excluído." />
        </GlassPanel>
      </div>
    );
  }

  const { client } = summary;
  const atrasadas = doCliente.filter((c) => chargeState(c, hoje) === 'atrasado');
  const noPrazo = doCliente.filter((c) => ['hoje', 'a_vencer'].includes(chargeState(c, hoje))).sort((a, b) => diaLocal(a.data_vencimento).getTime() - diaLocal(b.data_vencimento).getTime());
  const pagas = doCliente.filter((c) => c.status === 'pago').sort((a, b) => (b.data_pagamento || '').localeCompare(a.data_pagamento || ''));
  const paraCobrar = [...atrasadas, ...noPrazo.filter((c) => diasAteVencimento(c, hoje) <= 3)];

  // Headers count the whole group; only the rows are paged.
  const grupos = [
    { key: 'atraso', titulo: 'Em atraso', todos: atrasadas, itens: atrasadas, dot: 'bg-neg' },
    { key: 'prazo', titulo: 'A vencer', todos: noPrazo, itens: noPrazo, dot: 'bg-warn' },
    { key: 'pagas', titulo: 'Pagas', todos: pagas, itens: pagas.slice(0, limitePagas), dot: 'bg-pos' },
  ].filter((g) => g.todos.length > 0);

  const salvar = async () => {
    if (!form.nome.trim()) return addToast('error', 'Informe o nome do cliente');
    const telefone = form.telefone.trim() ? normalizarTelefoneBR(form.telefone) : null;
    const r = await actions.salvarCliente({ id: client.id, nome: form.nome.trim(), telefone, email: form.email.trim() || null });
    if (!r.ok) return addToast('error', r.error);
    setEditando(false);
    addToast('success', 'Dados do cliente atualizados.');
  };

  const remover = async () => {
    const r = await actions.excluirCliente(client.id);
    if (!r.ok) return addToast('error', r.error);
    addToast('success', 'Cliente excluído.');
    nav.push('/dashboard/clients');
  };

  const linkLote =
    client.telefone && paraCobrar.length > 0
      ? gerarLinkWhatsAppCobranca(
          client.nome,
          client.telefone,
          paraCobrar.map((c) => ({ valor: saldoAberto(c), vencimento: c.data_vencimento.split('T')[0], status: chargeState(c, hoje) === 'atrasado' ? 'atrasado' : 'vencendo', descricao: c.descricao || undefined })),
          userName || email.split('@')[0]
        )
      : null;

  return (
    <div className="space-y-6 @2xl:space-y-8">
      <PageHero
        backHref="/dashboard/clients"
        backLabel="Clientes"
        eyebrow={client.telefone ? formatPhone(client.telefone) : 'Sem WhatsApp cadastrado'}
        title={client.nome}
        actions={
          <>
            <Button asChild size="sm">
              <WLink href={`/dashboard/charges/new?client=${client.id}`}>
                <Plus />
                Nova cobrança
              </WLink>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => alternarEdicao(!editando)} aria-pressed={editando}>
              <Pencil />
              {editando ? 'Fechar edição' : 'Editar'}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setExcluir(true)} className="text-neg hover:bg-neg-soft hover:text-neg" aria-label="Excluir cliente">
              <Trash2 />
            </Button>
          </>
        }
      />

      <AnimatePresence initial={false}>
        {editando && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <GlassPanel lift={false} className="rounded-[28px] p-5 @2xl:p-6">
              <p className="mb-4 font-display text-lg font-semibold text-ink">Dados do cliente</p>
              <div className="grid gap-4 @2xl:grid-cols-3">
                <Input label="Nome" icon={<User />} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
                <Input label="WhatsApp" type="tel" inputMode="tel" icon={<Phone />} placeholder="(11) 99999-9999" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} />
                <Input label="E-mail" type="email" icon={<Mail />} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={() => setEditando(false)}>
                  Cancelar
                </Button>
                <Button onClick={salvar}>Salvar alterações</Button>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <Stagger onMount className="grid grid-cols-2 gap-3 @4xl:grid-cols-4 @4xl:gap-4">
        <KpiTile label="Já pagou" value={summary.pago} tone="pos" icon={<Wallet />} sub={summary.ultimoPagamento ? 'Total recebido' : 'Nenhum pagamento ainda'} />
        <KpiTile label="Em atraso" value={summary.emAtraso} tone="neg" icon={<Clock />} sub={`${summary.qtdAtrasadas} ${summary.qtdAtrasadas === 1 ? 'vencida' : 'vencidas'}`} />
        <KpiTile label="A receber" value={summary.aReceber} tone="warn" icon={<CalendarClock />} sub={`${noPrazo.length} no prazo`} />
        <KpiTile label="Pagas em dia" value={summary.pontualidade} kind="percent" tone="brand" icon={<Percent />} sub={summary.prazoMedioDias ? `${summary.prazoMedioDias} ${summary.prazoMedioDias === 1 ? 'dia' : 'dias'} de atraso em média` : 'Sem atraso médio'} />
      </Stagger>

      <div className="grid gap-6 @4xl:grid-cols-[360px_1fr] @4xl:items-start">
        <div className="min-w-0 space-y-6">
          <ScoreCard summary={summary} />
          {linkLote && (
            <GlassPanel lift={false} className="rounded-[28px] p-5">
              <p className="font-display text-lg font-semibold text-ink">Cobrar tudo de uma vez</p>
              <p className="mt-1 text-sm text-ink-3">Uma mensagem com as vencidas e as que vencem em até 3 dias.</p>
              {isPro ? (
                mode === 'demo' ? (
                  <Button variant="whatsapp" size="lg" className="mt-4 w-full" onClick={onWhatsApp}>
                    <WhatsAppIcon />
                    Cobrar no WhatsApp ({paraCobrar.length})
                  </Button>
                ) : (
                  <Button asChild variant="whatsapp" size="lg" className="mt-4 w-full">
                    <a href={linkLote} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon />
                      Cobrar no WhatsApp ({paraCobrar.length})
                    </a>
                  </Button>
                )
              ) : (
                <Button asChild variant="secondary" size="lg" className="mt-4 w-full">
                  <WLink href="/dashboard/upgrade">
                    <WhatsAppIcon />
                    Cobrar no WhatsApp ({paraCobrar.length})
                    <ProTag />
                  </WLink>
                </Button>
              )}
            </GlassPanel>
          )}
          {!client.telefone && (
            <button onClick={() => alternarEdicao(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong p-3 text-sm font-medium text-ink-2 transition-colors hover:border-brand-500 hover:text-brand-ink">
              <Phone className="size-4" />
              Adicionar WhatsApp para cobrar
            </button>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          {doCliente.length === 0 ? (
            <GlassPanel lift={false} className="rounded-[28px]">
              <EmptyState
                icon={<Receipt />}
                title="Nenhuma cobrança para este cliente"
                description="Lance a primeira e acompanhe o vencimento por aqui."
                action={
                  <Button asChild size="sm">
                    <WLink href={`/dashboard/charges/new?client=${client.id}`}>
                      <Plus />
                      Lançar cobrança
                    </WLink>
                  </Button>
                }
              />
            </GlassPanel>
          ) : (
            grupos.map((g) => (
              <Panel
                key={g.key}
                title={
                  <span className="flex items-center gap-2">
                    <span className={cn('size-2 rounded-full', g.dot)} />
                    {g.titulo}
                  </span>
                }
                hint={`${g.todos.length} · ${formatCurrency(g.todos.reduce((s, c) => s + (c.status === 'pago' ? Number(c.valor) : saldoAberto(c)), 0))}`}
                flush
              >
                <ChargeList charges={g.itens} hideClient onWhatsApp={onWhatsApp} />
                {g.todos.length > g.itens.length && (
                  <div className="border-t border-line/70 p-3 text-center">
                    <Button variant="ghost" size="sm" onClick={() => setLimitePagas((l) => l + 12)}>
                      Mostrar mais ({g.todos.length - g.itens.length} restantes)
                    </Button>
                  </div>
                )}
              </Panel>
            ))
          )}

          {eventos.length > 0 && (
            <Panel eyebrow="Histórico" title="Linha do tempo">
              <Timeline events={eventos} />
            </Panel>
          )}
        </div>
      </div>

      <Modal isOpen={excluir} onClose={() => setExcluir(false)} title={`Excluir ${client.nome}?`} description="O cliente e as cobranças dele saem da sua lista. Essa ação não pode ser desfeita." icon={<Trash2 />} tone="danger" size="sm">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setExcluir(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={remover}>
            Excluir cliente
          </Button>
        </div>
      </Modal>
    </div>
  );
}
