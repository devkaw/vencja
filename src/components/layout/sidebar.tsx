'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Receipt,
  TrendingDown,
  Settings,
  LogOut,
  FileBarChart2,
  Gem,
  Plus,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
  Sparkles,
  ChevronRight,
  Search,
} from 'lucide-react';
import { ProTag } from '@/components/ui/pro-tag';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { PLANS } from '@/lib/subscription';
import { Logo, LogoMark } from '@/components/brand/logo';
import { BUBBLE } from '@/components/brand/logo-paths';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Tooltip } from '@/components/ui/tooltip';
import { Sheet } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/data/avatar';
import { useWorkspace } from '@/components/workspace/workspace-context';

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard; pro?: boolean; badge?: 'atraso' };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Operação',
    items: [
      { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Cobranças', href: '/dashboard/charges', icon: Receipt, badge: 'atraso' },
      { name: 'Clientes', href: '/dashboard/clients', icon: Users },
      { name: 'Calendário', href: '/dashboard/calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Análise',
    items: [
      { name: 'Inadimplência', href: '/dashboard/ranking', icon: TrendingDown },
      { name: 'Relatórios', href: '/dashboard/relatorios', icon: FileBarChart2, pro: true },
    ],
  },
  {
    label: 'Conta',
    items: [
      { name: 'Planos', href: '/dashboard/upgrade', icon: Gem },
      { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

const allNav = navGroups.flatMap((g) => g.items);

function isActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
}

async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/';
}

export function Sidebar({ collapsed = false, onToggle, onSearch }: { collapsed?: boolean; onToggle?: () => void; onSearch?: () => void }) {
  const pathname = usePathname();
  const { isPro, userName, email, clients, charges, painel } = useWorkspace();
  const [moreOpen, setMoreOpen] = useState(false);
  const displayName = userName || email.split('@')[0] || 'Você';
  const usage = { clients: clients.length, charges: charges.length };
  const badges = { atraso: painel.qtdAtraso };

  return (
    <>
      {/* ---------- Desktop sidebar: a floating glass panel, like the landing nav ---------- */}
      <aside
        className={cn('glass fixed bottom-3 left-3 top-3 z-40 hidden flex-col rounded-[28px] transition-[width] duration-300 ease-out-expo lg:flex', collapsed ? 'w-[84px]' : 'w-64')}
        aria-label="Navegação principal"
      >
        <div className={cn('flex h-[72px] shrink-0 items-center px-4', collapsed ? 'justify-center' : 'justify-between')}>
          <Link href="/dashboard" className="rounded-lg" aria-label="VenceJá — Painel">
            {collapsed ? <LogoMark size={38} /> : <Logo markSize={38} />}
          </Link>
          {!collapsed && (
            <button onClick={onToggle} className="flex size-8 items-center justify-center rounded-lg text-ink-4 transition-colors hover:bg-ink/5 hover:text-ink-2" aria-label="Recolher menu">
              <PanelLeftClose className="size-[18px]" />
            </button>
          )}
        </div>

        <nav className="hide-scrollbar flex-1 space-y-4 overflow-y-auto px-3 py-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && <p className="mb-1 px-3 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-4">{group.label}</p>}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} locked={item.pro && !isPro} badge={item.badge ? badges[item.badge] : 0} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-2 p-3">
          {!collapsed && <PlanCard hasAccess={isPro} usage={usage} />}
          {collapsed && (
            <Tooltip content="Expandir menu" side="right">
              <button onClick={onToggle} className="flex h-10 w-full items-center justify-center rounded-xl text-ink-3 hover:bg-ink/5 hover:text-ink" aria-label="Expandir menu">
                <PanelLeftOpen className="size-[18px]" />
              </button>
            </Tooltip>
          )}
          <div className={cn('flex items-center gap-2 rounded-xl', collapsed ? 'flex-col' : 'px-1')}>
            {!collapsed && (
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Avatar name={displayName} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{displayName}</p>
                  <p className="truncate text-xs text-ink-3">{email}</p>
                </div>
              </div>
            )}
            <Tooltip content="Sair" side={collapsed ? 'right' : 'top'}>
              <button onClick={signOut} className="flex size-10 items-center justify-center rounded-xl text-ink-3 transition-colors hover:bg-neg-soft hover:text-neg" aria-label="Sair da conta">
                <LogOut className="size-[18px]" />
              </button>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* ---------- Mobile top bar ---------- */}
      <header className="glass fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between rounded-none px-4 pt-[env(safe-area-inset-top)] lg:hidden [&::after]:hidden">
        <Link href="/dashboard" aria-label="VenceJá — Painel">
          <Logo markSize={32} />
        </Link>
        <div className="flex items-center gap-1">
          {!isPro && (
            <Link href="/dashboard/upgrade" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-soft px-3 text-xs font-semibold text-brand-ink">
              <Sparkles className="size-3.5" />
              Pro
            </Link>
          )}
          <button onClick={onSearch} className="flex size-11 items-center justify-center rounded-xl text-ink-2" aria-label="Buscar">
            <Search className="size-5" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* ---------- Mobile bottom tab bar ---------- */}
      <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden" style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }} aria-label="Navegação principal">
        <div className="glass grid h-16 grid-cols-5 items-center rounded-[22px] px-1.5">
          <TabLink href="/dashboard" icon={LayoutDashboard} label="Painel" active={isActive(pathname, '/dashboard')} />
          <TabLink href="/dashboard/charges" icon={Receipt} label="Cobranças" active={isActive(pathname, '/dashboard/charges') && pathname !== '/dashboard/charges/new'} badge={painel.qtdAtraso} />
          <div className="flex justify-center">
            <Link href="/dashboard/charges/new" className="glass-brand flex size-12 items-center justify-center rounded-2xl text-white transition-transform duration-300 ease-spring hover:scale-110 active:scale-90" aria-label="Nova cobrança">
              <Plus className="size-6" />
            </Link>
          </div>
          <TabLink href="/dashboard/clients" icon={Users} label="Clientes" active={isActive(pathname, '/dashboard/clients')} />
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex h-full flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-medium transition-colors',
              ['/dashboard/calendar', '/dashboard/ranking', '/dashboard/relatorios', '/dashboard/upgrade', '/dashboard/settings'].some((h) => pathname.startsWith(h)) ? 'text-brand-ink' : 'text-ink-3'
            )}
            aria-haspopup="dialog"
          >
            <MoreHorizontal className="size-[22px]" />
            Mais
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="Menu">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/dashboard/clients/new', label: 'Novo cliente', icon: UserPlus },
              { href: '/dashboard/charges/new', label: 'Nova cobrança', icon: Plus },
            ].map((a) => (
              <Link key={a.href} href={a.href} onClick={() => setMoreOpen(false)} className="flex items-center gap-2.5 rounded-2xl bg-surface/70 p-3 text-sm font-medium text-ink">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
                  <a.icon className="size-[18px]" />
                </span>
                {a.label}
              </Link>
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl bg-surface/70">
            {allNav.slice(3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn('flex items-center gap-3 border-b border-line/70 px-4 py-3.5 text-[15px] font-medium last:border-0', isActive(pathname, item.href) ? 'text-brand-ink' : 'text-ink')}
              >
                <item.icon className="size-5 text-ink-3" />
                <span className="flex-1">{item.name}</span>
                {item.pro && !isPro && <ProTag />}
                <ChevronRight className="size-4 text-ink-4" />
              </Link>
            ))}
          </div>
          <PlanCard hasAccess={isPro} usage={usage} onNavigate={() => setMoreOpen(false)} />
          <div className="flex items-center gap-2 rounded-2xl bg-surface/70 p-2">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1">
              <Avatar name={displayName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{displayName}</p>
                <p className="truncate text-xs text-ink-3">{email}</p>
              </div>
            </div>
            <button onClick={signOut} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-neg hover:bg-neg-soft">
              <LogOut className="size-4" />
              Sair
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

function NavLink({ item, active, collapsed, locked, badge = 0 }: { item: NavItem; active: boolean; collapsed: boolean; locked?: boolean; badge?: number }) {
  const link = (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative isolate flex h-10 items-center gap-3 rounded-xl text-sm font-medium transition-[background-color,color,transform] duration-300 ease-spring hover:scale-[1.04] active:scale-95',
        collapsed ? 'justify-center' : 'px-3',
        active ? 'text-brand-ink' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink'
      )}
    >
      {active && (
        <>
          <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-xl bg-brand-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.5)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
          <motion.span layoutId="nav-bar" className="absolute -left-3 top-2 h-6 w-1 rounded-r-full bg-brand-500" transition={{ type: 'spring', stiffness: 420, damping: 34 }} aria-hidden />
        </>
      )}
      <item.icon className={cn('size-[18px] shrink-0 transition-transform duration-300 ease-spring group-hover:-rotate-6 group-hover:scale-125', active ? 'text-brand-ink' : 'text-ink-3 group-hover:text-ink-2')} />
      {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
      {!collapsed && locked && <ProTag />}
      {badge > 0 && (
        <span className={cn('rounded-md bg-neg-soft text-2xs font-semibold text-neg tnum', collapsed ? 'absolute right-1 top-0.5 px-1' : 'px-1.5 py-0.5')} aria-label={`${badge} em atraso`}>
          {badge}
        </span>
      )}
    </Link>
  );
  return collapsed ? (
    <Tooltip content={item.name} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function TabLink({ href, icon: Icon, label, active, badge = 0 }: { href: string; icon: typeof LayoutDashboard; label: string; active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex h-full flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-medium transition-colors',
        active ? 'text-brand-ink' : 'text-ink-3'
      )}
    >
      <motion.span animate={{ y: active ? -2 : 0, scale: active ? 1.12 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}>
        <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 1.9} />
      </motion.span>
      {label}
      {badge > 0 && <span className="absolute right-1.5 top-2 min-w-4 rounded-full bg-neg px-1 text-center text-[9px] font-bold leading-4 text-white dark:text-canvas tnum">{badge}</span>}
      {active && <motion.span layoutId="tab-dot" className="absolute bottom-1 h-1 w-4 rounded-full bg-brand-500" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
    </Link>
  );
}

