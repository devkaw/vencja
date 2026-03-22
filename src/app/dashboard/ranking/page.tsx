'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Sparkles, DollarSign, Clock, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { formatCurrency, calcularDiasAtraso, getMonthOptions, parseMonth, getMesObj } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Client } from '@/types';
import { Select } from '@/components/ui/select';
import { parseISO, isBefore, isAfter } from 'date-fns';

interface ClientRanking { client: Client; totalAtrasado: number; quantidadeAtrasos: number; mediaDiasAtraso: number; charges: Array<{ id: string; descricao: string; valor: number; data_vencimento: string; dias_atraso: number }>; }

interface RankingData {
  ranking: ClientRanking[];
  totalAtrasadoGeral: number;
  totalChargesAtrasadas: number;
  avgDiasAtraso: number;
  mesSelecionado: string;
}

export default function RankingPage() {
  const [data, setData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mesSelecionado) return;

    async function loadData() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dataReferencia = parseMonth(mesSelecionado);
      const { fim: fimMes } = getMesObj(dataReferencia);
      const mesAnterior = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() - 1, 1);

      const { data: clientsData } = await supabase.from('clients').select('*').eq('user_id', user.id);

      const clients = clientsData || [];
      const rankingData: ClientRanking[] = [];
      const hoje = new Date();

      for (const client of clients) {
        const { data: charges } = await supabase
          .from('charges')
          .select('id, descricao, valor, data_vencimento, status, data_pagamento')
          .eq('client_id', client.id);

        const chargesData = charges || [];
        
        const atrasados = chargesData.filter((c: any) => {
          const vencimento = parseISO(c.data_vencimento);
          
          if (mesSelecionado === 'all') {
            return c.status === 'pendente' && isBefore(vencimento, hoje);
          }
          
          return c.status === 'pendente' && isBefore(vencimento, fimMes) && isAfter(vencimento, mesAnterior);
        });
        
        if (atrasados.length > 0) {
          const totalAtrasado = atrasados.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
          const chargesComDias = atrasados.map((c: any) => ({ ...c, dias_atraso: calcularDiasAtraso(c.data_vencimento) }));
          const totalDias = chargesComDias.reduce((sum: number, c: any) => sum + c.dias_atraso, 0);
          rankingData.push({ 
            client, 
            totalAtrasado, 
            quantidadeAtrasos: atrasados.length, 
            mediaDiasAtraso: Math.round(totalDias / chargesComDias.length), 
            charges: chargesComDias 
          });
        }
      }

      rankingData.sort((a, b) => { 
        if (b.totalAtrasado !== a.totalAtrasado) return b.totalAtrasado - a.totalAtrasado; 
        if (b.quantidadeAtrasos !== a.quantidadeAtrasos) return b.quantidadeAtrasos - a.quantidadeAtrasos; 
        return b.mediaDiasAtraso - a.mediaDiasAtraso; 
      });

      const totalAtrasadoGeral = rankingData.reduce((sum, r) => sum + r.totalAtrasado, 0);
      const totalChargesAtrasadas = rankingData.reduce((sum, r) => sum + r.quantidadeAtrasos, 0);
      const avgDiasAtraso = rankingData.length > 0 ? Math.round(rankingData.reduce((sum, r) => sum + r.mediaDiasAtraso, 0) / rankingData.length) : 0;

      setData({
        ranking: rankingData,
        totalAtrasadoGeral,
        totalChargesAtrasadas,
        avgDiasAtraso,
        mesSelecionado
      });
      
      setIsLoading(false);
    }
    
    loadData();
  }, [mesSelecionado]);

  useEffect(() => {
    if (mounted) {
      const options = getMonthOptions(12);
      options.push({ value: 'all', label: 'Todos os períodos' });
      setMesSelecionado(options[0].value);
    }
  }, [mounted]);

  if (isLoading || !data) return <div className="space-y-6"><h1 className="text-2xl font-bold">Ranking de Inadimplencia</h1><DashboardSkeleton /></div>;

  const { ranking, totalAtrasadoGeral, totalChargesAtrasadas, avgDiasAtraso } = data;
  const monthOptions = getMonthOptions(12);
  monthOptions.push({ value: 'all', label: 'Todos os períodos' });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ranking de Inadimplência</h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">Análise detalhada dos clientes devedores</p>
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

      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 opacity-0 ${mounted ? 'animate-fade-up animate-delay-100' : ''}`}>
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border-l-2 sm:border-l-4 border-l-danger">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-danger/10 rounded-lg sm:rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-danger" /></div>
            <div className="min-w-0"><p className="text-gray-400 text-[10px] sm:text-xs">Total em Atraso</p><p className="text-lg sm:text-xl font-bold text-danger truncate">{formatCurrency(totalAtrasadoGeral)}</p></div>
          </div>
        </div>
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border-l-2 sm:border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-lg sm:rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" /></div>
            <div><p className="text-gray-400 text-[10px] sm:text-xs">Cobranças</p><p className="text-lg sm:text-xl font-bold">{totalChargesAtrasadas}</p></div>
          </div>
        </div>
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border-l-2 sm:border-l-4 border-l-orange-500">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 rounded-lg sm:rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /></div>
            <div><p className="text-gray-400 text-[10px] sm:text-xs">Média</p><p className="text-lg sm:text-xl font-bold">{avgDiasAtraso}d</p></div>
          </div>
        </div>
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border-l-2 sm:border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/10 rounded-lg sm:rounded-xl flex items-center justify-center"><Users className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" /></div>
            <div><p className="text-gray-400 text-[10px] sm:text-xs">Inadimpl.</p><p className="text-lg sm:text-xl font-bold">{ranking.length}</p></div>
          </div>
        </div>
      </div>

      {ranking.length === 0 ? (
        <div className="glass-card rounded-3xl py-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-4"><Sparkles className="w-10 h-10 text-accent" /></div>
          <h3 className="text-xl font-semibold mb-2">Nenhum cliente em atraso!</h3>
          <p className="text-gray-400">Continue mantendo suas cobranças em dia</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {ranking.map((item, index) => {
            const percentage = totalAtrasadoGeral > 0 ? (item.totalAtrasado / totalAtrasadoGeral) * 100 : 0;
            return (
              <div key={item.client.id} className={`glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 hover-lift cursor-pointer opacity-0 ${mounted ? 'animate-fade-up' : ''}`} style={{ animationDelay: `${(index + 3) * 50}ms` }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : index === 1 ? 'bg-gray-400/20 text-gray-400' : index === 2 ? 'bg-orange-600/20 text-orange-600' : 'bg-gray-800 text-gray-500'}`}>{index + 1}</div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center"><span className="text-sm sm:text-lg font-bold">{item.client.nome.charAt(0).toUpperCase()}</span></div>
                    <div className="min-w-0 flex-1 sm:flex-none">
                      <p className="font-semibold text-sm sm:text-base truncate">{item.client.nome}</p>
                      <p className="text-xs text-gray-400">{item.quantidadeAtrasos} cobrança{item.quantidadeAtrasos > 1 ? 's' : ''} • {item.mediaDiasAtraso}d méd.</p>
                    </div>
                  </div>
                  <div className="text-right w-full sm:w-auto sm:ml-4">
                    <p className="text-lg sm:text-xl font-bold text-danger">{formatCurrency(item.totalAtrasado)}</p>
                    <div className="w-full sm:w-24 h-1.5 sm:h-2 bg-gray-800 rounded-full mt-1 sm:mt-2 overflow-hidden">
                      <div className="h-full bg-danger rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{percentage.toFixed(1)}% do total</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full text-xs sm:text-sm text-gray-400" onClick={(e) => { e.preventDefault(); setShowDetails(showDetails === item.client.id ? null : item.client.id); }}>
                  {showDetails === item.client.id ? 'Ver menos' : 'Ver cobranças'}
                </Button>
                {showDetails === item.client.id && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-800 space-y-2">
                    {item.charges.map(charge => (
                      <div key={charge.id} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-400 truncate flex-1 mr-2">{charge.descricao || 'Cobrança'}</span>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <span className="text-danger">{formatCurrency(Number(charge.valor))}</span>
                          <Badge className="bg-danger/20 text-danger text-[10px] sm:text-xs">{charge.dias_atraso}d</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}