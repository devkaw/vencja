'use client';

import { ScoreRing } from '@/components/data/charts';
import type { ClientSummary } from '@/lib/domain/clients';
import { scoreTone } from '@/lib/ui/status';
import { cn } from '@/lib/utils';
import { Panel } from './panel';
import { ScoreBreakdown } from './score-breakdown';

export function ScoreCard({ summary, className }: { summary: ClientSummary; className?: string }) {
  const { score } = summary;
  const tone = scoreTone(score.value);

  return (
    <Panel title="Por que esta nota" eyebrow="Score do cliente" className={className}>
      <div className="flex items-center gap-5">
        <ScoreRing score={score.value} size={104} stroke={9} />
        <div className="min-w-0">
          <p className={cn('font-display text-xl font-semibold', tone.text)}>{tone.label}</p>
          <p className="mt-1 text-sm text-ink-3">
            {score.value === null ? 'A nota aparece quando uma cobrança for paga ou vencer. Cobranças no prazo não contam.' : `Calculada em ${score.counted} ${score.counted === 1 ? 'cobrança paga ou vencida' : 'cobranças pagas ou vencidas'}.`}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ScoreBreakdown score={score} />
      </div>
    </Panel>
  );
}
