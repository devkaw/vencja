'use client';

import { useEffect, useState } from 'react';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, calcularDiasAtraso, isVencido, filterChargesByMonth, calculateProjection, getAtrasoDesdeInicio, getAtrasoNoMes } from '@/lib/utils';
import { TrendingUp, AlertTriangle, Clock, ArrowRight, DollarSign, Users, Receipt, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement,
  BarController,
  ArcElement,
} from 'chart.js';
import { format, isSameMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, ArcElement, Title, Tooltip, Legend, Filler);

interface DashboardData {
  totalClientes: number;
  totalCobrancas: number;
  cobrancasPagas: number;
  cobrancasPendentes: number;
  cobrancasVencidas: number;
  faturamentoMes: number;
  faturamentoTotal: number;
  totalAtrasado: number;
  menorScore: number;
  chargesProximasVencer: any[];
  chargesRecentes: any[];
  topDevedores: any[];
  dadosGrafico: { labels: string[]; valores: number[] };
  dadosInadimplencia: { labels: string[]; valores: number[] };
  dadosPerdaAtraso: { labels: string[]; valores: number[] };
  projectionData: { labels: string[]; aVencer: number[]; mesmoPeriodoAnoAnterior: number[] };
  metricasMes: {
    cobrancasNoMes: number;
    cobrancasPagasNoMes: number;
    cobrancasAtrasadasNoMes: number;
    faturamentoNoMes: number;
  };
  atrasoDesdeInicio: number;
  atrasoNoMes: number;
  taxaRecuperacao: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dataReferencia = new Date();
      const { fim: fimMes } = { fim: endOfMonth(dataReferencia) };

      const [chargesRes, clientsRes] = await Promise.all([
        supabase
          .from('charges')
          .select('*, client:clients(nome, score)')
          .eq('user_id', user.id)
          .order('data_vencimento', { ascending: false }),
        supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('total_atrasado', { ascending: false })
      ]);

      const allCharges = chargesRes.data || [];
      const clients = clientsRes.data || [];

      const chargesPagas = allCharges.filter(c => c.status === 'pago');
      const chargesPendentes = allCharges.filter(c => c.status === 'pendente' && !isVencido(c.data_vencimento));
      const chargesVencidas = allCharges.filter(c => c.status === 'pendente' && isVencido(c.data_vencimento));

      const metricasMes = filterChargesByMonth(allCharges, dataReferencia);
      const atrasoDesdeInicio = getAtrasoDesdeInicio(allCharges);
      const atrasoNoMes = getAtrasoNoMes(allCharges, dataReferencia);

      const faturamentoTotal = chargesPagas.reduce((sum, c) => sum + Number(c.valor), 0);

      const chargesProximasVencer = chargesPendentes
        .filter(c => !isVencido(c.data_vencimento))
        .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
        .slice(0, 5);

      const chargesRecentes = allCharges.slice(0, 8);

      const topDevedores = clients
        .filter(c => Number(c.total_atrasado) > 0)
        .slice(0, 5);

      const labels: string[] = [];
      const valores: number[] = [];
      let acumulado = 0;
      const totalDias = fimMes.getDate();
      const hoje = new Date();

      for (let day = 1; day <= totalDias; day++) {
        labels.push(day.toString());
        
        const isMesAtual = isSameMonth(dataReferencia, hoje);
        
        const paidOfDay = chargesPagas
          .filter(c => c.data_pagamento)
          .filter(c => {
            const pagamento = new Date(c.data_pagamento);
            return pagamento.getDate() === day &&
              pagamento.getMonth() === dataReferencia.getMonth() &&
              pagamento.getFullYear() === dataReferencia.getFullYear();
          })
          .reduce((sum, c) => sum + Number(c.valor), 0);
        
        if (isMesAtual && day > hoje.getDate()) {
          valores.push(acumulado);
        } else {
          acumulado += paidOfDay;
          valores.push(acumulado);
        }
      }

      const inadimplenciaLabels = ['Pago', 'A Vencer', 'Atrasado'];
      const inadimplenciaValores = [
        chargesPagas.reduce((sum, c) => sum + Number(c.valor), 0),
        chargesPendentes.filter(c => !isVencido(c.data_vencimento)).reduce((sum, c) => sum + Number(c.valor), 0),
        chargesVencidas.reduce((sum, c) => sum + Number(c.valor), 0)
      ];

      const perdaAtrasoLabels: string[] = [];
      const perdaAtrasoValores: number[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const mes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() - i, 1);
        const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
        const fim = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
        
