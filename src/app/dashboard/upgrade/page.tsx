'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, CreditCard, CheckCircle, Clock, Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { hasPremiumAccess } from '@/lib/subscription';
import type { Profile } from '@/types';

const PIX_KEY = '00020101021126650014br.gov.bcb.pix0111097354445770228Pagamento Vitalicio  VenceJa5204000053039865406297.005802BR5916KADU A WANDERLEY6008SALVADOR62070503***6304C7AE';
const PLAN_PRICE = 297;

const features = [
  { name: 'Clientes', free: '3', pro: 'Ilimitados' },
  { name: 'Cobranças', free: '10', pro: 'Ilimitadas' },
  { name: 'Ranking de inadimplência', free: true, pro: true },
  { name: 'Dashboard inteligente', free: true, pro: true },
  { name: 'Score de clientes', free: true, pro: true },
  { name: 'Suporte por Email', free: true, pro: true },
  { name: 'Cobrança via WhatsApp', free: false, pro: true },
  { name: 'Cobranças recorrentes', free: false, pro: true },
  { name: 'Exportação CSV', free: false, pro: true },
  { name: 'Suporte prioritário', free: false, pro: true },
];

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
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8 px-3 sm:px-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">Escolha seu plano</h1>
      </div>

      {hasAccess ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center">
            <Crown className="w-12 h-12 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Acesso Vitalício Ativo!</h2>
            <p className="text-gray-500">Obrigado por apoiar o VenceJa</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {hasPendingRequest && (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Pagamento em Análise</p>
                  <p className="text-sm text-gray-500">Aguarde a aprovação</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Free Plan */}
            <div className="pricing-card glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 hover-lift border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Gratuito</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm">Para quem está começando</p>
              
              <div className="mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold">R$ 0</span>
                <span className="text-gray-500 ml-2 text-sm">para sempre</span>
              </div>

              <ul className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
                {features.filter(f => typeof f.free === 'string').map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{feature.name}: {feature.free}</span>
                  </li>
                ))}
                {features.filter(f => f.free === true).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{feature.name}</span>
                  </li>
                ))}
              </ul>

              <div className="text-sm text-gray-500 text-center py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                Seu plano atual
              </div>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card featured glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 relative overflow-hidden border-2 border-accent">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-accent/20 rounded-full blur-2xl sm:blur-3xl" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-accent/20 rounded-full text-accent text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 fill-accent" />
                  Mais Popular
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Vitalício Pro</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm">Acesso permanente a todas as funcionalidades</p>
                
                <div className="mb-4 sm:mb-6">
                  <span className="text-4xl sm:text-5xl font-bold text-accent">R$ 297</span>
                  <span className="text-gray-500 ml-2 text-sm">pagamento único</span>
                </div>

                <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-accent/10 rounded-lg sm:rounded-xl text-accent text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                  Economize R$ 598/ano vs assinatura
                </div>

                <ul className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
                  {['Tudo do plano Gratuito', 'Clientes ilimitados', 'Cobranças ilimitadas', 'Cobrança via WhatsApp', 'Cobranças recorrentes', 'Exportação CSV', 'Suporte prioritário', 'Acesso vitalício - pague uma vez!'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 sm:gap-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 p-4 bg-gray-50 dark:bg-black/30 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium">Chave PIX:</p>
                  <div className="bg-white dark:bg-[#0a0a0a] p-3 font-mono text-xs break-all rounded-lg border border-gray-200 dark:border-gray-700">
                    {PIX_KEY}
                  </div>
                  <Button onClick={handleCopyPix} className="w-full">
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copiado!' : 'Copiar Código PIX'}
                  </Button>

                  {!hasPendingRequest && (
                    <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-black" onClick={() => setShowPaymentModal(true)}>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Já fiz o pagamento
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 glass rounded-lg sm:rounded-xl">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span className="text-xs sm:text-sm font-medium">Pagamento 100% seguro via PIX</span>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 glass rounded-lg sm:rounded-xl">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span className="text-xs sm:text-sm font-medium">Ativação em até 24h</span>
            </div>
          </div>
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