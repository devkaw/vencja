'use client';

import { motion } from 'framer-motion';
import { CalendarDays, FileSpreadsheet, Gauge, LayoutDashboard, TrendingDown } from 'lucide-react';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { GlassPanel } from '@/components/motion/primitives';

const ease = [0.16, 1, 0.3, 1] as const;

const chips = [
  { icon: CalendarDays, label: 'Calendário' },
  { icon: TrendingDown, label: 'Ranking' },
  { icon: FileSpreadsheet, label: 'CSV' },
];

/**
 * Product glimpse made only of real features: no customers, amounts or stats.
 * The WhatsApp text is the actual template with its fields left as placeholders.
 */
export function ProductGlimpse({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative mx-auto w-full max-w-[470px]">
        <div className="pointer-events-none absolute -inset-10 rounded-full bg-brand-500/15 blur-3xl" aria-hidden />

        <motion.div initial={{ opacity: 0, y: 30, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: -1 }} transition={{ duration: 0.8, delay: 0.25, ease }}>
          <GlassPanel strong className="rounded-[28px] p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <LayoutDashboard className="size-[18px]" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink">Painel</p>
                <p className="text-xs text-ink-3">Tudo o que você tem a receber</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { l: 'Recebido', c: 'bg-pos', w: '72%' },
                { l: 'A receber', c: 'bg-warn', w: '48%' },
                { l: 'Em atraso', c: 'bg-neg', w: '24%' },
              ].map((k, i) => (
                <div key={k.l} className="rounded-2xl bg-surface/80 p-3 shadow-xs">
                  <p className="text-2xs font-medium text-ink-3">{k.l}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <motion.div className={`h-full rounded-full ${k.c}`} initial={{ width: 0 }} animate={{ width: k.w }} transition={{ duration: 1.1, delay: 0.9 + i * 0.15, ease }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div
          className="relative z-10 -mt-3 ml-8 sm:ml-14"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease }}
        >
          <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
            <GlassPanel className="flex items-center gap-4 rounded-3xl p-4">
              <div className="relative size-16 shrink-0">
                <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgb(var(--ink) / 0.1)" strokeWidth="7" />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="rgb(var(--pos-fill))"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray="163"
                    initial={{ strokeDashoffset: 163 }}
                    animate={{ strokeDashoffset: [163, 40, 163] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  />
                </svg>
                <Gauge className="absolute inset-0 m-auto size-5 text-brand-ink" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Score de 0 a 100</p>
                <p className="text-xs leading-snug text-ink-3">Uma nota para cada cliente, pelo histórico de pagamentos.</p>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative z-20 -mt-2 mr-4 sm:mr-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease }}
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}>
            <GlassPanel strong className="rounded-3xl p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <WhatsAppIcon className="size-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-ink">Mensagem pronta</p>
                  <p className="text-2xs text-ink-3">Você revisa e envia do seu número</p>
                </div>
              </div>
              <p className="mt-3 rounded-2xl rounded-tl-md bg-brand-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
                Olá <b>{'{nome}'}</b>! Tudo bem? Estamos passando para lembrar que você tem uma cobrança no valor de <b>{'{valor}'}</b> que venceu há <b>{'{dias}'}</b> dias.
              </p>
            </GlassPanel>
          </motion.div>
        </motion.div>

        <motion.div className="mt-4 flex flex-wrap justify-center gap-2" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 1 } } }}>
          {chips.map((c) => (
            <motion.span
              key={c.label}
              variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
              whileHover={{ y: -3 }}
              className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-2"
            >
              <c.icon className="size-3.5 text-brand-ink" />
              {c.label}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
