'use client';

import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalContainer } from './portal-context';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  side?: 'bottom' | 'right';
  children: React.ReactNode;
  className?: string;
}

/** Glass sheet for secondary navigation on small screens. */
export function Sheet({ open, onOpenChange, title, side = 'bottom', children, className }: SheetProps) {
  const container = usePortalContainer();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/25 backdrop-blur-[2px] data-[state=open]:animate-fade-in dark:bg-black/55" />
        <Dialog.Content
          className={cn(
            'glass-strong fixed z-[61] flex flex-col focus:outline-none',
            side === 'bottom'
              ? 'inset-x-2 bottom-2 max-h-[85dvh] rounded-[28px] data-[state=open]:animate-sheet-up'
              : 'inset-y-2 right-2 w-[min(22rem,calc(100vw-1rem))] rounded-[28px] data-[state=open]:animate-slide-in-right',
            className
          )}
        >
          {side === 'bottom' && <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-ink/15" aria-hidden />}
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <Dialog.Title className="font-display text-base font-semibold text-ink">{title}</Dialog.Title>
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
            <Dialog.Close
              className="flex size-9 items-center justify-center rounded-full text-ink-3 hover:bg-ink/5 hover:text-ink"
              aria-label="Fechar"
            >
              <X className="size-[18px]" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-3 pb-3 safe-pb">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
