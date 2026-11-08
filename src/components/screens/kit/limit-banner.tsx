'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { WLink } from '@/components/workspace/workspace-context';

export function LimitBanner({ title, description }: { title: string; description: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 rounded-2xl border border-brand-500/25 bg-brand-soft/60 p-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm text-ink-3">{description}</p>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <WLink href="/dashboard/upgrade">Ver o Pro</WLink>
      </Button>
    </motion.div>
  );
}
