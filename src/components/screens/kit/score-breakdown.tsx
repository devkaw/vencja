'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import type { ScoreResult } from '@/lib/domain/score';
import { HISTORICO_COMPLETO, NOTA_NEUTRA, SCORE_MAX_DIAS } from '@/lib/domain/score';

const ease = [0.16, 1, 0.3, 1] as const;

/** Points per criterion and the ceiling note. Used by the client page and by the landing demo, so both read the same. */
export function ScoreBreakdown({ score }: { score: ScoreResult }) {
  if (score.value === null) return null;
  const limitada = score.cap !== null && score.base !== null && score.base > score.cap;

  return (
    <>
      <ul className="space-y-3.5" aria-label="Pontos por critério">
        {score.criteria.map((c, i) => (
          <li key={c.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink-2">{c.label}</span>
              <span className="shrink-0 font-semibold text-ink tnum">
                {Math.round(c.points)}
                <span className="font-normal text-ink-4"> de {c.max}</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
              <motion.div className="h-full rounded-full bg-brand-500" initial={{ width: 0 }} animate={{ width: `${(c.points / c.max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.05, ease }} />
            </div>
          </li>
        ))}
      </ul>

      {score.poucoHistorico && (
        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-info-soft p-3 text-sm text-info" role="status">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Pouco histórico: {score.counted === 1 ? 'só 1 cobrança conta' : `só ${score.counted} cobranças contam`}. Até haver {HISTORICO_COMPLETO}, a nota fica mais perto de {NOTA_NEUTRA}. A soma dos critérios dá {score.soma}.
          </span>
        </p>
      )}

      {limitada && (
        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-warn-soft p-3 text-sm text-warn" role="status">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            A nota seria {score.base}, mas fica limitada a {score.cap} enquanto houver cobrança vencida em aberto
            {score.maiorAtrasoAberto > SCORE_MAX_DIAS ? ` (a mais antiga está há ${score.maiorAtrasoAberto} dias)` : ''}. Pagar essa cobrança tira o limite.
          </span>
        </p>
      )}
    </>
  );
}
