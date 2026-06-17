'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Check, BarChart3, Users, Calendar, Receipt, TrendingDown, Shield, Clock, Star, ChevronDown, Mail, X, Menu, AlertCircle,
  Target, DollarSign, Wallet, PieChart, FileText, Bell, Lock, CreditCard, Smartphone, Globe, Award, ThumbsUp, ArrowUpRight, ArrowDownRight,
  MessageCircle, TrendingUp, Download, CalendarCheck, Send, RefreshCw, BarChart, Gauge, LockKeyhole
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };
const stagger = { animate: { transition: { staggerChildren: 0.1 } } };

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: BarChart3, title: 'Dashboard Inteligente', description: 'Veja na hora quem pagou, quem deve e quanto está perdendo. Tudo em um só lugar, sem planilha.', stats: 'Em tempo real' },
    { icon: Gauge, title: 'Score de Clientes', description: 'Receba uma nota de 0 a 100 para cada cliente. Saiba de quem pode confiar antes de fechar serviço.', stats: 'Automático' },
    { icon: Receipt, title: 'Cobranças Flexíveis', description: 'Crie cobrança avulsa ou recorrente. Controle quem pagou, quem está devendo e quem atrasou.', stats: 'Simples' },
    { icon: Calendar, title: 'Calendário Financeiro', description: 'Veja no calendário o dia que cada cliente vence. Nunca mais esqueça de cobrar.', stats: 'Visual' },
    { icon: TrendingDown, title: 'Ranking de Inadimplência', description: 'Lista ordenada de quem mais deve. Priorize seus esforços de cobrança onde importa.', stats: 'Priorizado' },
    { icon: MessageCircle, title: 'Cobrança via WhatsApp', description: 'Gere a mensagem pronta e envie direto pro cliente. Copia e cola, sem enrolação.', stats: 'Pro' },
    { icon: Download, title: 'Exportação CSV', description: 'Exporte seus clientes e cobranças para planilha. Faça seu controle fora do sistema se preferir.', stats: 'CSV' },
    { icon: Shield, title: 'Segurança e LGPD', description: 'Seus dados ficam protegidos e criptografados. Ninguém acessa senão você.', stats: 'Protegido' },
  ];

  const benefits = [
    { title: 'Pare de correr atrás de dinheiro', description: 'Com o Score automático, você sabe de quem pode confiar. Cobrar cliente que já é conhecido por não pagar é perda de tempo.', icon: TrendingDown },
    { title: 'Cobre em 2 cliques', description: 'Gere a mensagem de cobrança e envie pelo WhatsApp. Sem digitar valor, sem errar dados, sem enrolação.', icon: MessageCircle },
    { title: 'Saiba quanto está devendo', description: 'Dashboard mostra exatamente quem pagou, quem não pagou e quanto você está perdendo por mês.', icon: BarChart3 },
    { title: 'Em 5 minutos está pronto', description: 'Não precisa de planilha, contador ou curso. Cadastre seus clientes e comece a cobrar agora.', icon: Target },
  ];

  const testimonials = [
    { name: 'Marcos Silva', role: 'Eletricista', text: 'Antes eu perdia cliente por esquecer de cobrar. Agora o calendário me avisa. Já recuperei mais de R$ 2.000 em dívidas que iam pro esquecimento.', rating: 5, image: 'MS' },
    { name: 'Juliana Costa', role: 'Cabeleireira', text: 'Tinha cliente que "esquecia" de pagar. O Score me mostrou quem era. Agora cobro antes de iniciar o serviço. Nunca mais perdi dinheiro.', rating: 5, image: 'JC' },
    { name: 'Pedro Santos', role: 'Pedreiro', text: 'Cobrava na mão e sempre tinha um que sumia. Agora mando pelo WhatsApp com tudo certo. O VenceJa se paga com um único cliente que paga em dia.', rating: 5, image: 'PS' },
    { name: 'Ana Ribeiro', role: 'Personal Trainer', text: 'Organizava tudo no caderninho. Quando percebi, tinha R$ 3.000 devendo. Agora sei exatamente quem deve e quanto. Melhor investimento que fiz.', rating: 5, image: 'AR' },
  ];

  const plans = [
    { 
      name: 'Gratuito', 
      price: 'R$ 0', 
      period: 'para sempre', 
      description: 'Para quem está começando ou quer testar antes de investir',
      features: [
        '3 clientes',
        '10 cobranças por mês',
        'Dashboard com métricas',
        'Score automático de clientes',
        'Ranking de inadimplência',
        'Calendário financeiro',
        'Cobranças recorrentes',
        'Pagamento parcial',
      ], 
      cta: 'Começar Grátis', 
      popular: false 
    },
    { 
      name: 'Pro', 
      price: 'R$ 49,90', 
      period: '/mês', 
      description: 'Para quem já tem clientes e quer parar de perder dinheiro',
      features: [
        'Clientes ilimitados',
        'Cobranças ilimitadas',
        'Cobrança via WhatsApp',
        'Relatórios completos',
        'Exportação CSV',
        'Suporte prioritário',
      ], 
      cta: 'Assinar Agora', 
      popular: true, 
      annualPrice: 'R$ 499/ano',
      annualDiscount: 'Economize 17%' 
    },
  ];

  const faqs = [
    { q: 'Vale a pena pra quem fatura pouco?', a: 'Sim! Se você tem apenas 3 clientes que pagam em dia, o plano gratuito já resolve. Se já perdeu dinheiro com cliente inadimplente, o Pro se paga com um único pagamento recuperado.' },
    { q: 'Funciona pra quem cobra por obra ou serviço?', a: 'Perfeitamente. Você cadastra o cliente, define o valor e a data de vencimento. Funciona para qualquer tipo de cobrança: hora, dia, obra fechada ou recorrente.' },
    { q: 'E se eu não tiver muitos clientes?', a: 'O plano gratuito suporta até 3 clientes e 10 cobranças. É ideal para quem está começando ou tem poucos clientes fixos.' },
    { q: 'Como o Score ajuda no meu dia a dia?', a: 'O Score analisa o histórico de pagamentos de cada cliente e dá uma nota de 0 a 100. Acima de 70 é bom pagador. Abaixo de 50, cuidado. Você sabe com quem pode confiar.' },
    { q: 'Preciso de internet para usar?', a: 'Sim, é uma ferramenta online. Mas funciona perfeitamente no celular pelo navegador. Para cobrar via WhatsApp, você já está usando o celular mesmo.' },
    { q: 'Posso cancelar quando quiser?', a: 'Sim, sem multa nem burocracia. É só cancelar nas configurações. Se cancelar no mesmo mês, não paga nada.' },
    { q: 'Tenho garantia de reembolso?', a: 'Sim! 7 dias após a compra, sem perguntas. Se não gostar, devolvemos 100%. É só ir em Configurações > Plano.' },
    { q: 'Como funciona a cobrança via WhatsApp?', a: 'O sistema gera uma mensagem pronta com o valor, vencimento e descrição. Você copia e envia direto pelo WhatsApp. Sem digitar tudo de novo.' },
    { q: 'O que são cobranças recorrentes?', a: 'Cobranças que se repetem automaticamente: semanal ou mensal. Você configura uma vez e o sistema cria as próximas. Ideal para clientes fixos.' },
  ];

  const howItWorks = [
    { step: '01', title: 'Cadastre seus clientes', desc: 'Adicione nome, telefone e quanto devem. Em 5 minutos você já tem tudo organizado.', icon: Users },
    { step: '02', title: 'Cobre em 2 cliques', desc: 'Defina valor e vencimento. Se for Pro, gere a mensagem pronta pro WhatsApp.', icon: Receipt },
    { step: '03', title: 'Acompanhe quem pagou', desc: 'Dashboard mostra quem está em dia e quem está devendo. Calendário avisa antes do vencimento.', icon: BarChart3 },
  ];

  const trustItems = [
    { icon: Shield, label: 'Dados protegidos pela LGPD' },
    { icon: Clock, label: 'Ativação imediata' },
    { icon: AlertCircle, label: 'Sem taxa de setup' },
    { icon: ArrowRight, label: 'Cancele quando quiser' },
    { icon: Check, label: '7 dias de garantia' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="fixed inset-0 hero-glow opacity-50" style={{ top: '-30%', left: '50%', transform: 'translateX(-50%)' }} />

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-3 shadow-2xl backdrop-blur-2xl bg-black/95 border-b border-white/10' : 'py-5 backdrop-blur-lg bg-black/60'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Image src="/logo.png" alt="VenceJa" width={36} height={36} className="w-9 h-9 rounded-xl object-contain" />
                <div className="absolute -inset-1 bg-accent/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-light tracking-wide">VenceJa</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-light text-slate-400 hover:text-accent transition-colors">Funcionalidades</a>
              <a href="#como-funciona" className="text-sm font-light text-slate-400 hover:text-accent transition-colors">Como Funciona</a>
              <a href="#depoimentos" className="text-sm font-light text-slate-400 hover:text-accent transition-colors">Depoimentos</a>
              <a href="#precos" className="text-sm font-light text-slate-400 hover:text-accent transition-colors">Planos</a>
              <a href="#faq" className="text-sm font-light text-slate-400 hover:text-accent transition-colors">FAQ</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Link href="/dashboard"><Button className="bg-accent text-black"><BarChart3 className="w-4 h-4 mr-2" />Dashboard</Button></Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-light text-slate-400 hover:text-accent">Entrar</Link>
                  <Link href="/register"><Button className="bg-accent text-black">Começar<ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
                </>
              )}
            </div>
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-slate-800/50 rounded-xl glass-effect"><Menu className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl p-6 border-l border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end mb-8"><button onClick={() => setMobileMenuOpen(false)}><X className="w-6 h-6" /></button></div>
            <div className="space-y-4 font-light">
              <a href="#features" className="block text-lg py-3 text-slate-300">Funcionalidades</a>
              <a href="#como-funciona" className="block text-lg py-3 text-slate-300">Como Funciona</a>
              <a href="#depoimentos" className="block text-lg py-3 text-slate-300">Depoimentos</a>
              <a href="#precos" className="block text-lg py-3 text-slate-300">Planos</a>
              <a href="#faq" className="block text-lg py-3 text-slate-300">FAQ</a>
              <div className="pt-6 space-y-3 border-t border-slate-800">
                {user ? <Link href="/dashboard" className="block"><Button className="w-full bg-accent text-black">Dashboard</Button></Link> : <><Link href="/login" className="block"><Button variant="outline" className="w-full">Entrar</Button></Link><Link href="/register" className="block"><Button className="w-full bg-accent text-black">Começar Gratuitamente</Button></Link></>}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-40 pb-28 lg:pt-56 lg:pb-36 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="initial" animate="animate" variants={stagger} className="text-center max-w-5xl mx-auto">
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl lg:text-7xl font-extralight tracking-tight mb-8 leading-tight">
              Pare de perder dinheiro<br />
              <span className="text-gradient">com inadimplência</span>
            </motion.h1>

            <motion.p variants={fadeIn} className="text-xl lg:text-2xl text-slate-400 font-light max-w-3xl mx-auto mb-10 leading-relaxed">
              Saiba quem paga, quem deve e quanto está perdendo. Em 5 minutos você organiza suas cobranças e para de correr atrás de dinheiro.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-12">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-accent text-black px-8 py-4 text-lg shadow-lg shadow-accent/20 hover:shadow-accent/40">
                    <BarChart3 className="w-5 h-5 mr-2" />Acessar Dashboard<ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="bg-accent text-black px-8 py-4 text-lg shadow-lg shadow-accent/20 hover:shadow-accent/40">
                      Começar Gratuitamente<ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/login" className="text-slate-400 hover:text-white font-light">Já tem conta? Entrar</Link>
                </>
              )}
            </motion.div>

            <motion.div variants={fadeIn} className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10"><Check className="w-4 h-4 text-accent" /><span className="font-light">3 clientes grátis</span></div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10"><Check className="w-4 h-4 text-accent" /><span className="font-light">Sem cartão de crédito</span></div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10"><Check className="w-4 h-4 text-accent" /><span className="font-light">Cancele quando quiser</span></div>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-6 h-6 text-slate-500 animate-bounce" />
        </div>
      </section>

      {/* Benefits Section - New */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-black/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={i} variants={fadeIn} className="glass-card rounded-3xl p-6 text-center hover:border-accent/30">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-lg font-light mb-2 text-white">{b.title}</h3>
                <p className="text-slate-400 font-light text-sm">{b.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger} className="text-center mb-20">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 rounded-full text-accent text-sm font-light mb-6 backdrop-blur-sm">
              <Star className="w-4 h-4" />Funcionalidades
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-4xl sm:text-5xl font-extralight mb-6">Tudo que você precisa pra cobrar</motion.h2>
            <motion.p variants={fadeIn} className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Ferramentas reais para quem trabalha por conta própria e não quer mais perder dinheiro com cliente que não paga.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} 
                className="group glass-card backdrop-blur-xl rounded-3xl p-6 hover:-translate-y-2 hover:border-accent/30 hover:bg-white/[0.08]">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <f.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-lg font-light mb-2">{f.title}</h3>
                <p className="text-slate-400 font-light text-sm mb-4">{f.description}</p>
                <Badge variant="primary" className="text-xs backdrop-blur-md">{f.stats}</Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-light mb-6 backdrop-blur-sm">
              <Target className="w-4 h-4" />Simples
            </div>
            <h2 className="text-4xl sm:text-5xl font-extralight mb-6">Como funciona</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Em 3 passos você para de perder dinheiro:</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                className="relative glass-card backdrop-blur-xl rounded-3xl p-8 text-center hover:border-accent/30 hover:bg-white/[0.08]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl font-light shadow-lg shadow-accent/30">{item.step}</div>
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 mt-2">
                  <item.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-light mb-3">{item.title}</h3>
                <p className="text-slate-400 font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-warning/10 rounded-full text-warning text-sm font-light mb-6 backdrop-blur-sm">
              <ThumbsUp className="w-4 h-4" />Quem usa, recomenda
            </div>
            <h2 className="text-4xl sm:text-5xl font-extralight mb-6">Quem já parou de perder dinheiro</h2>
            <p className="text-xl text-slate-400 font-light">Autônomos que transformaram a forma de cobrar</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass-card backdrop-blur-xl rounded-3xl p-8 hover:-translate-y-1 hover:border-accent/20 hover:bg-white/[0.06]">
                <div className="flex gap-1 mb-4">{[...Array(t.rating)].map((_, j) => <Star key={j} className="w-5 h-5 fill-warning text-warning" />)}</div>
                <p className="text-lg text-slate-200 font-light mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center text-black font-light text-lg">{t.image}</div>
                  <div><div className="font-light">{t.name}</div><div className="text-sm text-slate-500">{t.role}</div></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 rounded-full text-accent text-sm font-light mb-6 backdrop-blur-sm">
              <CreditCard className="w-4 h-4" />Planos
            </div>
            <h2 className="text-4xl sm:text-5xl font-extralight mb-6">Simples e que se paga</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Um único cliente que paga em dia já cobre o plano Pro. Comece grátis.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`glass-card backdrop-blur-xl rounded-3xl p-8 ${plan.popular ? 'border-2 border-accent lg:scale-105' : 'border-white/[0.08]'}`}>
                {plan.popular && <div className="mb-4"><Badge variant="primary" className="px-4 py-1 backdrop-blur-md"><Star className="w-4 h-4 mr-1" />Mais Popular</Badge></div>}
                <h3 className="text-2xl font-light mb-2">{plan.name}</h3>
                <p className="text-slate-400 font-light mb-4">{plan.description}</p>
                <div className="mb-4"><span className="text-5xl font-extralight">{plan.price}</span><span className="text-slate-500 ml-2">{plan.period}</span></div>
                {plan.annualPrice && (
                  <div className="flex items-center gap-3 mb-6">
                    <Badge variant="primary" className="backdrop-blur-md">{plan.annualDiscount}</Badge>
                    <span className="text-slate-400 font-light">{plan.annualPrice}</span>
                  </div>
                )}
                <ul className="space-y-3 mb-8">{plan.features.map((f, j) => <li key={j} className="flex items-center gap-3"><Check className="w-5 h-5 text-accent" /><span className="text-slate-300 font-light">{f}</span></li>)}</ul>
                <Link href="/register" className="block"><Button variant={plan.popular ? 'primary' : 'outline'} size="lg" className={`w-full ${plan.popular ? 'bg-accent text-black' : ''}`}>{plan.cta}</Button></Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {trustItems.map((item, i) => (
              <div key={i} className="trust-badge backdrop-blur-md border border-white/10">
                <item.icon className="w-4 h-4 text-accent" /><span className="font-light">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-800/50 rounded-full text-slate-300 text-sm font-light mb-6 backdrop-blur-sm">
              <Bell className="w-4 h-4" />FAQ
            </div>
            <h2 className="text-4xl sm:text-5xl font-extralight mb-6">Perguntas Frequentes</h2>
          </div>
          <div className="space-y-4">{faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}</div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass-card backdrop-blur-xl rounded-3xl p-12 lg:p-16 border border-white/10">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6">Comece a receber o que é seu</h2>
            <p className="text-xl text-slate-400 font-light mb-8 max-w-2xl mx-auto">Não perca mais tempo cobrando na mão. Organize tudo em 5 minutos.</p>
            <Link href="/register">
              <Button size="lg" className="bg-accent text-black px-12 py-5 text-xl shadow-2xl shadow-accent/30 hover:shadow-accent/50">
                Começar Grátis agora<ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4"><Image src="/logo.png" alt="VenceJa" width={32} height={32} className="w-8 h-8 rounded-lg" /><span className="text-lg font-light">VenceJa</span></div>
              <p className="text-slate-500 font-light text-sm">Cobrança simplificada para quem trabalha por conta própria.</p>
            </div>
            <div><h4 className="font-light mb-4">Produto</h4><div className="space-y-2 text-sm text-slate-400 font-light"><a href="#features" className="block hover:text-accent">Funcionalidades</a><a href="#precos" className="block hover:text-accent">Planos</a><a href="#faq" className="block hover:text-accent">FAQ</a></div></div>
            <div><h4 className="font-light mb-4">Suporte</h4><div className="space-y-2 text-sm text-slate-400 font-light"><a href="mailto:suporte@venceja.com.br" className="block hover:text-accent">Email</a><a href="/help" className="block hover:text-accent">Central de ajuda</a></div></div>
            <div><h4 className="font-light mb-4">Legal</h4><div className="space-y-2 text-sm text-slate-400 font-light"><Link href="/termos" className="block hover:text-accent">Termos de uso</Link><Link href="/privacidade" className="block hover:text-accent">Privacidade</Link></div></div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm font-light">© 2025 VenceJa. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4"><a href="mailto:suporte@venceja.com.br" className="flex items-center gap-2 text-slate-400 hover:text-accent text-sm"><Mail className="w-4 h-4" />suporte@venceja.com.br</a></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="glass-card backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 text-left font-light hover:bg-white/5 transition-colors">
        <span className="text-lg">{q}</span><ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-5 pb-5"><p className="text-slate-400 font-light pt-2">{a}</p></motion.div>}
    </motion.div>
  );
}