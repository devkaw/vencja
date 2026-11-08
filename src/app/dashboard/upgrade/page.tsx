'use client';

import { SUPORTE_PRIORITARIO } from '@/lib/legal';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Minus, Sparkles, ShieldCheck, RotateCcw, Zap, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard as Card } from '@/components/screens/kit/glass-card';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton, PageHeaderSkeleton } from '@/components/ui/skeleton';
import { PageHero } from '@/components/screens/kit/page-hero';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { createClient } from '@/lib/supabase/client';
import { hasPremiumAccess } from '@/lib/subscription';
import { ANNUAL_PER_MONTH, ANNUAL_SAVINGS, PRICE_ANNUAL, PRICE_MONTHLY, brl, comparison } from '@/lib/ui/pricing';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';
import { PaymentForm } from '@/components/payment-form';

export default function UpgradePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Carregando planos">
        <PageHeaderSkeleton />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  const hasAccess = hasPremiumAccess(profile);

  if (hasAccess) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <PageHero title="Seu plano" backHref="/dashboard" backLabel="Painel" />
        <Card className="relative overflow-hidden p-8 text-center sm:p-10">
          <div className="pointer-events-none absolute inset-0 aurora opacity-70" aria-hidden />
          <div className="relative">
            <span className="glass-brand mx-auto mb-5 flex size-16 items-center justify-center rounded-3xl text-white">
              <Gem className="size-7" />
            </span>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">Você está no Pro</h2>
            <p className="mx-auto mt-2 max-w-sm text-ink-3">Clientes e cobranças ilimitados, cobrança pelo WhatsApp, relatórios e exportação liberados.</p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Button asChild>
                <Link href="/dashboard">Voltar ao painel</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/dashboard/settings">Gerenciar assinatura</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const annual = selectedPlan === 'annual';

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait" initial={false}>
        {showPaymentForm ? (
          <motion.div key="checkout" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto max-w-md space-y-6">
            <button onClick={() => setShowPaymentForm(false)} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink">
              <ArrowLeft className="size-4" />
              Voltar aos planos
            </button>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Revise sua assinatura</h1>
              <p className="mt-1 text-sm text-ink-3">Confira o plano e siga para o pagamento seguro.</p>
            </div>
            <Segmented
              tone="solid"
              aria-label="Ciclo de cobrança"
              value={selectedPlan}
              onChange={setSelectedPlan}
              className="w-full [&>button]:flex-1"
              options={[
                { value: 'monthly', label: 'Mensal' },
                { value: 'annual', label: 'Anual' },
              ]}
            />
            <Card className="p-5 sm:p-6">
              <PaymentForm planType={selectedPlan} />
            </Card>
          </motion.div>
        ) : (
          <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <PageHero
                eyebrow="Planos"
                title="Cobre sem limite"
                highlight="com o Pro."
                description="Para quem já tem mais de 3 clientes ou quer cobrar pelo WhatsApp com a mensagem pronta."
              />
              <Segmented
                aria-label="Ciclo de cobrança"
                value={selectedPlan}
                onChange={setSelectedPlan}
                options={[
                  { value: 'monthly', label: 'Mensal' },
                  {
                    value: 'annual',
                    label: (
                      <>
                        Anual <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-2xs font-semibold text-brand-ink">2 meses grátis</span>
                      </>
                    ),
                  },
                ]}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1.15fr] lg:gap-6">
              <Card className="flex flex-col p-6">
                <p className="text-sm font-semibold text-ink-2">Grátis</p>
                <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">R$ 0</p>
                <p className="mt-1 text-sm text-ink-3">Para organizar os primeiros clientes.</p>
                <ul className="mt-6 space-y-2.5 text-sm text-ink-2">
                  {comparison.slice(0, 8).map((row) => (
                    <li key={row.label} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-ink-4" />
                      {typeof row.free === 'string' ? `${row.free} ${row.label.toLowerCase()}` : row.label}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6">
                  <div className="flex h-11 items-center justify-center rounded-xl bg-surface-3 text-sm font-medium text-ink-3">Seu plano atual</div>
                </div>
              </Card>

              <div className="relative rounded-[26px] bg-gradient-to-b from-brand-400/60 via-brand-500/20 to-transparent p-px shadow-lift">
                <div className="relative flex h-full flex-col overflow-hidden rounded-[25px] bg-surface p-6">
                  <div className="pointer-events-none absolute inset-0 aurora opacity-60" aria-hidden />
                  <div className="relative flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
                      <Sparkles className="size-4" />
                      Pro
                    </p>
                    {annual && <Badge variant="primary">Melhor custo</Badge>}
                  </div>
                  <div className="relative mt-3 flex items-baseline gap-1.5">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={selectedPlan}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="font-display text-4xl font-semibold tracking-tight text-ink tnum"
                      >
                        R$ {brl(annual ? ANNUAL_PER_MONTH : PRICE_MONTHLY)}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-sm text-ink-3">/mês</span>
                  </div>
                  <p className="relative mt-1 text-sm text-ink-3">
                    {annual ? `R$ ${brl(PRICE_ANNUAL)} cobrados uma vez por ano · economia de R$ ${brl(ANNUAL_SAVINGS)}` : 'Cobrado todo mês. Cancele quando quiser.'}
                  </p>

                  <ul className="relative mt-6 space-y-2.5 text-sm text-ink">
                    {[
                      'Clientes e cobranças ilimitados',
                      'Cobrança pelo WhatsApp com mensagem pronta',
                      'Relatórios mensais e anuais',
                      'Exportação em CSV para planilha ou contador',
                      SUPORTE_PRIORITARIO,
                      'Tudo do plano grátis',
                    ].map((f, i) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                          {i === 1 ? <WhatsAppIcon className="size-2.5" /> : <Check className="size-2.5" strokeWidth={3} />}
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="relative mt-auto pt-6">
                    <Button size="xl" className="w-full" onClick={() => setShowPaymentForm(true)}>
                      <Zap />
                      Assinar o Pro {annual ? 'anual' : 'mensal'}
                    </Button>
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-3">
                      <RotateCcw className="size-3.5" />7 dias para pedir reembolso integral
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="p-5 sm:p-6">
                <h2 className="font-display text-lg font-semibold text-ink">Compare os planos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y border-line bg-surface-2/60 dark:bg-surface-2">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-ink-3">Recurso</th>
                      <th className="w-28 px-3 py-3 text-center text-xs font-medium text-ink-3">Grátis</th>
                      <th className="w-28 px-5 py-3 text-center text-xs font-semibold text-brand-ink">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {comparison.map((row) => (
                      <tr key={row.label}>
                        <td className="px-5 py-3 text-ink-2">{row.label}</td>
                        {[row.free, row.pro].map((v, i) => (
                          <td key={i} className={cn('px-3 py-3 text-center', i === 1 && 'bg-brand-soft/30')}>
                            {typeof v === 'string' ? (
                              <span className={cn('font-medium', i === 1 ? 'text-brand-ink' : 'text-ink-2')}>{v}</span>
                            ) : v ? (
                              <Check className={cn('mx-auto size-4', i === 1 ? 'text-brand-ink' : 'text-ink-3')} />
                            ) : (
                              <Minus className="mx-auto size-4 text-ink-4" aria-label="Não incluso" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: 'Garantia de 7 dias', desc: 'Não gostou? Peça o reembolso integral em Configurações › Plano.' },
                { icon: RotateCcw, title: 'Cancele quando quiser', desc: 'Sem multa e sem ligação. Você mantém o Pro até o fim do período pago.' },
                { icon: Zap, title: 'Liberação automática', desc: 'Assim que o pagamento é confirmado, o Pro é ativado na sua conta.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 rounded-2xl border border-line bg-surface/60 p-4">
                  <item.icon className="mt-0.5 size-5 shrink-0 text-brand-ink" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-sm text-ink-3">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
