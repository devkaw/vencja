import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInCalendarDays, parseISO, isAfter, isBefore, startOfMonth, endOfMonth, startOfToday, addMonths, addWeeks, subMonths, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Charge } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(telefone: string): string {
  const limpo = telefone.replace(/\D/g, '');
  if (limpo.length === 12 || limpo.length === 13) {
    const ddd = limpo.slice(2, 4);
    const parte1 = limpo.slice(4, 9);
    const parte2 = limpo.slice(9);
    return `+${limpo.slice(0, 2)} (${ddd}) ${parte1}-${parte2}`;
  } else if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  }
  return telefone;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: ptBR });
}

export function formatDateFull(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

// Due dates are calendar days ("YYYY-MM-DD"): a charge due today is not overdue yet.
export function parseDateLocal(dataStr: string): Date {
  return parseISO(dataStr.split('T')[0]);
}

export function diasAteVencimento(dataVencimento: string): number {
  return differenceInCalendarDays(parseDateLocal(dataVencimento), startOfToday());
}

export function calcularDiasAtraso(dataVencimento: string): number {
  return Math.max(0, -diasAteVencimento(dataVencimento));
}

export function isVencido(dataVencimento: string): boolean {
  return diasAteVencimento(dataVencimento) < 0;
}

function textoPrazo(dias: number): string {
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  return `em ${dias} dias`;
}

// Stored numbers may or may not carry the country code. 10/11 digits = DDD + number
// (a DDD 55 number must still get +55); 12/13 digits already include it.
export function normalizarTelefoneBR(telefone: string): string {
  const digits = telefone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return '55' + digits;
  }
  return digits;
}

export function isNoPrazo(dataVencimento: string): boolean {
  return !isVencido(dataVencimento);
}

export function getMesAtual(): { inicio: Date; fim: Date } {
  const hoje = new Date();
  return {
    inicio: startOfMonth(hoje),
    fim: endOfMonth(hoje),
  };
}

export function gerarProximoVencimento(dataVencimento: string, periodicidade: 'semanal' | 'mensal'): string {
  const vencimento = parseISO(dataVencimento);
  const proximo = periodicidade === 'semanal' 
    ? addWeeks(vencimento, 1) 
    : addMonths(vencimento, 1);
  return proximo.toISOString().split('T')[0];
}

export function gerarLinkWhatsApp(nome: string, telefone: string, valor: number, vencimento: string, tipo: 'pendente' | 'atrasado' = 'pendente', descricao?: string, remetente?: string): string {
  let mensagem: string;
  const desc = descricao ? ` (${descricao})` : '';
  
  if (tipo === 'atrasado') {
    const diasAtraso = calcularDiasAtraso(vencimento);
    mensagem = `Olá ${nome}! Tudo bem?

Estamos passando para lembrar que você tem uma cobrança${desc} no valor de ${formatCurrency(valor)} que venceu há ${diasAtraso} dia${diasAtraso > 1 ? 's' : ''}.

Para continuar aproveitando nossos serviços sem interrupções, regularize suas pendências quando puder.

Qualquer dúvida, estamos à disposição!

Atenciosamente,
${remetente || 'VenceJá'}`;
  } else {
    const textoDias = textoPrazo(diasAteVencimento(vencimento));
    mensagem = `Olá ${nome}! Tudo bem?

Temos uma cobrança${desc} no valor de ${formatCurrency(valor)} que vence ${textoDias} (${formatDate(vencimento)}).

Que tal já quitar e deixar isso resolvido?

Estamos aqui caso precise de algo!

Atenciosamente,
${remetente || 'VenceJá'}`;
  }
  
  return `https://wa.me/${normalizarTelefoneBR(telefone)}?text=${encodeURIComponent(mensagem)}`;
}

