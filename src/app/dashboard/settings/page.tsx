'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, CheckCircle2, Key, Shield, Lock, Gem, AlertTriangle, X, Trash2, RefreshCw, Check, Sparkles, Palette, BellRing, Download, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GlassCard as Card } from '@/components/screens/kit/glass-card';
import { NotificationSettings } from '@/components/screens/kit/notification-settings';
import { Modal } from '@/components/ui/modal';
import { Skeleton, PageHeaderSkeleton } from '@/components/ui/skeleton';
import { PageHero } from '@/components/screens/kit/page-hero';
import { Avatar } from '@/components/data/avatar';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { erroDeSenha } from '@/lib/domain/senha';
import { hasPremiumAccess, PLANS } from '@/lib/subscription';
import { cn } from '@/lib/utils';
import { ASSUNTO_SUPORTE_PRO, EMPRESA, PRAZO_ATENDIMENTO, PRAZO_SUPORTE_PRO } from '@/lib/legal';
import type { Profile } from '@/types';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="space-y-6"><PageHeaderSkeleton /><Skeleton className="h-72 rounded-3xl" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const searchParamsIniciais = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => searchParamsIniciais.get('secao') || 'profile');
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
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
    if (error) { addToast('error', 'Não foi possível atualizar o nome.'); return; }
    addToast('success', 'Nome atualizado.');
  };

  const handleChangePassword = async () => {
    const erroSenha = erroDeSenha(newPassword);
    if (erroSenha) { setResetError(erroSenha); return; }
    if (resetToken) {
      setIsResetting(true);
      setResetError('');
      
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
    if (!deletePassword) { addToast('error', 'Digite sua senha para confirmar.'); return; }
    setIsDeleting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile?.email || '',
      password: deletePassword,
    });

    if (signInError) {
      addToast('error', 'Senha incorreta.');
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
    if (!cancelConfirmed) {
      addToast('error', 'Marque a confirmação para continuar.');
      return;
    }
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
      addToast('success', 'Pedido de cancelamento enviado.');
      window.location.reload();
    } catch (error) {
      addToast('error', 'Erro ao processar solicitação');
    }
    setIsSubmitting(false);
  };

  const handleRequestRefund = async () => {
    if (!refundReason) {
      addToast('error', 'Escolha um motivo para continuar.');
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
      addToast('success', 'Pedido de reembolso enviado.');
      window.location.reload();
    } catch (error) {
      addToast('error', 'Erro ao processar solicitação');
    }
    setIsSubmitting(false);
  };


  const isPro = hasPremiumAccess(profile);

  const sections = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'avisos', label: 'Avisos', icon: BellRing },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'plan', label: 'Plano', icon: Gem },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'dados', label: 'Seus dados', icon: Download },
    { id: 'danger', label: 'Excluir conta', icon: AlertTriangle, danger: true },
  ];

  if (isLoading)
    return (
      <div className="space-y-6" role="status" aria-label="Carregando configurações">
        <PageHeaderSkeleton />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );

  const endsAt = profile?.subscription_ends_at ? new Date(profile.subscription_ends_at).toLocaleDateString('pt-BR') : null;

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Configurações" title="Sua conta," highlight="do seu jeito." description="Perfil, avisos, plano e preferências." />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Seções das configurações" className="-mx-4 overflow-x-auto px-4 hide-scrollbar lg:mx-0 lg:px-0">
          <ul className="flex gap-1 lg:flex-col">
            {sections.map((section) => {
              const active = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-10 w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-[background-color,color,transform] duration-300 ease-spring hover:scale-[1.04] active:scale-95',
                      active
                        ? section.danger
                          ? 'bg-neg-soft text-neg'
                          : 'bg-brand-soft text-brand-ink'
                        : section.danger
                          ? 'text-neg hover:bg-neg-soft'
                          : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink'
                    )}
                  >
                    <section.icon className="size-4" />
                    {section.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <motion.div key={activeSection} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
          {activeSection === 'profile' && (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-4 border-b border-line pb-5">
                <Avatar name={name || email || 'U'} size="xl" />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-ink">{name || 'Sem nome'}</h2>
                  <p className="truncate text-sm text-ink-3">{email}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input label="Seu nome" value={name} onChange={(e) => setName(e.target.value)} hint="Assina as mensagens de cobrança do WhatsApp." />
                <Input label="E-mail" type="email" value={email} disabled hint="Para trocar o e-mail, fale com o suporte." />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleUpdateName}>Salvar alterações</Button>
              </div>
            </Card>
          )}

          {activeSection === 'avisos' && <NotificationSettings />}

          {activeSection === 'security' && (
            <Card className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-surface-3 text-ink-2">
                    <Lock className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">Senha</h3>
                    <p className="text-sm text-ink-3">Use pelo menos 8 caracteres.</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setPasswordModal(true)}>
                  <Key />
                  Alterar senha
                </Button>
              </div>
            </Card>
          )}

          {activeSection === 'plan' && (
            <Card className={cn('overflow-hidden', isPro && 'border-brand-500/30')}>
              <div className={cn('relative p-5 sm:p-6', isPro && 'bg-gradient-to-br from-brand-soft/80 to-transparent')}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className={cn('flex size-12 items-center justify-center rounded-2xl', isPro ? 'glass-brand text-white' : 'bg-surface-3 text-ink-2')}>
                      <Gem className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink">{isPro ? 'Plano Pro' : 'Plano Grátis'}</h3>
                      <p className="text-sm text-ink-3">
                        {isPro
                          ? cancellationStatus === 'pending'
                            ? cancellationType === 'refund'
                              ? `Reembolso em análise · resposta em até ${PRAZO_ATENDIMENTO}`
                              : `Cancelamento em análise · resposta em até ${PRAZO_ATENDIMENTO}`
                            : profile?.subscription_status === 'canceled'
                              ? `Acesso garantido até ${endsAt || 'o fim do período'}`
                              : 'Clientes e cobranças ilimitados'
                          : `Até ${PLANS.free.limits.maxClients} clientes e ${PLANS.free.limits.maxCharges} cobranças`}
                      </p>
                    </div>
                  </div>
                  {isPro &&
                    (cancellationStatus === 'pending' ? (
                      <Badge variant="warning" dot>
                        Em análise
                      </Badge>
                    ) : profile?.subscription_status === 'canceled' ? (
                      <Badge variant="warning" dot>
                        Cancelado
                      </Badge>
                    ) : (
                      <Badge variant="success" dot>
                        Ativo
                      </Badge>
                    ))}
                </div>

                {isPro ? (
                  <div className="mt-6 space-y-5">
                    <dl className="grid grid-cols-3 gap-3 rounded-2xl border border-line bg-surface p-4 text-center dark:bg-surface-2">
                      <div>
                        <dt className="text-xs text-ink-3">Clientes</dt>
                        <dd className="mt-0.5 font-semibold text-ink">Ilimitados</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-3">{profile?.subscription_status === 'canceled' ? 'Acesso até' : 'Renova em'}</dt>
                        <dd className="mt-0.5 font-semibold text-ink tnum">
                          {profile?.subscription_ends_at ? new Date(profile.subscription_ends_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-3">WhatsApp</dt>
                        <dd className="mt-0.5 font-semibold text-pos">Liberado</dd>
                      </div>
                    </dl>

                    <div className="flex flex-col gap-3 rounded-2xl border border-brand-500/25 bg-brand-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <LifeBuoy className="mt-0.5 size-5 shrink-0 text-brand-ink" />
                        <div>
                          <p className="text-sm font-semibold text-ink">Suporte prioritário</p>
                          <p className="text-sm text-ink-2">Como assinante Pro, você recebe resposta em até {PRAZO_SUPORTE_PRO}.</p>
                        </div>
                      </div>
                      <Button asChild variant="secondary" size="sm" className="shrink-0">
                        <a href={`mailto:${EMPRESA.emailSuporte}?subject=${encodeURIComponent(ASSUNTO_SUPORTE_PRO)}&body=${encodeURIComponent(`Conta: ${profile?.email || ''}\n\nComo podemos ajudar?\n`)}`}>Falar com o suporte</a>
                      </Button>
                    </div>

                    {cancellationStatus !== 'pending' && (
                      <div className="space-y-3 border-t border-line pt-5">
                        {refundEligible && (
                          <p className="text-sm text-ink-2">
                            {refundDaysRemaining === 0 ? <>Hoje é o <strong className="text-ink">último dia</strong> para pedir reembolso integral.</> : <>Você ainda tem <strong className="text-ink tnum">{refundDaysRemaining} {refundDaysRemaining === 1 ? 'dia' : 'dias'}</strong> para pedir reembolso integral.</>}
                          </p>
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button variant="secondary" onClick={() => setShowCancelModal(true)}>
                            <X />
                            Cancelar assinatura
                          </Button>
                          {refundEligible && (
                            <Button variant="danger-soft" onClick={() => setShowRefundModal(true)}>
                              <RefreshCw />
                              Pedir reembolso
                            </Button>
                          )}
                        </div>
                        {!refundEligible && <p className="text-xs text-ink-3">O prazo de 7 dias para reembolso já passou.</p>}
                      </div>
                    )}

                    {cancellationStatus === 'pending' && cancellationType === 'refund' && (
                      <div className="rounded-2xl border border-info/25 bg-info-soft p-4 text-sm">
                        <p className="font-semibold text-info">Seu pedido de reembolso está em análise.</p>
                        <p className="mt-1 text-ink-2">Resposta em até {PRAZO_ATENDIMENTO}. Você continua com o Pro enquanto isso. Depois de aprovado, o estorno leva até 5 dias úteis.</p>
                      </div>
                    )}

                    {cancellationStatus === 'pending' && cancellationType === 'cancel' && (
                      <div className="rounded-2xl border border-warn/25 bg-warn-soft p-4 text-sm">
                        <p className="font-semibold text-warn">Seu pedido de cancelamento está em análise.</p>
                        <p className="mt-1 text-ink-2">
                          Resposta em até {PRAZO_ATENDIMENTO}. Você mantém o Pro até o fim do período pago ({endsAt || 'verificando…'}). Depois disso, a conta volta para o plano grátis.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 border-t border-line pt-5">
                    <ul className="mb-5 grid gap-2 text-sm text-ink-2 sm:grid-cols-2">
                      {PLANS.pro.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="size-4 text-pos" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button asChild size="lg" className="w-full sm:w-auto">
                      <Link href="/dashboard/upgrade">
                        <Sparkles />
                        Assinar o Pro · R$ 49,90/mês
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeSection === 'appearance' && (
            <Card className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-ink">Tema</h3>
                  <p className="text-sm text-ink-3">Claro para o dia, escuro para a noite. A escolha fica salva neste aparelho.</p>
                </div>
                <div className="w-full sm:w-48">
                  <ThemeToggle withLabel className="border border-line" />
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'dados' && (
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Seus dados</h2>
              <p className="mt-1 text-sm text-ink-3">Baixe uma cópia da sua conta, dos seus clientes, cobranças e pagamentos em um arquivo JSON.</p>
              <Button asChild variant="secondary" className="mt-4">
                <a href="/api/account/export" download>
                  <Download />
                  Baixar meus dados
                </a>
              </Button>
              <p className="mt-4 text-sm text-ink-3">
                Saiba mais na <Link href="/privacidade" className="font-medium text-brand-ink underline underline-offset-2">Política de Privacidade</Link> e em <Link href="/exclusao-de-dados" className="font-medium text-brand-ink underline underline-offset-2">exclusão de dados</Link>.
              </p>
            </Card>
          )}

          {activeSection === 'danger' && (
            <Card className="border-neg/30 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-neg-soft text-neg">
                  <AlertTriangle className="size-5" />
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-ink">Excluir minha conta</h3>
                  <p className="mt-1 text-sm text-ink-3">Apaga sua conta, seus clientes e todas as cobranças de forma permanente. Não dá para desfazer.</p>
                  {isPro && <p className="mt-2 text-sm text-warn">Se você tem uma assinatura ativa, cancele antes para não ser cobrado de novo.</p>}
                  <Button variant="danger" onClick={() => setDeleteModal(true)} className="mt-5">
                    <Trash2 />
                    Excluir minha conta
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>

      <Modal
        isOpen={passwordModal}
        onClose={() => {
          setPasswordModal(false);
          setResetPassword(false);
          setResetToken('');
          setNewPassword('');
          setConfirmPassword('');
        }}
        title={resetPassword ? 'Crie uma nova senha' : 'Alterar senha'}
        icon={<Key />}
        size="sm"
      >
        {resetSuccess ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-pos-soft text-pos">
              <CheckCircle2 className="size-7" />
            </div>
            <p className="font-semibold text-ink">Senha alterada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resetError && (
              <div className="rounded-xl border border-neg/25 bg-neg-soft p-3 text-sm text-neg" role="alert">
                {resetError}
              </div>
            )}
            <Input label="Nova senha" type="password" showPasswordToggle value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
            <Input label="Confirme a nova senha" type="password" showPasswordToggle value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" autoComplete="new-password" />
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setPasswordModal(false);
                  setResetPassword(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleChangePassword} isLoading={isResetting}>
                Salvar nova senha
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Excluir sua conta?"
        description="Todos os seus dados serão apagados de forma permanente."
        icon={<Trash2 />}
        tone="danger"
        size="sm"
      >
        <div className="space-y-4">
          <Input label="Digite sua senha para confirmar" type="password" showPasswordToggle value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} autoComplete="current-password" />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteModal(false);
                setDeletePassword('');
              }}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount} isLoading={isDeleting}>
              Excluir conta para sempre
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelReason('');
          setCancelConfirmed(false);
        }}
        title="Cancelar assinatura"
        icon={<X />}
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-warn/25 bg-warn-soft p-3.5 text-sm text-ink-2">
            <p>
              Você mantém o Pro até o fim do período pago (<strong>{endsAt || 'em breve'}</strong>). Depois, a conta volta para o plano grátis.
            </p>
            <p className="mt-2 font-medium text-warn">Reembolso só é possível em até 7 dias após a compra.</p>
          </div>
          <Select
            label="Por que está cancelando? (opcional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            options={[
              { value: '', label: 'Escolha um motivo' },
              { value: 'Muito caro', label: 'Muito caro' },
              { value: 'Não estou usando', label: 'Não estou usando' },
              { value: 'Encontrou outro produto', label: 'Encontrei outro produto' },
              { value: 'Falta de tempo', label: 'Falta de tempo' },
              { value: 'Outro', label: 'Outro' },
            ]}
          />
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface-2 p-3.5 text-sm text-ink-2 dark:bg-surface-3/60">
            <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-brand-600" checked={cancelConfirmed} onChange={(e) => setCancelConfirmed(e.target.checked)} />
            Entendo que estou pedindo o cancelamento e que, depois deste pedido, não terei direito a reembolso.
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
                setCancelConfirmed(false);
              }}
            >
              Manter o Pro
            </Button>
            <Button variant="danger" onClick={handleCancelSubscription} isLoading={isSubmitting}>
              Confirmar cancelamento
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setRefundReason('');
        }}
        title="Pedir reembolso"
        icon={<RefreshCw />}
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-500/25 bg-brand-soft/60 p-3.5 text-sm text-ink-2">
            <p className="font-semibold text-brand-ink">
              {refundDaysRemaining === 0 ? 'Hoje é o último dia do prazo.' : `Faltam ${refundDaysRemaining} ${refundDaysRemaining === 1 ? 'dia' : 'dias'} do prazo.`}
            </p>
            <p className="mt-1">O reembolso é integral dentro de 7 dias após a compra.</p>
          </div>
          <Select
            label="Motivo do reembolso"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            options={[
              { value: '', label: 'Escolha um motivo' },
              { value: 'Não gostei do produto', label: 'Não gostei do produto' },
              { value: 'Não funcionou como esperado', label: 'Não funcionou como esperado' },
              { value: 'Comprei por engano', label: 'Comprei por engano' },
              { value: 'Outro', label: 'Outro' },
            ]}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowRefundModal(false);
                setRefundReason('');
              }}
            >
              Voltar
            </Button>
            <Button variant="danger" onClick={handleRequestRefund} isLoading={isSubmitting}>
              Pedir reembolso
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
