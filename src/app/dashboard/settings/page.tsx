'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { User, CheckCircle, Key, Shield, Lock, Crown, Mail, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { hasPremiumAccess } from '@/lib/subscription';
import type { Profile } from '@/types';

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

  const sections = [
    { id: 'profile', label: 'Perfil', icon: User, description: 'Gerencie suas informações pessoais' },
    { id: 'security', label: 'Segurança', icon: Shield, description: 'Senha e configurações de segurança' },
    { id: 'plan', label: 'Plano', icon: Crown, description: 'Seu plano e limitações' },
    { id: 'danger', label: 'Zona de Perigo', icon: AlertTriangle, description: 'Ações irreversíveis', danger: true },
  ];

  if (isLoading) return <div className="space-y-6"><h1 className="text-2xl font-bold">Configurações</h1><div className="glass-card rounded-2xl p-8 animate-pulse" /></div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">Gerencie sua conta e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className={`lg:col-span-1 space-y-2 sm:space-y-3 opacity-0 ${mounted ? 'animate-fade-up animate-delay-100' : ''}`}>
          {sections.map(section => (
            <button key={section.id} onClick={() => setActiveSection(section.id)} className={`w-full glass-card rounded-xl p-3 sm:p-4 text-left hover-lift transition-all ${activeSection === section.id ? (section.danger ? 'border-danger' : 'border-accent') : ''} ${section.danger ? 'hover:border-danger/50' : ''}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${activeSection === section.id ? (section.danger ? 'bg-danger/20 text-danger' : 'bg-accent/20 text-accent') : 'bg-gray-800 text-gray-400'}`}>
                  <section.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`font-medium text-sm sm:text-base ${section.danger ? 'text-danger' : ''}`}>{section.label}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{section.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className={`lg:col-span-3 opacity-0 ${mounted ? 'animate-fade-up animate-delay-200' : ''}`}>
          {activeSection === 'profile' && (
            <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-gray-800">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-accent to-accent/50 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold text-black">{name?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-lg sm:text-xl font-bold">{name || 'Usuário'}</h2>
                  <p className="text-gray-400 text-sm">{email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} icon={<User className="w-4 h-4" />} />
                <Input label="Email" value={email} disabled icon={<Mail className="w-4 h-4" />} />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleUpdateName} className="bg-accent w-full sm:w-auto">Salvar Alterações</Button>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 rounded-xl flex items-center justify-center"><Lock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" /></div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">Senha</h3>
                      <p className="text-xs sm:text-sm text-gray-400">Última alteração: nunca</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setPasswordModal(true)} className="w-full sm:w-auto text-sm">Alterar Senha</Button>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 rounded-xl flex items-center justify-center"><Key className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" /></div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">Autenticação em duas etapas</h3>
                      <p className="text-xs sm:text-sm text-gray-400">Adicione uma camada extra de segurança</p>
                    </div>
                  </div>
                  <Badge className="bg-gray-800 text-gray-400 text-xs">Em breve</Badge>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'plan' && (
            <div className="space-y-3 sm:space-y-4">
              <div className={`glass-card rounded-2xl p-4 sm:p-6 border-2 ${hasPremiumAccess(profile) ? 'border-accent' : ''}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${hasPremiumAccess(profile) ? 'bg-accent/20' : 'bg-gray-800'}`}>
                      <Crown className={`w-6 h-6 sm:w-7 sm:h-7 ${hasPremiumAccess(profile) ? 'text-accent' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold">{hasPremiumAccess(profile) ? 'Plano Vitalício' : 'Plano Grátis'}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">{hasPremiumAccess(profile) ? 'Acesso completo e ilimitado' : 'Limitado a 3 clientes'}</p>
                    </div>
                  </div>
                  {hasPremiumAccess(profile) && <Badge className="bg-accent/20 text-accent">Ativo</Badge>}
                </div>
                {hasPremiumAccess(profile) ? (
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-gray-800">
                    <div className="text-center"><p className="text-xl sm:text-2xl font-bold text-accent">∞</p><p className="text-[10px] sm:text-xs text-gray-400">Clientes</p></div>
                    <div className="text-center"><p className="text-xl sm:text-2xl font-bold text-accent">∞</p><p className="text-[10px] sm:text-xs text-gray-400">Cobranças</p></div>
                    <div className="text-center"><p className="text-xl sm:text-2xl font-bold text-accent">✓</p><p className="text-[10px] sm:text-xs text-gray-400">Ranking</p></div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-800">
                    <Link href="/dashboard/upgrade"><Button className="bg-accent w-full"><Zap className="w-4 h-4 mr-2" />Fazer Upgrade - R$ 297</Button></Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'danger' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="glass-card rounded-2xl p-4 sm:p-6 border border-danger/30">
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-danger/10 rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-danger" /></div>
                  <div>
                    <h3 className="font-semibold text-danger text-sm sm:text-base">Zona de Perigo</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Ações irreversíveis</p>
                  </div>
                </div>
                <Button variant="danger" onClick={() => setDeleteModal(true)} className="w-full text-sm">Excluir Minha Conta</Button>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-3 text-center">Esta ação não pode ser desfeita. Todos os seus dados serão excluídos permanentemente.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={passwordModal} onClose={() => { setPasswordModal(false); setResetPassword(false); setResetToken(''); setNewPassword(''); setConfirmPassword(''); }} title={resetPassword ? 'Nova Senha' : 'Alterar Senha'} size="sm">
        {resetSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-accent" /></div>
            <p className="font-semibold">Senha alterada com sucesso!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resetError && <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">{resetError}</div>}
            <Input label="Nova Senha" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            <Input label="Confirmar Senha" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setPasswordModal(false); setResetPassword(false); setNewPassword(''); setConfirmPassword(''); }}>Cancelar</Button>
              <Button onClick={handleChangePassword} isLoading={isResetting} className="bg-accent">Alterar Senha</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir Conta" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Esta ação é irreversível. Todos os seus dados serão excluídos permanentemente.</p>
          <Input label="Digite sua senha para confirmar" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setDeleteModal(false); setDeletePassword(''); }}>Cancelar</Button>
            <Button variant="danger" onClick={handleDeleteAccount} isLoading={isDeleting}>Excluir Conta</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}