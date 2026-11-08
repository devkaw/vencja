'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, FileBarChart2, LayoutDashboard, Plus, Receipt, Search, TrendingDown, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { PortalContainerProvider } from '@/components/ui/portal-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CommandPalette } from '@/components/layout/command-palette';
import { PaymentProvider } from '@/components/screens/kit/payment-context';
import { CalendarScreen } from '@/components/screens/calendar-screen';
import { ChargeDetailScreen } from '@/components/screens/charge-detail-screen';
import { ChargeFormScreen } from '@/components/screens/charge-form-screen';
import { ChargesScreen } from '@/components/screens/charges-screen';
import { ClientDetailScreen } from '@/components/screens/client-detail-screen';
import { ClientFormScreen } from '@/components/screens/client-form-screen';
import { ClientsScreen } from '@/components/screens/clients-screen';
import { PainelScreen } from '@/components/screens/painel-screen';
import { RankingScreen } from '@/components/screens/ranking-screen';
import { ReportsScreen } from '@/components/screens/reports-screen';
import { DemoWorkspace } from '@/components/workspace/demo-workspace';
import { useWorkspace, WorkspaceNavProvider } from '@/components/workspace/workspace-context';
import { cn } from '@/lib/utils';
import { createDemoData } from './demo-data';

const itens: { href: string; nome: string; icon: LucideIcon }[] = [
  { href: '/dashboard', nome: 'Painel', icon: LayoutDashboard },
  { href: '/dashboard/charges', nome: 'Cobranças', icon: Receipt },
  { href: '/dashboard/clients', nome: 'Clientes', icon: Users },
  { href: '/dashboard/calendar', nome: 'Calendário', icon: CalendarDays },
  { href: '/dashboard/ranking', nome: 'Inadimplência', icon: TrendingDown },
  { href: '/dashboard/relatorios', nome: 'Relatórios', icon: FileBarChart2 },
];

function ativo(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
}

function Tela({ pathname, onWhatsApp }: { pathname: string; onWhatsApp: () => void }) {
  const [area, sub] = pathname.split('/').slice(2);
  if (area === 'charges') {
    if (sub === 'new') return <ChargeFormScreen />;
    if (sub) return <ChargeDetailScreen id={sub} onWhatsApp={onWhatsApp} />;
    return <ChargesScreen onWhatsApp={onWhatsApp} />;
  }
  if (area === 'clients') {
    if (sub === 'new') return <ClientFormScreen />;
    if (sub) return <ClientDetailScreen id={sub} onWhatsApp={onWhatsApp} />;
    return <ClientsScreen />;
  }
  if (area === 'calendar') return <CalendarScreen onWhatsApp={onWhatsApp} />;
  if (area === 'ranking') return <RankingScreen onWhatsApp={onWhatsApp} />;
  if (area === 'relatorios') return <ReportsScreen />;
  if (area === 'upgrade' || area === 'settings') {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="font-display text-xl font-semibold text-ink">Planos e configurações ficam na sua conta</p>
        <p className="mt-2 max-w-sm text-sm text-ink-3">Crie uma conta grátis para ver essas telas com os seus dados.</p>
        <Button asChild className="mt-5">
          <Link href="/register">Criar conta grátis</Link>
        </Button>
      </div>
    );
  }
  return <PainelScreen onWhatsApp={onWhatsApp} />;
}

function Janela({ onWhatsApp, onScore }: { onWhatsApp: () => void; onScore: () => void }) {
  const { painel } = useWorkspace();
  const [caminho, setCaminho] = useState('/dashboard');
  const [busca, setBusca] = useState(false);
  const rolagem = useRef<HTMLDivElement>(null);
  const pathname = caminho.split('?')[0];

  const params = useMemo(() => new URLSearchParams(caminho.split('?')[1] || ''), [caminho]);
  const push = useCallback(
    (href: string) => {
      setCaminho(href);
      rolagem.current?.scrollTo({ top: 0 });
      if (href.startsWith('/dashboard/clients')) onScore();
    },
    [onScore]
  );
  const nav = useMemo(() => ({ params, push }), [params, push]);

  return (
    <WorkspaceNavProvider value={nav}>
      <PaymentProvider>
      <CommandPalette open={busca} onOpenChange={setBusca} shortcut={false} />
      <div className="flex h-[720px] flex-col md:flex-row">
        <nav className="shrink-0 border-b border-line/70 p-2 md:w-[200px] md:border-b-0 md:border-r md:p-3" aria-label="Seções da demonstração">
          <div className="hidden items-center gap-2 px-2 pb-3 md:flex">
            <LogoMark size={28} />
            <span className="font-display text-sm font-semibold text-ink">VenceJá</span>
          </div>
          <ul className="hide-scrollbar flex gap-1 overflow-x-auto md:flex-col md:gap-0.5">
            {itens.map((item) => {
              const on = ativo(pathname, item.href);
              return (
                <li key={item.href} className="shrink-0">
                  <button onClick={() => nav.push(item.href)} aria-current={on ? 'page' : undefined} className={cn('flex h-11 w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-[background-color,color,transform] duration-300 ease-spring hover:scale-[1.04]', on ? 'bg-brand-soft text-brand-ink' : 'text-ink-2 hover:bg-ink/[0.04]')}>
                    <item.icon className="size-4" />
                    {item.nome}
                    {item.href === '/dashboard/charges' && painel.qtdAtraso > 0 && <span className="ml-auto rounded-md bg-neg-soft px-1.5 text-2xs font-semibold text-neg tnum">{painel.qtdAtraso}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 hidden space-y-2 md:block">
            <button onClick={() => nav.push('/dashboard/charges/new')} className="glass-brand flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white">
              <Plus className="size-4" />
              Nova cobrança
            </button>
            <button onClick={() => setBusca(true)} className="flex h-11 w-full items-center gap-2 rounded-xl bg-ink/[0.05] px-3 text-sm text-ink-3">
              <Search className="size-4" />
              Buscar
            </button>
          </div>
        </nav>

        <div ref={rolagem} className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-canvas/40 p-4 sm:p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={caminho} className="@container" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <Tela pathname={pathname} onWhatsApp={onWhatsApp} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      </PaymentProvider>
    </WorkspaceNavProvider>
  );
}

export default function DemoApp({ resetKey, onGoal }: { resetKey: number; onGoal: (goal: 'pago' | 'whatsapp' | 'nova' | 'score') => void }) {
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const onEvent = useCallback((e: 'pagamento' | 'cobranca') => onGoal(e === 'pagamento' ? 'pago' : 'nova'), [onGoal]);
  const onWhatsApp = useCallback(() => onGoal('whatsapp'), [onGoal]);
  const onScore = useCallback(() => onGoal('score'), [onGoal]);

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        {/* The transform makes this box the containing block of fixed overlays, so modals stay in the window. */}
        <div ref={setPortal} className="relative isolate [transform:translateZ(0)]">
          <PortalContainerProvider value={portal}>
            <DemoWorkspace key={resetKey} initial={createDemoData} resetKey={resetKey} onEvent={onEvent}>
              <Janela onWhatsApp={onWhatsApp} onScore={onScore} />
            </DemoWorkspace>
          </PortalContainerProvider>
        </div>
      </TooltipProvider>
    </MotionConfig>
  );
}
