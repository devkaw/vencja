'use client';

import { Dialog, VisuallyHidden } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalContainer } from './portal-context';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Visual tone of the header icon area. */
  tone?: 'default' | 'danger';
  icon?: React.ReactNode;
}

const sizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

/**
 * Accessible dialog (focus trap, Esc, scroll lock via Radix).
 * On phones it docks to the bottom like a sheet; on larger screens it is centered.
 */
export function Modal({ isOpen, onClose, title, description, children, size = 'md', tone = 'default', icon }: ModalProps) {
  const container = usePortalContainer();
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-[3px] data-[state=open]:animate-fade-in dark:bg-black/60" />
        <div className="pointer-events-none fixed inset-0 z-[61] flex items-end justify-center sm:items-center sm:p-6">
          <Dialog.Content
            className={cn(
              'glass-strong pointer-events-auto relative flex max-h-[92dvh] w-full flex-col overflow-hidden',
              'rounded-t-[28px] sm:rounded-3xl',
              'data-[state=open]:animate-sheet-up sm:data-[state=open]:animate-scale-in',
              'focus:outline-none',
              sizes[size]
            )}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-ink/15 sm:hidden" aria-hidden />
            {title ? (
              <div className="flex shrink-0 items-start gap-3 px-5 pb-1 pt-4 sm:px-6 sm:pt-6">
                {icon && (
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-2xl [&_svg]:size-5',
                      tone === 'danger' ? 'bg-neg-soft text-neg' : 'bg-brand-soft text-brand-ink'
                    )}
                  >
                    {icon}
                  </div>
                )}
                <div className="min-w-0 flex-1 pt-0.5">
                  <Dialog.Title className="font-display text-lg font-semibold tracking-tight text-ink">{title}</Dialog.Title>
                  {description ? (
                    <Dialog.Description className="mt-1 text-sm text-ink-3">{description}</Dialog.Description>
                  ) : (
                    <VisuallyHidden.Root>
                      <Dialog.Description>{title}</Dialog.Description>
                    </VisuallyHidden.Root>
                  )}
                </div>
                <Dialog.Close
                  className="-mr-1.5 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-ink/5 hover:text-ink"
                  aria-label="Fechar"
                >
                  <X className="size-[18px]" />
                </Dialog.Close>
              </div>
            ) : (
              <VisuallyHidden.Root>
                <Dialog.Title>Janela</Dialog.Title>
                <Dialog.Description>Conteúdo da janela</Dialog.Description>
              </VisuallyHidden.Root>
            )}
            <div className="overflow-y-auto px-5 pb-6 pt-4 safe-pb sm:px-6 sm:pb-6">{children}</div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
