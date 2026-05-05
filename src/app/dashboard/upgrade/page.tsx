'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Star, CreditCard, Shield, Clock, AlertCircle, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { hasPremiumAccess } from '@/lib/subscription';
import type { Profile } from '@/types';
import { PaymentForm } from '@/components/payment-form';

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

const plans = [
  { 
    name: 'Gratuito', 
    price: 'R$ 0', 
    period: 'para sempre', 
    description: 'Ideal para testar a plataforma',
    features: [
      '3 clientes',
      '10 cobranças',
      'Dashboard inteligente',
      'Score de clientes',
      'Ranking de inadimplência',
      'Calendário financeiro',
      'Suporte por email',
      'Cobranças recorrentes',
      'Pagamento parcial',
    ],
    cta: 'Plano Atual',
    popular: false
  },
  { 
    name: 'Pro', 
    price: 'R$ 49,90', 
    period: '/mês', 
    description: 'Para profissionais e empresas',
    features: [
      'Clientes ilimitados',
      'Cobranças ilimitadas',
      'Cobrança via WhatsApp',
      'Relatórios completos',
      'Exportação CSV',
      'Suporte prioritário',
    ],
    cta: 'Assinar Agora',
    popular: true,
    annualPrice: 'R$ 499/ano',
    annualDiscount: '17% OFF'
  },
];

const trustItems = [
  { icon: Shield, label: 'Pagamento 100% seguro' },
  { icon: Clock, label: 'Ativação imediata' },
  { icon: AlertCircle, label: 'Sem taxa de setup' },
  { icon: Check, label: '7 dias para solicitar reembolso' },
  { icon: X, label: 'Cancele a qualquer momento' },
];

export default function UpgradePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const handleSuccess = () => {
    setShowPaymentForm(false);
    setShowSuccessModal(true);
    setTimeout(() => window.location.reload(), 2000);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const hasAccess = hasPremiumAccess(profile);

  if (showPaymentForm) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-xl font-light">Assinatura Pro</h1>
        </div>
        <div className="glass-card backdrop-blur-xl rounded-3xl p-6 border border-white/10">
          <PaymentForm planType={selectedPlan} onSuccess={handleSuccess} />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><Shield className="w-4 h-4" /><span>Pagamento 100% seguro</span></div>
      </div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" variants={fadeIn} className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-extralight tracking-tight">Upgrade</h1>
          <p className="text-slate-400 font-light mt-1">Escolha o melhor plano para você</p>
        </div>
      </div>

      {hasAccess ? (
        <motion.div variants={fadeIn} className="glass-card backdrop-blur-xl rounded-3xl p-12 border border-accent/30 text-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-3xl font-extralight mb-3">Plano Pro Ativo!</h2>
          <p className="text-slate-400 font-light">Obrigado por apoiar o VenceJa. Você tem acesso a todos os recursos premium.</p>
        </motion.div>
      ) : (
        <motion.div variants={fadeIn} className="grid md:grid-cols-2 gap-8">
          {plans.map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`glass-card backdrop-blur-xl rounded-3xl p-8 ${plan.popular ? 'border-2 border-accent lg:scale-105' : 'border-white/10'}`}>
              {plan.popular && <div className="mb-4"><Badge variant="primary" className="px-4 py-1 backdrop-blur-md"><Star className="w-4 h-4 mr-1" />Mais Popular</Badge></div>}
              <h3 className="text-2xl font-light mb-2">{plan.name}</h3>
              <p className="text-slate-400 font-light mb-4">{plan.description}</p>
              <div className="mb-4"><span className="text-5xl font-extralight">{plan.price}</span><span className="text-slate-500 ml-2">{plan.period}</span></div>
              {plan.annualPrice && (
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary" className="backdrop-blur-md">{plan.annualDiscount}</Badge>
                  <span className="text-slate-400 font-light">{plan.annualPrice}</span>
                </div>
              )}
              <ul className="space-y-3 mb-8">{plan.features.map((f, j) => <li key={j} className="flex items-center gap-3"><Check className="w-5 h-5 text-accent" /><span className="text-slate-300 font-light">{f}</span></li>)}</ul>
              {i === 0 ? (
                <div className="text-sm text-slate-500 text-center py-3 bg-white/5 rounded-xl">Seu plano atual</div>
              ) : (
                <>
                  <Button size="lg" className="w-full bg-accent text-black" onClick={() => { setSelectedPlan('monthly'); setShowPaymentForm(true); }}>
                    <CreditCard className="w-5 h-5 mr-2" />{plan.cta}
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-slate-400" onClick={() => { setSelectedPlan('annual'); setShowPaymentForm(true); }}>
                    {plan.annualPrice} - Assinar anual
                  </Button>
                </>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {!hasAccess && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {trustItems.map((item, i) => (
            <div key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 text-sm">
              <item.icon className="w-4 h-4 text-accent" /><span className="font-light text-slate-400">{item.label}</span>
            </div>
          ))}
        </motion.div>
      )}

      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto"><Check className="w-8 h-8 text-accent" /></div>
          <h3 className="text-xl font-light">Bem-vindo ao Plano Pro!</h3>
          <p className="text-slate-400 text-sm">Assinatura confirmada com sucesso.</p>
          <Button className="w-full bg-accent text-black" onClick={() => { setShowSuccessModal(false); window.location.reload(); }}>Continuar</Button>
        </div>
      </Modal>
    </motion.div>
  );
}

function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card backdrop-blur-xl rounded-2xl p-6 w-full max-w-md border border-white/10">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        {children}
      </div>
    </div>
  );
}