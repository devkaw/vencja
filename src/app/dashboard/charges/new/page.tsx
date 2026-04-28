'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { hasPremiumAccess } from '@/lib/subscription';
import { isVencido, calcularScore } from '@/lib/utils';
import type { Profile } from '@/types';

interface ClientOption {
  id: string;
  nome: string;
}

export default function NewChargePage() {
  const [formData, setFormData] = useState({
    client_id: '',
    valor: '',
    data_vencimento: '',
    descricao: '',
    recorrente: false,
    periodicidade: 'mensal',
    quantidade_parcelas: 0,
  });
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [chargeCount, setChargeCount] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [clientsRes, chargesRes, profileRes] = await Promise.all([
        supabase.from('clients').select('id, nome').eq('user_id', user.id).order('nome'),
        supabase.from('charges').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);

      setClients(clientsRes.data || []);
      setChargeCount(chargesRes.count || 0);
      setProfile(profileRes.data);

      const clientParam = searchParams.get('client');
      if (clientParam) {
        setFormData(prev => ({ ...prev, client_id: clientParam }));
      }

      setIsLoading(false);
    }

    loadData();
  }, [searchParams]);

  const canAddCharge = hasPremiumAccess(profile) || (chargeCount + (formData.quantidade_parcelas || 1)) <= 10;

  const checkForDuplicates = async (descricao: string, clientId: string, recorrente: boolean, periodicidade: string) => {
    if (!descricao.trim() || !clientId) {
      setDuplicateError(null);
      return false;
    }

    setIsCheckingDuplicate(true);
    setDuplicateError(null);

    let existente = false;

    if (recorrente) {
      const { data: existingCharges } = await supabase
        .from('charges')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('client_id', clientId)
        .eq('recorrente', true)
        .eq('periodicidade', periodicidade)
        .ilike('descricao', descricao.trim() + '%');

      existente = (existingCharges || []).length > 0;
    } else {
      const { data: existingCharge } = await supabase
        .from('charges')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('client_id', clientId)
        .eq('descricao', descricao.trim())
        .single();

      existente = !!existingCharge;
    }

    if (existente) {
      setDuplicateError(`Já existe uma cobrança com esta descrição para este cliente.`);
    }

    setIsCheckingDuplicate(false);
    return existente;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!canAddCharge) {
      newErrors.general = 'Limite de cobranças excedido. O plano gratuito permite até 10 cobranças.';
    }
    
    if (!formData.client_id) {
      newErrors.client_id = 'Selecione um cliente';
    }
    
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.data_vencimento) {
      newErrors.data_vencimento = 'Data de vencimento da 1ª parcela é obrigatória';
    }

    if (duplicateError) {
      newErrors.descricao = duplicateError;
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

    const vencimentoOriginal = new Date(formData.data_vencimento);
    const chargesToInsert = [];
    const numParcelas = formData.quantidade_parcelas || 1;

    for (let i = 0; i < numParcelas; i++) {
      const dataVencimento = new Date(vencimentoOriginal);
      
      if (i > 0) {
        switch (formData.periodicidade) {
          case 'quinzenal':
            dataVencimento.setDate(dataVencimento.getDate() + (15 * i));
            break;
          case 'mensal':
            dataVencimento.setMonth(dataVencimento.getMonth() + i);
            break;
        }
      }

      const parcelaDesc = numParcelas > 1 
        ? `${formData.descricao || 'Cobrança'} (${i + 1}/${numParcelas})`
        : formData.descricao;

      chargesToInsert.push({
        user_id: user.id,
        client_id: formData.client_id,
        valor: parseFloat(formData.valor),
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        descricao: parcelaDesc.trim(),
        status: 'pendente',
        recorrente: formData.recorrente,
        periodicidade: formData.recorrente ? formData.periodicidade : null,
      });
    }

    const { error: insertError } = await supabase
      .from('charges')
      .insert(chargesToInsert);

    if (insertError) {
      addToast('error', 'Erro ao criar cobrança');
      setIsLoading(false);
      return;
    }

    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('id', formData.client_id)
      .single();

    if (clientData) {
      const { data: allCharges } = await supabase
        .from('charges')
        .select('*')
        .eq('client_id', formData.client_id);

      const atrasadas = (allCharges || []).filter((c: any) => isVencido(c.data_vencimento) && c.status === 'pendente');
      const totalAtrasado = atrasadas.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
      const novoScore = calcularScore(allCharges || []);

      await supabase
        .from('clients')
        .update({
          total_atrasado: totalAtrasado,
          score: novoScore,
        })
        .eq('id', formData.client_id);
    }

    const message = numParcelas > 1 
      ? `${numParcelas} cobranças criadas com sucesso!`
      : 'Cobrança criada com sucesso!';
    addToast('success', message);
    router.push('/dashboard/charges');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/charges">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Nova Cobrança</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg">
                <p className="text-danger text-sm font-medium">{errors.general}</p>
              </div>
            )}
            {!hasPremiumAccess(profile) && !errors.general && (chargeCount + (formData.quantidade_parcelas || 1)) > 10 && (
              <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg">
                <p className="text-danger text-sm font-medium">Você vai ultrapassar o limite de 10 cobranças. Reduza a quantidade de parcelas.</p>
                <Link href="/dashboard/upgrade">
                  <span className="text-danger text-sm font-medium underline cursor-pointer">Fazer upgrade para ilimitado</span>
                </Link>
              </div>
            )}
            <Select
              label="Cliente *"
              value={formData.client_id}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, client_id: e.target.value }));
                checkForDuplicates(formData.descricao, e.target.value, formData.recorrente, formData.periodicidade);
              }}
              options={[
                { value: '', label: 'Selecione' },
                ...clients.map(c => ({ value: c.id, label: c.nome }))
              ]}
              error={errors.client_id}
            />

            <Input
              label="Valor *"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={formData.valor}
              onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
              error={errors.valor}
            />

            <Input
              label={formData.recorrente ? "Vencimento da 1ª parcela *" : "Vencimento *"}
              type="date"
              value={formData.data_vencimento}
              onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
              error={errors.data_vencimento}
            />

            <Input
              label="Descrição"
              placeholder="Ex: Mensalidade Janeiro"
              value={formData.descricao}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, descricao: e.target.value }));
                checkForDuplicates(e.target.value, formData.client_id, formData.recorrente, formData.periodicidade);
              }}
              error={errors.descricao}
            />
            {isCheckingDuplicate && (
              <p className="text-xs text-gray-500">Verificando...</p>
            )}
            {duplicateError && !errors.descricao && (
              <p className="text-xs text-danger">{duplicateError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, recorrente: !prev.recorrente }));
                  checkForDuplicates(formData.descricao, formData.client_id, !formData.recorrente, formData.periodicidade);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.recorrente 
                    ? 'bg-accent' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    formData.recorrente ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${formData.recorrente ? 'text-accent' : 'text-gray-500'}`} />
                <span className={`text-sm ${formData.recorrente ? 'text-accent font-medium' : 'text-gray-600 dark:text-gray-400'}`}>Recorrente</span>
              </div>
            </div>

            {formData.recorrente && (
              <>
                <Select
                  label="Periodicidade"
                  value={formData.periodicidade}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, periodicidade: e.target.value }));
                    checkForDuplicates(formData.descricao, formData.client_id, formData.recorrente, e.target.value);
                  }}
                  options={[
                    { value: 'quinzenal', label: 'Quinzenal' },
                    { value: 'mensal', label: 'Mensal' }
                  ]}
                />
                <Input
                  label="Quantidade de Parcelas"
                  type="number"
                  min="0"
                  max="60"
                  placeholder="Ex: 12"
                  value={formData.quantidade_parcelas || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantidade_parcelas: parseInt(e.target.value) || 0 }))}
                  hint="Define o número de cobranças que serão criadas"
                />
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/charges" className="flex-1">
                <Button variant="outline" className="w-full" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" isLoading={isLoading} disabled={!canAddCharge}>
                {!canAddCharge ? 'Limite Excedido' : 'Criar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
