'use client';

import { Suspense, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MotionConfig, motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { CommandPalette } from '@/components/layout/command-palette';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SupabaseWorkspace } from '@/components/workspace/supabase-workspace';
import { PaymentProvider } from '@/components/screens/kit/payment-context';
import { cn } from '@/lib/utils';

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [search, setSearch] = useState(false);
  // The layout only renders after the client-side auth check, so reading storage here is safe.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('sidebar-collapsed', String(next));
    } catch {
      // ignore blocked storage
    }
  };

  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas text-ink">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lift">
        Pular para o conteúdo
      </a>
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-[8%] -top-[12%] size-[50vw] animate-drift rounded-full bg-brand-500/[0.14] blur-[90px] dark:bg-brand-500/30" />
        <div className="absolute -right-[10%] top-[5%] size-[40vw] animate-drift rounded-full bg-brand-300/25 blur-[100px] [animation-delay:-7s] dark:bg-brand-400/15" />
        <div className="absolute bottom-[-15%] left-[30%] size-[45vw] animate-drift rounded-full bg-brand-400/[0.12] blur-[110px] [animation-delay:-14s] dark:bg-brand-500/15" />
      </div>
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} onSearch={() => setSearch(true)} />
      <CommandPalette open={search} onOpenChange={setSearch} />
      <div className={cn('relative transition-[padding] duration-300 ease-out-expo', collapsed ? 'lg:pl-[108px]' : 'lg:pl-[280px]')}>
        <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[1240px] px-4 pb-28 pt-[4.75rem] sm:px-6 lg:px-6 lg:pb-12 lg:pt-3">
          <TopBar onSearch={() => setSearch(true)} />
          <motion.div key={pathname} className="@container" initial={{ opacity: 0, y: 26, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <SupabaseWorkspace>
          <PaymentProvider>
            <Suspense fallback={null}>
              <Shell>{children}</Shell>
            </Suspense>
          </PaymentProvider>
        </SupabaseWorkspace>
      </TooltipProvider>
    </MotionConfig>
  );
}
