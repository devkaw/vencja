'use client';

import { useRef } from 'react';
import {
  MotionConfig,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type HTMLMotionProps,
  type Variants,
} from 'framer-motion';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

/** Respects the OS "reduce motion" setting for every animation below it. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  scale?: number;
}

/** Fades and rises into place the first time it scrolls into view. */
export function Reveal({ children, delay = 0, y = 22, x = 0, scale = 1, className, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const containerVariants = (stagger: number, delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease } },
};

/** Children wrapped in <StaggerItem> animate in one after another. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  as = 'div',
  onMount,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  as?: 'div' | 'ul' | 'ol' | 'section';
  /** Animate on mount instead of on scroll (for above-the-fold content). */
  onMount?: boolean;
}) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      variants={containerVariants(stagger, delay)}
      initial="hidden"
      {...(onMount ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '0px 0px -10% 0px' } })}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({ children, className, as = 'div' }: { children: React.ReactNode; className?: string; as?: 'div' | 'li' | 'article' }) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp variants={itemVariants} className={className}>
      {children}
    </Comp>
  );
}

/** Liquid-glass surface that grows toward the cursor and settles back with a spring. */
export function GlassPanel({
  children,
  className,
  strong,
  lift = true,
  grow = 1.035,
  ...rest
}: Omit<HTMLMotionProps<'div'>, 'children'> & { children: React.ReactNode; strong?: boolean; lift?: boolean; grow?: number }) {
  return (
    <motion.div
      whileHover={lift ? { scale: grow, zIndex: 10 } : undefined}
      whileTap={lift ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('relative overflow-hidden', strong ? 'glass-strong' : 'glass', className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Headline that rises in word by word. Real text stays selectable and readable by screen readers. */
export function AnimatedWords({
  text,
  className,
  wordClassName,
  onMount,
  delay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  onMount?: boolean;
  delay?: number;
}) {
  const word: Variants = {
    hidden: { opacity: 0, y: '0.6em', rotate: 3 },
    show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.7, ease } },
  };
  return (
    <motion.span
      className={className}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.055, delayChildren: delay } } }}
      initial="hidden"
      {...(onMount ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '0px 0px -8% 0px' } })}
    >
      {text.split(' ').map((w, i, all) => (
        <span key={i}>
          <motion.span variants={word} className={cn('inline-block origin-bottom-left', wordClassName)}>
            {w}
          </motion.span>
          {i < all.length - 1 ? ' ' : ''}
        </span>
      ))}
    </motion.span>
  );
}

/**
 * Section-to-section transition tied to scroll: each part rises and scales into
 * place as it arrives, and recedes as the next one takes over.
 */
export function ScrollSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.3 });
  const scale = useTransform(smooth, [0, 0.2, 0.82, 1], [0.93, 1, 1, 0.95]);
  const opacity = useTransform(smooth, [0, 0.16, 0.86, 1], [0.2, 1, 1, 0.3]);
  const y = useTransform(smooth, [0, 0.2], [56, 0]);

  return (
    <motion.div ref={ref} style={reduce ? undefined : { scale, opacity, y }} className={cn('origin-center', className)}>
      {children}
    </motion.div>
  );
}

/** Thin brand-colored progress line tied to page scroll. */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });
  return <motion.div aria-hidden className={cn('fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-brand-600 via-brand-400 to-brand-300', className)} style={{ scaleX }} />;
}

/** Slow parallax drift for decorative layers. */
export function Parallax({ children, className, offset = 60 }: { children: React.ReactNode; className?: string; offset?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
