'use client';

import { motion } from 'framer-motion';
import { Check, ShieldCheck, Smartphone, Wallet, CheckCircle2 } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { AnimatedWords, GlassPanel, Reveal, Stagger, StaggerItem } from '@/components/motion/primitives';
import { HeroCtas } from './hero-ctas';
import { ProductGlimpse } from './glimpse';

const ease = [0.16, 1, 0.3, 1] as const;

const proof = [
  { icon: Smartphone, title: 'Nada para instalar', desc: 'Abre no navegador do celular ou do computador.' },
  { icon: ShieldCheck, title: 'Seus dados são seus', desc: 'Conexão criptografada. Baixe ou exclua tudo quando quiser.' },
  { icon: CheckCircle2, title: 'Garantia de 7 dias no Pro', desc: 'Não gostou, pede o reembolso integral.' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-32 sm:pt-40 lg:pb-20 lg:pt-44" aria-labelledby="hero-title">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" aria-hidden />

      {/* Oversized mark: the brand should be felt, not just seen in the nav */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
        animate={{ opacity: 0.07, scale: 1, rotate: -8 }}
        transition={{ duration: 1.4, ease }}
        className="pointer-events-none absolute -left-40 top-20 hidden lg:block"
      >
        <LogoMark size={520} />
      </motion.div>

      <div className="container-x relative grid items-center gap-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="max-w-xl">
          <h1 id="hero-title" className="font-display text-display-2xl font-bold text-ink">
            <AnimatedWords onMount text="Saiba quem te deve." />{' '}
            <AnimatedWords onMount delay={0.25} text="Cobre em dois toques." wordClassName="bg-gradient-to-br from-brand-500 to-brand-800 bg-clip-text pb-[0.1em] text-transparent dark:from-brand-ink dark:to-brand-ink" />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease }}
            className="mt-6 text-lg leading-relaxed text-ink-2 sm:text-xl"
          >
            A VenceJá organiza suas cobranças, mostra o que vence e o que já atrasou, e monta a mensagem de cobrança no WhatsApp. Chega de caderninho, planilha e lembrete na
            cabeça.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7, ease }} className="mt-8">
            <HeroCtas />
          </motion.div>

          <Stagger as="ul" onMount delay={0.85} stagger={0.1} className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-3">
            {['Grátis até 3 clientes', 'Sem cartão de crédito', 'Funciona no celular'].map((t) => (
              <StaggerItem as="li" key={t} className="flex items-center gap-1.5">
                <Check className="size-4 text-brand-ink" strokeWidth={2.5} />
                {t}
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <ProductGlimpse />
      </div>

      {/* One block with a clear lead instead of a row of look-alike cards */}
      <div className="container-x relative mt-28 sm:mt-36 lg:mt-44">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
          <Reveal x={-28} y={0}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="glass-brand relative flex h-full flex-col justify-between overflow-hidden rounded-[32px] p-8 text-white sm:p-10"
            >
              <Wallet className="absolute -bottom-10 -right-8 size-64 rotate-[-12deg] text-white/[0.07]" aria-hidden />
              <p className="relative text-sm font-semibold uppercase tracking-[0.14em] text-white/70">Seu dinheiro é seu</p>
              <div className="relative mt-16 sm:mt-24">
                <h2 className="font-display text-display-lg font-bold">
                  <AnimatedWords text="Sem taxa sobre o que você recebe." />
                </h2>
                <p className="mt-3 max-w-md text-lg text-white/80">A VenceJá não intermedia o pagamento. Seu cliente paga como já paga hoje, e o dinheiro cai direto na sua conta.</p>
              </div>
            </motion.div>
          </Reveal>

          <Reveal x={28} y={0} delay={0.1}>
            <GlassPanel lift={false} className="h-full rounded-[32px] p-3 sm:p-4">
              <Stagger as="ul" stagger={0.12} className="flex h-full flex-col justify-center divide-y divide-line/70">
                {proof.map((item) => (
                  <StaggerItem as="li" key={item.title}>
                    <div className="group flex items-center gap-4 rounded-2xl px-3 py-5 transition-transform duration-300 ease-spring hover:scale-[1.03]">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink transition-transform duration-300 ease-spring group-hover:-rotate-6 group-hover:scale-110">
                        <item.icon className="size-[22px]" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{item.title}</p>
                        <p className="mt-0.5 text-sm text-ink-3">{item.desc}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </GlassPanel>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
