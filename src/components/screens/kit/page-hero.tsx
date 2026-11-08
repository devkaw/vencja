'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { AnimatedWords } from '@/components/motion/primitives';
import { WLink } from '@/components/workspace/workspace-context';

interface PageHeroProps {
  eyebrow?: React.ReactNode;
  title: string;
  /** Second phrase, in the landing's green gradient. */
  highlight?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

export function PageHero({ eyebrow, title, highlight, description, actions, backHref, backLabel = 'Voltar' }: PageHeroProps) {
  return (
    <header className="relative isolate pt-1">
      <div className="dot-grid pointer-events-none absolute -inset-x-6 -top-8 bottom-0 -z-10 opacity-60 [mask-image:radial-gradient(60%_90%_at_20%_20%,#000,transparent)]" aria-hidden />
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
        animate={{ opacity: 0.06, scale: 1, rotate: -8 }}
        transition={{ duration: 1.2, ease }}
        className="pointer-events-none absolute -right-16 -top-16 -z-10 hidden @4xl:block"
      >
        <LogoMark size={260} />
      </motion.div>

      <div className="flex flex-col gap-5 @2xl:flex-row @2xl:items-end @2xl:justify-between">
        <div className="min-w-0 max-w-2xl">
          {backHref && (
            <WLink href={backHref} className="mb-3 flex min-h-11 w-fit items-center gap-1.5 rounded-lg text-sm font-medium text-ink-3 transition-colors hover:text-ink @2xl:min-h-0">
              <ArrowLeft className="size-4" />
              {backLabel}
            </WLink>
          )}
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="break-words font-display text-[clamp(1.9rem,4.4cqw,3rem)] font-bold leading-[1.05] tracking-[-0.03em] text-ink">
            <AnimatedWords key={title} onMount text={title} />
            {highlight && (
              <>
                {' '}
                <AnimatedWords key={highlight} onMount delay={0.18} text={highlight} wordClassName="bg-gradient-to-br from-brand-500 to-brand-800 bg-clip-text pb-[0.1em] text-transparent dark:from-brand-ink dark:to-brand-ink" />
              </>
            )}
          </h1>
          {description && (
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25, ease }} className="mt-3 text-[15px] leading-relaxed text-ink-2 @2xl:text-base">
              {description}
            </motion.p>
          )}
        </div>
        {actions && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35, ease }} className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </motion.div>
        )}
      </div>
    </header>
  );
}
