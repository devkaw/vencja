'use client';

import { useMemo, useState } from 'react';
import { addDays, addMonths, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, CalendarDays, Receipt, Repeat, Sparkles, UserPlus } from 'lucide-react';
import { Avatar } from '@/components/data/avatar';
import { EmptyState } from '@/components/data/empty-state';
import { GlassPanel } from '@/components/motion/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WLink, useWorkspace, useWorkspaceNav } from '@/components/workspace/workspace-context';
import { PLANS } from '@/lib/subscription';
import { useAppStore } from '@/lib/store';
import { cn, formatCurrency } from '@/lib/utils';
import { PageHero } from './kit/page-hero';

export function ChargeFormScreen() {
  const { clients, charges, isPro, actions } = useWorkspace();
  const nav = useWorkspaceNav();
  const addToast = useAppStore((s) => s.addToast);
  const [form, setForm] = useState({
    client_id: nav.params.get('client') || '',
    valor: '',
    data_vencimento: '',
    descricao: '',
    recorrente: false,
    periodicidade: 'mensal' as 'mensal' | 'quinzenal',
    quantidade_parcelas: 0,
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const definir = <K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => (e[campo] ? { ...e, [campo]: '' } : e));
  };

  const duplicada = useMemo(() => {
    const d = form.descricao.trim().toLowerCase();
    if (!d || !form.client_id) return false;
    return charges.some((c) => {
      if (c.client_id !== form.client_id) return false;
      const atual = (c.descricao || '').toLowerCase();
      return form.recorrente ? c.recorrente && c.periodicidade === form.periodicidade && atual.startsWith(d) : atual === d;
    });
  }, [charges, form.client_id, form.descricao, form.periodicidade, form.recorrente]);

  const parcelas = form.recorrente ? Math.min(60, form.quantidade_parcelas || 1) : 1;
  const maximo = PLANS.free.limits.maxCharges;
  const podeCriar = isPro || charges.length + parcelas <= maximo;

  const valorNum = parseFloat(form.valor) || 0;
  const primeira = form.data_vencimento ? parseISO(form.data_vencimento) : null;
  const dataDaParcela = (inicio: Date, i: number) => (form.periodicidade === 'quinzenal' ? addDays(inicio, 15 * i) : addMonths(inicio, i));
  const ultima = primeira && parcelas > 1 ? dataDaParcela(primeira, parcelas - 1) : null;
  const cliente = clients.find((c) => c.id === form.client_id);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const novos: Record<string, string> = {};
    if (!form.client_id) novos.client_id = 'Escolha o cliente';
    if (!valorNum || valorNum <= 0) novos.valor = 'Informe um valor maior que zero';
    if (!primeira) novos.data_vencimento = form.recorrente ? 'Informe o vencimento da 1ª parcela' : 'Informe a data de vencimento';
    if (duplicada) novos.descricao = 'Já existe uma cobrança com essa descrição para este cliente.';
    if (!podeCriar) novos.general = `Limite de cobranças atingido. O plano grátis permite até ${maximo} cobranças.`;
    setErros(novos);
    if (Object.values(novos).some(Boolean) || !primeira) return;

    setEnviando(true);
    const drafts = Array.from({ length: parcelas }, (_, i) => ({
      client_id: form.client_id,
      valor: valorNum,
      // Always offset from the first due date so short months don't shift the following ones.
      data_vencimento: format(dataDaParcela(primeira, i), 'yyyy-MM-dd'),
      descricao: parcelas > 1 ? `${form.descricao.trim() || 'Cobrança'} (${i + 1}/${parcelas})` : form.descricao.trim(),
      recorrente: form.recorrente,
      periodicidade: form.recorrente ? form.periodicidade : null,
    }));
    const r = await actions.criarCobrancas(drafts);
    setEnviando(false);
    if (!r.ok) {
      addToast('error', r.error);
      return;
    }
    addToast('success', parcelas > 1 ? `${parcelas} parcelas criadas.` : 'Cobrança criada.');
    nav.push('/dashboard/charges');
  };

  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <PageHero title="Nova cobrança" backHref="/dashboard/charges" backLabel="Cobranças" />
        <GlassPanel lift={false} className="rounded-[28px]">
          <EmptyState
            icon={<UserPlus />}
            title="Primeiro, cadastre um cliente"
            description="Toda cobrança pertence a alguém. Cadastre o cliente com nome e WhatsApp e volte aqui."
            action={
              <Button asChild>
                <WLink href="/dashboard/clients/new">
                  <UserPlus />
                  Cadastrar cliente
                </WLink>
              </Button>
            }
          />
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="space-y-6 @2xl:space-y-8">
      <PageHero eyebrow="Avulsa, parcelada ou recorrente" title="Nova" highlight="cobrança." backHref="/dashboard/charges" backLabel="Cobranças" />

      <form onSubmit={enviar} noValidate className="grid gap-6 @4xl:grid-cols-[1fr_360px] @4xl:items-start">
        <GlassPanel lift={false} className="space-y-5 rounded-[28px] p-5 @2xl:p-7">
          {erros.general && (
            <div className="flex gap-3 rounded-xl border border-neg/25 bg-neg-soft p-3.5 text-sm text-neg" role="alert">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {erros.general}
            </div>
          )}
          {!podeCriar && !erros.general && (
            <div className="flex flex-col gap-2 rounded-xl border border-warn/30 bg-warn-soft p-3.5 text-sm @2xl:flex-row @2xl:items-center @2xl:justify-between">
              <p className="text-warn">
                Com {parcelas} {parcelas === 1 ? 'cobrança' : 'parcelas'} você passaria do limite de {maximo} do plano grátis ({charges.length} usadas).
              </p>
              <WLink href="/dashboard/upgrade" className="shrink-0 font-semibold text-ink underline underline-offset-4">
                Ver o Pro
              </WLink>
            </div>
          )}

          <Select label="Cliente" value={form.client_id} onChange={(e) => definir('client_id', e.target.value)} options={[{ value: '', label: 'Escolha um cliente' }, ...clients.map((c) => ({ value: c.id, label: c.nome }))]} error={erros.client_id} />

          <div className="grid gap-5 @2xl:grid-cols-2">
            <Input label="Valor" type="number" inputMode="decimal" step="0.01" min="0.01" prefix="R$" placeholder="0,00" value={form.valor} onChange={(e) => definir('valor', e.target.value)} error={erros.valor} className="font-semibold tnum" />
            <Input label={form.recorrente ? 'Vencimento da 1ª parcela' : 'Vencimento'} type="date" value={form.data_vencimento} onChange={(e) => definir('data_vencimento', e.target.value)} error={erros.data_vencimento} />
          </div>

          <div>
            <Input label="Descrição (opcional)" placeholder="Ex.: Mensalidade de março, conserto do portão" value={form.descricao} onChange={(e) => definir('descricao', e.target.value)} error={erros.descricao} hint="Aparece na mensagem de cobrança do WhatsApp." />
            {duplicada && !erros.descricao && <p className="mt-1.5 text-sm text-neg">Já existe uma cobrança com essa descrição para este cliente.</p>}
          </div>

          <div className={cn('rounded-2xl border p-4 transition-colors', form.recorrente ? 'border-brand-500/30 bg-brand-soft/40' : 'border-line bg-surface/60')}>
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="recorrente" className="flex cursor-pointer items-start gap-3">
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', form.recorrente ? 'bg-brand-600 text-white' : 'bg-surface-3 text-ink-3')}>
                  <Repeat className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">Parcelar ou repetir</span>
                  <span className="block text-xs text-ink-3">Cria várias cobranças de uma vez, com vencimentos em sequência.</span>
                </span>
              </label>
              <Switch id="recorrente" checked={form.recorrente} onCheckedChange={(v) => definir('recorrente', v)} />
            </div>
            {form.recorrente && (
              <div className="mt-4 grid gap-4 border-t border-brand-500/15 pt-4 @2xl:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-ink-2">Frequência</p>
                  <Segmented
                    aria-label="Frequência"
                    value={form.periodicidade}
                    onChange={(v) => definir('periodicidade', v)}
                    options={[
                      { value: 'mensal', label: 'Mensal' },
                      { value: 'quinzenal', label: 'Quinzenal' },
                    ]}
                    className="w-full [&>button]:flex-1"
                  />
                </div>
                <div>
                  <Input label="Quantidade de parcelas" type="number" inputMode="numeric" min="0" max="60" placeholder="Ex.: 12" value={form.quantidade_parcelas || ''} onChange={(e) => definir('quantidade_parcelas', Math.min(60, parseInt(e.target.value) || 0))} />
                  <div className="mt-2 flex gap-1.5">
                    {[3, 6, 12].map((n) => (
                      <button key={n} type="button" onClick={() => definir('quantidade_parcelas', n)} className={cn('h-9 rounded-lg px-3 text-xs font-medium transition-colors', form.quantidade_parcelas === n ? 'bg-ink text-canvas' : 'bg-surface text-ink-2 ring-1 ring-line hover:ring-line-strong')}>
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-line/70 pt-5 @2xl:flex-row @2xl:justify-end">
            <Button asChild variant="ghost" type="button">
              <WLink href="/dashboard/charges">Cancelar</WLink>
            </Button>
            <Button type="submit" size="lg" isLoading={enviando} disabled={!podeCriar || enviando}>
              {!podeCriar ? 'Limite do plano atingido' : parcelas > 1 ? `Criar ${parcelas} parcelas` : 'Criar cobrança'}
            </Button>
          </div>
        </GlassPanel>

        <aside className="@4xl:sticky @4xl:top-24" aria-label="Resumo da cobrança">
          <GlassPanel strong lift={false} className="rounded-[28px] p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
            <p className="eyebrow relative mb-5">
              <Receipt className="size-3.5" />
              Recibo ao vivo
            </p>
            <div className="relative flex items-center gap-3">
              <Avatar name={cliente?.nome || '?'} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{cliente?.nome || 'Nenhum cliente escolhido'}</p>
                <p className="truncate text-sm text-ink-3">{form.descricao || 'Sem descrição'}</p>
              </div>
            </div>
            <div className="relative mt-5 border-t border-dashed border-line pt-5">
              <p className="text-xs text-ink-3">{parcelas > 1 ? `${parcelas} parcelas de` : 'Valor'}</p>
              <p className="truncate font-display text-4xl font-semibold tracking-tight text-ink tnum">{formatCurrency(valorNum)}</p>
              {parcelas > 1 && valorNum > 0 && <p className="mt-1 text-sm text-ink-3 tnum">Total de {formatCurrency(valorNum * parcelas)}</p>}
            </div>
            <div className="relative mt-4 flex items-start gap-2.5 rounded-2xl bg-surface/70 p-3 text-sm">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-ink-3" />
              <p className="text-ink-2">
                {!primeira
                  ? 'Escolha a data de vencimento.'
                  : ultima
                    ? `De ${format(primeira, "d 'de' MMM", { locale: ptBR })} a ${format(ultima, "d 'de' MMM 'de' yyyy", { locale: ptBR })}, ${form.periodicidade === 'quinzenal' ? 'a cada 15 dias' : 'todo mês'}.`
                    : `Vence em ${format(primeira, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}.`}
              </p>
            </div>
            {!isPro && (
              <p className="relative mt-4 flex items-center gap-1.5 text-xs text-ink-3">
                <Sparkles className="size-3.5 text-brand-ink" />
                {Math.max(0, maximo - charges.length)} de {maximo} cobranças disponíveis no plano grátis
              </p>
            )}
          </GlassPanel>
        </aside>
      </form>
    </div>
  );
}
