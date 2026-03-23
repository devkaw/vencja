'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  TrendingDown, 
  Settings,
  LogOut,
  Crown,
  Shield,
  Menu,
  X,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { hasPremiumAccess } from '@/lib/subscription';
import { useAppStore } from '@/lib/store';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile | null;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/dashboard/clients', icon: Users },
  { name: 'Cobranças', href: '/dashboard/charges', icon: Receipt },
  { name: 'Ranking', href: '/dashboard/ranking', icon: TrendingDown },
  { name: 'Notificações', href: '/dashboard/notifications', icon: Sparkles },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const hasAccess = hasPremiumAccess(profile);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loadNotifications, unreadCount } = useAppStore();

  useEffect(() => {
    async function loadNotifs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await loadNotifications();
      }
    }
    loadNotifs();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[60] p-2 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 hover:border-accent/30 transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-[280px] sm:w-72 bg-white dark:bg-black border-r border-gray-100 dark:border-gray-800 transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full pt-14 sm:pt-16 lg:pt-0">
          <div className="p-4 sm:p-6 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group" onClick={handleLinkClick}>
              <Image 
                src="/logo.png" 
                alt="VenceJa" 
                width={40} 
                height={40}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-black"
              />
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                VenceJa
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5" />
                    {item.name === 'Notificações' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  {item.name}
    
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
            {hasAccess ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-accent/5 rounded-xl border border-accent/20">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-accent block">Vitalício Pro</span>
                  <span className="text-xs text-gray-500">Acesso ilimitado</span>
                </div>
              </div>
            ) : (
              <Link
                href="/dashboard/upgrade"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-accent hover:bg-accent/90 text-black rounded-xl text-sm font-semibold transition-all hover-lift"
              >
                <Crown className="w-4 h-4" />
                Upgrade Vitalício
              </Link>
            )}

            {profile?.is_admin && (
              <Link
                href="/dashboard/admin/payments"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Shield className="w-5 h-5" />
                Admin
              </Link>
            )}

            <a
              href="https://wa.me/5579991526467"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Precisa de ajuda?
            </a>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}