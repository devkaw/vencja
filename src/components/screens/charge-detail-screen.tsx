'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Ban, CheckCircle2, Pencil, Phone, Receipt, Repeat, Trash2 } from 'lucide-react';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { Avatar } from '@/components/data/avatar';
import { ScoreRing } from '@/components/data/charts';
import { EmptyState } from '@/components/data/empty-state';
import { GlassPanel } from '@/components/motion/primitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { WLink, useWorkspace, useWorkspaceNav } from '@/components/workspace/workspace-context';
import { saldoAberto } from '@/lib/domain/charges';
import { linhaDoTempo } from '@/lib/domain/clients';
import { useAppStore } from '@/lib/store';
import { chargeVisual, scoreTone } from '@/lib/ui/status';
import { cn, formatCurrency, formatDate, formatPhone } from '@/lib/utils';
import { PageHero } from './kit/page-hero';
import { Panel } from './kit/panel';
import { PaymentSheet } from './kit/payment-sheet';
import { Timeline } from './kit/timeline';
import { WhatsAppSheet, linkDaCobranca } from './kit/whatsapp-sheet';

export function ChargeDetailScreen({ id, onWhatsApp }: { id: string; onWhatsApp?: () => void }) {
  const { charges, summaries, isPro, hoje, actions, userName, email } = useWorkspace();
  const nav = useWorkspaceNav();
  const addToast = useAppStore((s) => s.addToast);
  const charge = charges.find((c) => c.id === id);
  const summary = summaries.find((s) => s.client.id === charge?.client_id);
  const [pagar, setPagar] = useState(false);
  const [whats, setWhats] = useState(false);
  const [editar, setEditar] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const [excluirSerie, setExcluirSerie] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ descricao: '', valor: '', data_vencimento: '' });

  const eventos = useMemo(() => (charge ? linhaDoTempo([charge], hoje) : []), [charge, hoje]);

  if (!charge || !summary) {
    return (
      <div className="space-y-6">
        <PageHero title="Cobrança não encontrada" backHref="/dashboard/charges" backLabel="Cobranças" />
        <GlassPanel lift={false} className="rounded-[28px]">
          <EmptyState icon={<Receipt />} title="Esta cobrança não existe mais" description="Ela pode ter sido excluída." />
        </GlassPanel>
      </div>
    );
  }

  const v = chargeVisual(charge);
  const aberta = charge.status !== 'pago';
  const client = summary.client;
  const tom = scoreTone(summary.score.value);
  const periodicidade = charge.periodicidade === 'semanal' ? 'Semanal' : charge.periodicidade === 'quinzenal' ? 'Quinzenal' : 'Mensal';
  const remetente = userName || email.split('@')[0];
  const texto = aberta && client.telefone ? new URL(linkDaCobranca(charge, remetente, hoje)).searchParams.get('text') : null;

  const abrirEdicao = () => {
    setForm({ descricao: charge.descricao || '', valor: String(charge.valor), data_vencimento: charge.data_vencimento.split('T')[0] });
    setEditar(true);
  };

  const salvar = async () => {
    const valor = parseFloat(form.valor);
    if (!Number.isFinite(valor) || valor <= 0) return addToast('error', 'Valor inválido');
    if (!form.data_vencimento) return addToast('error', 'Data de vencimento é obrigatória');
    setSalvando(true);
    const r = await actions.atualizarCobranca(charge.id, { descricao: form.descricao.trim() || null, valor, data_vencimento: form.data_vencimento });
    setSalvando(false);
    if (!r.ok) return addToast('error', r.error);
    addToast('success', 'Alterações salvas.');
    setEditar(false);
  };

  const removerUma = async () => {
    setSalvando(true);
    const r = await actions.excluirCobranca(charge.id);
    setSalvando(false);
    if (!r.ok) return addToast('error', r.error);
    addToast('success', 'Cobrança excluída.');
    nav.push('/dashboard/charges');
  };

  const removerSerie = async () => {
    setSalvando(true);
    const r = await actions.excluirSerie(charge.id);
    setSalvando(false);
    if (!r.ok) return addToast('error', r.error);
    addToast('success', `${r.removidas} ${r.removidas === 1 ? 'parcela excluída' : 'parcelas excluídas'}.`);
    nav.push('/dashboard/charges');
  };

  return (
    <div className="space-y-6 @2xl:space-y-8">
      <PageHero
        backHref="/dashboard/charges"
        backLabel="Cobranças"
        eyebrow={client.nome}
        title={charge.descricao || 'Cobrança'}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={abrirEdicao}>
              <Pencil />
              Editar
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setExcluir(true)} className="text-neg hover:bg-neg-soft hover:text-neg" aria-label="Excluir cobrança">
              <Trash2 />
            </Button>
          </>
        }
      />

      <div className="grid gap-6 @4xl:grid-cols-[1fr_360px] @4xl:items-start">
        <div className="min-w-0 space-y-6">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-strong relative overflow-hidden rounded-[32px]" aria-label="Detalhes da cobrança">
            <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b opacity-80', v.key === 'pago' ? 'from-pos-soft' : v.key === 'atrasado' ? 'from-neg-soft' : 'from-warn-soft/70')} aria-hidden />
            <Receipt className="pointer-events-none absolute -bottom-12 -right-8 size-64 rotate-[-12deg] text-ink/[0.03]" aria-hidden />
            <div className="relative p-6 @2xl:p-9">
              <Badge variant={v.variant} size="md" dot>
                {v.label}
              </Badge>
              <p className={cn('mt-4 truncate font-display text-[clamp(2.4rem,7cqw,4rem)] font-bold leading-none tracking-[-0.03em] tnum', v.key === 'atrasado' ? 'text-neg' : 'text-ink')}>{formatCurrency(aberta ? saldoAberto(charge) : Number(charge.valor))}</p>
              {charge.status === 'parcial' && <p className="mt-1 text-sm text-ink-3 tnum">restante de {formatCurrency(Number(charge.valor))}</p>}

              <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-dashed border-line pt-5 text-sm @2xl:grid-cols-3">
                <div>
                  <dt className="text-xs text-ink-3">Vencimento</dt>
                  <dd className={cn('mt-0.5 font-medium tnum', v.key === 'atrasado' ? 'text-neg' : 'text-ink')}>{formatDate(charge.data_vencimento)}</dd>
                </div>
                {charge.status === 'pago' && charge.data_pagamento ? (
                  <div>
                    <dt className="text-xs text-ink-3">Pago em</dt>
                    <dd className="mt-0.5 font-medium text-pos tnum">{formatDate(charge.data_pagamento)}</dd>
                  </div>
                ) : (
                  <div>
                    <dt className="text-xs text-ink-3">Lançada em</dt>
                    <dd className="mt-0.5 font-medium text-ink tnum">{formatDate(charge.created_at)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-ink-3">Tipo</dt>
                  <dd className="mt-0.5 font-medium text-ink">{charge.recorrente ? `Recorrente · ${periodicidade}` : 'Avulsa'}</dd>
                </div>
              </dl>

              {charge.status === 'pago' && Number(charge.dias_atraso) > 0 && (
                <p className="mt-4 text-sm text-ink-3">
                  Paga com {charge.dias_atraso} {charge.dias_atraso === 1 ? 'dia' : 'dias'} de atraso.
                </p>
              )}

              {aberta && (
                <div className="mt-7 grid gap-3 @2xl:grid-cols-2">
                  <Button size="xl" onClick={() => setPagar(true)}>
                    <CheckCircle2 />
                    Marcar como pago
                  </Button>
                  {!client.telefone ? (
                    <Button asChild size="xl" variant="secondary">
                      <WLink href={`/dashboard/clients/${client.id}?edit=true`}>
                        <Phone />
                        Adicionar WhatsApp
                      </WLink>
                    </Button>
                  ) : isPro ? (
                    <Button
                      size="xl"
                      variant="whatsapp"
                      onClick={() => {
                        setWhats(true);
                        onWhatsApp?.();
                      }}
                    >
                      <WhatsAppIcon />
                      Cobrar no WhatsApp
                    </Button>
                  ) : (
                    <Button asChild size="xl" variant="secondary">
                      <WLink href="/dashboard/upgrade">
                        <WhatsAppIcon />
                        Cobrar no WhatsApp
                        <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-2xs font-semibold text-brand-ink">PRO</span>
                      </WLink>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.section>

          {texto && (
            <Panel title="Mensagem pronta" hint="Você revisa no WhatsApp antes de enviar" icon={<WhatsAppIcon />} action={!isPro ? <Badge variant="primary">Pro</Badge> : undefined}>
              <div className="dot-grid rounded-2xl bg-surface-3 p-4">
                <p className={cn('ml-auto max-w-md whitespace-pre-line rounded-2xl rounded-tr-sm bg-brand-soft px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink shadow-xs', !isPro && 'select-none')}>{texto}</p>
              </div>
            </Panel>
          )}

          <Panel title="Histórico" eyebrow="Linha do tempo">
            <Timeline events={eventos} showLink={false} />
          </Panel>
        </div>

        <aside className="space-y-4 @4xl:sticky @4xl:top-24">
          <WLink href={`/dashboard/clients/${client.id}`} className="block">
            <GlassPanel className="rounded-[28px] p-5">
              <p className="eyebrow mb-3 text-[11px]">Cliente</p>
              <div className="flex items-center gap-3">
                <Avatar name={client.nome} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{client.nome}</p>
                  <p className="truncate text-sm text-ink-3">{client.telefone ? formatPhone(client.telefone) : 'Sem WhatsApp'}</p>
                </div>
                <ScoreRing score={summary.score.value} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line/70 pt-4 text-sm">
                <div className="min-w-0">
                  <p className="text-xs text-ink-3">Já pagou</p>
                  <p className="truncate font-semibold text-ink tnum">{formatCurrency(summary.pago)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-ink-3">Em atraso</p>
                  <p className={cn('truncate font-semibold tnum', summary.emAtraso > 0 ? 'text-neg' : 'text-ink')}>{formatCurrency(summary.emAtraso)}</p>
                </div>
              </div>
              <p className={cn('mt-3 text-xs font-medium', tom.text)}>{tom.label}</p>
            </GlassPanel>
          </WLink>

          {charge.recorrente && (
            <GlassPanel lift={false} className="rounded-[28px] p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
                  <Repeat className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Faz parte de uma série</p>
                  <p className="text-xs text-ink-3">Cobrança recorrente · {periodicidade}</p>
                </div>
              </div>
              <Button variant="danger-soft" size="sm" className="mt-4 w-full" onClick={() => setExcluirSerie(true)}>
                <Ban />
                Excluir parcelas pendentes
              </Button>
            </GlassPanel>
          )}
        </aside>
      </div>

      {pagar && <PaymentSheet charge={charge} open={pagar} onClose={() => setPagar(false)} />}
      {whats && <WhatsAppSheet charge={charge} open={whats} onClose={() => setWhats(false)} />}

      <Modal isOpen={editar} onClose={() => setEditar(false)} title="Editar cobrança" icon={<Pencil />} size="sm">
        <div className="space-y-4">
          <Input label="Descrição" placeholder="Ex.: Mensalidade de março" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
          <Input label="Valor" type="number" inputMode="decimal" step="0.01" min="0.01" prefix="R$" placeholder="0,00" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} />
          <Input label="Vencimento" type="date" value={form.data_vencimento} onChange={(e) => setForm((f) => ({ ...f, data_vencimento: e.target.value }))} />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setEditar(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} isLoading={salvando}>
              Salvar alterações
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={excluirSerie} onClose={() => setExcluirSerie(false)} title="Excluir parcelas pendentes?" description="As parcelas já pagas continuam no histórico. Essa ação não pode ser desfeita." icon={<Ban />} tone="danger" size="sm">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setExcluirSerie(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={removerSerie} isLoading={salvando}>
            Excluir parcelas pendentes
          </Button>
        </div>
      </Modal>

      <Modal isOpen={excluir} onClose={() => setExcluir(false)} title="Excluir esta cobrança?" description={`${formatCurrency(Number(charge.valor))} de ${client.nome}. Essa ação não pode ser desfeita.`} icon={<Trash2 />} tone="danger" size="sm">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setExcluir(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={removerUma} isLoading={salvando}>
            Excluir cobrança
          </Button>
        </div>
      </Modal>
    </div>
  );
}
