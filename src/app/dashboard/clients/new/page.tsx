'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { hasPremiumAccess } from '@/lib/subscription';
import type { Profile } from '@/types';

export default function NewClientPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [clientCount, setClientCount] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const { addToast } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const [clientsRes, profileRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);

      setClientCount(clientsRes.count || 0);
      setProfile(profileRes.data);
      setIsLoading(false);
    }

    loadData();
  }, []);

  const canAddClient = hasPremiumAccess(profile) || clientCount < 3;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    let telefoneFormatado = formData.telefone.replace(/\D/g, '');
    if (telefoneFormatado && !telefoneFormatado.startsWith('55')) {
      telefoneFormatado = '55' + telefoneFormatado;
    }

    const { error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        nome: formData.nome.trim(),
        email: formData.email.trim() || null,
        telefone: telefoneFormatado || null,
        score: 70,
        total_pago: 0,
        total_atrasado: 0,
      });

    if (error) {
      addToast('error', 'Erro ao criar cliente');
      setIsLoading(false);
      return;
    }

    addToast('success', 'Cliente criado com sucesso!');
    router.push('/dashboard/clients');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canAddClient) {
    return (
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Novo Cliente</h1>
        </div>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Limite atingido</h2>
            <p className="text-gray-500 mb-4">
              Você atingiu o limite de 3 clientes. Faça upgrade para adicionar clientes ilimitados.
            </p>
            <Link href="/dashboard/upgrade">
              <Button className="bg-primary">Fazer Upgrade</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Novo Cliente</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome *"
              placeholder="Nome completo"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              error={errors.nome}
            />

            <Input
              label="Email"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              error={errors.email}
            />

            <Input
              label="Telefone"
              type="tel"
              placeholder="+55 11 99999-9999"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
            />

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/clients" className="flex-1">
                <Button variant="outline" className="w-full" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" isLoading={isLoading}>
                Criar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
