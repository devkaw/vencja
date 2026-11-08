'use client';

import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BUBBLE, JA, VENCE } from './logo-paths';

const wiggle = { rotate: [0, -9, 7, -4, 2, 0], transition: { duration: 0.65, ease: 'easeInOut' as const } };

/** The bubble shouting "já!": a charge that speaks for you. Pops in and wiggles from its tail. */
function Bubble({ id, animated, light }: { id: string; animated: boolean; light?: boolean }) {
  return (
    <g transform="rotate(-7 32 32)">
      <motion.g
        style={{ originX: 0.12, originY: 0.98 }}
        initial={animated ? { scale: 0, rotate: -35 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 15, delay: 0.1 }}
      >
        <path d={BUBBLE} fill={light ? '#FFFFFF' : `url(#${id})`} />
        <path d={JA.d} transform={JA.transform} fill={light ? 'var(--green-to)' : '#FFFFFF'} />
      </motion.g>
    </g>
  );
}

function Gradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="10" y1="2" x2="50" y2="60" gradientUnits="userSpaceOnUse">
      <stop stopColor="var(--green-from)" />
      <stop offset="1" stopColor="var(--green-to)" />
    </linearGradient>
  );
}

export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  const id = useId();
  const reduce = useReducedMotion();
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn('shrink-0 overflow-visible', className)}
      whileHover={reduce ? undefined : wiggle}
      aria-hidden
    >
      <defs>
        <Gradient id={id} />
      </defs>
      <Bubble id={id} animated={!reduce} />
    </motion.svg>
  );
}

/** Full lockup: "vence" + the "já!" bubble. markSize keeps the old scale, drawn larger on purpose. */
export function Logo({
  className,
  markSize = 34,
  hideWordmark,
  tone = 'default',
}: {
  className?: string;
  markSize?: number;
  hideWordmark?: boolean;
  tone?: 'default' | 'light';
}) {
  const id = useId();
  const reduce = useReducedMotion();
  if (hideWordmark) return <LogoMark size={markSize} className={className} />;

  const height = markSize * 1.4;
  const viewW = VENCE.width + 66;

  return (
    <motion.svg
      viewBox={`0 0 ${viewW} 64`}
      height={height}
      width={(height * viewW) / 64}
      className={cn('shrink-0 overflow-visible', className)}
      role="img"
      aria-label="VenceJá"
      whileHover={reduce ? undefined : { scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    >
      <defs>
        <Gradient id={id} />
      </defs>
      <motion.path
        d={VENCE.d}
        transform={`translate(1 44) scale(${VENCE.scale})`}
        fill={tone === 'light' ? '#FFFFFF' : 'rgb(var(--ink))'}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <g transform={`translate(${VENCE.width + 1} 0)`}>
        <Bubble id={id} animated={!reduce} light={tone === 'light'} />
      </g>
    </motion.svg>
  );
}
