'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { User, CheckCircle, Key, Shield, Lock, Crown, Mail, AlertTriangle, Zap, X, LogOut, Trash2, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { hasPremiumAccess, PLANS } from '@/lib/subscription';
import type { Profile } from '@/types';
import { motion } from 'framer-motion';

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [passwordModal, setPasswordModal] = useState(false);
  const [resetPassword, setResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [refundEligible, setRefundEligible] = useState(false);
  const [refundDaysRemaining, setRefundDaysRemaining] = useState(0);
  const [cancellationStatus, setCancellationStatus] = useState<string | null>(null);
  const [cancellationType, setCancellationType] = useState<string | null>(null);
  const { addToast } = useAppStore();
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tokenFromUrl = searchParams.get('reset_token');
      if (tokenFromUrl) {
        setResetToken(tokenFromUrl);
        setResetPassword(true);
        setPasswordModal(true);
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setName(user.user_metadata?.name || '');
      setEmail(user.email || data?.email || '');
      
      if (data?.plano === 'pro') {
        setCancellationStatus(data.cancellation_status || null);
        setCancellationType(data.cancellation_type || null);
        
        try {
          const response = await fetch('/api/subscriptions/refund');
          const result = await response.json();
          setRefundEligible(result.eligible || false);
          setRefundDaysRemaining(result.daysRemaining || 0);
        } catch (e) {
          console.error('Erro ao verificar elegibilidade:', e);
        }
      }
      
      setIsLoading(false);
    }
    loadProfile();
  }, [searchParams]);

  const handleUpdateName = async () => {
    const { error } = await supabase.auth.updateUser({ data: { name } });
    if (error) { addToast('error', 'Erro ao atualizar nome'); return; }
    addToast('success', 'Nome atualizado com sucesso!');
  };

  const handleChangePassword = async () => {
    if (resetToken) {
      setIsResetting(true);
      setResetError('');
      if (newPassword.length < 6) { setResetError('A senha deve ter pelo menos 6 caracteres'); setIsResetting(false); return; }
      if (newPassword !== confirmPassword) { setResetError('As senhas não coincidem'); setIsResetting(false); return; }

      try {
        const response = await fetch('/api/auth/verify-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken, newPassword }) });
        const data = await response.json();
        if (!response.ok) { setResetError(data.error || 'Erro ao redefinir senha'); setIsResetting(false); return; }
        setResetSuccess(true);
        setTimeout(() => { setPasswordModal(false); setResetPassword(false); setResetToken(''); setNewPassword(''); setConfirmPassword(''); setResetSuccess(false); window.history.replaceState({}, '', '/dashboard/settings'); }, 2000);
      } catch { setResetError('Erro ao redefinir senha'); setIsResetting(false); }
      return;
    }

    setIsResetting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setResetError(error.message); setIsResetting(false); return; }
    setResetSuccess(true);
    setTimeout(() => { setPasswordModal(false); setNewPassword(''); setConfirmPassword(''); setResetSuccess(false); }, 2000);
    setIsResetting(false);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { addToast('error', 'Digite sua senha'); return; }
    setIsDeleting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile?.email || '',
      password: deletePassword,
    });

    if (signInError) {
      addToast('error', 'Senha incorreta');
      setIsDeleting(false);
      return;
    }

    const response = await fetch('/api/account/delete', {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      addToast('error', data.error || 'Erro ao excluir conta');
      setIsDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleCancelSubscription = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        addToast('error', data.error || 'Erro ao enviar solicitação');
        setIsSubmitting(false);
        return;
      }
      
      setCancellationStatus('pending');
      setCancellationType('cancel');
      setShowCancelModal(false);
      setCancelReason('');
      setCancelSuccess(true);
      addToast('success', 'Solicitação de cancelamento enviada com sucesso');
      window.location.reload();
    } catch (error) {
      addToast('error', 'Erro ao processar solicitação');
    }
    setIsSubmitting(false);
  };

  const handleRequestRefund = async () => {
    if (!refundReason) {
      addToast('error', 'Por favor, selecione um motivo');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/subscriptions/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundReason }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        addToast('error', data.error || 'Erro ao enviar solicitação');
        setIsSubmitting(false);
        return;
      }
      
      setCancellationStatus('pending');
      setCancellationType('refund');
      setShowRefundModal(false);
      setRefundReason('');
      addToast('success', 'Solicitação de reembolso enviada com sucesso');
      window.location.reload();
    } catch (error) {
      addToast('error', 'Erro ao processar solicitação');
    }
    setIsSubmitting(false);
  };

  const cancellationTypeDisplay = cancellationType === 'cancel' ? 'Cancelamento' : 'Reembolso';

  const isPro = hasPremiumAccess(profile);

  const sections = [
    { id: 'profile', label: 'Perfil', icon: User, description: 'Gerencie suas informações pessoais' },
    { id: 'security', label: 'Segurança', icon: Shield, description: 'Senha e configurações de segurança' },
    { id: 'plan', label: 'Plano', icon: Crown, description: 'Seu plano e limitações' },
    { id: 'danger', label: 'Zona de Perigo', icon: AlertTriangle, description: 'Ações irreversíveis', danger: true },
  ];

  if (isLoading) return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extralight tracking-tight">Configurações</h1>
      <div className="glass-card rounded-2xl p-8 animate-pulse" />
    </div>
  );

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <h1 className="text-3xl font-extralight tracking-tight">Configurações</h1>
        <p className="text-slate-400 font-light mt-1">Gerencie sua conta e preferências</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div variants={fadeIn} className="space-y-2">
          {sections.map(section => (
            <button 
              key={section.id} 
              onClick={() => setActiveSection(section.id)} 
              className={`w-full glass-card rounded-xl p-4 text-left hover-lift transition-all ${activeSection === section.id ? (section.danger ? 'border-danger' : 'border-accent') : ''} ${section.danger ? 'hover:border-danger/50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeSection === section.id ? (section.danger ? 'bg-danger/20 text-danger' : 'bg-accent/20 text-accent') : 'bg-white/5 text-slate-400'}`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-light ${section.danger ? 'text-danger' : ''}`}>{section.label}</p>
                  <p className="text-xs text-slate-500">{section.description}</p>
                </div>
              </div>
            </button>
          ))}
        </motion.div>

        <motion.div variants={fadeIn} className="lg:col-span-3">
          {activeSection === 'profile' && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/50 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-extralight text-black">{name?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
                <div>
                  <h2 className="text-xl font-light">{name || 'Usuário'}</h2>
                  <p className="text-slate-400 text-sm">{email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400 font-light">Nome</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-light focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400 font-light">Email</label>
                  <input 
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 font-light cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleUpdateName} className="bg-accent text-black">Salvar Alterações</Button>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                      <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-light">Senha</h3>
                      <p className="text-xs text-slate-500">Última alteração: nunca</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setPasswordModal(true)}>Alterar Senha</Button>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                      <Key className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-light">Autenticação em duas etapas</h3>
                      <p className="text-xs text-slate-500">Adicione uma camada extra de segurança</p>
                    </div>
                  </div>
                  <Badge className="bg-white/5 text-slate-400 text-xs">Em breve</Badge>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'plan' && (
            <div className="space-y-4">
              <div className={`glass-card rounded-2xl p-6 border-2 ${isPro ? 'border-accent' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isPro ? 'bg-accent/20' : 'bg-white/5'}`}>
                      <Crown className={`w-7 h-7 ${isPro ? 'text-accent' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-light">{isPro ? 'Plano Pro' : 'Plano Grátis'}</h3>
                      <p className="text-slate-400 text-sm">
                        {isPro 
                          ? cancellationStatus === 'pending' 
                            ? cancellationType === 'refund' 
                              ? `Reembolso pendente - ${cancellationTypeDisplay}`
                              : `Cancelamento pendente`
                            : 'Acesso completo e ilimitado'
                          : `${PLANS.free.limits.maxClients} clientes, ${PLANS.free.limits.maxCharges} cobranças`}
                      </p>
                    </div>
                  </div>
                  {isPro && (
                    cancellationStatus === 'pending' 
                      ? <Badge className="bg-yellow-500/20 text-yellow-500">Pendente</Badge>
                      : <Badge className="bg-accent/20 text-accent">Ativo</Badge>
                  )}
                </div>
                {isPro ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                      <div className="text-center">
                        <p className="text-2xl font-extralight text-accent">∞</p>
                        <p className="text-xs text-slate-500">Clientes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-extralight text-accent">
                          {profile?.subscription_ends_at 
                            ? new Date(profile.subscription_ends_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                            : '-'}
                        </p>
                        <p className="text-xs text-slate-500">Próxima cobrança</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-extralight text-accent">✓</p>
                        <p className="text-xs text-slate-500">WhatsApp</p>
                      </div>
                    </div>
                    
                    {cancellationStatus !== 'pending' && (
                      <div className="pt-4 border-t border-white/10 space-y-3">
                        {refundEligible && (
                          <div className="text-sm text-slate-400 mb-2">
                            <span className="text-accent">{refundDaysRemaining}</span> dias restantes para solicitar reembolso
                          </div>
                        )}
                        <div className="flex gap-3">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                            onClick={() => setShowCancelModal(true)}
                          >
                            <X className="w-4 h-4 mr-2" />Cancelar Assinatura
                          </Button>
                          {refundEligible && (
                            <Button 
                              variant="outline" 
                              className="flex-1 border-danger/50 text-danger hover:bg-danger/10"
                              onClick={() => setShowRefundModal(true)}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />Solicitar Reembolso
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {!refundEligible && cancellationStatus !== 'pending' && 'Prazo de 7 dias para reembolso excedido'}
                        </p>
                      </div>
                    )}

                    {cancellationStatus === 'pending' && cancellationType === 'refund' && (
                      <div className="pt-4 border-t border-white/10">
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-sm text-yellow-500">
                            <strong>Sua solicitação de reembolso está em análise.</strong>
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Você receberá um email com a resposta em até 24 horas.
                          </p>
                        </div>
                      </div>
                    )}

                    {cancellationStatus === 'pending' && cancellationType === 'cancel' && (
                      <div className="pt-4 border-t border-white/10">
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-sm text-yellow-500">
                            <strong>Sua solicitação de cancelamento foi enviada.</strong>
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Você terá acesso até o fim do período pago. Após isso, voltará automaticamente para o plano gratuito.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-white/10">
                    <Link href="/dashboard/upgrade">
                      <Button className="w-full bg-accent text-black">
                        <Zap className="w-4 h-4 mr-2" />Fazer Upgrade - R$ 49,90/mês
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'danger' && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6 border border-danger/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-danger" />
                  </div>
                  <div>
                    <h3 className="font-light text-danger">Zona de Perigo</h3>
                    <p className="text-xs text-slate-500">Ações irreversíveis</p>
                  </div>
                </div>
                <Button variant="danger" onClick={() => setDeleteModal(true)} className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />Excluir Minha Conta
                </Button>
                <p className="text-xs text-slate-500 mt-3 text-center">Esta ação não pode ser desfeita. Todos os seus dados serão excluídos permanentemente.</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <Modal isOpen={passwordModal} onClose={() => { setPasswordModal(false); setResetPassword(false); setResetToken(''); setNewPassword(''); setConfirmPassword(''); }} title={resetPassword ? 'Nova Senha' : 'Alterar Senha'} size="sm">
        {resetSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <p className="font-light">Senha alterada com sucesso!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resetError && <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">{resetError}</div>}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-light">Nova Senha</label>
              <input 
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 font-light focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-light">Confirmar Senha</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 font-light focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setPasswordModal(false); setResetPassword(false); setNewPassword(''); setConfirmPassword(''); }}>Cancelar</Button>
              <Button onClick={handleChangePassword} isLoading={isResetting} className="bg-accent text-black">Alterar Senha</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir Conta" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Esta ação é irreversível. Todos os seus dados serão excluídos permanentemente.</p>
          <div className="space-y-2">
            <label className="text-sm text-slate-400 font-light">Digite sua senha para confirmar</label>
            <input 
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 font-light focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setDeleteModal(false); setDeletePassword(''); }}>Cancelar</Button>
            <Button variant="danger" onClick={handleDeleteAccount} isLoading={isDeleting}>Excluir Conta</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCancelModal} onClose={() => { setShowCancelModal(false); setCancelReason(''); }} title="Cancelar Assinatura" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-slate-300">
            <p><strong>Atenção:</strong> Ao cancelar, você perderá acesso ao plano Pro no fim do período pago ({profile?.subscription_ends_at ? new Date(profile.subscription_ends_at).toLocaleDateString('pt-BR') : 'em breve'}).</p>
            <p className="mt-2 text-yellow-500">O reembolso só é possível dentro de 7 dias após a compra.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400 font-light">Nos ajude a melhorar (opcional)</label>
            <select 
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-light focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            >
              <option value="">Selecione um motivo...</option>
              <option value="Muito caro">Muito caro</option>
              <option value="Não estou usando">Não estou usando</option>
              <option value="Encontrou outro produto">Encontrou outro produto</option>
              <option value="Falta de tempo">Falta de tempo</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 accent-accent" />
              <span className="text-sm text-slate-400">Entendo que estou solicitando o cancelamento e que não terei direito a reembolso após este pedido.</span>
            </label>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setShowCancelModal(false); setCancelReason(''); }}>Voltar</Button>
            <Button onClick={handleCancelSubscription} isLoading={isSubmitting} className="bg-yellow-500 text-black">Confirmar Cancelamento</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRefundModal} onClose={() => { setShowRefundModal(false); setRefundReason(''); }} title="Solicitar Reembolso" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg text-sm text-slate-300">
            <p className="text-accent font-medium">Prazo: {refundDaysRemaining} dias restantes</p>
            <p className="mt-1">Você tem direito ao reembolso total dentro de 7 dias após a compra.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400 font-light">Motivo do reembolso *</label>
            <select 
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-light focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            >
              <option value="">Selecione um motivo...</option>
              <option value="Não gostei do produto">Não gostei do produto</option>
              <option value="Não funcionou como esperado">Não funcionou como esperado</option>
              <option value="Comprei por engano">Comprei por engano</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setShowRefundModal(false); setRefundReason(''); }}>Cancelar</Button>
            <Button onClick={handleRequestRefund} isLoading={isSubmitting} className="bg-danger text-white">Solicitar Reembolso</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}