export function gerarLinkWhatsAppCobranca(nome: string, telefone: string, cobrancas: Array<{ valor: number; vencimento: string; status: string; descricao?: string }>, remetente?: string): string {
  const atrasadas = cobrancas.filter(c => c.status === 'atrasado');
  const proximas = cobrancas.filter(c => c.status === 'vencendo');
  
  let mensagem = `Olá ${nome}! Tudo bem?\n\n`;
  
  if (atrasadas.length > 0) {
    const totalAtrasado = atrasadas.reduce((sum, c) => sum + c.valor, 0);
    mensagem += `Temos algumas pendências registradas:\n\n`;
    atrasadas.forEach((c) => {
      const dias = calcularDiasAtraso(c.vencimento);
      const desc = c.descricao ? ` (${c.descricao})` : '';
      mensagem += `• ${formatCurrency(c.valor)}${desc} - venceu há ${dias} dia${dias > 1 ? 's' : ''}\n`;
    });
    mensagem += `\nTotal em atraso: ${formatCurrency(totalAtrasado)}\n\n`;
  }
  
  if (proximas.length > 0) {
    const totalProximo = proximas.reduce((sum, c) => sum + c.valor, 0);
    mensagem += `E também temos vencimentos próximos:\n\n`;
    proximas.forEach((c) => {
      const desc = c.descricao ? ` (${c.descricao})` : '';
      const textoDias = textoPrazo(diasAteVencimento(c.vencimento));
      mensagem += `• ${formatCurrency(c.valor)}${desc} - vence ${textoDias}\n`;
    });
    mensagem += `\nTotal próximo: ${formatCurrency(totalProximo)}\n\n`;
  }
  
  if (atrasadas.length > 0 || proximas.length > 0) {
    const total = atrasadas.reduce((sum, c) => sum + c.valor, 0) + proximas.reduce((sum, c) => sum + c.valor, 0);
    mensagem += `Total geral: ${formatCurrency(total)}\n\n`;
  }
  
  mensagem += `Regularize suas pendências para continuar aproveitando nossos serviços sem interrupções.\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\n${remetente || 'VenceJá'}`;
  
  return `https://wa.me/${normalizarTelefoneBR(telefone)}?text=${encodeURIComponent(mensagem)}`;
}

