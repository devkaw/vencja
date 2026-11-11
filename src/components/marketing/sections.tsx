import Link from 'next/link';
import {
  CalendarDays,
  Coins,
  FileBarChart2,
  Gauge,
  LayoutDashboard,
  Lock,
  Mail,
  MessageCircleMore,
  MonitorSmartphone,
  Receipt,
  Repeat,
  TrendingDown,
  UserPlus,
  Wallet,
  BarChart3,
  Target,
  BellRing,
  CheckCheck,
  Search,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { AnimatedWords, GlassPanel, Reveal, Stagger, StaggerItem } from '@/components/motion/primitives';
import { CookiePreferencesButton } from '@/components/legal/cookie-consent';
import { identificacaoEmpresa } from '@/lib/legal';
import { PrimaryCta } from './hero-ctas';

function SectionHead({ eyebrow, title, id, center = true, children }: { eyebrow: string; title: string; id: string; center?: boolean; children?: React.ReactNode }) {
  return (
    <Reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-display text-display-xl font-bold text-ink">
        <AnimatedWords text={title} />
      </h2>
      {children && <p className="mt-4 text-lg text-ink-2">{children}</p>}
    </Reveal>
  );
}

export function Benefits() {
  const items = [
    { icon: TrendingDown, title: 'Pare de correr atrás de dinheiro', desc: 'Com o score de cada cliente você sabe em quem confiar antes de fechar o próximo serviço.' },
    { icon: MessageCircleMore, title: 'Cobre em poucos toques', desc: 'Abra a cobrança e a mensagem sai pronta para o WhatsApp, com valor, vencimento e dias de atraso.' },
    { icon: BarChart3, title: 'Saiba quanto está devendo', desc: 'O painel mostra o que foi recebido, o que está no prazo e o que já atrasou, sem você somar nada.' },
    { icon: Target, title: 'Comece em minutos', desc: 'Sem planilha, sem contador e sem curso. Cadastre um cliente, lance a cobrança e pronto.' },
  ];
  return (
    <section className="py-20 lg:py-28" aria-labelledby="beneficios-title">
      <div className="container-x">
        <SectionHead id="beneficios-title" eyebrow="Para quem trabalha por conta própria" title="Menos tempo cobrando. Mais dinheiro entrando." />
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((b) => (
            <StaggerItem key={b.title}>
              <GlassPanel className="h-full rounded-3xl p-6">
                <span className="glass-brand flex size-12 items-center justify-center rounded-2xl text-white">
                  <b.icon className="size-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{b.title}</h3>
                <p className="mt-2 text-[15px] text-ink-2">{b.desc}</p>
              </GlassPanel>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      icon: UserPlus,
      title: 'Cadastre o cliente',
      desc: 'Nome e WhatsApp. Leva segundos e fica salvo para as próximas cobranças.',
      visual: (
        <div className="space-y-2">
          <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink-4">Nome do cliente</div>
          <div className="rounded-xl border border-brand-500/50 bg-surface px-3 py-2 text-sm text-ink-4 shadow-ring-brand">(DDD) WhatsApp</div>
        </div>
      ),
    },
    {
      icon: Receipt,
      title: 'Lance a cobrança',
      desc: 'Valor e vencimento. Se for mensalidade ou parcelado, crie todas as parcelas de uma vez.',
      visual: (
        <div className="flex flex-wrap gap-1.5">
          {['1/6', '2/6', '3/6', '4/6', '5/6', '6/6'].map((m) => (
            <span key={m} className="rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-ink-2 ring-1 ring-line">
              Parcela {m}
            </span>
          ))}
        </div>
      ),
    },
    {
      icon: MessageCircleMore,
      title: 'Acompanhe e cobre',
      desc: 'O painel mostra o que vence e o que atrasou. Um toque e a mensagem de cobrança abre no seu WhatsApp.',
      visual: (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-neg-soft px-2.5 py-1 text-xs font-semibold text-neg">Em atraso</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">
            <WhatsAppIcon className="size-3.5" />
            Cobrar
          </span>
        </div>
      ),
    },
  ];

  return (
    <section id="como-funciona" className="py-20 lg:py-28" aria-labelledby="como-title">
      <div className="container-x">
        <SectionHead id="como-title" eyebrow="Como funciona" title="Do caderno para o controle em três passos." />
        <Stagger as="ol" className="relative mt-12 grid gap-4 md:grid-cols-3 md:gap-6" stagger={0.15}>
          <div className="absolute left-[16%] right-[16%] top-[46px] hidden h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent md:block" aria-hidden />
          {steps.map((s, i) => (
            <StaggerItem as="li" key={s.title}>
              <GlassPanel className="relative flex h-full flex-col rounded-3xl p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="glass-brand flex size-12 items-center justify-center rounded-2xl text-white">
                    <s.icon className="size-6" />
                  </span>
                  <span className="font-display text-sm font-semibold text-ink-3">Passo {i + 1}</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-[15px] text-ink-2">{s.desc}</p>
                <div className="mt-6 rounded-2xl bg-surface/70 p-4">{s.visual}</div>
              </GlassPanel>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function FeatureGrid() {
  return (
    <section id="recursos" className="py-20 lg:py-28" aria-labelledby="recursos-title">
      <div className="container-x">
        <SectionHead id="recursos-title" center={false} eyebrow="Recursos" title="O que um controle de cobranças precisa. Nada que atrapalhe." />

        <Stagger className="mt-12 grid auto-rows-[minmax(0,auto)] gap-4 md:grid-cols-6 lg:gap-5" stagger={0.07}>
          <StaggerItem className="md:col-span-4 md:row-span-2">
            <GlassPanel strong grow={1.015} className="relative h-full rounded-3xl p-6 lg:p-8">
              <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand-500/15 blur-3xl" aria-hidden />
              <div className="relative flex items-center gap-2">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-600 text-white">
                  <WhatsAppIcon className="size-5" />
                </span>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-2xs font-semibold text-brand-ink">PRO</span>
              </div>
              <h3 className="relative mt-5 font-display text-2xl font-semibold text-ink">Cobrança pelo WhatsApp, sem constrangimento</h3>
              <p className="relative mt-2 max-w-md text-[15px] text-ink-2">
                A mensagem sai pronta com o nome do cliente, valor, vencimento e dias de atraso. Educada e direta. Você revisa e envia do seu próprio número.
              </p>
              <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
                <div className="dot-grid rounded-2xl bg-surface-3 p-3">
                  <p className="ml-auto max-w-[95%] rounded-2xl rounded-tr-sm bg-brand-soft px-3 py-2 text-[12.5px] leading-relaxed text-ink shadow-sm">
                    Olá <b>{'{nome}'}</b>! Tudo bem? Temos uma cobrança <b>{'{descrição}'}</b> no valor de <b>{'{valor}'}</b> que vence <b>{'{hoje / em X dias}'}</b>. Que tal já quitar e deixar isso resolvido?
                  </p>
                </div>
                <div className="dot-grid rounded-2xl bg-surface-3 p-3">
                  <p className="ml-auto max-w-[95%] rounded-2xl rounded-tr-sm bg-brand-soft px-3 py-2 text-[12.5px] leading-relaxed text-ink shadow-sm">
                    Olá <b>{'{nome}'}</b>! Tudo bem? Estamos passando para lembrar que você tem uma cobrança no valor de <b>{'{valor}'}</b> que venceu há <b>{'{dias}'}</b> dias. Qualquer dúvida, estamos à disposição!
                  </p>
                </div>
              </div>
              <p className="relative mt-3 text-xs text-ink-3">Os dois modelos de mensagem: para quem está no prazo e para quem já atrasou. Os campos entre chaves são preenchidos sozinhos.</p>
            </GlassPanel>
          </StaggerItem>

          <Feature className="md:col-span-2" icon={LayoutDashboard} title="Painel completo" desc="Recebido no mês, previsão de 30 dias, a receber, em atraso e taxa de recebimento, tudo calculado na hora." />
          <Feature className="md:col-span-2" icon={Gauge} title="Score explicado" desc="Uma nota de 0 a 100 por cliente, com o motivo de cada ponto. Cobrança no prazo não pesa contra ninguém." />
          <Feature className="md:col-span-2" icon={Repeat} title="Parcelado e recorrente" desc="Crie até 60 parcelas de uma vez, mensais ou quinzenais. Se precisar, exclua as pendentes da série." />
          <Feature className="md:col-span-2" icon={Coins} title="Pagamento parcial" desc="Recebeu só uma parte? Registre o valor e o restante vira uma nova cobrança." />
          <Feature className="md:col-span-2" icon={CalendarDays} title="Calendário financeiro" desc="O mês inteiro em uma tela: o que vence, o que foi pago e o que atrasou." />
          <Feature className="md:col-span-2" icon={TrendingDown} title="Ranking de inadimplência" desc="Quem deve mais e há mais tempo aparece primeiro. Você sabe por onde começar a cobrar." />
          <Feature className="md:col-span-2" icon={BellRing} title="Aviso diário por e-mail" desc="Nos dias com vencimento, você recebe o que vence hoje e o que venceu ontem. Dá para desligar." />
          <Feature className="md:col-span-2" icon={CheckCheck} title="Ações rápidas" desc="Marque como pago ou cobre direto da lista, sem abrir cada cobrança." />
          <Feature className="md:col-span-2" icon={Search} title="Busca em tudo" desc="Encontre qualquer cliente ou cobrança em segundos, com Cmd ou Ctrl + K." />
          <Feature className="md:col-span-2" icon={FileBarChart2} title="Relatórios e exportação CSV" desc="Resumos por período, mês e ano, com exportação para planilha ou contador." pro />
          <Feature className="md:col-span-2" icon={Lock} title="Segurança e controle dos dados" desc="Conexão criptografada, cada conta enxerga só os próprios dados e você baixa ou exclui tudo quando quiser." />
          <Feature className="md:col-span-3" icon={MonitorSmartphone} title="No celular ou no computador" desc="Funciona no navegador, com tema claro e escuro. Nada para instalar, nada para atualizar." />
          <Feature className="md:col-span-3" icon={Wallet} title="Sem taxa sobre o que você recebe" desc="A VenceJá não intermedia o pagamento. Seu cliente paga como já paga hoje e o dinheiro cai direto para você." />
        </Stagger>
      </div>
    </section>
  );
}

function Feature({ icon: Icon, title, desc, className, pro }: { icon: typeof Repeat; title: string; desc: string; className?: string; pro?: boolean }) {
  return (
    <StaggerItem className={className}>
      <GlassPanel className="group h-full rounded-3xl p-6">
        <div className="flex items-center gap-2">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-600 text-white transition-transform duration-300 ease-spring group-hover:rotate-[-8deg] group-hover:scale-125">
            <Icon className="size-5" />
          </span>
          {pro && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-2xs font-semibold text-brand-ink">PRO</span>}
        </div>
        <h3 className="mt-5 font-display text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-1.5 text-[15px] text-ink-2">{desc}</p>
      </GlassPanel>
    </StaggerItem>
  );
}

export function FinalCta() {
  return (
    <section className="py-20 lg:py-28" aria-labelledby="final-title">
      <div className="container-x">
        <Reveal scale={0.97}>
          <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-16 text-center shadow-float sm:px-12 lg:py-24">
            <div className="pointer-events-none absolute -left-20 -top-24 size-96 animate-drift rounded-full bg-brand-300/25 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-32 -right-10 size-96 animate-drift rounded-full bg-brand-300/20 blur-3xl [animation-delay:-8s]" aria-hidden />
            <div className="pointer-events-none absolute inset-0 dot-grid opacity-30 [mask-image:radial-gradient(60%_60%_at_50%_50%,#000,transparent)] [--ink:255_255_255]" aria-hidden />
            <div className="relative mx-auto max-w-2xl">
              <Logo markSize={56} tone="light" className="mb-8" />
              <h2 id="final-title" className="font-display text-display-xl font-bold text-white">
<AnimatedWords text="Organize suas cobranças hoje. Comece pelo grátis." />
</h2>
              <p className="mt-4 text-lg text-white/80">Cadastre um cliente, lance uma cobrança e veja o painel funcionando com os seus números.</p>
              <div className="mt-8 flex flex-col items-center gap-3">
                <PrimaryCta variant="onDark" />
                <p className="text-sm text-white/70">Grátis até 3 clientes · Sem cartão de crédito</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-surface/50 pb-24 pt-14 backdrop-blur-xl sm:pb-12">
      <div className="container-x relative">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo markSize={40} />
            <p className="mt-4 text-sm text-ink-3">Cobrança simplificada para quem trabalha por conta própria.</p>
            <a href="mailto:suporte@venceja.com.br" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink">
              <Mail className="size-4" />
              suporte@venceja.com.br
            </a>
          </div>
          <FooterCol
            title="Produto"
            links={[
              { href: '/como-funciona', label: 'Como funciona' },
              { href: '/recursos', label: 'Recursos' },
              { href: '/precos', label: 'Preços e planos' },
              { href: '/perguntas-frequentes', label: 'Perguntas frequentes' },
              { href: '/#demo', label: 'Demonstração' },
            ]}
          />
          <FooterCol
            title="Conta"
            links={[
              { href: '/register', label: 'Criar conta grátis' },
              { href: '/login', label: 'Entrar' },
              { href: '/forgot-password', label: 'Recuperar senha' },
              { href: '/help', label: 'Ajuda e contato' },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { href: '/termos', label: 'Termos de uso' },
              { href: '/privacidade', label: 'Privacidade' },
              { href: '/reembolso', label: 'Reembolso' },
              { href: '/cookies', label: 'Cookies' },
              { href: '/exclusao-de-dados', label: 'Exclusão de dados' },
              { href: '/licencas', label: 'Licenças' },
            ]}
          >
            <li>
              <CookiePreferencesButton className="min-h-6 text-left text-sm text-ink-3 transition-colors hover:text-ink" />
            </li>
          </FooterCol>
        </div>

        <p
          aria-hidden
          className="pointer-events-none mt-14 select-none text-center font-display text-[clamp(4.5rem,21vw,16rem)] font-bold leading-[0.8] tracking-[-0.06em] text-transparent"
          style={{ backgroundImage: 'linear-gradient(180deg, rgb(var(--brand-ink) / 0.5), rgb(var(--brand-ink) / 0))', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}
        >
          VenceJá
        </p>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-ink-3 sm:flex-row">
          <p>© {new Date().getFullYear()} VenceJá. Todos os direitos reservados.</p>
          <p>{identificacaoEmpresa()}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links, children }: { title: string; links: { href: string; label: string }[]; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            {l.href.startsWith('/') ? (
              <Link href={l.href} className="text-sm text-ink-3 transition-colors hover:text-ink">
                {l.label}
              </Link>
            ) : (
              <a href={l.href} className="text-sm text-ink-3 transition-colors hover:text-ink">
                {l.label}
              </a>
            )}
          </li>
        ))}
        {children}
      </ul>
    </div>
  );
}
