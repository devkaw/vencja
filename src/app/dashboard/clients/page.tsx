'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Download, Users, ArrowRight, TrendingUp, DollarSign, AlertCircle, Phone, Mail, ArrowUpDown, Grid, List, MoreVertical, Edit, Trash, Eye, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { formatCurrency, formatPhone } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { hasPremiumAccess, PLANS } from '@/lib/subscription';
import type { Client, Profile } from '@/types';

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'nome' | 'score' | 'total_pago' | 'total_atrasado'>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterScore, setFilterScore] = useState<string>('');
  const [filterDebt, setFilterDebt] = useState<string>('');
  const { addToast } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [clientsRes, profileRes] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);
      setClients(clientsRes.data || []);
      setProfile(profileRes.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredClients = useMemo(() => 
    clients.filter(c => {
      const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || c.telefone?.toLowerCase().includes(search.toLowerCase());
      const matchesScore = !filterScore || (filterScore === 'high' && c.score >= 80) || (filterScore === 'medium' && c.score >= 50 && c.score < 80) || (filterScore === 'low' && c.score < 50);
      const matchesDebt = !filterDebt || (filterDebt === 'yes' && Number(c.total_atrasado) > 0) || (filterDebt === 'no' && Number(c.total_atrasado) === 0);
      return matchesSearch && matchesScore && matchesDebt;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nome') comparison = a.nome.localeCompare(b.nome);
      else if (sortBy === 'score') comparison = a.score - b.score;
      else if (sortBy === 'total_pago') comparison = Number(a.total_pago) - Number(b.total_pago);
      else comparison = Number(a.total_atrasado) - Number(b.total_atrasado);
      return sortOrder === 'asc' ? comparison : -comparison;
    }), [clients, search, sortBy, sortOrder, filterScore, filterDebt]);

  const hasAccess = hasPremiumAccess(profile);
  const maxClients = hasAccess ? PLANS.pro.limits.maxClients : PLANS.free.limits.maxClients;
  const canAddMore = hasAccess || clients.length < maxClients;
  
  const stats = { 
    total: clients.length, 
    maxClients,
    withDebt: clients.filter(c => Number(c.total_atrasado) > 0).length, 
    paidTotal: clients.reduce((sum, c) => sum + Number(c.total_pago), 0), 
    avgScore: clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + c.score, 0) / clients.length) : 0,
    totalDebt: clients.reduce((sum, c) => sum + Number(c.total_atrasado), 0)
  };

  if (isLoading) return <TableSkeleton rows={3} />;

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extralight tracking-tight">Clientes</h1>
          <p className="text-slate-400 font-light mt-1">Gerencie seus clientes</p>
        </div>
        <div className="flex gap-3">
          {canAddMore ? (
            <Link href="/dashboard/clients/new">
              <Button className="bg-accent text-black"><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button>
            </Link>
          ) : (
            <Link href="/dashboard/upgrade">
              <Button className="bg-accent text-black"><Plus className="w-4 h-4 mr-2" />Upgrade</Button>
            </Link>
          )}
        </div>
      </motion.div>

      {!canAddMore && (
        <motion.div variants={fadeIn} className="glass-card rounded-xl p-4 border-accent/30">
          <p className="text-sm font-light">
            Limite de {maxClients} clientes atingido. 
            <Link href="/dashboard/upgrade" className="text-accent font-light ml-1">Faça upgrade</Link> para ilimitados.
          </p>
        </motion.div>
      )}

      <motion.div variants={fadeIn} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MiniStat color="text-white" label="Total Clientes" value={`${stats.total}/${stats.maxClients === -1 ? '∞' : stats.maxClients}`} icon={Users} />
        <MiniStat color="text-danger" label="Com Dívidas" value={stats.withDebt} icon={AlertCircle} />
        <MiniStat color="text-accent" label="Total Recebido" value={formatCurrency(stats.paidTotal)} icon={DollarSign} />
        <MiniStat color="text-danger" label="Em Atraso" value={formatCurrency(stats.totalDebt)} icon={TrendingUp} />
        <MiniStat color="text-warning" label="Score Médio" value={stats.avgScore} icon={TrendingUp} />
      </motion.div>

      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Buscar clientes..."
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
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)} 
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-light text-slate-300 focus:outline-none"
          >
            <option value="nome">Nome</option>
            <option value="score">Score</option>
            <option value="total_pago">Mais Pago</option>
            <option value="total_atrasado">Maior Atraso</option>
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
            <span className="text-sm text-slate-400 font-light">Score:</span>
            <select 
              value={filterScore} 
              onChange={e => setFilterScore(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-light text-slate-300 focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="high">Alto (80-100)</option>
              <option value="medium">Médio (50-79)</option>
              <option value="low">Baixo (0-49)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 font-light">Dívida:</span>
            <select 
              value={filterDebt} 
              onChange={e => setFilterDebt(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-light text-slate-300 focus:outline-none"
            >
              <option value="">Todas</option>
              <option value="yes">Com dívida</option>
              <option value="no">Sem dívida</option>
            </select>
          </div>
          {(filterScore || filterDebt) && (
            <button 
              onClick={() => { setFilterScore(''); setFilterDebt(''); }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />Limpar
            </button>
          )}
        </motion.div>
      )}

      {filteredClients.length === 0 ? (
        <motion.div variants={fadeIn} className="glass-card rounded-3xl py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-4"><Users className="w-10 h-10 text-slate-500" /></div>
          <h3 className="text-xl font-light mb-2">{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h3>
          <p className="text-slate-500 font-light mb-4">{search ? 'Tente buscar por outro termo' : 'Comece adicionando seu primeiro cliente'}</p>
          {!search && canAddMore && <Link href="/dashboard/clients/new"><Button className="bg-accent text-black">Adicionar Cliente</Button></Link>}
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client, i) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-6 hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center">
                    <span className="text-2xl font-extralight text-black">{client.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <Badge variant={client.score >= 80 ? 'success' : client.score >= 50 ? 'warning' : 'danger'} className="text-xs">Score {client.score}</Badge>
                </div>
                <h3 className="text-lg font-light mb-1 group-hover:text-accent transition-colors">{client.nome}</h3>
                <p className="text-sm text-slate-500 font-light mb-4">{client.telefone ? formatPhone(client.telefone) : 'Sem telefone'}</p>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-xs text-slate-500">Total Pago</p>
                    <p className="text-accent font-light">{formatCurrency(Number(client.total_pago))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Em Atraso</p>
                    <p className={`font-light ${Number(client.total_atrasado) > 0 ? 'text-danger' : 'text-slate-400'}`}>{formatCurrency(Number(client.total_atrasado))}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      ) : (
        <motion.div variants={fadeIn} className="glass-card rounded-2xl overflow-x-auto">
          <div className="divide-y divide-white/5 min-w-[600px]">
            {filteredClients.map((client, i) => (
              <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center">
                    <span className="text-lg font-extralight text-black">{client.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-light">{client.nome}</p>
                    <p className="text-sm text-slate-500">{client.telefone ? formatPhone(client.telefone) : 'Sem telefone'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Score</p>
                    <p className={`font-light ${client.score >= 80 ? 'text-accent' : client.score >= 50 ? 'text-warning' : 'text-danger'}`}>{client.score}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Pago</p>
                    <p className="text-accent font-light">{formatCurrency(Number(client.total_pago))}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Atrasado</p>
                    <p className={`font-light ${Number(client.total_atrasado) > 0 ? 'text-danger' : 'text-slate-400'}`}>{formatCurrency(Number(client.total_atrasado))}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function MiniStat({ color, label, value, icon: Icon }: { color: string; label: string; value: string | number; icon: any }) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className={`text-xl font-extralight ${color}`}>{value}</p>
        <p className="text-xs text-slate-500 font-light">{label}</p>
      </div>
    </div>
  );
}