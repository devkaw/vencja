'use client';

import { Accordion } from 'radix-ui';
import { Plus } from 'lucide-react';
import { faqs } from './faq-data';
import { AnimatedWords, Reveal } from '@/components/motion/primitives';


export function Faq() {
  return (
    <section id="duvidas" className="py-20 lg:py-28" aria-labelledby="faq-title">
      <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow">Dúvidas</p>
          <h2 id="faq-title" className="mt-3 font-display text-display-xl font-semibold text-ink">
<AnimatedWords text="Perguntas frequentes" />
</h2>
          <p className="mt-4 text-lg text-ink-2">Não achou o que procurava?</p>
          <a href="mailto:suporte@venceja.com.br" className="mt-2 inline-block font-semibold text-brand-ink hover:underline">
            Fale com a gente: suporte@venceja.com.br
          </a>
        </Reveal>

        <Reveal y={30} delay={0.1}>
        <Accordion.Root type="single" collapsible className="glass-strong divide-y divide-line/70 overflow-hidden rounded-3xl">
          {faqs.map((f, i) => (
            <Accordion.Item key={f.q} value={`q${i}`} className="group transition-transform duration-300 ease-spring hover:scale-[1.012]">
              <Accordion.Header>
                <Accordion.Trigger className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-[15px] font-semibold text-ink transition-colors hover:bg-ink/[0.03] sm:px-6">
                  {f.q}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-2 transition-transform duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:bg-brand-600 group-data-[state=open]:text-white">
                    <Plus className="size-4" />
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[accordion-up_200ms_ease-out] data-[state=open]:animate-[accordion-down_250ms_cubic-bezier(0.16,1,0.3,1)]">
                <p className="px-5 pb-5 text-[15px] leading-relaxed text-ink-2 sm:px-6">{f.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
        </Reveal>
      </div>
    </section>
  );
}
