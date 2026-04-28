'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, DollarSign, Receipt, Users, AlertTriangle, TrendingUp, TrendingDown, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, isVencido } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { hasPremiumAccess } from '@/lib/subscription';
import type { Charge, Profile } from '@/types';

export default function RelatoriosPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [clients, setClients] = useState<{ id: string; nome: string; telefone: string; email: string; score: number; total_pago: number; total_atrasado: number; created_at: string }[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumo' | 'cobrancas' | 'clientes'>('resumo');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [chargesRes, clientsRes, profileRes] = await Promise.all([
        supabase.from('charges').select('*, client:clients(*)').eq('user_id', user.id).order('data_vencimento', { ascending: false }),
        supabase.from('clients').select('*').eq('user_id', user.id).order('nome'),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);

      setCharges(chargesRes.data || []);
      setClients(clientsRes.data || []);
      setProfile(profileRes.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading && profile && !hasPremiumAccess(profile)) {
      router.push('/dashboard/upgrade');
    }
  }, [profile, isLoading, router]);

  const stats = {
    totalCobranca: charges.length,
    totalPago: charges.filter(c => c.status === 'pago').length,
    totalPendente: charges.filter(c => c.status === 'pendente').length,
    totalAtrasado: charges.filter(c => c.status === 'pendente' && isVencido(c.data_vencimento)).length,
    valorTotal: charges.reduce((sum, c) => sum + Number(c.valor), 0),
    valorPago: charges.filter(c => c.status === 'pago').reduce((sum, c) => sum + Number(c.valor), 0),
    valorPendente: charges.filter(c => c.status === 'pendente').reduce((sum, c) => sum + Number(c.valor), 0),
    valorAtrasado: charges.filter(c => c.status === 'pendente' && isVencido(c.data_vencimento)).reduce((sum, c) => sum + Number(c.valor), 0),
    totalClientes: clients.length,
    clientesAtivos: clients.filter(c => c.total_pago > 0).length,
  };

  const getMonthlySummary = () => {
    const data: { mes: string; pagas: number; pendentes: number; atrasadas: number; valorPago: number; valorPendente: number; valorAtrasado: number }[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mesKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const mesLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      const monthCharges = charges.filter(c => {
        const d = new Date(c.data_vencimento);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesKey;
      });
      
      const pagas = monthCharges.filter(c => c.status === 'pago');
      const pendentes = monthCharges.filter(c => c.status === 'pendente' && !isVencido(c.data_vencimento));
      const atrasadas = monthCharges.filter(c => c.status === 'pendente' && isVencido(c.data_vencimento));
      
      data.push({
        mes: mesLabel,
        pagas: pagas.length,
        pendentes: pendentes.length,
        atrasadas: atrasadas.length,
        valorPago: pagas.reduce((sum, c) => sum + Number(c.valor), 0),
        valorPendente: pendentes.reduce((sum, c) => sum + Number(c.valor), 0),
        valorAtrasado: atrasadas.reduce((sum, c) => sum + Number(c.valor), 0),
      });
    }
    
    return data;
  };

  const getYearlySummary = () => {
    const years = [...new Set(charges.map(c => new Date(c.data_vencimento).getFullYear()))].sort();
    
    return years.map(year => {
      const yearCharges = charges.filter(c => new Date(c.data_vencimento).getFullYear() === year);
      const pagas = yearCharges.filter(c => c.status === 'pago');
      const pendentes = yearCharges.filter(c => c.status === 'pendente' && !isVencido(c.data_vencimento));
      const atrasadas = yearCharges.filter(c => c.status === 'pendente' && isVencido(c.data_vencimento));
      
      return {
        ano: year.toString(),
        total: yearCharges.length,
        pagas: pagas.length,
        pendentes: pendentes.length,
        atrasadas: atrasadas.length,
        valorTotal: yearCharges.reduce((sum, c) => sum + Number(c.valor), 0),
        valorPago: pagas.reduce((sum, c) => sum + Number(c.valor), 0),
        valorPendente: pendentes.reduce((sum, c) => sum + Number(c.valor), 0),
        valorAtrasado: atrasadas.reduce((sum, c) => sum + Number(c.valor), 0),
      };
    });
  };

  const getInadimplentes = () => {
    const clientMap = new Map<string, { client: any; totalAtrasado: number; quantidadeAtrasos: number; mediaDiasAtraso: number; charges: any[] }>();
    const hoje = new Date();

    charges.forEach(c => {
      if (c.status === 'pendente' && new Date(c.data_vencimento) < hoje) {
        if (!clientMap.has(c.client_id)) {
          clientMap.set(c.client_id, {
            client: c.client,
            totalAtrasado: 0,
            quantidadeAtrasos: 0,
            mediaDiasAtraso: 0,
            charges: [],
          });
        }
        const data = clientMap.get(c.client_id)!;
        data.quantidadeAtrasos++;
        data.totalAtrasado += Number(c.valor);
        const diasAtrasoCalc = Math.floor((hoje.getTime() - new Date(c.data_vencimento).getTime()) / (1000 * 60 * 60 * 24));
        data.charges.push({ ...c, dias_atraso: diasAtrasoCalc });
      }
    });

    clientMap.forEach((data) => {
      const totalDias = data.charges.reduce((sum: number, c: any) => sum + c.dias_atraso, 0);
      data.mediaDiasAtraso = Math.round(totalDias / data.charges.length);
    });

    return Array.from(clientMap.values())
      .sort((a, b) => {
        if (b.totalAtrasado !== a.totalAtrasado) return b.totalAtrasado - a.totalAtrasado;
        if (b.quantidadeAtrasos !== a.quantidadeAtrasos) return b.quantidadeAtrasos - a.quantidadeAtrasos;
        return b.mediaDiasAtraso - a.mediaDiasAtraso;
      })
      .slice(0, 50);
  };

  const exportCSV = (type: 'resumo_mensal' | 'resumo_anual' | 'cobrancas' | 'clientes' | 'inadimplentes') => {
    let csv = '';
    
    if (type === 'resumo_mensal') {
      const data = getMonthlySummary();
      csv = [
        'Mês,Cobranças Pagas,Cobranças Pendentes,Cobranças Atrasadas,Valor Pago,Valor Pendente,Valor Atrasado',
        ...data.map(d => `${d.mes},${d.pagas},${d.pendentes},${d.atrasadas},${d.valorPago},${d.valorPendente},${d.valorAtrasado}`)
      ].join('\n');
    } else if (type === 'resumo_anual') {
      const data = getYearlySummary();
      csv = [
        'Ano,Total,Cobranças Pagas,Cobranças Pendentes,Cobranças Atrasadas,Valor Total,Valor Pago,Valor Pendente,Valor Atrasado',
        ...data.map(d => `${d.ano},${d.total},${d.pagas},${d.pendentes},${d.atrasadas},${d.valorTotal},${d.valorPago},${d.valorPendente},${d.valorAtrasado}`)
      ].join('\n');
    } else if (type === 'cobrancas') {
      csv = [
        'Cliente,Valor,Vencimento,Status,Data Pagamento,Descrição',
        ...charges.map(c => `${c.client?.nome || ''},${c.valor},${c.data_vencimento},${c.status},${c.data_pagamento || ''},${c.descricao || ''}`)
      ].join('\n');
    } else if (type === 'clientes') {
      csv = [
        'Nome,Email,Telefone,Score,Total Pago,Total Atrasado,Desde',
        ...clients.map(c => `${c.nome},${c.email || ''},${c.telefone || ''},${c.score},${c.total_pago},${c.total_atrasado},${c.created_at}`)
      ].join('\n');
    } else if (type === 'inadimplentes') {
      const inadim = getInadimplentes();
      csv = [
        'Posição,Cliente,Total Atrasado,Qtd Cobranças,Média Dias',
        ...inadim.map((item, i) => `${i + 1},${item.client?.nome || ''},${item.totalAtrasado},${item.quantidadeAtrasos},${item.mediaDiasAtraso}`)
      ].join('\n');
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const tabs = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'cobrancas', label: 'Cobranças' },
    { id: 'clientes', label: 'Clientes' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-800/50 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!hasPremiumAccess(profile)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-gray-400 mt-1">Dados completos para análise</p>
        </div>
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 opacity-0 ${mounted ? 'animate-fade-up animate-delay-100' : ''}`}>
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-accent">
          <p className="text-gray-400 text-xs mb-1">Valor Total</p>
          <p className="font-bold text-accent text-lg">{formatCurrency(stats.valorTotal)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-green-500">
          <p className="text-gray-400 text-xs mb-1">Valor Recebido</p>
          <p className="font-bold text-green-500 text-lg">{formatCurrency(stats.valorPago)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-yellow-500">
          <p className="text-gray-400 text-xs mb-1">Valor Pendente</p>
          <p className="font-bold text-yellow-500 text-lg">{formatCurrency(stats.valorPendente)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-danger">
          <p className="text-gray-400 text-xs mb-1">Valor Atrasado</p>
          <p className="font-bold text-danger text-lg">{formatCurrency(stats.valorAtrasado)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-blue-500">
          <p className="text-gray-400 text-xs mb-1">Cobranças</p>
          <p className="font-bold text-lg">{stats.totalCobranca}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-purple-500">
          <p className="text-gray-400 text-xs mb-1">Clientes</p>
          <p className="font-bold text-lg">{stats.totalClientes}</p>
        </div>
      </div>

      <div className={`flex gap-2 border-b border-gray-800 opacity-0 ${mounted ? 'animate-fade-up animate-delay-200' : ''}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-accent text-accent' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumo' && (
        <div className="space-y-6">
          <div className={`glass-card rounded-2xl p-5 opacity-0 ${mounted ? 'animate-fade-up animate-delay-300' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Resumo Mensal</h3>
              <Button variant="outline" size="sm" onClick={() => exportCSV('resumo_mensal')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-3 text-gray-400 font-medium">Mês</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Pagas</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Pendentes</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Atrasadas</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Valor Pago</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Valor Pendente</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Valor Atrasado</th>
                  </tr>
                </thead>
                <tbody>
                  {getMonthlySummary().map((row, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 px-3 capitalize">{row.mes}</td>
                      <td className="py-2 px-3 text-right text-green-500">{row.pagas}</td>
                      <td className="py-2 px-3 text-right text-yellow-500">{row.pendentes}</td>
                      <td className="py-2 px-3 text-right text-danger">{row.atrasadas}</td>
                      <td className="py-2 px-3 text-right text-green-500">{formatCurrency(row.valorPago)}</td>
                      <td className="py-2 px-3 text-right text-yellow-500">{formatCurrency(row.valorPendente)}</td>
                      <td className="py-2 px-3 text-right text-danger">{formatCurrency(row.valorAtrasado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`glass-card rounded-2xl p-5 opacity-0 ${mounted ? 'animate-fade-up animate-delay-400' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Resumo Anual</h3>
              <Button variant="outline" size="sm" onClick={() => exportCSV('resumo_anual')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-3 text-gray-400 font-medium">Ano</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Total</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Pagas</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Pendentes</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Atrasadas</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Valor Total</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Valor Pago</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Valor Atrasado</th>
                  </tr>
                </thead>
                <tbody>
                  {getYearlySummary().map((row, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 px-3 font-medium">{row.ano}</td>
                      <td className="py-2 px-3 text-right">{row.total}</td>
                      <td className="py-2 px-3 text-right text-green-500">{row.pagas}</td>
                      <td className="py-2 px-3 text-right text-yellow-500">{row.pendentes}</td>
                      <td className="py-2 px-3 text-right text-danger">{row.atrasadas}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(row.valorTotal)}</td>
                      <td className="py-2 px-3 text-right text-green-500">{formatCurrency(row.valorPago)}</td>
                      <td className="py-2 px-3 text-right text-danger">{formatCurrency(row.valorAtrasado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`glass-card rounded-2xl p-5 opacity-0 ${mounted ? 'animate-fade-up animate-delay-500' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Inadimplentes (Top 50)</h3>
              <Button variant="outline" size="sm" onClick={() => exportCSV('inadimplentes')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-3 text-gray-400 font-medium">#</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-medium">Cliente</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Total Atrasado</th>
                    <th className="text-center py-3 px-3 text-gray-400 font-medium">Qtd Cobranças</th>
                    <th className="text-center py-3 px-3 text-gray-400 font-medium">Média Dias</th>
                  </tr>
                </thead>
                <tbody>
                  {getInadimplentes().map((item, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 px-3">{i + 1}</td>
                      <td className="py-2 px-3 font-medium">{item.client?.nome || '-'}</td>
                      <td className="py-2 px-3 text-right text-danger font-medium">{formatCurrency(item.totalAtrasado)}</td>
                      <td className="py-2 px-3 text-center">{item.quantidadeAtrasos}</td>
                      <td className="py-2 px-3 text-center">{item.mediaDiasAtraso}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cobrancas' && (
        <div className={`glass-card rounded-2xl p-5 opacity-0 ${mounted ? 'animate-fade-up animate-delay-300' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Todas as Cobranças ({charges.length})</h3>
            <Button variant="outline" size="sm" onClick={() => exportCSV('cobrancas')}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Cliente</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium">Valor</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium">Vencimento</th>
                  <th className="text-center py-3 px-3 text-gray-400 font-medium">Status</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium">Pagamento</th>
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge, i) => {
                  const vencido = isVencido(charge.data_vencimento) && charge.status === 'pendente';
                  return (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 px-3">{charge.client?.nome || '-'}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatCurrency(Number(charge.valor))}</td>
                      <td className="py-2 px-3 text-right">{formatDate(charge.data_vencimento)}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          charge.status === 'pago' ? 'bg-green-500/20 text-green-500' : 
                          vencido ? 'bg-danger/20 text-danger' : 'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {charge.status === 'pago' ? 'Pago' : vencido ? 'Atrasado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-400">{charge.data_pagamento ? formatDate(charge.data_pagamento) : '-'}</td>
                      <td className="py-2 px-3">{charge.descricao || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'clientes' && (
        <div className={`glass-card rounded-2xl p-5 opacity-0 ${mounted ? 'animate-fade-up animate-delay-300' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Todos os Clientes ({clients.length})</h3>
            <Button variant="outline" size="sm" onClick={() => exportCSV('clientes')}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Nome</th>
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-3 text-gray-400 font-medium">Telefone</th>
                  <th className="text-center py-3 px-3 text-gray-400 font-medium">Score</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium">Total Pago</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium">Total Atrasado</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium">Desde</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 px-3 font-medium">{client.nome}</td>
                    <td className="py-2 px-3 text-gray-400">{client.email || '-'}</td>
                    <td className="py-2 px-3 text-gray-400">{client.telefone || '-'}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.score >= 700 ? 'bg-green-500/20 text-green-500' :
                        client.score >= 500 ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-danger/20 text-danger'
                      }`}>
                        {client.score}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-green-500">{formatCurrency(client.total_pago)}</td>
                    <td className="py-2 px-3 text-right text-danger">{formatCurrency(client.total_atrasado)}</td>
                    <td className="py-2 px-3 text-right text-gray-400">{formatDate(client.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}