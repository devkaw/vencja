import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays, parseISO, isAfter, isBefore, startOfMonth, endOfMonth, addMonths, addWeeks, subMonths, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Charge } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(telefone: string): string {
  const limpo = telefone.replace(/\D/g, '');
  if (limpo.length === 12) {
    return `+${limpo.slice(0, 2)} ${limpo.slice(2, 4)} ${limpo.slice(4, 8)}-${limpo.slice(8)}`;
  } else if (limpo.length === 13) {
    return `+${limpo.slice(0, 2)} ${limpo.slice(2, 4)} ${limpo.slice(4, 8)}-${limpo.slice(8)}`;
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

export function calcularDiasAtraso(dataVencimento: string): number {
  const hoje = new Date();
  const vencimento = parseISO(dataVencimento);
  
  if (isBefore(vencimento, hoje)) {
    return differenceInDays(hoje, vencimento);
  }
  return 0;
}

export function isVencido(dataVencimento: string): boolean {
  const hoje = new Date();
  const vencimento = parseISO(dataVencimento);
  return isBefore(vencimento, hoje);
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

export function calcularScore(charges: Charge[]): number {
  const paidCharges = charges.filter(c => c.status === 'pago' && c.data_pagamento);
  const overdueCharges = charges.filter(c => 
    c.status !== 'pago' && 
    (c.status === 'pendente' || c.status === 'parcial') && 
    isVencido(c.data_vencimento)
  );
  
  if (paidCharges.length === 0 && overdueCharges.length === 0) {
    return 100;
  }
  
  let total = 0;
  let count = 0;
  
  paidCharges.forEach(c => {
    if (!c.data_pagamento) return;
    const vencimento = parseISO(c.data_vencimento);
    const pagamento = parseISO(c.data_pagamento);
    const diferencaDias = differenceInDays(pagamento, vencimento);
    
    if (diferencaDias <= 0) total += 10;
    else if (diferencaDias <= 7) total += 5;
    else if (diferencaDias <= 15) total += 0;
    else total -= 10;
    
    count++;
  });
  
  overdueCharges.forEach(() => {
    total -= 10;
    count++;
  });
  
  const score = 80 + (total / count);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success-600';
  if (score >= 60) return 'text-warning-500';
  return 'text-danger-500';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-success-100 text-success-700';
  if (score >= 60) return 'bg-warning-100 text-warning-700';
  return 'bg-danger-100 text-danger-700';
}

export function gerarLinkWhatsApp(nome: string, telefone: string, valor: number, vencimento: string, tipo: 'pendente' | 'atrasado' = 'pendente', descricao?: string, remetente?: string): string {
  let mensagem: string;
  const desc = descricao ? ` (${descricao})` : '';
  
  if (tipo === 'atrasado') {
    const diasAtraso = calcularDiasAtraso(vencimento);
    mensagem = `Ola ${nome}! Tudo bem?

Estamos passando para lembrar que voce tem uma cobranca${desc} no valor de ${formatCurrency(valor)} que venceu ha ${diasAtraso} dia${diasAtraso > 1 ? 's' : ''}.

Para continuar aproveitando nossos servicos sem interrupcoes, regularize suas pendencias quando puder.

Qualquer duvida, estamos a disposicao!

Atenciosamente,
${remetente || 'VenceJa'}`;
  } else {
    mensagem = `Ola ${nome}! Tudo bem?

Temos uma cobranca${desc} no valor de ${formatCurrency(valor)} com vencimento em ${formatDate(vencimento)}.

Que tal ja quitar para ficar tranquilo${descricao ? ' com essa pendencia' : ''}?

Estamos aqui caso precise de algo!

Atenciosamente,
${remetente || 'VenceJa'}`;
  }
  
  let telefoneFormatado = telefone.replace(/\D/g, '');
  if (!telefoneFormatado.startsWith('55')) {
    telefoneFormatado = '55' + telefoneFormatado;
  }
  
  return `https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`;
}

export function gerarLinkWhatsAppCobranca(nome: string, telefone: string, cobrancas: Array<{ valor: number; vencimento: string; status: string; descricao?: string }>, remetente?: string): string {
  const atrasadas = cobrancas.filter(c => c.status === 'atrasado');
  const proximas = cobrancas.filter(c => c.status === 'vencendo');
  
  let mensagem = `Ola ${nome}! Tudo bem?\n\n`;
  
  if (atrasadas.length > 0) {
    const totalAtrasado = atrasadas.reduce((sum, c) => sum + c.valor, 0);
    mensagem += `Temos algumas pendencias registradas:\n\n`;
    atrasadas.forEach((c) => {
      const dias = calcularDiasAtraso(c.vencimento);
      const desc = c.descricao ? ` (${c.descricao})` : '';
      mensagem += `• ${formatCurrency(c.valor)}${desc} - venceu ha ${dias} dia${dias > 1 ? 's' : ''}\n`;
    });
    mensagem += `\nTotal em atraso: ${formatCurrency(totalAtrasado)}\n\n`;
  }
  
  if (proximas.length > 0) {
    const totalProximo = proximas.reduce((sum, c) => sum + c.valor, 0);
    mensagem += `E tambem temos vencimentos proximos:\n\n`;
    proximas.forEach((c) => {
      const dias = Math.ceil((new Date(c.vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const desc = c.descricao ? ` (${c.descricao})` : '';
      mensagem += `• ${formatCurrency(c.valor)}${desc} - vence em ${dias} dia${dias > 1 ? 's' : ''}\n`;
    });
    mensagem += `\nTotal proximo: ${formatCurrency(totalProximo)}\n\n`;
  }
  
  if (atrasadas.length > 0 || proximas.length > 0) {
    const total = atrasadas.reduce((sum, c) => sum + c.valor, 0) + proximas.reduce((sum, c) => sum + c.valor, 0);
    mensagem += `Total geral: ${formatCurrency(total)}\n\n`;
  }
  
  mensagem += `Regularize suas pendencias para continuar aproveitando nossos servicos sem interrupcoes.\n\nQualquer duvida, estamos a disposicao.\n\nAtenciosamente,\n${remetente || 'VenceJa'}`;
  
  let telefoneFormatado = telefone.replace(/\D/g, '');
  if (!telefoneFormatado.startsWith('55')) {
    telefoneFormatado = '55' + telefoneFormatado;
  }
  
  return `https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`;
}

export function gerarLinkWhatsAppVarios(nome: string, telefone: string, cobrancas: Array<{ valor: number; vencimento: string; status: string; descricao?: string }>, remetente?: string): string {
  const atrasadas = cobrancas.filter(c => c.status === 'atrasado');
  const pendentes = cobrancas.filter(c => c.status === 'pendente');
  
  let mensagem = `Ola ${nome}! Tudo bem?\n\n`;
  
  if (atrasadas.length > 0) {
    const totalAtrasado = atrasadas.reduce((sum, c) => sum + c.valor, 0);
    mensagem += `Temos algumas pendencias registradas:\n\n`;
    atrasadas.forEach((c) => {
      const dias = calcularDiasAtraso(c.vencimento);
      const desc = c.descricao ? ` (${c.descricao})` : '';
      mensagem += `• ${formatCurrency(c.valor)}${desc} - venceu ha ${dias} dia${dias > 1 ? 's' : ''}\n`;
    });
    mensagem += `\nTotal em atraso: ${formatCurrency(totalAtrasado)}\n\n`;
  }
  
  if (pendentes.length > 0) {
    const totalPendente = pendentes.reduce((sum, c) => sum + c.valor, 0);
    mensagem += `E tambem temos vencimentos proximos:\n\n`;
    pendentes.forEach((c) => {
      const desc = c.descricao ? ` (${c.descricao})` : '';
      mensagem += `• ${formatCurrency(c.valor)}${desc} - vence em ${formatDate(c.vencimento)}\n`;
    });
    mensagem += `\nTotal pendente: ${formatCurrency(totalPendente)}\n\n`;
  }
  
  mensagem += `Regularize suas pendencias para continuar aproveitando nossos servicos sem interrupcoes.\n\nQualquer duvida, estamos a disposicao.\n\nAtenciosamente,\n${remetente || 'VenceJa'}`;
  
  let telefoneFormatado = telefone.replace(/\D/g, '');
  if (!telefoneFormatado.startsWith('55')) {
    telefoneFormatado = '55' + telefoneFormatado;
  }
  
  return `https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`;
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

export function gerarCSV(data: Record<string, unknown>[], headers: Record<string, string>): string {
  const headerRow = Object.values(headers).join(',');
  const rows = data.map(item => 
    Object.keys(headers).map(key => {
      const value = item[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return value;
    }).join(',')
  );
  return [headerRow, ...rows].join('\n');
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

export function calculateProjection(charges: Charge[], meses: number = 6): Array<{ mes: Date; faturamento: number; cobranas: number }> {
  const projections: Array<{ mes: Date; faturamento: number; cobranas: number }> = [];
  const hoje = new Date();
  
  const chargesPagas = charges.filter(c => c.status === 'pago' && c.data_pagamento);
  
  const ultimosMeses = 3;
  const monthlyAverages: number[] = [];
  
  for (let i = 0; i < ultimosMeses; i++) {
    const data = subMonths(hoje, i);
    const { inicio, fim } = getMesObj(data);
    const total = chargesPagas
      .filter(c => {
        if (!c.data_pagamento) return false;
        const pagamento = parseISO(c.data_pagamento);
        return pagamento >= inicio && pagamento <= fim;
      })
      .reduce((sum, c) => sum + Number(c.valor), 0);
    monthlyAverages.push(total);
  }
  
  const mediaMensal = monthlyAverages.reduce((a, b) => a + b, 0) / monthlyAverages.length;
  const tendencia = monthlyAverages.length >= 2 ? (monthlyAverages[0] - monthlyAverages[1]) / monthlyAverages[1] : 0;
  
  for (let i = 1; i <= meses; i++) {
    const data = addMonths(hoje, i);
    const baseFaturamento = mediaMensal * (1 + tendencia * i * 0.3);
    const projection = Math.max(mediaMensal * 0.7, baseFaturamento);
    
    projections.push({
      mes: data,
      faturamento: Math.round(projection),
      cobranas: Math.round(mediaMensal > 0 ? (chargesPagas.length / 12) : 0)
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
