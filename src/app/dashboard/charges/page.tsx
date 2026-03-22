'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Download, AlertTriangle, Clock, CheckCircle, Receipt, ArrowRight, Filter, DollarSign, BarChart3, X, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { formatCurrency, formatDate, calcularDiasAtraso, isVencido } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { hasPremiumAccess } from '@/lib/subscription';
import type { Charge, Profile } from '@/types';

interface ClientOption { id: string; nome: string; }

export default function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'data_vencimento' | 'valor' | 'cliente'>('data_vencimento');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [chargesRes, clientsRes, profileRes] = await Promise.all([
        supabase.from('charges').select('*, client:clients(*)').eq('user_id', user.id).order('data_vencimento', { ascending: false }),
        supabase.from('clients').select('id, nome').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);

      setCharges(chargesRes.data || []);
      setClients(clientsRes.data || []);
      setProfile(profileRes.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredCharges = charges
    .filter(charge => {
      const clientName = charge.client?.nome?.toLowerCase() || '';
      const matchesSearch = clientName.includes(search.toLowerCase()) || charge.descricao?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !filterStatus || charge.status === filterStatus;
      const matchesClient = !filterClient || charge.client_id === filterClient;
      
      const chargeDate = new Date(charge.data_vencimento);
      const now = new Date();
      let matchesPeriod = true;
      
      if (filterPeriod) {
        switch (filterPeriod) {
          case 'proximo_mes':
            const fimMes = new Date(now);
            fimMes.setMonth(fimMes.getMonth() + 1);
            matchesPeriod = chargeDate >= now && chargeDate <= fimMes;
            break;
          case 'proximo_semestre':
            const fimSemestre = new Date(now);
            fimSemestre.setMonth(fimSemestre.getMonth() + 6);
            matchesPeriod = chargeDate >= now && chargeDate <= fimSemestre;
            break;
          case 'proximo_ano':
            const fimAno = new Date(now);
            fimAno.setFullYear(fimAno.getFullYear() + 1);
            matchesPeriod = chargeDate >= now && chargeDate <= fimAno;
            break;
          case 'ultimo_mes':
            const inicioMes = new Date(now);
            inicioMes.setMonth(inicioMes.getMonth() - 1);
            matchesPeriod = chargeDate >= inicioMes && chargeDate <= now;
            break;
          case 'ultimo_semestre':
            const inicioSemestre = new Date(now);
            inicioSemestre.setMonth(inicioSemestre.getMonth() - 6);
            matchesPeriod = chargeDate >= inicioSemestre && chargeDate <= now;
            break;
          case 'ultimo_ano':
            const inicioAno = new Date(now);
            inicioAno.setFullYear(inicioAno.getFullYear() - 1);
            matchesPeriod = chargeDate >= inicioAno && chargeDate <= now;
            break;
          case 'personalizado':
            if (customDateFrom && customDateTo) {
              matchesPeriod = chargeDate >= new Date(customDateFrom) && chargeDate <= new Date(customDateTo);
            } else if (customDateFrom) {
              matchesPeriod = chargeDate >= new Date(customDateFrom);
            } else if (customDateTo) {
              matchesPeriod = chargeDate <= new Date(customDateTo);
            }
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesClient && matchesPeriod;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'data_vencimento':
          comparison = new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
          break;
        case 'valor':
          comparison = Number(a.valor) - Number(b.valor);
          break;
        case 'cliente':
          comparison = (a.client?.nome || '').localeCompare(b.client?.nome || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const stats = {
    total: charges.length,
    paid: charges.filter(c => c.status === 'pago').length,
    pending: charges.filter(c => c.status === 'pendente' && !isVencido(c.data_vencimento)).length,
    overdue: charges.filter(c => c.status === 'pendente' && isVencido(c.data_vencimento)).length,
    totalValue: charges.reduce((sum, c) => sum + Number(c.valor), 0),
    paidValue: charges.filter(c => c.status === 'pago').reduce((sum, c) => sum + Number(c.valor), 0),
    pendingValue: charges.filter(c => c.status === 'pendente').reduce((sum, c) => sum + Number(c.valor), 0),
    overdueValue: charges.filter(c => c.status === 'pendente' && isVencido(c.data_vencimento)).reduce((sum, c) => sum + Number(c.valor), 0),
  };

  const exportCSV = () => {
    const csv = [
      'Cliente,Valor,Vencimento,Status,Descrição',
      ...filteredCharges.map(c => `${c.client?.nome || ''},${c.valor},${c.data_vencimento},${c.status},${c.descricao || ''}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cobrancas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterClient('');
    setFilterPeriod('');
    setCustomDateFrom('');
    setCustomDateTo('');
    setShowFilters(false);
  };

  if (isLoading) return <div className="space-y-6"><h1 className="text-2xl font-bold">Cobrancas</h1><TableSkeleton rows={5} /></div>;

  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cobranças</h1>
          <p className="text-gray-400 mt-1">Gerencie todas as suas cobranças</p>
        </div>
        <div className="flex gap-3">
          {hasPremiumAccess(profile) && (
            <Button variant="outline" onClick={exportCSV} className="hover-lift"><Download className="w-4 h-4" /></Button>
          )}
          <Link href="/dashboard/charges/new">
            <Button className="bg-accent hover-lift"><Plus className="w-4 h-4 mr-2" />Nova Cobrança</Button>
          </Link>
        </div>
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 opacity-0 ${mounted ? 'animate-fade-up animate-delay-100' : ''}`}>
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-gray-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center"><BarChart3 className="w-5 h-5 text-gray-400" /></div>
            <div><p className="text-gray-400 text-xs">Total</p><p className="font-bold">{stats.total}</p></div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-accent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center"><CheckCircle className="w-5 h-5 text-accent" /></div>
            <div><p className="text-gray-400 text-xs">Pagas</p><p className="font-bold">{stats.paid}</p></div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-yellow-500" /></div>
            <div><p className="text-gray-400 text-xs">A Vencer</p><p className="font-bold">{stats.pending}</p></div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-danger">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger/10 rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-danger" /></div>
            <div><p className="text-gray-400 text-xs">Atrasadas</p><p className="font-bold">{stats.overdue}</p></div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-green-500 md:col-span-1 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-500" /></div>
            <div><p className="text-gray-400 text-xs">Recebido</p><p className="font-bold text-accent">{formatCurrency(stats.paidValue)}</p></div>
          </div>
        </div>
      </div>

      <div className={`flex flex-col sm:flex-row gap-4 opacity-0 ${mounted ? 'animate-fade-up animate-delay-200' : ''}`}>
        <div className="flex-1">
          <Input placeholder="Buscar por cliente ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} className="glass-card" />
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
          >
            <option value="data_vencimento">Ordenar por Vencimento</option>
            <option value="valor">Ordenar por Valor</option>
            <option value="cliente">Ordenar por Cliente</option>
          </select>
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3"
          >
            <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          </Button>
          <Button variant={showFilters ? 'primary' : 'outline'} onClick={() => setShowFilters(!showFilters)} className="hover-lift"><Filter className="w-4 h-4" /></Button>
          <Button variant={viewMode === 'grid' ? 'primary' : 'outline'} onClick={() => setViewMode('grid')} className="px-2 sm:px-3"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></Button>
          <Button variant={viewMode === 'list' ? 'primary' : 'outline'} onClick={() => setViewMode('list')} className="px-2 sm:px-3"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></Button>
        </div>
      </div>

      {showFilters && (
        <div className="glass-card rounded-2xl p-5 opacity-0 animate-fade-up">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} options={[{value: '', label: 'Todos'}, {value: 'proximo_mes', label: 'Daqui a 1 Mês'}, {value: 'proximo_semestre', label: 'Daqui a 6 Meses'}, {value: 'proximo_ano', label: 'Daqui a 1 Ano'}, {value: 'ultimo_mes', label: 'Último Mês'}, {value: 'ultimo_semestre', label: 'Último Semestre'}, {value: 'ultimo_ano', label: 'Último Ano'}, {value: 'personalizado', label: 'Personalizado'}]} />
            </div>
            {filterPeriod === 'personalizado' && (
              <>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium mb-1.5">De</label>
                  <input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent" />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium mb-1.5">Até</label>
                  <input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent" />
                </div>
              </>
            )}
            <div className="flex-1 min-w-[200px]">
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} options={[{value: '', label: 'Todos os status'}, {value: 'pendente', label: 'A Vencer'}, {value: 'pago', label: 'Pago'}]} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} options={[{value: '', label: 'Todos os clientes'}, ...clients.map(c => ({value: c.id, label: c.nome}))]} />
            </div>
            <Button variant="ghost" onClick={clearFilters}><X className="w-4 h-4 mr-2" />Limpar</Button>
          </div>
        </div>
      )}

      {filteredCharges.length === 0 ? (
        <div className="glass-card rounded-3xl py-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-4"><Receipt className="w-10 h-10 text-gray-500" /></div>
          <h3 className="text-xl font-semibold mb-2">{search || filterStatus || filterClient || filterPeriod ? 'Nenhuma cobrança encontrada' : 'Nenhuma cobrança cadastrada'}</h3>
          <p className="text-gray-400 mb-4">{search || filterStatus || filterClient || filterPeriod ? 'Tente ajustar os filtros' : 'Comece criando sua primeira cobrança'}</p>
          {!search && !filterStatus && !filterClient && !filterPeriod && (<Link href="/dashboard/charges/new"><Button className="bg-accent">Criar Cobrança</Button></Link>)}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharges.map((charge, i) => {
            const vencido = isVencido(charge.data_vencimento) && charge.status === 'pendente';
            const diasAtraso = charge.dias_atraso || calcularDiasAtraso(charge.data_vencimento);
            return (
              <Link key={charge.id} href={`/dashboard/charges/${charge.id}`} className="block">
                <div className={`glass-card rounded-2xl p-5 hover-lift cursor-pointer group opacity-0 ${mounted ? 'animate-fade-up' : ''}`} style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      charge.status === 'pago' ? 'bg-accent/10' : vencido ? 'bg-danger/10' : 'bg-yellow-500/10'
                    }`}>
                      {charge.status === 'pago' ? <CheckCircle className="w-6 h-6 text-accent" /> : vencido ? <AlertTriangle className="w-6 h-6 text-danger" /> : <Clock className="w-6 h-6 text-yellow-500" />}
                    </div>
                    <Badge className={`${charge.status === 'pago' ? 'bg-accent/20 text-accent' : vencido ? 'bg-danger/20 text-danger' : 'bg-yellow-500/20 text-yellow-500'}`}>
                      {charge.status === 'pago' ? 'Pago' : vencido ? `${diasAtraso}d atrasado` : 'A Vencer'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors">{charge.client?.nome || 'Cliente'}</h3>
                  <p className="text-gray-400 text-sm mb-4">{charge.descricao || 'Cobrança'}</p>
                  <div className="flex items-end justify-between pt-4 border-t border-gray-800">
                    <div>
                      <p className="text-gray-500 text-xs">Valor</p>
                      <p className={`text-xl font-bold ${charge.status === 'pago' ? 'text-accent' : vencido ? 'text-danger' : 'text-white'}`}>{formatCurrency(Number(charge.valor))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">Vencimento</p>
                      <p className={`text-sm ${vencido ? 'text-danger' : 'text-gray-400'}`}>{formatDate(charge.data_vencimento)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCharges.map((charge, i) => {
            const vencido = isVencido(charge.data_vencimento) && charge.status === 'pendente';
            const diasAtraso = charge.dias_atraso || calcularDiasAtraso(charge.data_vencimento);
            return (
              <Link key={charge.id} href={`/dashboard/charges/${charge.id}`} className="block">
                <div className={`glass-card rounded-2xl p-4 hover-lift cursor-pointer opacity-0 ${mounted ? 'animate-fade-up' : ''}`} style={{ animationDelay: `${i * 20}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${charge.status === 'pago' ? 'bg-accent/10' : vencido ? 'bg-danger/10' : 'bg-yellow-500/10'}`}>
                        {charge.status === 'pago' ? <CheckCircle className="w-6 h-6 text-accent" /> : vencido ? <AlertTriangle className="w-6 h-6 text-danger" /> : <Clock className="w-6 h-6 text-yellow-500" />}
                      </div>
                      <div>
                        <p className="font-semibold">{charge.client?.nome}</p>
                        <p className="text-sm text-gray-400">{charge.descricao || 'Cobrança'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-gray-500 text-xs">Valor</p>
                        <p className={`font-bold ${charge.status === 'pago' ? 'text-accent' : vencido ? 'text-danger' : ''}`}>{formatCurrency(Number(charge.valor))}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 text-xs">Vencimento</p>
                        <p className={`text-sm ${vencido ? 'text-danger' : 'text-gray-400'}`}>{formatDate(charge.data_vencimento)}</p>
                      </div>
                      <Badge className={`${charge.status === 'pago' ? 'bg-accent/20 text-accent' : vencido ? 'bg-danger/20 text-danger' : 'bg-yellow-500/20 text-yellow-500'}`}>
                        {charge.status === 'pago' ? 'Pago' : vencido ? `${diasAtraso}d` : 'A Vencer'}
                      </Badge>
                      <ArrowRight className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}