        const chargesAtrasadasDoMes = allCharges.filter(c => {
          const vencimento = new Date(c.data_vencimento);
          return vencimento >= inicio && vencimento <= fim && c.status === 'pendente' && isVencido(c.data_vencimento);
        });
        
        perdaAtrasoLabels.push(format(mes, 'MMM', { locale: ptBR }));
        perdaAtrasoValores.push(chargesAtrasadasDoMes.reduce((sum, c) => sum + Number(c.valor), 0));
      }

      const projection = calculateProjection(allCharges, 6);
      const projectionLabels = projection.map(p => format(p.mes, 'MMM', { locale: ptBR }));
      const projectionAVencer = projection.map(p => p.aVencer);
      const projectionMesmoPeriodo = projection.map(p => p.mesmoPeriodoAnoAnterior);

      const { inicio, fim } = { inicio: new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1), fim: new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0) };
      const cobrancasVencedasNoMes = allCharges.filter(c => {
        const vencimento = new Date(c.data_vencimento);
        return vencimento >= inicio && vencimento <= fim;
      });
      const totalVencedasNoMes = cobrancasVencedasNoMes.reduce((sum, c) => sum + Number(c.valor), 0);
      const totalPagoDasVencedasNoMes = cobrancasVencedasNoMes.reduce((sum, c) => sum + Number(c.valor_pago || 0), 0);
      const taxaRecuperacao = totalVencedasNoMes > 0 ? (totalPagoDasVencedasNoMes / totalVencedasNoMes) * 100 : 0;

      setData({
        totalClientes: clients.length,
        totalCobrancas: allCharges.length,
        cobrancasPagas: chargesPagas.length,
        cobrancasPendentes: chargesPendentes.length,
        cobrancasVencidas: chargesVencidas.length,
        faturamentoMes: metricasMes.faturamentoNoMes,
        faturamentoTotal,
        totalAtrasado: chargesVencidas.reduce((sum, c) => sum + Number(c.valor), 0),
        menorScore: 0,
        chargesProximasVencer,
        chargesRecentes,
        topDevedores,
        dadosGrafico: { labels, valores },
        dadosInadimplencia: { labels: inadimplenciaLabels, valores: inadimplenciaValores },
        dadosPerdaAtraso: { labels: perdaAtrasoLabels, valores: perdaAtrasoValores },
        projectionData: { labels: projectionLabels, aVencer: projectionAVencer, mesmoPeriodoAnoAnterior: projectionMesmoPeriodo },
        metricasMes,
        atrasoDesdeInicio,
        atrasoNoMes,
        taxaRecuperacao
      });

      setIsLoading(false);
    }

    loadDashboard();
  }, []);

  if (isLoading || !data) return <DashboardSkeleton />;

  const { totalClientes, cobrancasVencidas, faturamentoTotal, totalAtrasado, chargesProximasVencer, chargesRecentes, topDevedores, dadosGrafico, dadosPerdaAtraso, projectionData, metricasMes, atrasoDesdeInicio, atrasoNoMes, taxaRecuperacao } = data;

  const chartData = {
    labels: dadosGrafico.labels,
    datasets: [
      {
        label: 'Faturamento Acumulado',
        data: dadosGrafico.valores,
        borderColor: '#10b981',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 256);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const inadimplenciaData = {
    labels: data.dadosInadimplencia.labels,
    datasets: [
      {
        data: data.dadosInadimplencia.valores,
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      }
    ]
  };

  const perdaAtrasoData = {
    labels: dadosPerdaAtraso.labels,
    datasets: [
      {
        label: 'Perda por Atraso',
        data: dadosPerdaAtraso.valores,
        backgroundColor: '#ef4444',
        borderRadius: 6,
      },
    ],
  };

  const projectionChartData = {
    labels: projectionData.labels,
    datasets: [
      {
        label: 'A Vencer',
        data: projectionData.aVencer,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        borderWidth: 2,
      },
      {
        label: 'Mesmo Período Ano Anterior',
        data: projectionData.mesmoPeriodoAnoAnterior,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        borderWidth: 2,
        borderDash: [5, 5],
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => formatCurrency(context.raw),
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#737373', font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: 'rgba(115, 115, 115, 0.1)' }, ticks: { color: '#737373', font: { size: 11 }, callback: (value: any) => formatCurrency(Number(value)) }, border: { display: false } },
    },
  };

  const projectionChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: { color: '#737373', font: { size: 11 }, boxWidth: 12, padding: 8 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => formatCurrency(context.raw),
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#737373', font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: 'rgba(115, 115, 115, 0.1)' }, ticks: { color: '#737373', font: { size: 11 }, callback: (value: any) => formatCurrency(Number(value)) }, border: { display: false } },
    },
  };

  const barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => formatCurrency(context.raw),
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#737373', font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: 'rgba(115, 115, 115, 0.1)' }, ticks: { color: '#737373', font: { size: 11 }, callback: (value: any) => formatCurrency(Number(value)) }, border: { display: false } },
    },
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'right',
        labels: { color: '#737373', font: { size: 11 }, boxWidth: 12, padding: 8 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => formatCurrency(context.raw),
        },
      },
    },
  };

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      <div className={`opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral financeira do seu negócio</p>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className={`glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`} style={{ animationDelay: '80ms' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center bg-accent/10">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold">{formatCurrency(metricasMes.faturamentoNoMes)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Faturamento do Mês</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">{metricasMes.cobrancasPagasNoMes} cobranças pagas no mês</p>
        </div>

        <div className={`glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`} style={{ animationDelay: '160ms' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center bg-accent/10">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold">{formatCurrency(faturamentoTotal)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Faturamento Total</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">Desde o início</p>
        </div>

        <div className={`glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`} style={{ animationDelay: '240ms' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center bg-danger/10">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-danger" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-danger">{formatCurrency(atrasoDesdeInicio)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Atraso Total</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">{cobrancasVencidas} cobranças</p>
        </div>

        <div className={`glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`} style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center bg-danger/10">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-danger" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-danger">{formatCurrency(atrasoNoMes)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Atraso no Mês</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">Valor atrasado no mês</p>
        </div>
      </div>

      {/* Stats Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total de Clientes', value: totalClientes, icon: Users, color: 'gray' },
          { label: 'Cobranças no Mês', value: metricasMes.cobrancasNoMes, icon: Receipt, color: 'gray' },
          { label: 'Cobranças Pagas no Mês', value: metricasMes.cobrancasPagasNoMes, icon: CheckCircle, color: 'accent' },
          { label: 'Cobranças Atrasadas no Mês', value: metricasMes.cobrancasAtrasadasNoMes, icon: AlertTriangle, color: 'danger' },
        ].map((stat, i) => (
          <div key={stat.label} className={`glass-card rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-4 opacity-0 ${mounted ? 'animate-fade-up' : ''}`} style={{ animationDelay: `${(i + 5) * 80}ms` }}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${stat.color === 'accent' ? 'bg-accent/10' : stat.color === 'danger' ? 'bg-danger/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color === 'accent' ? 'text-accent' : stat.color === 'danger' ? 'text-danger' : 'text-gray-500'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-xl font-bold truncate">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Gráfico de Faturamento Mensal */}
        <div className={`xl:col-span-2 glass-card rounded-2xl p-4 sm:p-6 opacity-0 ${mounted ? 'animate-fade-up animate-delay-300' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Faturamento do Mês</h3>
              <p className="text-xs sm:text-sm text-gray-500">Evolução acumulada</p>
            </div>
          </div>
          <div className="h-40 sm:h-56 lg:h-64 min-w-0 overflow-hidden">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Gráfico de Inadimplência */}
        <div className={`glass-card rounded-2xl p-4 sm:p-6 opacity-0 ${mounted ? 'animate-fade-up animate-delay-400' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Status</h3>
              <p className="text-xs sm:text-sm text-gray-500">Visão geral</p>
            </div>
          </div>
          <div className="h-40 sm:h-56 lg:h-64 min-w-0 overflow-hidden">
            <Doughnut data={inadimplenciaData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Gráficos de Perda e Projeção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Perda por Atraso */}
        <div className={`glass-card rounded-2xl p-4 sm:p-6 opacity-0 ${mounted ? 'animate-fade-up animate-delay-500' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Perda por Atraso no Mês</h3>
              <p className="text-xs sm:text-sm text-gray-500">Valor perdido por mês</p>
            </div>
          </div>
          <div className="h-40 sm:h-48 lg:h-56 min-w-0 overflow-hidden">
            <Bar data={perdaAtrasoData} options={barChartOptions} />
          </div>
        </div>

        {/* Projeção */}
        <div className={`glass-card rounded-2xl p-4 sm:p-6 opacity-0 ${mounted ? 'animate-fade-up animate-delay-600' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Projeção de Valores a Vencer</h3>
              <p className="text-xs sm:text-sm text-gray-500">Valores a receber por mês + mesmo período ano anterior</p>
            </div>
          </div>
          <div className="h-40 sm:h-48 lg:h-56 min-w-0 overflow-hidden">
            <Line data={projectionChartData} options={projectionChartOptions} />
          </div>
        </div>
      </div>

      {/* Listas */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Top Devedores */}
        <div className={`glass-card rounded-2xl p-4 sm:p-6 opacity-0 ${mounted ? 'animate-fade-up animate-delay-500' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Maiores Devedores</h3>
              <p className="text-xs sm:text-sm text-gray-500">Clientes com mais dívida</p>
            </div>
            <Link href="/dashboard/ranking" className="text-accent text-xs sm:text-sm hover:underline whitespace-nowrap">Ver ranking</Link>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {topDevedores.length === 0 ? (
              <p className="text-gray-500 text-xs sm:text-sm text-center py-4">Nenhum devedor</p>
            ) : (
              topDevedores.map((cliente, i) => (
                <div key={cliente.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : i === 1 ? 'bg-gray-400/20 text-gray-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate max-w-[60px] sm:max-w-[80px] lg:max-w-[100px]">{cliente.nome}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">Score: {cliente.score}</p>
                    </div>
                  </div>
                  <p className="font-bold text-danger text-xs sm:text-sm whitespace-nowrap">{formatCurrency(Number(cliente.total_atrasado))}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Próximas a Vencer */}
        <div className={`glass-card rounded-2xl overflow-hidden opacity-0 ${mounted ? 'animate-fade-up animate-delay-600' : ''}`}>
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Próximas a Vencer</h3>
                <p className="text-xs sm:text-sm text-gray-500">Nos próximos dias</p>
              </div>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {chargesProximasVencer.length === 0 ? (
              <p className="text-gray-500 text-xs sm:text-sm text-center py-6">Nenhuma cobrança próxima</p>
            ) : (
              chargesProximasVencer.map((charge: any) => {
                const diasUntil = Math.ceil((new Date(charge.data_vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <Link key={charge.id} href={`/dashboard/charges/${charge.id}`} className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-white/5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{charge.client?.nome || 'Cliente'}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">{formatDate(charge.data_vencimento)}</p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-sm sm:text-base">{formatCurrency(Number(charge.valor))}</p>
                      <p className="text-[10px] sm:text-xs text-yellow-500">{diasUntil === 1 ? 'amanhã' : `${diasUntil} dias`}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Cobranças Recentes */}
        <div className={`glass-card rounded-2xl overflow-hidden opacity-0 ${mounted ? 'animate-fade-up animate-delay-700' : ''}`}>
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Atividade Recente</h3>
                <p className="text-xs sm:text-sm text-gray-500">Últimas cobranças</p>
              </div>
              <Receipt className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {chargesRecentes.length === 0 ? (
              <p className="text-gray-500 text-xs sm:text-sm text-center py-6">Nenhuma cobrança ainda</p>
            ) : (
              chargesRecentes.map((charge: any) => {
                const vencido = isVencido(charge.data_vencimento) && charge.status === 'pendente';
                const diasAtraso = charge.dias_atraso || calcularDiasAtraso(charge.data_vencimento);
                return (
                  <Link key={charge.id} href={`/dashboard/charges/${charge.id}`} className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-white/5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${charge.status === 'pago' ? 'bg-accent/10' : vencido ? 'bg-danger/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {charge.status === 'pago' ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent" /> : vencido ? <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-danger" /> : <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate max-w-[60px] sm:max-w-[100px]">{charge.client?.nome || 'Cliente'}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[80px] sm:max-w-[120px]">{charge.descricao || 'Cobrança'}</p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className={`font-bold text-xs sm:text-base ${charge.status === 'pago' ? 'text-accent' : vencido ? 'text-danger' : ''}`}>
                        {formatCurrency(Number(charge.valor))}
                      </p>
                      <p className={`text-[10px] sm:text-xs ${charge.status === 'pago' ? 'text-accent' : vencido ? 'text-danger' : 'text-gray-500'}`}>
                        {charge.status === 'pago' ? 'Pago' : vencido ? `${diasAtraso}d atrasado` : formatDate(charge.data_vencimento)}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          <Link href="/dashboard/charges" className="block p-3 sm:p-4 text-center text-xs sm:text-sm text-accent hover:bg-gray-50 dark:hover:bg-white/5 border-t border-gray-100 dark:border-gray-800">
            Ver todas as cobranças <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 inline ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}