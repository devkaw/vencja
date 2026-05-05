'use client';

import { useEffect, useState } from 'react';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { formatCurrency, isVencido } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertTriangle, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function toLocalDate(dateStr: string | undefined | null): Date {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface ChargeDay {
  date: Date;
  charges: {
    id: string;
    valor: number;
    status: 'pago' | 'pendente';
    data_vencimento: string;
    data_pagamento?: string;
    data_criacao: string;
    descricao: string;
    client: { nome: string };
    tipo: 'pago' | 'criado' | 'vencido' | 'pendente';
  }[];
  pagos: number;
  vencidos: number;
  criados: number;
  pendentes: number;
}

export default function CalendarPage() {
  const [data, setData] = useState<ChargeDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filters, setFilters] = useState({
    pagos: true,
    vencidos: true,
    pendentes: true,
    criados: true
  });
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadCharges() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const chargesRes = await supabase
        .from('charges')
        .select('*, client:clients(nome)')
        .eq('user_id', user.id)
        .order('data_vencimento', { ascending: false });

      const allCharges = chargesRes.data || [];
      const mesInicio = startOfMonth(currentDate);
      const mesFim = endOfMonth(currentDate);
      const calInicio = startOfWeek(mesInicio);
      const calFim = endOfWeek(mesFim);
      const diasIntervalo = eachDayOfInterval({ start: calInicio, end: calFim });

      const chargesPorDia = diasIntervalo.map(dia => {
        const chargesNoDia = allCharges.filter(c => {
          const dataC = toLocalDate(c.data_criacao);
          const dataV = toLocalDate(c.data_vencimento);
          const dataP = c.data_pagamento ? toLocalDate(c.data_pagamento) : null;
          return isSameDay(dataC, dia) || isSameDay(dataV, dia) || (dataP && isSameDay(dataP, dia));
        });

        const pagosNoDia = chargesNoDia.filter(c => c.data_pagamento && isSameDay(toLocalDate(c.data_pagamento), dia)).map(c => ({ ...c, tipo: 'pago' as const }));
        const criadosNoDia = chargesNoDia.filter(c => isSameDay(toLocalDate(c.data_criacao), dia)).map(c => ({ ...c, tipo: 'criado' as const }));
        const vencidosNoDia = chargesNoDia.filter(c => {
          const dataV = toLocalDate(c.data_vencimento);
          const dataP = c.data_pagamento ? toLocalDate(c.data_pagamento) : null;
          return isSameDay(dataV, dia) && (!dataP || !isSameDay(dataP, dia)) && isVencido(c.data_vencimento);
        }).map(c => ({ ...c, tipo: 'vencido' as const }));
        const pendentesNoDia = chargesNoDia.filter(c => {
          const dataV = toLocalDate(c.data_vencimento);
          const dataP = c.data_pagamento ? toLocalDate(c.data_pagamento) : null;
          return isSameDay(dataV, dia) && (!dataP || !isSameDay(dataP, dia)) && !isVencido(c.data_vencimento);
        }).map(c => ({ ...c, tipo: 'pendente' as const }));

        const todasChargesDia = [...pagosNoDia, ...criadosNoDia, ...vencidosNoDia, ...pendentesNoDia];

        return {
          date: dia,
          charges: todasChargesDia,
          pagos: pagosNoDia.length,
          criados: criadosNoDia.length,
          vencidos: vencidosNoDia.length,
          pendentes: pendentesNoDia.length
        };
      });

      setData(chargesPorDia);
      setIsLoading(false);
    }

    loadCharges();
  }, [currentDate]);

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    setCurrentDate(prev => direcao === 'anterior' ? subMonths(prev, 1) : addMonths(prev, 1));
    setSelectedDay(null);
  };

  const toggleFilter = (filter: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };

  if (isLoading || !mounted) return <DashboardSkeleton />;

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hoje = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const totalEventos = data.reduce((acc, d) => {
    if (filters.pagos) acc += d.pagos;
    if (filters.vencidos) acc += d.vencidos;
    if (filters.pendentes) acc += d.pendentes;
    if (filters.criados) acc += d.criados;
    return acc;
  }, 0);

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      <div className={`opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        <h1 className="text-2xl sm:text-3xl font-extralight tracking-tight">Calendário</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Visualize suas cobranças por data</p>
      </div>

      {/* Filtros */}
      <div className={`glass-card rounded-xl p-2 sm:p-3 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => toggleFilter('pagos')}
            className={`px-2 py-1 rounded text-xs font-light transition-colors ${
              filters.pagos ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Pagos
          </button>
          <button
            onClick={() => toggleFilter('vencidos')}
            className={`px-2 py-1 rounded text-xs font-light transition-colors ${
              filters.vencidos ? 'bg-danger text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Vencidos
          </button>
          <button
            onClick={() => toggleFilter('pendentes')}
            className={`px-2 py-1 rounded text-xs font-light transition-colors ${
              filters.pendentes ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Clock className="w-3 h-3 inline mr-1" />
            A Vencer
          </button>
          <button
            onClick={() => toggleFilter('criados')}
            className={`px-2 py-1 rounded text-xs font-light transition-colors ${
              filters.criados ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Plus className="w-3 h-3 inline mr-1" />
            Criados
          </button>
          <button onClick={() => navegarMes('anterior')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors ml-auto">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-light min-w-[100px] text-center">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</span>
          <button onClick={() => navegarMes('proximo')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendário */}
      <div className={`glass-card rounded-2xl p-2 sm:p-4 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {diasSemana.map(dia => (
            <div key={dia} className="text-center text-xs sm:text-sm font-light text-gray-500 py-2">
              {dia}
            </div>
          ))}
        </div>

        {/* Grid do calendário */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dia, i) => {
            const dayData = data[i];
            const isCurrentMonth = isSameMonth(dia, currentDate);
            const isSelected = selectedDay && isSameDay(dia, selectedDay);
            const isHoje = isToday(dia);
            const temEventos = dayData && (
              (filters.pagos && dayData.pagos > 0) ||
              (filters.vencidos && dayData.vencidos > 0) ||
              (filters.pendentes && dayData.pendentes > 0) ||
              (filters.criados && dayData.criados > 0)
            );

            return (
              <button
                key={i}
                onClick={() => {
                  if (isCurrentMonth) {
                    setSelectedDay(isSelected ? null : dia);
                  }
                }}
                disabled={!isCurrentMonth}
                className={`
                  h-16 sm:h-20 p-1 rounded transition-all flex flex-col items-center justify-start
                  ${isCurrentMonth ? 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer' : 'opacity-30 cursor-not-allowed'}
                  ${isSelected ? 'bg-accent/10 ring-2 ring-accent' : ''}
                  ${isHoje ? 'bg-accent text-white hover:bg-accent' : ''}
                `}
              >
                <span className={`text-sm font-light ${isHoje ? 'text-white' : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>
                  {format(dia, 'd')}
                </span>
                {temEventos && (
                  <div className="flex flex-wrap gap-1 mt-1 justify-center">
                    {filters.pagos && dayData.pagos > 0 && (
                      <div className="w-2 h-2 rounded-full bg-accent" />
                    )}
                    {filters.vencidos && dayData.vencidos > 0 && (
                      <div className="w-2 h-2 rounded-full bg-danger" />
                    )}
                    {filters.pendentes && dayData.pendentes > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    )}
                    {filters.criados && dayData.criados > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span>Pago</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger" />
            <span>Vencido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>A Vencer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Criado</span>
          </div>
        </div>
      </div>

      {/* Detalhes do dia selecionado */}
      {selectedDay && (
        <div className={`glass-card rounded-xl overflow-hidden opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-light">{format(selectedDay, 'dd MMM yyyy', { locale: ptBR })}</h3>
              <p className="text-sm text-gray-500">
                {totalEventos > 0 ? `${data.reduce((acc, d) => {
                  if (isSameDay(d.date, selectedDay)) {
                    if (filters.pagos) acc += d.pagos;
                    if (filters.vencidos) acc += d.vencidos;
                    if (filters.pendentes) acc += d.pendentes;
                    if (filters.criados) acc += d.criados;
                  }
                  return acc;
                }, 0)} evento(s)` : 'Nenhum evento'}
              </p>
            </div>
            <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50">
            {data
              .filter(d => isSameDay(d.date, selectedDay))
              .flatMap(d => d.charges)
              .map(charge => {
                const tipo = charge.tipo || (charge.status === 'pago' ? 'pago' : isVencido(charge.data_vencimento) ? 'vencido' : 'pendente');

                if (tipo === 'pago' && !filters.pagos) return null;
                if (tipo === 'vencido' && !filters.vencidos) return null;
                if (tipo === 'pendente' && !filters.pendentes) return null;
                if (tipo === 'criado' && !filters.criados) return null;

                const corFundo = tipo === 'pago' ? 'bg-accent/10' : tipo === 'vencido' ? 'bg-danger/10' : tipo === 'pendente' ? 'bg-yellow-500/10' : 'bg-blue-500/10';
                const corTexto = tipo === 'pago' ? 'text-accent' : tipo === 'vencido' ? 'text-danger' : 'text-warning';

                return (
                  <Link
                    key={`${charge.id}-${tipo}`}
                    href={`/dashboard/charges/${charge.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${corFundo}`}>
                        {tipo === 'pago' ? (
                          <CheckCircle className="w-6 h-6 text-accent" />
                        ) : tipo === 'vencido' ? (
                          <AlertTriangle className="w-6 h-6 text-danger" />
                        ) : tipo === 'pendente' ? (
                          <Clock className="w-6 h-6 text-yellow-500" />
                        ) : (
                          <CalendarIcon className="w-6 h-6 text-blue-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-light text-base truncate max-w-[180px]">{charge.client?.nome || 'Cliente'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-extralight text-base ${corTexto}`}>
                        {formatCurrency(Number(charge.valor))}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}