'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, MessageSquare, Clock, Edit, Trash2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, formatPhone, calcularDiasAtraso, isVencido, gerarLinkWhatsApp, calcularScore } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { hasPremiumAccess, canUsePartialPayment } from '@/lib/subscription';
import type { Charge, Client, Profile } from '@/types';

export default function ChargeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [charge, setCharge] = useState<Charge | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [markAsPaidModal, setMarkAsPaidModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<string>('');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteRelatedModal, setDeleteRelatedModal] = useState(false);
  const [editForm, setEditForm] = useState({
    descricao: '',
    valor: '',
    data_vencimento: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const { addToast } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: chargeData, error: chargeError } = await supabase
        .from('charges')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single();

      if (chargeError || !chargeData) {
        addToast('error', 'Cobrança não encontrada');
        router.push('/dashboard/charges');
        return;
      }

      const [clientRes, profileRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('id', chargeData.client_id)
          .single(),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
      ]);

      setCharge(chargeData);
      setClient(clientRes.data);
      setProfile(profileRes.data);
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'VenceJa');
      setIsLoading(false);
    }

    loadData();
  }, [resolvedParams.id]);

  const handleMarkAsPaid = async () => {
    if (!charge || !client || isPaying) return;

    const valorPendente = Number(charge.valor) - Number(charge.valor_pago || 0);
    const valorRecebido = isPartialPayment && canUsePartialPayment(profile)
      ? Math.round(parseFloat(partialPaymentAmount) * 100) / 100
      : valorPendente;

    if (isNaN(valorRecebido) || valorRecebido <= 0) {
      addToast('error', 'Valor inválido');
      return;
    }

    if (valorRecebido > valorPendente) {
      addToast('error', 'Valor não pode exceder o valor pendente');
      return;
    }

    if (!paymentDate) {
      addToast('error', 'Informe a data do pagamento');
      return;
    }

    setIsPaying(true);

    const diasAtraso = Math.max(0, differenceInCalendarDays(parseISO(paymentDate), parseISO(charge.data_vencimento)));
    const ehPagamentoParcial = valorRecebido < valorPendente;
    const valorJaPago = Number(charge.valor_pago || 0);
    let restanteId: string | null = null;

    if (ehPagamentoParcial) {
      // Create the remainder first: if anything fails afterwards it is removed again,
      // so the original charge is never lost.
      const { data: restante, error: restanteError } = await supabase
        .from('charges')
        .insert({
          user_id: charge.user_id,
          client_id: charge.client_id,
          valor: Math.round((valorPendente - valorRecebido) * 100) / 100,
          valor_pago: 0,
          data_vencimento: charge.data_vencimento,
          status: 'pendente',
          descricao: `${charge.descricao || 'Cobrança'} (restante)`,
          recorrente: charge.recorrente,
          periodicidade: charge.recorrente ? charge.periodicidade : null,
          charge_original_id: charge.charge_original_id || charge.id,
        })
        .select('id')
        .single();

      if (restanteError || !restante) {
        addToast('error', 'Erro ao registrar pagamento parcial');
        setIsPaying(false);
        return;
      }
      restanteId = restante.id;
    }

    // The status guard makes a second submit a no-op instead of a duplicate payment.
    const { data: updated, error: chargeError } = await supabase
      .from('charges')
      .update(ehPagamentoParcial
        ? {
            valor: valorJaPago + valorRecebido,
            valor_pago: valorJaPago + valorRecebido,
            status: 'pago',
            data_pagamento: paymentDate,
            dias_atraso: diasAtraso,
            descricao: `${charge.descricao || 'Cobrança'} (parcial)`,
          }
        : {
            valor_pago: Number(charge.valor),
            status: 'pago',
            data_pagamento: paymentDate,
            dias_atraso: diasAtraso,
          })
      .eq('id', charge.id)
      .neq('status', 'pago')
      .select('*')
      .maybeSingle();

    if (chargeError || !updated) {
      if (restanteId) {
        await supabase.from('charges').delete().eq('id', restanteId);
      }
      addToast('error', chargeError ? 'Erro ao registrar pagamento' : 'Esta cobrança já estava paga');
      setIsPaying(false);
      setMarkAsPaidModal(false);
      return;
    }

    await supabase.from('payments').insert({
      user_id: charge.user_id,
      charge_id: charge.id,
      valor: valorRecebido,
      data_pagamento: paymentDate,
    });

    const clienteAtualizado = await recalcularCliente(client.id);

    setCharge(updated);
    if (clienteAtualizado) setClient(clienteAtualizado);
    setMarkAsPaidModal(false);
    setIsPartialPayment(false);
    setPartialPaymentAmount('');
    setIsPaying(false);
    addToast('success', ehPagamentoParcial
      ? `Pagamento parcial de ${formatCurrency(valorRecebido)} registrado! O restante virou uma nova cobrança.`
      : 'Pagamento registrado!');
  };

  const handleOpenEditModal = () => {
    if (!charge) return;
    setEditForm({
      descricao: charge.descricao || '',
      valor: String(charge.valor),
      data_vencimento: charge.data_vencimento.split('T')[0],
    });
    setEditModal(true);
  };

  const recalcularCliente = async (clientId: string): Promise<Client | null> => {
    const { data: allCharges } = await supabase
      .from('charges')
      .select('*')
      .eq('client_id', clientId);

    const overdueCharges = (allCharges || []).filter((c: any) => {
      const valorPendente = Number(c.valor) - Number(c.valor_pago || 0);
      return valorPendente > 0 && isVencido(c.data_vencimento) && c.status !== 'pago';
    });
    const totalAtrasado = overdueCharges.reduce((sum: number, c: any) => {
      const valorPendente = Number(c.valor) - Number(c.valor_pago || 0);
      return sum + valorPendente;
    }, 0);
    const totalPago = (allCharges || []).reduce((sum: number, c: any) => sum + Number(c.valor_pago || 0), 0);
    const novoScore = calcularScore(allCharges || []);

    const { data } = await supabase
      .from('clients')
      .update({
        total_atrasado: totalAtrasado,
        total_pago: totalPago,
        score: novoScore,
      })
      .eq('id', clientId)
      .select('*')
      .maybeSingle();

    return data;
  };

  const handleEditCharge = async () => {
    if (!charge) return;
    
    const valorNovo = parseFloat(editForm.valor);
    
    if (isNaN(valorNovo) || valorNovo <= 0) {
      addToast('error', 'Valor inválido');
      return;
    }

    if (!editForm.data_vencimento) {
      addToast('error', 'Data de vencimento é obrigatória');
      return;
    }

    setIsSaving(true);

    const updateData: any = {
      descricao: editForm.descricao.trim() || null,
      valor: valorNovo,
      data_vencimento: editForm.data_vencimento,
    };

    const { data: updated, error } = await supabase
      .from('charges')
      .update(updateData)
      .eq('id', charge.id)
      .select('*')
      .single();

    if (error || !updated) {
      addToast('error', 'Erro ao editar cobrança');
      setIsSaving(false);
      return;
    }

    setCharge(updated);
    if (client) {
      const clienteAtualizado = await recalcularCliente(client.id);
      if (clienteAtualizado) setClient(clienteAtualizado);
    }

    addToast('success', 'Cobrança editada com sucesso!');
    setEditModal(false);
    setIsSaving(false);
  };

  const handleDeleteCharge = async () => {
    if (!charge || !client) return;

    setIsDeleting(true);

    const { error } = await supabase
      .from('charges')
      .delete()
      .eq('id', charge.id);

    if (error) {
      addToast('error', 'Erro ao excluir cobrança');
      setIsDeleting(false);
      return;
    }

    await recalcularCliente(client.id);

    addToast('success', 'Cobrança excluída!');
    setDeleteModal(false);
    setIsDeleting(false);
    router.push('/dashboard/charges');
  };

  const handleDeleteAllRelated = async () => {
    if (!charge || !client) return;

    setIsDeletingAll(true);

    const stripParcela = (descricao: string | null) =>
      (descricao || '').replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
    const raiz = charge.charge_original_id || charge.id;
    const descricaoBase = stripParcela(charge.descricao);

    const { data: clientCharges } = await supabase
      .from('charges')
      .select('*')
      .eq('user_id', charge.user_id)
      .eq('client_id', charge.client_id);

    // Same group = linked by charge_original_id. Older charges have no link, so they fall
    // back to an exact match of the description without the "(i/N)" suffix.
    const pendentes = (clientCharges || []).filter((c: any) => {
      if (c.status === 'pago') return false;
      if (c.id === raiz || c.charge_original_id === raiz) return true;
      return Boolean(descricaoBase) && c.recorrente && stripParcela(c.descricao) === descricaoBase;
    });

    if (pendentes.length > 0) {
      const { error } = await supabase
        .from('charges')
        .delete()
        .in('id', pendentes.map((c: any) => c.id));

      if (error) {
        addToast('error', 'Erro ao excluir parcelas');
        setIsDeletingAll(false);
        return;
      }

      await recalcularCliente(client.id);
    }

    addToast('success', `${pendentes.length} parcela(s) excluída(s)!`);
    setDeleteRelatedModal(false);
    setIsDeletingAll(false);
    router.push('/dashboard/charges');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!charge || !client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cobrança não encontrada</p>
        <Link href="/dashboard/charges">
          <Button variant="outline" className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  const vencido = isVencido(charge.data_vencimento) && charge.status === 'pendente';
  const diasAtraso = charge.dias_atraso || calcularDiasAtraso(charge.data_vencimento);
  const valorPendente = Number(charge.valor) - Number(charge.valor_pago || 0);
  const podeFazerPagamentoParcial = canUsePartialPayment(profile) && charge.status !== 'pago';

  return (
    <div className="space-y-4 sm:space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/dashboard/charges">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg sm:text-2xl font-extralight truncate max-w-[150px] sm:max-w-none">{charge.descricao || 'Cobrança'}</h1>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenEditModal} className="p-2">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteModal(true)} className="text-danger hover:text-danger p-2">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-8">
          <div className="text-center mb-4 sm:mb-8">
            <p className={`text-3xl sm:text-5xl font-extralight ${charge.status === 'pago' ? 'text-primary' : vencido ? 'text-danger' : ''}`}>
              {charge.status === 'parcial' ? formatCurrency(valorPendente) : formatCurrency(Number(charge.valor))}
            </p>
            {charge.status === 'parcial' && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                de {formatCurrency(Number(charge.valor))} total
              </p>
            )}
            <div className="space-y-1 mt-2">
              {charge.status === 'pago' && charge.data_pagamento && (
                <p className={`text-sm sm:text-lg ${charge.status === 'pago' ? 'text-primary/70' : ''}`}>
                  <span className="text-gray-500">Venceu em: </span>
                  <span className={vencido ? 'text-danger' : ''}>{formatDate(charge.data_vencimento)}</span>
                </p>
              )}
              <p className={`text-sm sm:text-lg ${charge.status === 'pago' ? 'text-primary/70' : vencido ? 'text-danger/70' : 'text-gray-500'}`}>
                {charge.status === 'pago' ? `Pago em ${formatDate(charge.data_pagamento!)}` : `Vence ${formatDate(charge.data_vencimento)}`}
              </p>
            </div>
          </div>

          <div className="flex justify-center mb-4 sm:mb-6">
            {charge.status === 'pago' ? (
              <Badge variant="success" className="text-xs sm:text-sm px-3 sm:px-4 py-1">Pago</Badge>
            ) : charge.status === 'parcial' ? (
              <Badge variant="warning" className="text-xs sm:text-sm px-3 sm:px-4 py-1">Parcial</Badge>
            ) : vencido ? (
              <Badge variant="danger" className="text-xs sm:text-sm px-3 sm:px-4 py-1">{diasAtraso}d atraso</Badge>
            ) : (
              <Badge variant="default" className="text-xs sm:text-sm px-3 sm:px-4 py-1">A Vencer</Badge>
            )}
          </div>

          {charge.status === 'pendente' && (
            <Button size="lg" className="w-full mb-3 sm:mb-4" onClick={() => setMarkAsPaidModal(true)}>
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Marcar como Pago
            </Button>
          )}

          {vencido && client.telefone && (
            hasPremiumAccess(profile) ? (
              <a
                href={gerarLinkWhatsApp(
                  client.nome,
                  client.telefone,
                  Number(charge.valor),
                  charge.data_vencimento,
                  'atrasado',
                  charge.descricao || undefined,
                  userName
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 sm:py-4 bg-accent hover:bg-accent/90 text-black rounded-lg font-light text-sm sm:text-base"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                Cobrar via WhatsApp
              </a>
            ) : (
              <Link href="/dashboard/upgrade" className="flex items-center justify-center gap-2 w-full px-4 py-3 sm:py-4 bg-accent hover:bg-accent/90 text-black rounded-lg font-light text-sm sm:text-base">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                Cobrar via WhatsApp
              </Link>
            )
          )}

          {!vencido && charge.status === 'pendente' && client.telefone && (
            hasPremiumAccess(profile) ? (
              <a
                href={gerarLinkWhatsApp(
                  client.nome,
                  client.telefone,
                  Number(charge.valor),
                  charge.data_vencimento,
                  'pendente',
                  charge.descricao || undefined,
                  userName
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 sm:py-4 bg-accent hover:bg-accent/90 text-black rounded-lg font-light text-sm sm:text-base"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                Cobrar via WhatsApp
              </a>
            ) : (
              <Link href="/dashboard/upgrade" className="flex items-center justify-center gap-2 w-full px-4 py-3 sm:py-4 bg-accent hover:bg-accent/90 text-black rounded-lg font-light text-sm sm:text-base">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                Cobrar via WhatsApp
              </Link>
            )
          )}
        </CardContent>
      </Card>

      <Link href={`/dashboard/clients/${client.id}`}>
        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="p-3 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-extralight text-primary">
                    {client.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-base sm:text-lg font-light">{client.nome}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{client.telefone ? formatPhone(client.telefone) : 'Sem telefone'}</p>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-extralight ${
                client.score >= 80 ? 'bg-primary/10 text-primary' :
                client.score >= 60 ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                'bg-danger/10 text-danger'
              }`}>
                Score: {client.score}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {charge.recorrente && (
        <Card>
          <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                Cobrança recorrente - {charge.periodicidade === 'semanal' ? 'Semanal' : charge.periodicidade === 'quinzenal' ? 'Quinzenal' : 'Mensal'}
              </span>
            </div>
            <button
              onClick={() => setDeleteRelatedModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-light text-danger hover:bg-danger/10 rounded-lg transition-colors"
            >
              <Ban className="w-3 h-3" />
              Excluir todas
            </button>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={markAsPaidModal}
        onClose={() => {
          setMarkAsPaidModal(false);
          setIsPartialPayment(false);
          setPartialPaymentAmount('');
        }}
        title="Marcar como Pago"
        size="sm"
      >
        <div className="space-y-6">
          {charge.status === 'parcial' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Esta cobrança já possui um pagamento parcial de{' '}
                <strong>{formatCurrency(Number(charge.valor_pago))}</strong>.
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                Valor restante: <strong>{formatCurrency(valorPendente)}</strong>
              </p>
            </div>
          )}

          {!isPartialPayment && podeFazerPagamentoParcial && (
            <button
              type="button"
              onClick={() => {
                setIsPartialPayment(true);
                setPartialPaymentAmount(valorPendente.toFixed(2));
              }}
              className="w-full p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-light text-amber-900 dark:text-amber-100">Pagamento Parcial</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">Receber apenas uma parte</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-amber-200 dark:bg-amber-800/50 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-700 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          )}

          {isPartialPayment && (
            <div className="space-y-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-light text-amber-900 dark:text-amber-100">Pagamento Parcial</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPartialPayment(false);
                    setPartialPaymentAmount('');
                  }}
                  className="px-3 py-1.5 text-xs font-light text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
              <Input
                label="Valor a receber"
                type="number"
                step="0.01"
                min="0.01"
                max={valorPendente.toFixed(2)}
                placeholder="0,00"
                value={partialPaymentAmount}
                onChange={(e) => setPartialPaymentAmount(e.target.value)}
              />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Restante: <strong>{formatCurrency(valorPendente - (parseFloat(partialPaymentAmount) || 0))}</strong>
              </p>
            </div>
          )}

          {!isPartialPayment && (
            <p className="text-lg">
              Confirmar pagamento de <strong>{formatCurrency(valorPendente)}</strong>?
            </p>
          )}

          <Input
            label="Data do Pagamento"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button size="lg" variant="ghost" onClick={() => {
              setMarkAsPaidModal(false);
              setIsPartialPayment(false);
              setPartialPaymentAmount('');
            }}>
              Cancelar
            </Button>
            <Button size="lg" onClick={handleMarkAsPaid} isLoading={isPaying} disabled={isPaying}>
              {isPartialPayment ? 'Registrar Pagamento Parcial' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Editar Cobrança"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Descrição"
            placeholder="Ex: Mensalidade Janeiro"
            value={editForm.descricao}
            onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))}
          />
          <Input
            label="Valor"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={editForm.valor}
            onChange={(e) => setEditForm(prev => ({ ...prev, valor: e.target.value }))}
          />
          <Input
            label="Data de Vencimento"
            type="date"
            value={editForm.data_vencimento}
            onChange={(e) => setEditForm(prev => ({ ...prev, data_vencimento: e.target.value }))}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setEditModal(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleEditCharge} isLoading={isSaving}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteRelatedModal}
        onClose={() => setDeleteRelatedModal(false)}
        title="Excluir Todas as Parcelas"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-center">
            Tem certeza que deseja excluir <strong>todas</strong> as parcelas pendentes deste grupo?
          </p>
          <p className="text-sm text-gray-500 text-center">
            As parcelas já pagas serão mantidas. Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteRelatedModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteAllRelated} isLoading={isDeletingAll}>
              Excluir Todas
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Excluir Cobrança"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-center">
            Tem certeza que deseja excluir esta cobrança de{' '}
            <strong>{formatCurrency(Number(charge.valor))}</strong>?
          </p>
          <p className="text-sm text-gray-500 text-center">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteCharge} isLoading={isDeleting}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
