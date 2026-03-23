'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  CheckCircle, 
  BarChart3, 
  TrendingDown, 
  Clock, 
  Zap, 
  Shield,
  Users,
  MessageCircle,
  Download,
  ChevronDown,
  Star,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    checkUser();
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: BarChart3,
      title: 'Dashboard Inteligente',
      description: 'Visualize em tempo real quanto você faturou, quanto deveria ter faturado e quanto está perdendo com atrasos.',
    },
    {
      icon: TrendingDown,
      title: 'Ranking de Inadimplentes',
      description: 'Identifique instantaneamente quem são os clientes que mais prejudicam seu negócio e priorize suas cobranças.',
    },
    {
      icon: Clock,
      title: 'Score de Clientes',
      description: 'Sistema inteligente que avalia a confiabilidade de cada cliente com base no histórico de pagamentos.',
    },
    {
      icon: Zap,
      title: 'Cobranças Recorrentes',
      description: 'Configure cobranças que se renovam automaticamente e nunca mais esqueça de enviar uma cobrança.',
    },
    {
      icon: MessageCircle,
      title: 'Cobrança via WhatsApp',
      description: 'Envie lembretes personalizados pelo WhatsApp com um clique. Sem APIs caras, funciona com qualquer número.',
    },
    {
      icon: Download,
      title: 'Exportação e Relatórios',
      description: 'Exporte seus dados em CSV para análises profundas. Tenha total controle sobre suas informações.',
    },
  ];

  // const stats = [
  //   { value: '30%', label: 'Reducao de inadimplencia' },
  //   { value: 'R$ 10M+', label: 'Recuperados por clientes' },
  //   { value: '2.500+', label: 'Usuarios ativos' },
  // ];

  const testimonials = [
    {
      name: 'Carlos Silva',
      role: 'Diretor Comercial',
      company: 'AutoPeças Rapid',
      text: 'Em 3 meses reduzi minha inadimplência de 25% para 8%. O VenceJa mudou minha forma de cobrar.',
    },
    {
      name: 'Juliana Martins',
      role: 'Proprietária',
      company: 'Studio Yoga',
      text: 'Simplesmente essencial. Meu fluxo de caixa melhorou 100% desde que comecei a usar.',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sora overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed inset-0 hero-glow opacity-50" style={{ top: '-20%', left: '50%', transform: 'translateX(-50%)' }} />
      
      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Image 
                src="/logo.png" 
                alt="VenceJa" 
                width={40} 
                height={40}
                className="w-10 h-10 rounded-xl object-contain bg-black"
              />
              <span className="text-xl font-bold tracking-tight">VenceJa</span>
            </Link>
            
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-6">
                <Link href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-accent transition-colors">
                  Funcionalidades
                </Link>
                <Link href="#pricing" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-accent transition-colors">
                  Preços
                </Link>
              </div>
              <div className="hidden md:flex items-center gap-4">
                {user ? (
                  <Link href="/dashboard">
                    <button className="px-5 py-2.5 bg-accent text-black font-semibold rounded-xl text-sm flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-accent transition-colors">
                      Entrar
                    </Link>
                    <Link href="/register">
                      <button className="px-5 py-2.5 bg-accent text-black font-semibold rounded-xl text-sm">
                        Registrar-se
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 sm:pt-32 sm:pt-40 lg:pt-48 sm:pb-24 lg:pb-32 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto relative z-10">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass mb-4 sm:mb-6 lg:mb-8 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Mais de 2.500 empresas</span>
            </div>

            {/* Headline */}
            <h1 className={`text-2xl sm:text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-4 sm:mb-6 opacity-0 ${mounted ? 'animate-fade-up animate-delay-100' : ''}`}>
              <span className="block">Você sabe quanto</span>
              <span className="block text-gradient">está perdendo?</span>
            </h1>

            {/* Subheadline */}
            <p className={`text-sm sm:text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-8 opacity-0 ${mounted ? 'animate-fade-up animate-delay-200' : ''}`}>
              A inadimplência devora até 30% do seu faturamento. O VenceJa identifica, 
              acompanha e reduz esses prejuízos automaticamente.
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 opacity-0 ${mounted ? 'animate-fade-up animate-delay-300' : ''}`}>
              {user ? (
                <Link href="/dashboard">
                  <button className="btn-primary group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-accent text-black font-semibold rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                    Acessar Dashboard
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <button className="btn-primary group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-accent text-black font-semibold rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base">
                      Começar Gratuitamente
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <Link href="/login" className="sm:hidden text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Já tem conta? Entrar
                  </Link>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className={`flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-500 opacity-0 ${mounted ? 'animate-fade-up animate-delay-400' : ''}`}>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                <span>3 clientes grátis</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                <span>Sem cartão</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                <span>Acesso vitalício</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          {/* <div className={`mt-10 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-3xl mx-auto opacity-0 ${mounted ? 'animate-fade-up animate-delay-500' : ''}`}>
            {stats.map((stat, i) => (
              <div key={i} className="text-center glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl sm:text-4xl font-bold text-accent mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div> */}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 scroll-indicator opacity-0 hidden sm:block" style={{ animationDelay: '1s' }}>
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 lg:py-32 px-3 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-16 lg:mb-24">
            <h2 className="text-2xl sm:text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-sm sm:text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Controle quem te deve, quanto está perdendo e como recuperar seu dinheiro — sem complexidade.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 feature-card-hover cursor-pointer"
              >
                <div className="feature-icon w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-4 sm:mb-6 transition-all duration-300">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-3 sm:mt-4 flex items-center gap-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs sm:text-sm font-medium">Saiba mais</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-12 sm:py-20 lg:py-32 px-3 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
            {/* Left - Problem */}
            <div>
              <h2 className="text-2xl sm:text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                A inadimplência é o{' '}
                <span className="text-gradient">inimigo silencioso</span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
                Você trabalha duro para conquistar clientes, mas quando eles atrasam ou não pagam, 
                todo o seu esforço vai pelo ralo. E o pior: você só percebe quando já é tarde demais.
              </p>
              
              <div className="space-y-3 sm:space-y-4">
                {[
                  { icon: TrendingDown, title: 'Prejuízo Financeiro', desc: 'Cada real que não entra é lucro que você perde.' },
                  { icon: Clock, title: 'Estresse e Insegurança', desc: 'Insegurança sobre quem vai pagar.' },
                  { icon: Users, title: 'Dificuldade de Crescimento', desc: 'Sem previsibilidade, investimentos viram risco.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl dark:hover:bg-white/5 transition-colors">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-danger" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Solution */}
            <div className="relative">
              <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-accent/20 rounded-full blur-2xl sm:blur-3xl" />
                
                <div className="relative z-10 space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-black rounded-xl sm:rounded-2xl">
                    <span className="text-xs sm:text-sm font-medium">Total a Receber</span>
                    <span className="text-lg sm:text-2xl font-bold">R$ 47.850</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-danger/10 rounded-xl sm:rounded-2xl border border-danger/20">
                    <span className="text-xs sm:text-sm font-medium text-danger">Inadimplência</span>
                    <span className="text-lg sm:text-2xl font-bold text-danger">R$ 12.340</span>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 bg-accent/10 rounded-xl sm:rounded-2xl border border-accent/20">
                    <span className="text-xs sm:text-sm font-medium text-accent">Recuperado (30 dias)</span>
                    <span className="text-lg sm:text-2xl font-bold text-accent">R$ 8.520</span>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-500">Evolução vs Mês Anterior</span>
                      <span className="text-base sm:text-lg font-bold text-accent">+23%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-14 h-14 sm:w-20 sm:h-20 glass rounded-xl sm:rounded-2xl flex items-center justify-center animate-float">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-20 lg:py-32 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              O que dizem nossos clientes
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 hover-lift">
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 leading-relaxed">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center">
                    <span className="text-black font-bold text-sm sm:text-lg">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{testimonial.role} · {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-20 lg:py-32 px-3 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Simples e acessível
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
              Escolha o plano ideal para o seu negócio
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="pricing-card glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 hover-lift">
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Gratuito</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm">Para quem está começando</p>
              
              <div className="mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold">R$ 0</span>
                <span className="text-gray-500 ml-2 text-sm">para sempre</span>
              </div>

              <ul className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
                {['3 clientes', '10 cobranças', 'Ranking de inadimplência', 'Dashboard inteligente', 'Score de clientes', 'Notificações automáticas', 'Suporte via WhatsApp'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className="block">
                <button className="w-full py-3 sm:py-4 border border-gray-200 dark:border-gray-700 hover:border-accent hover:bg-accent/5 font-semibold rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base">
                  Começar Grátis
                </button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card featured glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-accent/20 rounded-full blur-2xl sm:blur-3xl" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-accent/20 rounded-full text-accent text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-accent" />
                  Mais Popular
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Vitalício Pro</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm">Acesso permanente a todas as funcionalidades</p>
                
                <div className="mb-4 sm:mb-6">
                  <span className="text-4xl sm:text-5xl font-bold">R$ 297</span>
                  <span className="text-gray-500 ml-2 text-sm">pagamento único</span>
                </div>

                <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-accent/10 rounded-lg sm:rounded-xl text-accent text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                  Economize R$ 598/ano vs assinatura
                </div>

                <ul className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
                  {['Tudo do plano Gratuito', 'Clientes ilimitados', 'Cobranças ilimitadas', 'Cobrança via WhatsApp', 'Cobranças recorrentes', 'Exportação CSV', 'Suporte prioritário', 'Acesso vitalício - pague uma vez!'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 sm:gap-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="block">
                  <button className="w-full py-3 sm:py-4 bg-accent hover:bg-accent/90 text-black font-semibold rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base">
                    Comprar Agora
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 glass rounded-lg sm:rounded-xl">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span className="text-xs sm:text-sm font-medium">Pagamento 100% seguro via PIX</span>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 glass rounded-lg sm:rounded-xl">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span className="text-xs sm:text-sm font-medium">Ativação em até 24h</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-20 lg:py-32 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Pare de perder dinheiro
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
            Junte-se a milhares de profissionais que transformaram sua gestão financeira com o VenceJa.
          </p>
          <Link href="/register">
            <button className="btn-primary group px-6 sm:px-10 py-3 sm:py-4 lg:py-5 bg-accent text-black font-bold rounded-xl sm:rounded-2xl inline-flex items-center gap-2 sm:gap-3 text-sm sm:text-base lg:text-lg">
              Começar Agora - É Grátis
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-lg sm:rounded-xl flex items-center justify-center">
                <span className="text-black font-bold text-sm sm:text-xl">V</span>
              </div>
              <span className="text-lg sm:text-xl font-bold">VenceJa</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-400">
              <a 
                href="https://wa.me/5579991526467" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2 hover:text-accent transition-colors"
              >
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Fale conosco</span>
              </a>
              <a href="#" className="hover:text-accent transition-colors">Termos</a>
              <a href="#" className="hover:text-accent transition-colors">Privacidade</a>
            </div>
            
            <p className="text-gray-500 text-xs sm:text-sm">
              © 2025 VenceJa. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}