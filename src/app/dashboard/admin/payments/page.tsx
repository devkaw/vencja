'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

interface PaymentRequestDisplay {
  id: string;
  user_id: string;
  email: string;
  status: string;
  comprovante_url: string | null;
  created_at: string;
}

export default function AdminPaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequestDisplay[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequestDisplay | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data: requestsData } = await supabase
      .from('payment_requests')
      .select('id, user_id, status, comprovante_url, created_at')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    const requestsWithEmail: PaymentRequestDisplay[] = [];
    
    for (const req of (requestsData || [])) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', req.user_id)
        .single();
      
      requestsWithEmail.push({
        ...req,
        email: userProfile?.email || 'Email nao encontrado'
      });
    }

    setRequests(requestsWithEmail);
    setIsLoading(false);
  }

  const handleApprove = async (request: PaymentRequestDisplay) => {
    if (!confirm(`Aprovar pagamento de ${request.email}?`)) return;
    
    setIsProcessing(true);

    const { error: error1 } = await supabase
      .from('payment_requests')
      .update({ status: 'aprovado' })
      .eq('id', request.id);

    if (error1) {
      addToast('error', `Erro ao atualizar pagamento: ${error1.message}`);
      setIsProcessing(false);
      return;
    }

    const { error: error2 } = await supabase
      .from('profiles')
      .update({ 
        plano: 'pro',
        acesso_vitalicio: true,
        status_pagamento: 'aprovado'
      })
      .eq('id', request.user_id);

    if (error2) {
      addToast('error', `Erro ao atualizar perfil: ${error2.message}`);
      setIsProcessing(false);
      return;
    }

    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: request.user_id,
        type: 'success',
        title: 'Pagamento aprovado!',
        message: 'Seu pagamento foi aprovado. Agora você tem acesso completo ao VenceJa!',
        link: '/dashboard'
      })
    });

    addToast('success', 'Pagamento aprovado!');
    setRequests(prev => prev.filter(r => r.id !== request.id));
    setSelectedRequest(null);
    setIsProcessing(false);
  };

  const handleReject = async (request: PaymentRequestDisplay) => {
    if (!confirm(`Rejeitar pagamento de ${request.email}?`)) return;
    
    setIsProcessing(true);

    const { error: error1 } = await supabase
      .from('payment_requests')
      .delete()
      .eq('id', request.id);

    if (error1) {
      addToast('error', `Erro: ${error1.message}`);
      setIsProcessing(false);
      return;
    }

    const { error: error2 } = await supabase
      .from('profiles')
      .update({ 
        plano: 'free',
        status_pagamento: 'rejeitado'
      })
      .eq('id', request.user_id);

    if (error2) {
      addToast('error', `Erro ao atualizar perfil: ${error2.message}`);
      setIsProcessing(false);
      return;
    }

    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: request.user_id,
        type: 'danger',
        title: 'Pagamento rejeitado',
        message: 'Seu pagamento foi rejeitado. Por favor, envie um novo comprovante.',
        link: '/dashboard/upgrade'
      })
    });

    addToast('info', 'Pagamento rejeitado!');
    setRequests(prev => prev.filter(r => r.id !== request.id));
    setSelectedRequest(null);
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
            <p className="text-gray-500 mb-6">Esta area e exclusiva para administradores.</p>
            <Link href="/dashboard"><Button>Voltar ao Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Gerenciar solicitacoes de pagamento</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Badge variant="default" className="text-xs sm:text-sm">{requests.length} pendente{requests.length !== 1 ? 's' : ''}</Badge>
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs sm:text-sm">Atualizar</Button>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-bold mb-2">Nenhuma solicitacao pendente</h2>
            <p className="text-gray-500 text-sm">Todos os pagamentos foram analisados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning-500/10 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-warning-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium flex items-center gap-2 text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{request.email}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {formatDate(request.created_at)} | {request.comprovante_url ? 'Comprovante OK' : 'Sem comprovante'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <Button onClick={() => setSelectedRequest(request)} variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm p-2 sm:p-0">
                      Ver
                    </Button>
                    <Button onClick={() => handleApprove(request)} variant="primary" size="sm" disabled={isProcessing} className="text-xs sm:text-sm">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Aprovar
                    </Button>
                    <Button onClick={() => handleReject(request)} variant="danger" size="sm" disabled={isProcessing} className="text-xs sm:text-sm">
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Detalhes" size="md">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-sm sm:text-base">{selectedRequest.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-medium text-sm sm:text-base">{formatDate(selectedRequest.created_at)}</p>
              </div>
            </div>
            {selectedRequest.comprovante_url && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Comprovante</p>
                <a href={selectedRequest.comprovante_url} target="_blank" className="text-primary underline text-sm sm:text-base">
                  Abrir imagem
                </a>
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button variant="ghost" onClick={() => setSelectedRequest(null)} className="w-full sm:w-auto text-sm">Fechar</Button>
              <Button variant="danger" onClick={() => selectedRequest && handleReject(selectedRequest)} disabled={isProcessing} className="w-full sm:w-auto text-sm">
                Rejeitar
              </Button>
              <Button className="bg-primary w-full sm:w-auto text-sm" onClick={() => selectedRequest && handleApprove(selectedRequest)} disabled={isProcessing}>
                Aprovar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
