'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, calcularDiasAtraso, isVencido } from '@/lib/utils';
import { 
  TrendingUp, AlertTriangle, Clock, DollarSign, Users, Receipt, CheckCircle, BarChart3, ChevronRight, Zap, Target, 
  Activity, ArrowRight, Plus, Search, Filter, Download, Grid, List, MoreHorizontal, Trash2, Edit, Eye, X, Check, AlertOctagon,
  TrendingDown, PieChart, Calendar, CreditCard, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardSkeleton, DashboardSkeleton } from '@/components/ui/skeleton';
import type { Charge } from '@/types';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [chargesRes, clientsRes] = await Promise.all([
        supabase.from('charges').select('*, client:clients(nome, score)').eq('user_id', user.id).order('data_vencimento', { ascending: false }),
        supabase.from('clients').select('*').eq('user_id', user.id).order('total_atrasado', { ascending: false })
      ]);

      const allCharges = chargesRes.data || [];
      const clients = clientsRes.data || [];
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();
      
      const faturamentoMes = allCharges
        .filter(c => c.status === 'pago' && c.data_pagamento)
        .filter(c => {
          const pagamento = parseDateLocal(c.data_pagamento);
          return pagamento.getMonth() === mesAtual && pagamento.getFullYear() === anoAtual;
        })
        .reduce((sum, c) => sum + Number(c.valor), 0);
      
      const faturamentoTotal = allCharges
        .filter(c => c.status === 'pago')
        .reduce((sum, c) => sum + Number(c.valor), 0);
      
      const atrasoTotal = allCharges
        .filter(c => c.status === 'pendente' && isVencido(c.data_vencimento))
        .reduce((sum, c) => sum + Number(c.valor), 0);
      
      const atrasoNoMes = allCharges
        .filter(c => c.status === 'pendente' && isVencido(c.data_vencimento))
        .filter(c => {
          const vencimento = new Date(c.data_vencimento);
          return vencimento.getMonth() === mesAtual && vencimento.getFullYear() === anoAtual;
        })
        .reduce((sum, c) => sum + Number(c.valor), 0);

      const chargesChartData = getChargesByMonth(allCharges);
      const statusChartData = getStatusDistribution(allCharges);
      const clientsChartData = getClientsEvolution(clients);

      setData({
        totalClientes: clients.length,
        cobrancasPagas: allCharges.filter(c => c.status === 'pago').length,
        cobrancasPendentes: allCharges.filter(c => c.status === 'pendente' && !isVencido(c.data_vencimento)).length,
        cobrancasVencidas: allCharges.filter(c => c.status === 'pendente' && isVencido(c.data_vencimento)).length,
        faturamentoMes,
        faturamentoTotal,
        atrasoTotal,
        atrasoNoMes,
        allCharges,
        chargesProximasVencer: allCharges.filter(c => c.status === 'pendente' && !isVencido(c.data_vencimento)).sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()).slice(0, 5),
        chargesRecentes: allCharges.slice(0, 8),
        topDevedores: clients.filter(c => Number(c.total_atrasado) > 0).slice(0, 5),
        chargesChartData,
        statusChartData,
        clientsChartData
      });
      setIsLoading(false);
    }
    loadDashboard();
  }, []);

  if (isLoading || !data) return <DashboardSkeleton />;

  const { totalClientes, cobrancasPagas, cobrancasPendentes, cobrancasVencidas, faturamentoMes, faturamentoTotal, atrasoTotal, atrasoNoMes, chargesProximasVencer, chargesRecentes, topDevedores, chargesChartData, statusChartData, clientsChartData, allCharges } = data;
  
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  const cobrancasPagasEsteMes = allCharges.filter((c: any) => {
    if (c.status !== 'pago' || !c.data_pagamento) return false;
    const pagamento = parseDateLocal(c.data_pagamento);
    return pagamento.getMonth() === mesAtual && pagamento.getFullYear() === anoAtual;
  }).length;

  const cobrancasAtrasadas = allCharges.filter((c: any) => {
    return c.status !== 'pago' && isVencido(c.data_vencimento);
  }).length;

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extralight tracking-tight">Financeiro</h1>
          <p className="text-slate-400 font-light mt-1">Visão completa do seu negócio</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/charges/new">
            <Button className="bg-accent text-black"><Plus className="w-4 h-4 mr-2" />Nova Cobrança</Button>
          </Link>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} title="Faturamento do Mês" value={formatCurrency(faturamentoMes)} sub={`${cobrancasPagasEsteMes} cobranças pagas este mês`} color="accent" delay={0} />
        <StatCard icon={TrendingUp} title="Faturamento Total" value={formatCurrency(faturamentoTotal)} sub="Total recebido" color="accent" delay={1} />
        <StatCard icon={AlertOctagon} title="Atraso Total" value={formatCurrency(atrasoTotal)} sub={`${cobrancasVencidas} cobranças vencidas`} color="danger" delay={2} />
        <StatCard icon={Clock} title="Atraso no Mês" value={formatCurrency(atrasoNoMes)} sub="Valores vencidos neste mês" color="danger" delay={3} />
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <QuickStat icon={Users} label="Total Clientes" value={totalClientes} delay={4} />
        <QuickStat icon={Receipt} label="Cobranças" value={allCharges.length} delay={5} />
        <QuickStat icon={CheckCircle} label="Pagas no Mês" value={cobrancasPagasEsteMes} color="text-accent" delay={6} />
        <QuickStat icon={Clock} label="A Vencer" value={allCharges.filter((c: any) => c.status === 'pendente' && !isVencido(c.data_vencimento)).length} color="text-warning" delay={7} />
        <QuickStat icon={AlertTriangle} label="Atraso" value={cobrancasAtrasadas} color="text-danger" delay={8} />
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={fadeIn}>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-accent" /></div>
              <div><h3 className="font-light">Faturamento Mensal</h3></div>
            </div>
            <div className="h-48">
              <Line 
                data={chargesChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                  }
                }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn}>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><PieChart className="w-5 h-5 text-accent" /></div>
              <div><h3 className="font-light">Status das Cobranças</h3></div>
            </div>
            <div className="h-48 flex items-center justify-center">
              <Pie 
                data={statusChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right', labels: { color: '#94a3b8', padding: 15, usePointStyle: true } } }
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div variants={fadeIn} className="lg:col-span-2">
          <GlassCard title="Atividade Recente" icon={Activity} href="/dashboard/charges">
            {chargesRecentes.length === 0 ? <EmptyState message="Nenhuma cobrança еще" /> : 
              chargesRecentes.map((charge: any) => {
                const vencido = isVencido(charge.data_vencimento) && charge.status === 'pendente';
                return (
                  <Link key={charge.id} href={`/dashboard/charges/${charge.id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-4">
                      <StatusIcon status={charge.status} date={charge.data_vencimento} />
                      <div><p className="font-light">{charge.client?.nome || 'Cliente'}</p><p className="text-xs text-slate-500">{charge.descricao || 'Cobrança'}</p></div>
                    </div>
                    <div className="text-right"><p className={`font-light ${charge.status === 'pago' ? 'text-accent' : vencido ? 'text-danger' : 'text-warning'}`}>{formatCurrency(Number(charge.valor))}</p><p className="text-xs text-slate-500">{charge.status === 'pago' ? 'Pago' : vencido ? `${calcularDiasAtraso(charge.data_vencimento)}d atraso` : formatDate(charge.data_vencimento)}</p></div>
                  </Link>
                );
              })}
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeIn}>
          <GlassCard title="Próximas a Vencer" icon={Clock}>
            {chargesProximasVencer.length === 0 ? <EmptyState message="Nenhuma cobrança" /> :
              chargesProximasVencer.map((charge: any) => {
                const diasUntil = Math.ceil((new Date(charge.data_vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <Link key={charge.id} href={`/dashboard/charges/${charge.id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-all">
                    <div><p className="font-light">{charge.client?.nome || 'Cliente'}</p><p className="text-xs text-slate-500">{formatDate(charge.data_vencimento)}</p></div>
                    <div className="text-right"><p className="font-light">{formatCurrency(Number(charge.valor))}</p><Badge variant={diasUntil <= 1 ? 'warning' : 'default'} className="text-xs">{diasUntil === 1 ? 'amanhã' : `${diasUntil} dias`}</Badge></div>
                  </Link>
                );
              })}
          </GlassCard>
        </motion.div>
      </div>

      <motion.div variants={fadeIn}>
        <GlassCard title="Maiores Devedores" icon={TrendingDown} href="/dashboard/ranking" linkText="Ver ranking">
          {topDevedores.length === 0 ? <EmptyState message="Nenhum devedor - tudo em dia!" /> :
            topDevedores.map((cliente: any, i: number) => (
              <Link key={cliente.id} href={`/dashboard/clients/${cliente.id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-light text-sm ${i === 0 ? 'bg-warning/20 text-warning' : i === 1 ? 'bg-slate-700 text-slate-400' : 'bg-white/10 text-slate-500'}`}>{i + 1}</div>
                  <div><p className="font-light">{cliente.nome}</p><p className="text-xs text-slate-500">Score: {cliente.score}</p></div>
                </div>
                <p className="font-light text-danger">{formatCurrency(Number(cliente.total_atrasado))}</p>
              </Link>
            ))}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function getChargesByMonth(charges: any[]) {
  const meses = [];
  const hoje = new Date();
  for (let i = 11; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push({
      mes: data.toLocaleDateString('pt-BR', { month: 'short' }),
      data: data
    });
  }

  const valores = meses.map(m => {
    return charges
      .filter(c => {
        if (!c.data_pagamento || c.status !== 'pago') return false;
        const pagamento = parseDateLocal(c.data_pagamento);
        return pagamento.getMonth() === m.data.getMonth() && pagamento.getFullYear() === m.data.getFullYear();
      })
      .reduce((sum, c) => sum + Number(c.valor), 0);
  });

  return {
    labels: meses.map(m => m.mes),
    datasets: [{
      label: 'Faturamento',
      data: valores,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };
}

function getStatusDistribution(charges: any[]) {
  const paga = charges.filter(c => c.status === 'pago').length;
  const pendente = charges.filter(c => c.status === 'pendente' && !isVencido(c.data_vencimento)).length;
  const atrasada = charges.filter(c => c.status === 'pendente' && isVencido(c.data_vencimento)).length;

  return {
    labels: ['Pagas', 'A Vencer', 'Atraso'],
    datasets: [{
      data: [paga, pendente, atrasada],
      backgroundColor: ['#10B981', '#F97316', '#EF4444'],
      borderWidth: 0
    }]
  };
}

function getClientsEvolution(clients: any[]) {
  const meses = [];
  const hoje = new Date();
  for (let i = 5; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push(data);
  }

  const valores = meses.map(m => {
    return clients.filter(c => {
      const created = new Date(c.created_at);
      return created.getMonth() === m.getMonth() && created.getFullYear() === m.getFullYear();
    }).length;
  });

  return {
    labels: meses.map(m => m.toLocaleDateString('pt-BR', { month: 'short' })),
    datasets: [{
      label: 'Novos Clientes',
      data: valores,
      backgroundColor: '#10B981',
      borderRadius: 6
    }]
  };
}

function StatCard({ icon: Icon, title, value, sub, color, delay }: { icon: any; title: string; value: string; sub: string; color: string; delay: number }) {
  const colorClasses: any = { accent: 'bg-accent/10 text-accent', danger: 'bg-danger/10 text-danger', warning: 'bg-warning/10 text-warning' };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay * 0.1 }}
      className="glass-card rounded-2xl p-5 hover:-translate-y-1 transition-all group cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-2xl font-extralight">{value}</p>
      <p className="text-sm text-slate-400 font-light">{title}</p>
      <p className="text-xs text-slate-600 font-light mt-1">{sub}</p>
    </motion.div>
  );
}

function QuickStat({ icon: Icon, label, value, color, delay, isCurrency }: { icon: any; label: string; value: number | string; color?: string; delay: number; isCurrency?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay * 0.1 }}
      className="glass-card rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
        <Icon className={`w-5 h-5 ${color || 'text-slate-400'}`} />
      </div>
      <div><p className="text-xl font-extralight">{isCurrency ? value : value}</p><p className="text-xs text-slate-500 font-light">{label}</p></div>
    </motion.div>
  );
}

function GlassCard({ title, icon: Icon, children, href, linkText }: { title: string; icon: any; children: React.ReactNode; href?: string; linkText?: string }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Icon className="w-5 h-5 text-accent" /></div>
          <div><h3 className="font-light">{title}</h3></div>
        </div>
        {href && <Link href={href} className="text-sm text-accent hover:underline flex items-center gap-1">{linkText || 'Ver'} <ChevronRight className="w-4 h-4" /></Link>}
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}

function StatusIcon({ status, date }: { status: string; date: string }) {
  const vencido = isVencido(date) && status === 'pendente';
  const classes = status === 'pago' ? 'bg-accent/10' : vencido ? 'bg-danger/10' : 'bg-warning/10';
  const icon = status === 'pago' ? CheckCircle : vencido ? AlertTriangle : Clock;
  return <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${classes}`}></div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-8 text-center text-slate-500 font-light">{message}</div>;
}