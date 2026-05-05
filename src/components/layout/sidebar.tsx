'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Calendar,
  Users, 
  Receipt, 
  TrendingDown, 
  Settings,
  LogOut,
  Crown,
  Menu,
  X,
  Sparkles,
  BarChart3,
  ChevronLeft,
  FileText,
  CreditCard
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { hasPremiumAccess } from '@/lib/subscription';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile | null;
  collapsed?: boolean;
  onToggle?: () => void;
}

const navigation = [
  { name: 'Financeiro', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendário', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Clientes', href: '/dashboard/clients', icon: Users },
  { name: 'Cobranças', href: '/dashboard/charges', icon: Receipt },
  { name: 'Ranking', href: '/dashboard/ranking', icon: TrendingDown },
  { name: 'Relatórios', href: '/dashboard/relatorios', icon: FileText },
  { name: 'Planos', href: '/dashboard/upgrade', icon: CreditCard },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar({ profile, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const hasAccess = hasPremiumAccess(profile);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        className="lg:hidden fixed top-2 left-2 z-50 p-1.5 glass-card rounded-lg border border-white/10 hover:border-accent/30 transition-all"
      >
        <Menu className="w-4 h-4" />
      </button>

      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed left-0 top-0 z-50 h-full glass-card border-r border-white/10 transition-all duration-300',
        collapsed ? 'w-16' : 'w-16 lg:w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 group" onClick={handleLinkClick}>
              <Image 
                src="/logo.png" 
                alt="VenceJa" 
                width={32} 
                height={32}
                className="w-8 h-8 rounded-lg object-contain"
              />
              <span className={cn("text-lg font-light hidden", !collapsed && "lg:block")}>VenceJa</span>
            </Link>
            <button
              onClick={onToggle}
              className="hidden lg:flex p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center justify-center lg:justify-between gap-2 lg:gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-light transition-all duration-200',
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className={cn("hidden", !collapsed && "lg:block")}>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/10 space-y-2">
            {hasAccess ? (
              <div className={cn("flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-3 bg-accent/10 rounded-xl border border-accent/20", collapsed && "justify-center")}>
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <div className={cn("hidden", !collapsed && "lg:block")}>
                  <span className="text-sm font-light text-accent block">Plano Pro</span>
                  <span className="text-xs text-slate-500">Acesso ilimitado</span>
                </div>
              </div>
            ) : (
              <Link
                href="/dashboard/upgrade"
                onClick={handleLinkClick}
                className={cn("flex items-center justify-center gap-2 px-2 lg:px-3 py-3 bg-accent text-black rounded-xl text-sm font-light transition-all hover-lift", collapsed && "px-2")}
              >
                <Crown className="w-4 h-4" />
                <span className={cn("hidden", !collapsed && "lg:block")}>Upgrade Pro</span>
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className={cn("flex items-center justify-center gap-2 w-full px-2 lg:px-3 py-2 rounded-xl text-sm font-light text-slate-400 hover:bg-white/5 hover:text-white transition-colors", collapsed && "px-2")}
            >
              <LogOut className="w-5 h-5" />
              <span className={cn("hidden", !collapsed && "lg:block")}>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}