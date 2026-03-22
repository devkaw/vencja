'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Download, Users, ArrowRight, TrendingUp, DollarSign, AlertCircle, Mail, Phone, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { hasPremiumAccess } from '@/lib/subscription';
import type { Client, Profile } from '@/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'nome' | 'score' | 'total_atrasado' | 'total_pago'>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { addToast } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [clientsRes, profileRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
      ]);

      setClients(clientsRes.data || []);
      setProfile(profileRes.data);
      setIsLoading(false);
    }

    loadData();
  }, []);

  const filteredClients = clients
    .filter(client =>
      client.nome.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'nome':
          comparison = a.nome.localeCompare(b.nome);
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'total_atrasado':
          comparison = Number(a.total_atrasado) - Number(b.total_atrasado);
          break;
        case 'total_pago':
          comparison = Number(a.total_pago) - Number(b.total_pago);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const canAddMore = hasPremiumAccess(profile) || clients.length < 3;

  const stats = {
    total: clients.length,
    withDebt: clients.filter(c => Number(c.total_atrasado) > 0).length,
    paidTotal: clients.reduce((sum, c) => sum + Number(c.total_pago), 0),
    avgScore: clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + c.score, 0) / clients.length) : 0
  };

  const handleDelete = async () => {
    if (!deleteModal) return;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', deleteModal.id);

    if (error) {
      addToast('error', 'Erro ao excluir cliente');
      return;
    }

    setClients(prev => prev.filter(c => c.id !== deleteModal.id));
    setDeleteModal(null);
    addToast('success', 'Cliente excluído');
  };

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Score', 'Total Pago', 'Total Atrasado'];
    const rows = filteredClients.map(c => [
      c.nome,
      c.email || '',
      c.telefone || '',
      c.score.toString(),
      c.total_pago,
      c.total_atrasado
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return <div className="space-y-6"><h1 className="text-2xl font-bold">Clientes</h1><TableSkeleton rows={3} /></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Gerencie seus clientes e informações</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          {hasPremiumAccess(profile) && (
            <Button variant="outline" onClick={exportCSV} className="hover-lift p-2 sm:px-3 sm:py-2">
              <Download className="w-4 h-4" />
            </Button>
          )}
          {canAddMore ? (
            <Link href="/dashboard/clients/new">
              <Button className="bg-accent hover-lift text-xs sm:text-sm">
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Novo Cliente</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/upgrade">
              <Button className="bg-accent hover-lift text-xs sm:text-sm">
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                Upgrade
              </Button>
            </Link>
          )}
        </div>
      </div>

      {!canAddMore && (
        <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border-accent/30">
          <p className="text-xs sm:text-sm">Limite de 3 clientes atingido. <Link href="/dashboard/upgrade" className="text-accent font-medium">Faça upgrade</Link> para ilimitados.</p>
        </div>
      )}

      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 opacity-0 ${mounted ? 'animate-fade-up animate-delay-100' : ''}`}>
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border-l-2 sm:border-l-4 border-l-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Total</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border-l-2 sm:border-l-4 border-l-danger">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Com Dívidas</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.withDebt}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-danger/10 rounded-lg sm:rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-danger" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border-l-2 sm:border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Recebido</p>
              <p className="text-lg sm:text-2xl font-bold mt-1 truncate max-w-[80px] sm:max-w-none">{formatCurrency(stats.paidTotal)}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-lg sm:rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border-l-2 sm:border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Score Médio</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.avgScore}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-lg sm:rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      <div className={`flex flex-col sm:flex-row gap-2 sm:gap-4 opacity-0 ${mounted ? 'animate-fade-up animate-delay-200' : ''}`}>
        <div className="flex-1">
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="glass-card"
          />
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
          >
            <option value="nome">Ordenar por Nome</option>
            <option value="score">Score</option>
            <option value="total_atrasado">Maior Atraso</option>
            <option value="total_pago">Mais Pago</option>
          </select>
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3"
          >
            <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            onClick={() => setViewMode('grid')}
            className="px-2 sm:px-3"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            onClick={() => setViewMode('list')}
            className="px-2 sm:px-3"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
          </Button>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="glass-card rounded-3xl py-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h3>
          <p className="text-gray-400 mb-4">{search ? 'Tente buscar por outro termo' : 'Comece adicionando seu primeiro cliente'}</p>
          {!search && canAddMore && (
            <Link href="/dashboard/clients/new">
              <Button className="bg-accent">Adicionar Cliente</Button>
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client, i) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="block">
              <div className={`glass-card rounded-2xl p-6 hover-lift cursor-pointer group opacity-0 ${mounted ? 'animate-fade-up' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent/50 rounded-2xl flex items-center justify-center">
                    <span className="text-xl font-bold text-black">{client.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    client.score >= 80 ? 'bg-accent/20 text-accent' :
                    client.score >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-danger/20 text-danger'
                  }`}>
                    Score {client.score}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors">{client.nome}</h3>
                <p className="text-gray-400 text-sm mb-4">{client.email || 'Sem email'}</p>
                
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800">
                  <div>
                    <p className="text-gray-500 text-xs">Total Pago</p>
                    <p className="text-accent font-semibold">{formatCurrency(Number(client.total_pago))}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Em Atraso</p>
                    <p className={`font-semibold ${Number(client.total_atrasado) > 0 ? 'text-danger' : 'text-gray-400'}`}>
                      {formatCurrency(Number(client.total_atrasado))}
                    </p>
                  </div>
                </div>
                
                {(client.telefone || client.email) && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                    {client.telefone && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Phone className="w-3 h-3" />
                        {client.telefone}
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client, i) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="block">
              <div className={`glass-card rounded-2xl p-4 hover-lift cursor-pointer opacity-0 ${mounted ? 'animate-fade-up' : ''}`} style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/50 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-black">{client.nome.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{client.nome}</p>
                      <p className="text-sm text-gray-400">{client.email || 'Sem email'} • {client.telefone || 'Sem telefone'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Score</p>
                      <p className={`text-lg font-bold ${client.score >= 80 ? 'text-accent' : client.score >= 60 ? 'text-yellow-500' : 'text-danger'}`}>{client.score}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Pago</p>
                      <p className="text-accent font-semibold">{formatCurrency(Number(client.total_pago))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Atrasado</p>
                      <p className={`font-semibold ${Number(client.total_atrasado) > 0 ? 'text-danger' : 'text-gray-400'}`}>{formatCurrency(Number(client.total_atrasado))}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Excluir Cliente" size="sm">
        <p className="mb-6">Excluir <strong>{deleteModal?.nome}</strong>?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}