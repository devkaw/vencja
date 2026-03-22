'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Trash2, Check, AlertTriangle, Clock, X, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useAppStore, type Notification } from '@/lib/store';
import { formatCurrency, isVencido, calcularDiasAtraso } from '@/lib/utils';

export default function NotificationsPage() {
  const [charges, setCharges] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const { notifications, loadNotifications, markAllAsRead, removeNotification, clearAllNotifications, unreadCount } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await loadNotifications();

      const { data: chargesData } = await supabase
        .from('charges')
        .select('*, client:clients(nome)')
        .eq('user_id', user.id)
        .eq('status', 'pendente');

      setCharges(chargesData || []);
    }
    loadData();
  }, []);

  const upcomingCharges = charges.filter(c => {
    const daysUntil = Math.ceil((new Date(c.data_vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil > 0;
  });

  const overdueCharges = charges.filter(c => isVencido(c.data_vencimento));

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'danger': return <AlertTriangle className="w-5 h-5 text-danger" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success': return <Check className="w-5 h-5 text-accent" />;
      case 'plan': return <Sparkles className="w-5 h-5 text-accent" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'danger': return 'bg-danger/10 border-danger/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'success': return 'bg-accent/10 border-accent/30';
      case 'plan': return 'bg-accent/10 border-accent/30';
      default: return 'bg-gray-800 border-gray-700';
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Avisos e alertas do sistema</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead} className="hover-lift w-full sm:w-auto text-sm">
            <Check className="w-4 h-4 mr-2" />
            Marcar todas
          </Button>
        )}
      </div>

      {unreadCount > 0 && (
        <div className={`glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-accent/10 border-accent/30 opacity-0 ${mounted ? 'animate-fade-up animate-delay-100' : ''}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-sm sm:text-base">{unreadCount} nova{unreadCount > 1 ? 's' : ''} notificação{unreadCount > 1 ? 's' : ''}</p>
              <p className="text-xs sm:text-sm text-gray-400">Você tem notificações não lidas</p>
            </div>
          </div>
        </div>
      )}

      {upcomingCharges.length > 0 && (
        <div className={`opacity-0 ${mounted ? 'animate-fade-up animate-delay-200' : ''}`}>
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            A Vencer
            <Badge className="bg-yellow-500/20 text-yellow-500 text-xs">{upcomingCharges.length}</Badge>
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {upcomingCharges.map(charge => {
              const daysUntil = Math.ceil((new Date(charge.data_vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Link key={charge.id} href={`/dashboard/charges/${charge.id}`}>
                  <div className="glass-card rounded-xl p-3 sm:p-4 hover-lift cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 border-l-2 sm:border-l-4 border-l-yellow-500">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{charge.client?.nome}</p>
                        <p className="text-xs text-gray-400 truncate">{charge.descricao || 'Cobrança'}</p>
                      </div>
                    </div>
                    <div className="text-right w-full sm:w-auto sm:ml-4">
                      <p className="font-bold text-yellow-500 text-sm sm:text-base">{formatCurrency(Number(charge.valor))}</p>
                      <p className="text-xs text-gray-400">{daysUntil === 1 ? 'Vence amanhã' : `Vence em ${daysUntil} dias`}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {overdueCharges.length > 0 && (
        <div className={`opacity-0 ${mounted ? 'animate-fade-up animate-delay-300' : ''}`}>
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-danger" />
            Atrasos
            <Badge className="bg-danger/20 text-danger text-xs">{overdueCharges.length}</Badge>
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {overdueCharges.map(charge => {
              const dias = calcularDiasAtraso(charge.data_vencimento);
              return (
                <Link key={charge.id} href={`/dashboard/charges/${charge.id}`}>
                  <div className="glass-card rounded-xl p-3 sm:p-4 hover-lift cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 border-l-2 sm:border-l-4 border-l-danger">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-danger/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-danger" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{charge.client?.nome}</p>
                        <p className="text-xs text-gray-400">{dias} dias em atraso</p>
                      </div>
                    </div>
                    <div className="text-right w-full sm:w-auto sm:ml-4">
                      <p className="font-bold text-danger text-sm sm:text-base">{formatCurrency(Number(charge.valor))}</p>
                      <p className="text-xs text-gray-400 truncate">{charge.descricao || 'Cobrança'}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div className={`opacity-0 ${mounted ? 'animate-fade-up animate-delay-400' : ''}`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              Histórico
            </h2>
            <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="text-xs sm:text-sm">
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Limpar tudo</span>
            </Button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {notifications.map(notification => (
              <div key={notification.id} className={`glass-card rounded-xl p-3 sm:p-4 border ${getNotificationBg(notification.type)} ${!notification.read ? 'border-l-2 sm:border-l-4' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationBg(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base">{notification.title}</p>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">{notification.message}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">
                        {new Date(notification.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                    {notification.link && (
                      <Link href={notification.link}>
                        <Button variant="ghost" size="sm" className="p-1 sm:p-2">
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </Link>
                    )}
                    <Button variant="ghost" size="sm" className="p-1 sm:p-2" onClick={() => removeNotification(notification.id)}>
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notifications.length === 0 && upcomingCharges.length === 0 && overdueCharges.length === 0 && (
        <div className="glass-card rounded-2xl sm:rounded-3xl py-12 sm:py-16 text-center opacity-0 animate-fade-up animate-delay-200">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Tudo em dia!</h3>
          <p className="text-gray-400 text-sm sm:text-base">Você não tem notificações no momento</p>
        </div>
      )}
    </div>
  );
}