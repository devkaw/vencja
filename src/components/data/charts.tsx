'use client';

import { useId, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { scoreTone } from '@/lib/ui/status';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Monotone cubic path (Fritsch–Carlson): smooth without overshooting  */
/* below zero, which matters for money values.                          */
/* ------------------------------------------------------------------ */
function monotonePath(points: [number, number][]) {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M${points[0][0]},${points[0][1]}`;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0];
    slope[i] = (points[i + 1][1] - points[i][1]) / dx[i];
  }
  const m: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    m[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  }
  m[n - 1] = slope[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * slope[i];
      m[i + 1] = t * b * slope[i];
    }
  }
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += ` C${x0 + h},${y0 + m[i] * h} ${x1 - h},${y1 - m[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}

interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  format?: (n: number) => string;
  className?: string;
  ariaLabel?: string;
  /** CSS color for line and fill. */
  color?: string;
}

const W = 600;

export function AreaChart({
  data,
  height = 200,
  format = (n) => String(n),
  className,
  ariaLabel = 'Gráfico',
  color = 'rgb(var(--pos-fill))',
}: AreaChartProps) {
  const gradientId = useId();
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);

  const { line, area, coords, max } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.value));
    const padTop = 12;
    const usable = height - padTop - 4;
    const coords: [number, number][] = data.map((d, i) => [
      data.length === 1 ? W / 2 : (i / (data.length - 1)) * W,
      padTop + usable - (d.value / max) * usable,
    ]);
    const line = monotonePath(coords);
    const area = coords.length ? `${line} L${W},${height} L0,${height} Z` : '';
    return { line, area, coords, max };
  }, [data, height]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(x * (data.length - 1));
    setActive(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const activePoint = active !== null ? coords[active] : null;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <figure className={cn('relative select-none', className)} aria-label={ariaLabel}>
      <figcaption className="sr-only">
        {ariaLabel}: {data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}. Total {format(total)}.
      </figcaption>
      <div
        className="relative touch-pan-y"
        style={{ height }}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setActive(null)}
      >
        {/* Grid */}
        {[0, 0.5, 1].map((p) => (
          <div
            key={p}
            className="absolute inset-x-0 border-t border-dashed border-line"
            style={{ top: 12 + (height - 16) * p }}
            aria-hidden
          />
        ))}
        <div className="absolute left-0 top-0 text-2xs text-ink-4 tnum" aria-hidden>
          {format(max)}
        </div>

        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={area}
            fill={`url(#${gradientId})`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={2.25}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        {activePoint && active !== null && (
          <>
            <div
              className="pointer-events-none absolute bottom-0 top-3 w-px bg-ink/15"
              style={{ left: `${(activePoint[0] / W) * 100}%` }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface shadow-md"
              style={{ left: `${(activePoint[0] / W) * 100}%`, top: activePoint[1], background: color }}
              aria-hidden
            />
            <div
              className="glass-strong pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-xl px-3 py-2"
              style={{
                left: `clamp(56px, ${(activePoint[0] / W) * 100}%, calc(100% - 56px))`,
                top: Math.max(0, activePoint[1] - 64),
              }}
            >
              <p className="text-2xs font-medium uppercase tracking-wide text-ink-3">{data[active].label}</p>
              <p className="text-sm font-semibold text-ink tnum">{format(data[active].value)}</p>
            </div>
          </>
        )}
      </div>
      <div className="mt-2 flex justify-between text-2xs text-ink-4" aria-hidden>
        {data.map((d, i) => (
          <span
            key={i}
            className={cn('w-0 flex-1 text-center first:text-left last:text-right', active === i && 'font-semibold text-ink-2', data.length > 8 && i % 2 === 1 && 'max-sm:invisible')}
          >
            {d.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

interface DonutSegment {
  label: string;
  value: number;
  /** CSS color, e.g. "rgb(var(--pos-fill))". */
  color: string;
}

export function DonutChart({
  segments,
  size = 168,
  thickness = 18,
  centerLabel,
  centerValue,
  className,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = total > 0 && segments.filter((s) => s.value > 0).length > 1 ? 4 : 0;
  let offset = 0;

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--ink) / 0.06)" strokeWidth={thickness} />
        {total > 0 &&
          segments.map((s) => {
            if (s.value <= 0) return null;
            const len = (s.value / total) * c;
            const dash = Math.max(0, len - gap);
            const el = (
              <motion.circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeLinecap="butt"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      {(centerLabel || centerValue !== undefined) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-2xl font-semibold text-ink tnum">{centerValue}</span>
          {centerLabel && <span className="text-xs text-ink-3">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

/** Small circular gauge for client scores (0–100). Null means the client has no history yet. */
export function ScoreRing({ score, size = 44, stroke = 4, className }: { score: number | null; size?: number; stroke?: number; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score === null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const color = scoreTone(score).fill;
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }} title={score === null ? 'Sem histórico' : `Score ${score} de 100`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--ink) / 0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${pct * c} ${c}` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-semibold text-ink tnum" style={{ fontSize: Math.max(11, size * 0.28) }}>
        <span className="sr-only">Score </span>
        {score ?? '—'}
      </span>
    </div>
  );
}

/** Horizontal stacked bar for compact status breakdowns. */
export function StackedBar({ segments, className }: { segments: DonutSegment[]; className?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div className={cn('flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-ink/[0.06]', className)} role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
      {total > 0 &&
        segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className="h-full transition-[width] duration-700 ease-out-expo first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          ) : null
        )}
    </div>
  );
}
