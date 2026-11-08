'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type CardProps = Omit<HTMLMotionProps<'div'>, 'children'> & { interactive?: boolean; children?: ReactNode };

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, interactive, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 22, scale: 0.98 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, margin: '0px 0px -5% 0px' }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ scale: interactive ? 1.03 : 1.012, zIndex: 5, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
    className={cn('surface-card relative', className)}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 pb-0 sm:p-6 sm:pb-0', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 sm:p-6', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

/** Section title row used inside cards: title, optional hint and a trailing action. */
function CardTitle({
  title,
  hint,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-ink-2 [&_svg]:size-[18px]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-ink">{title}</h3>
          {hint && <p className="truncate text-xs text-ink-3">{hint}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export { Card, CardHeader, CardContent, CardFooter, CardTitle };
