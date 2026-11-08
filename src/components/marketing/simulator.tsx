'use client';

import { useId, useState } from 'react';
import { Clock, Info } from 'lucide-react';
import { AnimatedNumber } from '@/components/data/animated-number';
import { AnimatedWords, GlassPanel, Reveal } from '@/components/motion/primitives';
import { PRICE_MONTHLY, brl } from '@/lib/ui/pricing';
import { cn } from '@/lib/utils';

function Range({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  format: (n: number) => string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <output htmlFor={id} className="font-display text-lg font-semibold text-ink tnum">
          {format(value)}
        </output>
      </div>
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range mt-3 w-full"
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
      />
    </div>
  );
}

export function Simulator() {
  const [cobrancas, setCobrancas] = useState(30);
  const [minHoje, setMinHoje] = useState(6);
  const [minCom, setMinCom] = useState(1);
  const [valorHora, setValorHora] = useState(40);

  const horasHoje = (cobrancas * minHoje) / 60;
  const horasCom = (cobrancas * Math.min(minCom, minHoje)) / 60;
  const horasLivres = Math.max(0, horasHoje - horasCom);
  const valorTempo = horasLivres * valorHora;
  const minutosPro = valorHora > 0 ? (PRICE_MONTHLY / valorHora) * 60 : 0;

  const fmtH = (h: number) => {
    const total = Math.round(h * 60);
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    if (hh === 0) return `${mm} min`;
    return mm === 0 ? `${hh} h` : `${hh} h ${mm} min`;
  };

  return (
    <section id="simulador" className="relative py-20 lg:py-28" aria-labelledby="sim-title">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Simulador</p>
          <h2 id="sim-title" className="mt-3 font-display text-display-xl font-semibold text-ink">
<AnimatedWords text="Quanto tempo a cobrança manual te custa?" />
</h2>
          <p className="mt-4 text-lg text-ink-2">Coloque os seus números. A conta é sua — a gente só mostra o resultado.</p>
        </Reveal>

        <Reveal className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_1fr] lg:gap-6" y={30}>
          <GlassPanel lift={false} className="space-y-7 rounded-3xl p-6 sm:p-8">
            <Range label="Cobranças que você faz por mês" value={cobrancas} onChange={setCobrancas} min={1} max={200} format={(n) => String(n)} />
            <Range
              label="Minutos por cobrança, hoje"
              hint="Procurar o contato, conferir o valor, escrever a mensagem, anotar"
              value={minHoje}
              onChange={setMinHoje}
              min={1}
              max={20}
              format={(n) => `${n} min`}
            />
            <Range
              label="Minutos por cobrança com a mensagem pronta"
              hint="Sua estimativa: abrir a cobrança, tocar em cobrar e enviar"
              value={minCom}
              onChange={setMinCom}
              min={0.5}
              max={5}
              step={0.5}
              format={(n) => `${brl(n, n % 1 === 0 ? 0 : 1)} min`}
            />
            <Range label="Quanto vale uma hora do seu trabalho" value={valorHora} onChange={setValorHora} min={10} max={300} step={5} format={(n) => `R$ ${n}`} />
          </GlassPanel>

          <GlassPanel strong lift={false} className="rounded-3xl p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 size-72 animate-drift rounded-full bg-brand-500/25 blur-3xl" aria-hidden />
            <div className="relative" aria-live="polite">
              <p className="flex items-center gap-2 text-sm font-medium text-ink-3">
                <Clock className="size-4" />
                Tempo que você pode liberar por mês
              </p>
              <p className="mt-2 font-display text-5xl font-bold tracking-tight text-ink tnum sm:text-6xl">
                <AnimatedNumber value={horasLivres} format={fmtH} duration={500} />
              </p>
              <p className="mt-1 text-sm text-ink-3 tnum">Cerca de {fmtH(horasLivres * 12)} por ano</p>

              <dl className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface/70 p-4">
                  <dt className="text-xs text-ink-3">Hoje você gasta</dt>
                  <dd className="mt-1 text-lg font-semibold tnum">{fmtH(horasHoje)}/mês</dd>
                </div>
                <div className="rounded-2xl bg-surface/70 p-4">
                  <dt className="text-xs text-ink-3">Valor desse tempo</dt>
                  <dd className="mt-1 text-lg font-semibold tnum">
                    R$ <AnimatedNumber value={valorTempo} format={(n) => brl(n, 0)} duration={500} />
                    /mês
                  </dd>
                </div>
              </dl>

              <div className={cn('mt-3 rounded-2xl p-4', valorTempo >= PRICE_MONTHLY ? 'bg-brand-soft ring-1 ring-brand-500/30' : 'bg-surface/70')}>
                <p className="text-sm">
                  O Pro custa R$ {brl(PRICE_MONTHLY)}/mês: o equivalente a <strong className="tnum">{Math.round(minutosPro)} minutos</strong> do seu trabalho.
                </p>
              </div>

              <p className="mt-6 flex items-start gap-2 text-xs text-ink-3">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                Estimativa feita só com os números que você informou. Não é promessa de resultado.
              </p>
            </div>
          </GlassPanel>
        </Reveal>
      </div>
    </section>
  );
}
