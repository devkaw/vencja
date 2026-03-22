'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, CreditCard, Infinity, CheckCircle, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { hasPremiumAccess } from '@/lib/subscription';
import type { Profile } from '@/types';

const PIX_KEY = '00020101021126650014br.gov.bcb.pix0111097354445770228Pagamento Vitalicio  VenceJa5204000053039865406297.005802BR5916KADU A WANDERLEY6008SALVADOR62070503***6304C7AE';
const PLAN_PRICE = 297;

export default function UpgradePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const { addToast } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);

      const { data: pendingRequest } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .single();

      setHasPendingRequest(!!pendingRequest);
      setIsLoading(false);

      if (data?.acesso_vitalicio) {
        addToast('success', 'Seu pagamento foi aprovado! Aproveite o acesso vitalício.');
      } else if (data?.status_pagamento === 'aprovado') {
        addToast('success', 'Pagamento aprovado! Recarregue a página.');
      }
    }

    loadProfile();
  }, []);

  const handleCopyPix = async () => {
    await navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
        addToast('success', 'Código PIX copiado!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmitPayment = async () => {
    if (!comprovante || !profile) return;

    setIsSubmitting(true);

    try {
      const fileExt = comprovante.name.split('.').pop();
      const fileName = `payment-requests/${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, comprovante, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        addToast('error', `Erro ao fazer upload: ${uploadError.message}`);
        setIsSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      const { error: requestError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: profile.id,
          comprovante_url: publicUrl,
          status: 'pendente',
        });

      if (requestError) {
        addToast('error', `Erro ao enviar solicitação: ${requestError.message}`);
        setIsSubmitting(false);
        return;
      }

      await supabase
        .from('profiles')
        .update({ status_pagamento: 'pendente' })
        .eq('id', profile.id);

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          type: 'warning',
          title: 'Pagamento pendente',
          message: 'Seu comprovante foi enviado e está aguardando aprovação.',
          link: '/dashboard'
        })
      });

      setHasPendingRequest(true);
      setShowPaymentModal(false);
      setComprovante(null);
        addToast('success', 'Comprovante enviado! Aguarde a aprovação.');
    } catch (error: any) {
      addToast('error', `Erro inesperado: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hasAccess = hasPremiumAccess(profile);

  return (
    <div className="max-w-md mx-auto space-y-4 sm:space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">Upgrade Vitalício</h1>
      </div>

      {hasAccess ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-2">Acesso Vitalício Ativo!</h2>
            <p className="text-gray-500">Obrigado por apoiar o VenceJa</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {hasPendingRequest && (
            <Card className="border-warning-500/20 bg-warning-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-warning-500" />
                <div>
                  <p className="font-medium">Pagamento em Análise</p>
                  <p className="text-sm text-gray-500">Aguarde a aprovação</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-center pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Infinity className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold">Plano Vitalício</h3>
                </div>
                <p className="text-4xl font-bold text-primary">R$ {PLAN_PRICE}</p>
                <p className="text-sm text-gray-500 mt-1">Pagamento único</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Chave PIX:</p>
                <div className="bg-gray-50 dark:bg-[#000000] p-3 font-mono text-xs break-all">
                  {PIX_KEY}
                </div>
                <Button onClick={handleCopyPix} className="w-full">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copiado!' : 'Copiar Código PIX'}
                </Button>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[#000000] rounded-lg">
                <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                  Após o pagamento, envie o comprovante para ativar seu acesso.
                </p>
              </div>

              {!hasPendingRequest && (
                <Button size="lg" className="w-full" onClick={() => setShowPaymentModal(true)}>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Já fiz o pagamento
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Modal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setComprovante(null); }}
        title="Enviar Comprovante"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Após enviar, aguarde até 24h para análise.</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setComprovante(e.target.files?.[0] || null)}
            className="w-full text-sm p-3 border border-gray-200 dark:border-gray-800 rounded-lg"
          />
          {comprovante && (
            <p className="text-sm text-primary">Selecionado: {comprovante.name}</p>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setShowPaymentModal(false); setComprovante(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitPayment} isLoading={isSubmitting} disabled={!comprovante}>
              Enviar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
