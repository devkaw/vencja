'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Download, AlertTriangle, Clock, CheckCircle, Receipt, ArrowRight, Filter, DollarSign, BarChart3, X, ArrowUpDown, Grid, List, MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { formatCurrency, formatDate, calcularDiasAtraso, isVencido } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { hasPremiumAccess, PLANS } from '@/lib/subscription';
import type { Charge, Profile } from '@/types';

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

export default function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'data_vencimento' | 'valor' | 'cliente'>('data_vencimento');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [chargesRes, profileRes] = await Promise.all([
        supabase.from('charges').select('*, client:clients(*)').eq('user_id', user.id).order('data_vencimento', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);
      setCharges(chargesRes.data || []);
      setProfile(profileRes.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredCharges = useMemo(() => 
    charges.filter(c => {
      const matchesSearch = !search || c.client?.nome?.toLowerCase().includes(search.toLowerCase()) || c.descricao?.toLowerCase().includes(search.toLowerCase());
      let matchesStatus = true;
      if (filterStatus) {
        if (filterStatus === 'atrasada') matchesStatus = c.status === 'pendente' && isVencido(c.data_vencimento);
        else if (filterStatus === 'pendente') matchesStatus = c.status === 'pendente' && !isVencido(c.data_vencimento);
        else matchesStatus = c.status === filterStatus;
      }
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'data_vencimento') comparison = new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      else if (sortBy === 'valor') comparison = Number(a.valor) - Number(b.valor);
      else comparison = (a.client?.nome || '').localeCompare(b.client?.nome || '');
      return sortOrder === 'asc' ? comparison : -comparison;
    }), [charges, search, filterStatus, sortBy, sortOrder]);

  const hasAccess = hasPremiumAccess(profile);
  const maxCharges = hasAccess ? PLANS.pro.limits.maxCharges : PLANS.free.limits.maxCharges;
  const canAddMore = hasAccess || charges.length < maxCharges;

  const stats = useMemo(() => ({
    total: charges.length,
    maxCharges,
    paid: charges.filter(c => c.status === 'pago').length,
    pending: charges.filter(c => c.status === 'pendente' && !isVencido(c.data_vencimento)).length,
    overdue: charges.filter(c => c.status === 'pendente' && isVencido(c.data_vencimento)).length,
    paidValue: charges.filter(c => c.status === 'pago').reduce((sum, c) => sum + Number(c.valor), 0),
    pendingValue: charges.filter(c => c.status === 'pendente').reduce((sum, c) => sum + Number(c.valor), 0),
    overdueValue: charges.filter(c => c.status === 'pendente' && isVencido(c.data_vencimento)).reduce((sum, c) => sum + Number(c.valor), 0),
  }), [charges]);

  if (isLoading) return <TableSkeleton rows={5} />;

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extralight tracking-tight">Cobranças</h1>
          <p className="text-slate-400 font-light mt-1">Gerencie todas as cobranças</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/charges/new">
            <Button className="bg-accent text-black" disabled={!canAddMore}>
              <Plus className="w-4 h-4 mr-2" />Nova Cobrança
            </Button>
          </Link>
        </div>
      </motion.div>

      {!canAddMore && (
        <motion.div variants={fadeIn} className="glass-card rounded-xl p-4 border-accent/30">
          <p className="text-sm font-light">
            Limite de {maxCharges} cobranças atingido. 
            <Link href="/dashboard/upgrade" className="text-accent font-light ml-1">Faça upgrade</Link> para ilimitadas.
          </p>
        </motion.div>
      )}

      <motion.div variants={fadeIn} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MiniStat color="text-slate-400" label="Total" value={`${stats.total}/${stats.maxCharges === -1 ? '∞' : stats.maxCharges}`} />
        <MiniStat color="text-accent" label="Pagas" value={stats.paid} />
        <MiniStat color="text-warning" label="A Vencer" value={stats.pending} />
        <MiniStat color="text-danger" label="Atraso" value={stats.overdue} />
        <MiniStat color="text-danger" label="Atrasadas" value={stats.overdue} />
        <MiniStat color="text-accent" label="Recebido" value={formatCurrency(stats.paidValue)} isCurrency />
      </motion.div>

      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Buscar cobranças..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 font-light focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-xl border text-sm font-light transition-all ${showFilters ? 'bg-accent/10 border-accent text-accent' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)} 
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-light text-slate-300 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="pago">Pagas</option>
            <option value="pendente">A Vencer</option>
            <option value="atrasada">Atrasadas</option>
          </select>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)} 
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-light text-slate-300 focus:outline-none"
          >
            <option value="data_vencimento">Data</option>
            <option value="valor">Valor</option>
            <option value="cliente">Cliente</option>
          </select>
          <button 
            onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')} 
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
          >
            <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          </button>
          <button 
            onClick={() => setViewMode('grid')} 
            className={`p-2 rounded-xl ${viewMode === 'grid' ? 'bg-accent text-black' : 'bg-white/5 text-slate-400 hover:text-white'} transition-all`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            className={`p-2 rounded-xl ${viewMode === 'list' ? 'bg-accent text-black' : 'bg-white/5 text-slate-400 hover:text-white'} transition-all`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {showFilters && (
        <motion.div variants={fadeIn} className="glass-card rounded-xl p-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 font-light">Status:</span>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-light text-slate-300 focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="pago">Pagas</option>
<option value="pendente">A Vencer</option>
<option value="atrasada">Atraso</option>
            </select>
          </div>
          {filterStatus && (
            <button 
              onClick={() => setFilterStatus('')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />Limpar
            </button>
          )}
        </motion.div>
      )}

      {filteredCharges.length === 0 ? (
        <motion.div variants={fadeIn} className="glass-card rounded-3xl py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-4"><Receipt className="w-10 h-10 text-slate-500" /></div>
          <h3 className="text-xl font-light mb-2">{search || filterStatus ? 'Nenhuma cobrança encontrada' : 'Nenhuma cobrança cadastrada'}</h3>
          <p className="text-slate-500 font-light mb-4">{search || filterStatus ? 'Tente ajustar os filtros' : 'Comece criando sua primeira cobrança'}</p>
          {!search && !filterStatus && canAddMore && <Link href="/dashboard/charges/new"><Button className="bg-accent text-black">Criar Cobrança</Button></Link>}
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharges.map((charge, i) => {
            const vencido = isVencido(charge.data_vencimento) && charge.status === 'pendente';
            const diasAtraso = charge.dias_atraso || calcularDiasAtraso(charge.data_vencimento);
            return (
              <Link key={charge.id} href={`/dashboard/charges/${charge.id}`}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-5 hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${charge.status === 'pago' ? 'bg-accent/10' : vencido ? 'bg-danger/10' : 'bg-warning/10'}`}>
                      {charge.status === 'pago' ? <CheckCircle className="w-6 h-6 text-accent" /> : vencido ? <AlertTriangle className="w-6 h-6 text-danger" /> : <Clock className="w-6 h-6 text-warning" />}
                    </div>
                    <Badge variant={charge.status === 'pago' ? 'success' : vencido ? 'danger' : 'warning'} className="text-xs">
                      {charge.status === 'pago' ? 'Pago' : vencido ? `${diasAtraso}d` : 'A Vencer'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-light mb-1 group-hover:text-accent transition-colors">{charge.client?.nome || 'Cliente'}</h3>
                  <p className="text-sm text-slate-500 font-light mb-4">{charge.descricao || 'Cobrança'}</p>
                  <div className="flex items-end justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-slate-500">Valor</p>
                      <p className={`text-xl font-extralight ${charge.status === 'pago' ? 'text-accent' : vencido ? 'text-danger' : 'text-warning'}`}>{formatCurrency(Number(charge.valor))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Vencimento</p>
                      <p className={`text-sm ${vencido ? 'text-danger' : 'text-slate-400'}`}>{formatDate(charge.data_vencimento)}</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      ) : (
        <motion.div variants={fadeIn} className="glass-card rounded-2xl overflow-x-auto">
          <div className="divide-y divide-white/5 min-w-[600px]">
            {filteredCharges.map((charge, i) => {
              const vencido = isVencido(charge.data_vencimento) && charge.status === 'pendente';
              const diasAtraso = charge.dias_atraso || calcularDiasAtraso(charge.data_vencimento);
              return (
                <Link key={charge.id} href={`/dashboard/charges/${charge.id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${charge.status === 'pago' ? 'bg-accent/10' : vencido ? 'bg-danger/10' : 'bg-warning/10'}`}>
                      {charge.status === 'pago' ? <CheckCircle className="w-5 h-5 text-accent" /> : vencido ? <AlertTriangle className="w-5 h-5 text-danger" /> : <Clock className="w-5 h-5 text-warning" />}
                    </div>
                    <div>
                      <p className="font-light">{charge.client?.nome}</p>
                      <p className="text-xs text-slate-500">{charge.descricao || 'Cobrança'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-sm text-slate-500">Valor</p>
                      <p className={`font-light ${charge.status === 'pago' ? 'text-accent' : vencido ? 'text-danger' : 'text-warning'}`}>{formatCurrency(Number(charge.valor))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-500">Vencimento</p>
                      <p className={`text-sm ${vencido ? 'text-danger' : 'text-slate-400'}`}>{formatDate(charge.data_vencimento)}</p>
                    </div>
                    <Badge variant={charge.status === 'pago' ? 'success' : vencido ? 'danger' : 'warning'}>
                      {charge.status === 'pago' ? 'Pago' : vencido ? `${diasAtraso}d` : 'A Vencer'}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function MiniStat({ color, label, value, isCurrency }: { color: string; label: string; value: number | string; isCurrency?: boolean }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className={`text-xl font-extralight ${color}`}>{isCurrency ? value : value}</p>
      <p className="text-xs text-slate-500 font-light">{label}</p>
    </div>
  );
}