export function gerarLinkWhatsAppVarios(nome: string, telefone: string, cobrancas: Array<{ valor: number; vencimento: string; status: string; descricao?: string }>, remetente?: string): string {
  const atrasadas = cobrancas.filter(c => c.status === 'atrasado');
  const pendentes = cobrancas.filter(c => c.status === 'pendente');
  
  let mensagem = `Olá ${nome}! Tudo bem?\n\n`;
  
  if (atrasadas.length > 0) {
    const totalAtrasado = atrasadas.reduce((sum, c) => sum + c.valor, 0);
    mensagem += `Temos algumas pendências registradas:\n\n`;
    atrasadas.forEach((c) => {
      const dias = calcularDiasAtraso(c.vencimento);
      const desc = c.descricao ? ` (${c.descricao})` : '';
      mensagem += `• ${formatCurrency(c.valor)}${desc} - venceu há ${dias} dia${dias > 1 ? 's' : ''}\n`;
    });
    mensagem += `\nTotal em atraso: ${formatCurrency(totalAtrasado)}\n\n`;
  }
  
  if (pendentes.length > 0) {
    const totalPendente = pendentes.reduce((sum, c) => sum + c.valor, 0);
    mensagem += `E também temos vencimentos próximos:\n\n`;
    pendentes.forEach((c) => {
      const desc = c.descricao ? ` (${c.descricao})` : '';
      mensagem += `• ${formatCurrency(c.valor)}${desc} - vence em ${formatDate(c.vencimento)}\n`;
    });
    mensagem += `\nTotal pendente: ${formatCurrency(totalPendente)}\n\n`;
  }
  
  mensagem += `Regularize suas pendências para continuar aproveitando nossos serviços sem interrupções.\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\n${remetente || 'VenceJá'}`;
  
  return `https://wa.me/${normalizarTelefoneBR(telefone)}?text=${encodeURIComponent(mensagem)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export function getChargeStatusColors(status: string, isOverdue: boolean): {
  text: string;
  iconColor: string;
} {
  if (status === 'pago') {
    return {
      text: 'text-green-600',
      iconColor: 'text-green-600',
    };
  }
  if (isOverdue) {
    return {
      text: 'text-red-600',
      iconColor: 'text-red-600',
    };
  }
  return {
    text: 'text-gray-500',
    iconColor: 'text-gray-500',
  };
}

export function getMonthName(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: ptBR });
}

export function getMonthNameShort(date: Date): string {
  return format(date, 'MMM yyyy', { locale: ptBR });
}

export function getMonthOptions(historicoMeses: number = 12) {
  const options: { value: string; label: string }[] = [];
  const hoje = new Date();
  
  for (let i = 0; i < historicoMeses; i++) {
    const date = subMonths(hoje, i);
    const value = format(date, 'yyyy-MM');
    const label = i === 0 ? 'Este mês' : getMonthName(date);
    options.push({ value, label });
  }
  
  return options;
}

export function getProjectionOptions(proximosMeses: number = 6) {
  const options: { value: string; label: string }[] = [];
  const hoje = new Date();
  
  for (let i = 1; i <= proximosMeses; i++) {
    const date = addMonths(hoje, i);
    const value = format(date, 'yyyy-MM');
    const label = i === 1 ? 'Próximo mês' : getMonthName(date);
    options.push({ value, label });
  }
  
  return options;
}

export function parseMonth(value: string): Date {
  const [year, month] = value.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, 1);
}

export function getMesAtualObj(): { inicio: Date; fim: Date; mes: number; ano: number } {
  const hoje = new Date();
  return {
    inicio: startOfMonth(hoje),
    fim: endOfMonth(hoje),
    mes: getMonth(hoje),
    ano: getYear(hoje)
  };
}

export function getMesObj(data: Date): { inicio: Date; fim: Date; mes: number; ano: number } {
  return {
    inicio: startOfMonth(data),
    fim: endOfMonth(data),
    mes: getMonth(data),
    ano: getYear(data)
  };
}

export function filterChargesByMonth(charges: Charge[], dataReferencia: Date): {
  cobrancasNoMes: number;
  cobrancasPagasNoMes: number;
  cobrancasAtrasadasNoMes: number;
  faturamentoNoMes: number;
  perdaPorAtrasoNoMes: number;
} {
  const { inicio, fim } = getMesObj(dataReferencia);
  
  const cobrancasNoMes = charges.filter(c => {
    const vencimento = parseISO(c.data_vencimento);
    return vencimento >= inicio && vencimento <= fim;
  });
  
  const cobrancasPagasNoMes = cobrancasNoMes.filter(c => {
    if (!c.data_pagamento) return false;
    const pagamento = parseISO(c.data_pagamento);
    return c.status === 'pago' && pagamento >= inicio && pagamento <= fim;
  });
  
  const cobrancasAtrasadasNoMes = cobrancasNoMes.filter(c => {
    const vencimento = parseISO(c.data_vencimento);
    return (c.status === 'pendente' && vencimento < inicio) || (c.status !== 'pago' && vencimento <= fim && vencimento < new Date());
  });
  
  const faturamentoNoMes = cobrancasPagasNoMes.reduce((sum, c) => sum + Number(c.valor), 0);
  
  const perdaPorAtrasoNoMes = cobrancasAtrasadasNoMes.reduce((sum, c) => sum + Number(c.valor), 0);
  
  return {
    cobrancasNoMes: cobrancasNoMes.length,
    cobrancasPagasNoMes: cobrancasPagasNoMes.length,
    cobrancasAtrasadasNoMes: cobrancasAtrasadasNoMes.length,
    faturamentoNoMes,
    perdaPorAtrasoNoMes
  };
}

export function calculateProjection(charges: Charge[], meses: number = 6): Array<{ mes: Date; aVencer: number; mesmoPeriodoAnoAnterior: number }> {
  const projections: Array<{ mes: Date; aVencer: number; mesmoPeriodoAnoAnterior: number }> = [];
  const hoje = new Date();
  
  const chargesPendentes = charges.filter(c => c.status === 'pendente');
  const chargesPagas = charges.filter(c => c.status === 'pago' && c.data_pagamento);
  
  for (let i = 1; i <= meses; i++) {
    const data = addMonths(hoje, i);
    const inicio = new Date(data.getFullYear(), data.getMonth(), 1);
    const fim = new Date(data.getFullYear(), data.getMonth() + 1, 0);
    
    const aVencer = chargesPendentes
      .filter(c => {
        const vencimento = parseDateLocal(c.data_vencimento);
        return vencimento >= inicio && vencimento <= fim;
      })
      .reduce((sum, c) => sum + Number(c.valor), 0);
    
    const dataAnoAnterior = subMonths(data, 12);
    const inicioAnoAnterior = new Date(dataAnoAnterior.getFullYear(), dataAnoAnterior.getMonth(), 1);
    const fimAnoAnterior = new Date(dataAnoAnterior.getFullYear(), dataAnoAnterior.getMonth() + 1, 0);
    
    const mesmoPeriodoAnoAnterior = chargesPagas
      .filter(c => {
        if (!c.data_pagamento) return false;
        const pagamento = parseISO(c.data_pagamento);
        return pagamento >= inicioAnoAnterior && pagamento <= fimAnoAnterior;
      })
      .reduce((sum, c) => sum + Number(c.valor), 0);
    
    projections.push({
      mes: data,
      aVencer: Math.round(aVencer),
      mesmoPeriodoAnoAnterior: Math.round(mesmoPeriodoAnoAnterior)
    });
  }
  
  return projections;
}

export function getAtrasoDesdeInicio(charges: Charge[]): number {
  return charges
    .filter(c => c.status === 'pendente' && isVencido(c.data_vencimento))
    .reduce((sum, c) => sum + Number(c.valor), 0);
}

export function getAtrasoNoMes(charges: Charge[], dataReferencia: Date): number {
  const { inicio, fim } = getMesObj(dataReferencia);
  const mesAnterior = subMonths(inicio, 1);
  
  return charges
    .filter(c => {
      if (c.status !== 'pendente') return false;
      const vencimento = parseISO(c.data_vencimento);
      return isBefore(vencimento, fim) && isAfter(vencimento, mesAnterior);
    })
    .reduce((sum, c) => sum + Number(c.valor), 0);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
