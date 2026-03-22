'use client';

import { useEffect, useState } from 'react';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, calcularDiasAtraso, isVencido, getMonthOptions, parseMonth, getMesObj, filterChargesByMonth, calculateProjection, getAtrasoDesdeInicio, getAtrasoNoMes, getProjectionOptions } from '@/lib/utils';
import { TrendingUp, AlertTriangle, Clock, ArrowRight, DollarSign, Users, Receipt, Calendar, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Line, Bar } from 'react-chartjs-2';
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
} from 'chart.js';
import { Select } from '@/components/ui/select';
import { format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, Title, Tooltip, Legend, Filler);

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
  mediaDiasAtraso: number;
  chargesProximasVencer: any[];
  chargesRecentes: any[];
  topDevedores: any[];
  dadosGrafico: { labels: string[]; valores: number[] };
  dadosInadimplencia: { labels: string[]; valores: number[] };
  dadosPerdaAtraso: { labels: string[]; valores: number[] };
  projectionData: { labels: string[]; valores: number[] };
  mesSelecionado: string;
  mesProjection: string;
  metricasMes: {
    cobrancasNoMes: number;
    cobrancasPagasNoMes: number;
    cobrancasAtrasadasNoMes: number;
    faturamentoNoMes: number;
    perdaPorAtrasoNoMes: number;
  };
  atrasoDesdeInicio: number;
  atrasoNoMes: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState<string>('');
  const [mesProjection, setMesProjection] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mesSelecionado) return;
    
    async function loadDashboard() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const hoje = new Date();
      const dataReferencia = parseMonth(mesSelecionado);
      const { fim: fimMes } = getMesObj(dataReferencia);

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

      const mediaDiasAtraso = chargesVencidas.length > 0
        ? Math.round(chargesVencidas.reduce((sum, c) => sum + (c.dias_atraso || calcularDiasAtraso(c.data_vencimento)), 0) / chargesVencidas.length)
        : 0;

      const menorScore = clients.length > 0
        ? Math.min(...clients.map(c => c.score || 70))
        : 0;

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

      for (let day = 1; day <= totalDias; day++) {
        labels.push(day.toString());
        
        const isMesAtual = isSameMonth(dataReferencia, hoje);
        
        const paidOfDay = chargesPagas
          .filter(c => c.data_pagamento)
          .filter(c => {
            const pagamento = new Date(c.data_pagamento);
            const isSameDay = pagamento.getDate() === day;
            const isSameMonth = pagamento.getMonth() === dataReferencia.getMonth();
            const isSameYear = pagamento.getFullYear() === dataReferencia.getFullYear();
            return isSameDay && isSameMonth && isSameYear;
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
      const ultimosMeses = 6;
      
      for (let i = ultimosMeses - 1; i >= 0; i--) {
        const mes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() - i, 1);
        const { inicio, fim } = getMesObj(mes);
        
        const chargesAtrasadasDoMes = allCharges.filter(c => {
          const vencimento = new Date(c.data_vencimento);
          return vencimento >= inicio && vencimento <= fim && c.status === 'pendente' && isVencido(c.data_vencimento);
        });
        
        perdaAtrasoLabels.push(format(mes, 'MMM', { locale: ptBR }));
        perdaAtrasoValores.push(chargesAtrasadasDoMes.reduce((sum, c) => sum + Number(c.valor), 0));
      }

      const projection = calculateProjection(allCharges, 6);
      const projectionLabels = projection.map(p => format(p.mes, 'MMM', { locale: ptBR }));
      const projectionValores = projection.map(p => p.faturamento);

      setData({
        totalClientes: clients.length,
        totalCobrancas: allCharges.length,
        cobrancasPagas: chargesPagas.length,
        cobrancasPendentes: chargesPendentes.length,
        cobrancasVencidas: chargesVencidas.length,
        faturamentoMes: metricasMes.faturamentoNoMes,
        faturamentoTotal,
        totalAtrasado: chargesVencidas.reduce((sum, c) => sum + Number(c.valor), 0),
        menorScore,
        mediaDiasAtraso,
        chargesProximasVencer,
        chargesRecentes,
        topDevedores,
        dadosGrafico: { labels, valores },
        dadosInadimplencia: { labels: inadimplenciaLabels, valores: inadimplenciaValores },
        dadosPerdaAtraso: { labels: perdaAtrasoLabels, valores: perdaAtrasoValores },
        projectionData: { labels: projectionLabels, valores: projectionValores },
        mesSelecionado,
        mesProjection,
        metricasMes,
        atrasoDesdeInicio,
        atrasoNoMes
      });

      setIsLoading(false);
    }

    loadDashboard();
  }, [mesSelecionado, mesProjection]);

  useEffect(() => {
    if (mounted) {
      const options = getMonthOptions(12);
      setMesSelecionado(options[0].value);
      const projectionOptions = getProjectionOptions(6);
      setMesProjection(projectionOptions[0].value);
    }
  }, [mounted]);

  if (isLoading || !data) return <DashboardSkeleton />;

  const { totalClientes, cobrancasVencidas, faturamentoTotal, totalAtrasado, menorScore, chargesProximasVencer, chargesRecentes, topDevedores, dadosGrafico, dadosPerdaAtraso, projectionData, metricasMes, atrasoDesdeInicio, atrasoNoMes } = data;

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
        label: 'Faturamento Projetado',
        data: projectionData.valores,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        borderWidth: 2,
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

  const monthOptions = getMonthOptions(12);
  const projectionOptions = getProjectionOptions(6);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto overflow-x-hidden">
      <div className={`opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral completa do seu negócio</p>
      </div>

      {/* Seletor de Período */}
      <div className={`glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            <span className="text-sm font-medium">Período:</span>
          </div>
          <Select
            options={monthOptions}
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Faturamento do Mês', value: metricasMes.faturamentoNoMes, icon: DollarSign, color: 'accent', sub: `${metricasMes.cobrancasPagasNoMes} cobranças pagas` },
          { label: 'Faturamento Total', value: faturamentoTotal, icon: TrendingUp, color: 'accent', sub: 'Desde o início' },
          { label: 'Atraso desde Início', value: atrasoDesdeInicio, icon: AlertTriangle, color: 'danger', sub: `${cobrancasVencidas} cobranças` },
          { label: 'Atraso no Mês', value: atrasoNoMes, icon: Clock, color: 'danger', sub: `${metricasMes.cobrancasAtrasadasNoMes} cobranças` },
        ].map((metric, i) => (
          <div key={metric.label} className={`glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`} style={{ animationDelay: `${(i + 1) * 80}ms` }}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${metric.color === 'accent' ? 'bg-accent/10' : metric.color === 'danger' ? 'bg-danger/10' : 'bg-yellow-500/10'}`}>
                <metric.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${metric.color === 'accent' ? 'text-accent' : metric.color === 'danger' ? 'text-danger' : 'text-yellow-500'}`} />
              </div>
            </div>
            <p className={`text-lg sm:text-2xl font-bold ${metric.color === 'accent' ? '' : metric.color === 'danger' ? 'text-danger' : 'text-yellow-500'}`}>
              {formatCurrency(Number(metric.value))}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{metric.label}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">{metric.sub}</p>
          </div>
        ))}
      </div>

      {/* Stats Rápidas - Métricas do Mês Selecionado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total de Clientes', value: totalClientes, icon: Users, color: 'gray' },
          { label: 'Cobranças no Mês', value: metricasMes.cobrancasNoMes, icon: Receipt, color: 'gray' },
          { label: 'Cobranças Pagas', value: metricasMes.cobrancasPagasNoMes, icon: CheckCircle, color: 'accent' },
          { label: 'Cobranças Atrasadas', value: metricasMes.cobrancasAtrasadasNoMes, icon: AlertTriangle, color: 'danger' },
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

      {/* Gráficos e Top Devedores */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Gráfico de Faturamento Mensal */}
        <div className={`xl:col-span-2 glass-card rounded-2xl p-4 sm:p-6 opacity-0 ${mounted ? 'animate-fade-up animate-delay-300' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Faturamento Mensal</h3>
              <p className="text-xs sm:text-sm text-gray-500">Evolução acumulada do período</p>
            </div>
          </div>
          <div className="h-40 sm:h-56 lg:h-64 min-w-0 overflow-hidden">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Devedores */}
        <div className={`glass-card rounded-2xl p-4 sm:p-6 opacity-0 ${mounted ? 'animate-fade-up animate-delay-400' : ''}`}>
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
      </div>

      {/* Gráfico de Perda por Atraso e Projeção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Perda por Atraso */}
        <div className={`glass-card rounded-2xl p-4 sm:p-6 opacity-0 ${mounted ? 'animate-fade-up animate-delay-500' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Perda por Atraso</h3>
              <p className="text-xs sm:text-sm text-gray-500">Valor perdido por mês</p>
            </div>
          </div>
          <div className="h-40 sm:h-48 lg:h-56 min-w-0 overflow-hidden">
            <Bar data={perdaAtrasoData} options={barChartOptions} />
          </div>
        </div>

        {/* Faturamento Projetivo */}
        <div className={`glass-card rounded-2xl p-4 sm:p-6 opacity-0 ${mounted ? 'animate-fade-up animate-delay-600' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Faturamento Projetivo</h3>
                <p className="text-xs sm:text-sm text-gray-500">Próximos meses</p>
              </div>
            </div>
            <Select
              options={projectionOptions}
              value={mesProjection}
              onChange={(e) => setMesProjection(e.target.value)}
              className="w-32 text-xs"
            />
          </div>
          <div className="h-40 sm:h-48 lg:h-56 min-w-0 overflow-hidden">
            <Line data={projectionChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Próximas a Vencer e Cobranças Recentes */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Próximas a Vencer */}
        <div className={`glass-card rounded-2xl overflow-hidden opacity-0 ${mounted ? 'animate-fade-up animate-delay-500' : ''}`}>
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Próximas a Vencer</h3>
                <p className="text-xs sm:text-sm text-gray-500">Cobranças nos próximos dias</p>
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
        <div className={`glass-card rounded-2xl overflow-hidden opacity-0 ${mounted ? 'animate-fade-up animate-delay-600' : ''}`}>
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

      {/* Alerta de Inadimplência */}
      {totalAtrasado > 0 && (
        <div className={`glass-card rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-danger/5 to-transparent border border-danger/20 opacity-0 ${mounted ? 'animate-fade-up animate-delay-700' : ''}`}>
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-danger/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-danger" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-danger">Atenção: Inadimplência</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs sm:text-sm">
                Você tem <span className="font-bold text-danger">{formatCurrency(totalAtrasado)}</span> em cobranças atrasadas de <span className="font-bold">{cobrancasVencidas}</span> cobrança{cobrancasVencidas !== 1 ? 's' : ''}.
                {menorScore > 0 && ` O menor score dos seus clientes é ${menorScore}.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                <Link href="/dashboard/ranking">
                  <button className="w-full sm:w-auto px-4 py-2 bg-danger text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-danger/90 transition-colors">
                    Ver Ranking
                  </button>
                </Link>
                <Link href="/dashboard/charges">
                  <button className="w-full sm:w-auto px-4 py-2 border border-danger text-danger rounded-lg text-xs sm:text-sm font-medium hover:bg-danger/5 transition-colors">
                    Gerenciar Cobranças
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={`grid grid-cols-2 gap-3 sm:gap-4 opacity-0 ${mounted ? 'animate-fade-up animate-delay-800' : ''}`}>
        <Link href="/dashboard/clients/new" className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 hover-lift group cursor-pointer">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base">Novo Cliente</h4>
              <p className="text-xs text-gray-500 hidden sm:block">Adicionar cliente</p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/charges/new" className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 hover-lift group cursor-pointer">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base">Nova Cobrança</h4>
              <p className="text-xs text-gray-500 hidden sm:block">Criar cobrança</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

