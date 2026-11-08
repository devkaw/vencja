'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { ScrollProgress } from '@/components/motion/primitives';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useIsLoggedIn } from './use-session';
import { cn } from '@/lib/utils';

const links = [
  { href: '#demo', label: 'Demonstração' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#precos', label: 'Preços' },
  { href: '#duvidas', label: 'Dúvidas' },
];

export function MarketingNav() {
  const loggedIn = useIsLoggedIn();
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      setPastHero(window.scrollY > 720);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlights the menu item of the section currently on screen.
  useEffect(() => {
    const sections = links.map((l) => document.querySelector(l.href)).filter(Boolean) as Element[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`);
          else setActiveSection((cur) => (cur === `#${entry.target.id}` ? '' : cur));
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <ScrollProgress />
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4"
      >
        <nav
          aria-label="Principal"
          className={cn(
            'mx-auto flex h-[68px] max-w-5xl items-center justify-between rounded-2xl pl-4 pr-2.5 transition-all duration-500 ease-out-expo',
            scrolled ? 'glass' : 'bg-transparent'
          )}
        >
          <Link href="/" aria-label="VenceJá — início" className="rounded-lg">
            <Logo markSize={38} />
          </Link>

          <ul className="hidden items-center gap-0.5 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className={cn(
                    'relative inline-block rounded-lg px-3 py-2 text-sm font-medium transition-[color,transform] duration-200 hover:scale-105',
                    activeSection === l.href ? 'text-brand-ink' : 'text-ink-2 hover:text-ink'
                  )}
                >
                  {activeSection === l.href && (
                    <motion.span layoutId="landing-nav-pill" className="absolute inset-0 -z-10 rounded-lg bg-brand-soft" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                  )}
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            <ThemeToggle className="hidden sm:inline-flex" />
            {loggedIn ? (
              <Button asChild size="sm" className="h-10">
                <Link href="/dashboard">
                  Abrir painel
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-2 hover:text-ink sm:block">
                  Entrar
                </Link>
                <Button asChild size="sm" className="hidden h-10 sm:inline-flex">
                  <Link href="/register">Criar conta grátis</Link>
                </Button>
              </>
            )}
            <button
              onClick={() => setOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl text-ink-2 hover:bg-ink/5 lg:hidden"
              aria-label="Abrir menu"
              aria-haspopup="dialog"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </nav>
      </motion.header>

      <Sheet open={open} onOpenChange={setOpen} title="Menu">
        <div className="space-y-3">
          <ul className="overflow-hidden rounded-2xl bg-surface/70">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="block border-b border-line/70 px-4 py-3.5 text-[15px] font-medium text-ink last:border-0">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between rounded-2xl bg-surface/70 px-2 py-1">
            <span className="px-2 text-sm text-ink-3">Tema</span>
            <ThemeToggle withLabel className="w-auto" />
          </div>
          {loggedIn ? (
            <Button asChild size="lg" className="w-full">
              <Link href="/dashboard">Abrir painel</Link>
            </Button>
          ) : (
            <div className="grid gap-2">
              <Button asChild size="lg" className="w-full">
                <Link href="/register">Criar conta grátis</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="w-full">
                <Link href="/login">Entrar</Link>
              </Button>
            </div>
          )}
        </div>
      </Sheet>

      {/* Mobile sticky CTA once the hero is out of view */}
      <AnimatePresence>
        {pastHero && !loggedIn && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed inset-x-3 z-40 sm:hidden"
            style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <div className="glass flex items-center gap-3 rounded-2xl p-2 pl-4">
              <p className="flex-1 text-sm font-medium leading-tight text-ink">
                Grátis até 3 clientes
                <span className="block text-xs font-normal text-ink-3">Sem cartão de crédito</span>
              </p>
              <Button asChild size="md">
                <Link href="/register">Criar conta</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
