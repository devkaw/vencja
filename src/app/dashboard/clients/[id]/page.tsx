'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit, MessageSquare, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, formatPhone, calcularDiasAtraso, isVencido, gerarLinkWhatsAppCobranca, calcularScore } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import type { Client, Charge } from '@/types';

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({ nome: '', email: '', telefone: '' });
  const router = useRouter();
  const { addToast } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const searchParams = new URLSearchParams(window.location.search);
      const shouldEdit = searchParams.get('edit') === 'true';

      const [clientRes, chargesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('id', resolvedParams.id)
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('charges')
          .select('*')
          .eq('client_id', resolvedParams.id)
          .eq('user_id', user.id)
          .order('data_vencimento', { ascending: false }),
      ]);

      if (!clientRes.data) {
        addToast('error', 'Cliente não encontrado');
        router.push('/dashboard/clients');
        return;
      }

      const allCharges = chargesRes.data || [];
      const overdueCharges = allCharges.filter((c: any) => isVencido(c.data_vencimento) && c.status === 'pendente');
      const totalAtrasado = overdueCharges.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
      const novoScore = calcularScore(allCharges);

      await supabase
        .from('clients')
        .update({
          total_atrasado: totalAtrasado,
          score: novoScore,
        })
        .eq('id', resolvedParams.id);

      const { data: clientAtualizado } = await supabase
        .from('clients')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      setClient(clientAtualizado?.data || clientRes.data);
      setCharges(allCharges);
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'VenceJa');
      setEditForm({
        nome: clientAtualizado?.data?.nome || clientRes.data.nome,
        email: clientAtualizado?.data?.email || clientRes.data.email || '',
        telefone: clientAtualizado?.data?.telefone || clientRes.data.telefone || '',
      });
      setIsEditing(shouldEdit);
      setIsLoading(false);
    }

    loadData();
  }, [resolvedParams.id]);

  const handleSaveEdit = async () => {
    if (!client) return;

    let telefoneFormatado = editForm.telefone.replace(/\D/g, '');
    if (telefoneFormatado && !telefoneFormatado.startsWith('55')) {
      telefoneFormatado = '55' + telefoneFormatado;
    }

    const { error } = await supabase
      .from('clients')
      .update({
        nome: editForm.nome.trim(),
        email: editForm.email.trim() || null,
        telefone: telefoneFormatado || null,
      })
      .eq('id', client.id);

    if (error) {
      addToast('error', 'Erro ao atualizar');
      return;
    }

    setClient(prev => prev ? { ...prev, ...editForm } : null);
    setIsEditing(false);
    addToast('success', 'Cliente atualizado');
  };

  const handleDelete = async () => {
    if (!client) return;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', client.id);

    if (error) {
      addToast('error', 'Erro ao excluir');
      return;
    }

      addToast('success', 'Cliente excluído');
    router.push('/dashboard/clients');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cliente não encontrado</p>
        <Link href="/dashboard/clients">
          <Button variant="outline" className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  const unpaidCharges = charges.filter(c => c.status === 'pendente');
  const overdueCharges = unpaidCharges.filter(c => isVencido(c.data_vencimento));
  const pendingCharges = unpaidCharges.filter(c => !isVencido(c.data_vencimento));
  const paidCharges = charges.filter(c => c.status === 'pago');
  
  const chargesToCobrar = unpaidCharges.filter(c => {
    if (isVencido(c.data_vencimento)) return true;
    const daysUntil = Math.ceil((new Date(c.data_vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3;
  });

  return (
    <div className="space-y-4 sm:space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold truncate">{client.nome}</h1>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="p-2">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteModal(true)} className="text-danger p-2">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <Input label="Nome" value={editForm.nome} onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))} />
            <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
            <Input label="Telefone" value={editForm.telefone} onChange={(e) => setEditForm(prev => ({ ...prev, telefone: e.target.value }))} />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSaveEdit}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold text-primary">{client.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-lg sm:text-xl font-semibold">{client.nome}</p>
                    <p className="text-gray-500 text-sm">{client.email || 'Sem email'}</p>
                    <p className="text-xs sm:text-sm text-gray-400">{client.telefone ? formatPhone(client.telefone) : 'Sem telefone'}</p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-base sm:text-lg font-bold ${
                    client.score >= 80 ? 'bg-primary/10 text-primary' :
                    client.score >= 60 ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                    'bg-danger/10 text-danger'
                  }`}>
                    {client.score}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{formatCurrency(Number(client.total_pago))}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Total Pago</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-danger">{formatCurrency(Number(client.total_atrasado))}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Em Atraso</p>
                </div>
              </div>

              {chargesToCobrar.length > 0 && client.telefone && (
                <a
                  href={gerarLinkWhatsAppCobranca(client.nome, client.telefone, chargesToCobrar.map(c => ({
                    valor: Number(c.valor),
                    vencimento: c.data_vencimento,
                    status: isVencido(c.data_vencimento) ? 'atrasado' : 'vencendo',
                    descricao: c.descricao || undefined
                  })), userName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 sm:py-4 bg-primary hover:bg-primary/90 text-white rounded-lg mt-4 sm:mt-6 font-medium text-sm sm:text-base"
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  Cobrar Pendências via WhatsApp ({chargesToCobrar.length})
                </a>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold">Cobranças</h2>
            <Link href={`/dashboard/charges/new?client=${client.id}`}>
              <Button size="sm" className="text-xs sm:text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Nova
              </Button>
            </Link>
          </div>

          {overdueCharges.length > 0 && (
            <Card className="border-danger/30">
              <CardContent className="p-0">
                <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold text-danger text-sm sm:text-base">Em Atraso ({overdueCharges.length})</h3>
                </div>
                {overdueCharges.map((charge) => {
                  const diasAtraso = charge.dias_atraso || calcularDiasAtraso(charge.data_vencimento);
                  return (
                    <Link key={charge.id} href={`/dashboard/charges/${charge.id}`} className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#000000]/50 last:border-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-danger/10 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-danger" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-danger text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">{charge.descricao || 'Cobrança'}</p>
                          <p className="text-[10px] sm:text-xs text-danger/70">{diasAtraso}d atrasado</p>
                        </div>
                      </div>
                      <p className="font-bold text-danger text-sm sm:text-base">{formatCurrency(Number(charge.valor))}</p>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {pendingCharges.length > 0 && (
            <Card className="border-orange-500/30">
              <CardContent className="p-0">
                <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold text-orange-500 text-sm sm:text-base">A Vencer ({pendingCharges.length})</h3>
                </div>
                {pendingCharges.map((charge) => (
                  <Link key={charge.id} href={`/dashboard/charges/${charge.id}`} className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#000000]/50 last:border-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-orange-500 text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">{charge.descricao || 'Cobrança'}</p>
                        <p className="text-[10px] sm:text-xs text-orange-500/70">Vence {formatDate(charge.data_vencimento)}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-orange-500 text-sm sm:text-base">{formatCurrency(Number(charge.valor))}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-accent/30">
            <CardContent className="p-0">
              <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-accent text-sm sm:text-base">Pagas ({paidCharges.length})</h3>
              </div>
              {paidCharges.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-xs sm:text-sm text-gray-500">Nenhuma cobrança paga</div>
              ) : (
                paidCharges.map((charge) => (
                  <Link key={charge.id} href={`/dashboard/charges/${charge.id}`} className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#000000]/50 last:border-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-accent text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">{charge.descricao || 'Cobrança'}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">Pago {formatDate(charge.data_pagamento!)}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-accent text-sm sm:text-base">{formatCurrency(Number(charge.valor))}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir Cliente" size="sm">
        <p className="mb-6">Excluir <strong>{client.nome}</strong>?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