function PlanCard({ hasAccess, usage, onNavigate }: { hasAccess: boolean; usage?: { clients: number; charges: number } | null; onNavigate?: () => void }) {
  if (hasAccess) {
    return (
      <Link
        href="/dashboard/settings?secao=plan"
        onClick={onNavigate}
        aria-label="Plano Pro ativo. Ver detalhes do plano"
        className="glass-brand group relative block overflow-hidden rounded-2xl p-3.5 text-white transition-transform duration-300 ease-spring hover:scale-[1.03] active:scale-[0.98]"
      >
        <svg viewBox="0 0 64 64" className="pointer-events-none absolute -bottom-6 -right-5 size-24 rotate-[-10deg] text-white/[0.09] transition-transform duration-500 ease-spring group-hover:rotate-[-4deg] group-hover:scale-110" aria-hidden>
          <path d={BUBBLE} fill="currentColor" />
        </svg>
        <div className="relative flex items-center justify-between">
          <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-white/70">Seu plano</span>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-inset ring-white/25">
            <span className="size-1.5 rounded-full bg-[#7CF0B8] shadow-[0_0_6px_#7CF0B8]" aria-hidden />
            Ativo
          </span>
        </div>
        <p className="relative mt-1.5 font-display text-xl font-bold leading-none tracking-[-0.02em]">
          Pro<span className="text-white/60">.</span>
        </p>
        <p className="relative mt-1.5 text-xs leading-snug text-white/75">Clientes, cobranças e WhatsApp sem limite</p>
      </Link>
    );
  }

  const { maxClients, maxCharges } = PLANS.free.limits;
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-3.5 dark:bg-surface-2/60">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Plano Grátis</p>
        <span className="text-2xs font-medium uppercase tracking-wide text-ink-4">Uso</span>
      </div>
      {usage && (
        <div className="mb-3 space-y-2.5">
          <UsageRow label="Clientes" used={usage.clients} max={maxClients} />
          <UsageRow label="Cobranças" used={usage.charges} max={maxCharges} />
        </div>
      )}
      <Link
        href="/dashboard/upgrade"
        onClick={onNavigate}
        className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-ink text-sm font-semibold text-canvas transition-[opacity,transform] duration-300 ease-spring hover:scale-[1.04] hover:opacity-90 active:scale-95"
      >
        <Sparkles className="size-3.5" />
        Liberar tudo com o Pro
      </Link>
    </div>
  );
}

function UsageRow({ label, used, max }: { label: string; used: number; max: number }) {
  const near = used >= max;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-ink-3">{label}</span>
        <span className={cn('font-medium tnum', near ? 'text-warn' : 'text-ink-2')}>
          {Math.min(used, max)}/{max}
        </span>
      </div>
      <Progress value={used} max={max} color={near ? 'warning' : 'primary'} label={`${label}: ${used} de ${max}`} />
    </div>
  );
}
