import { addDays, format } from 'date-fns';
import type { Charge, Client } from '@/types';

export const hoje = new Date(2026, 10, 6, 12, 0, 0);
export const dia = (offset: number) => format(addDays(hoje, offset), 'yyyy-MM-dd');

let seq = 0;
export function charge(over: Partial<Charge> = {}): Charge {
  seq += 1;
  return {
    id: `c${seq}`,
    user_id: 'u',
    client_id: 'cl',
    valor: 100,
    valor_pago: 0,
    data_vencimento: dia(0),
    status: 'pendente',
    data_pagamento: null,
    dias_atraso: 0,
    descricao: null,
    recorrente: false,
    periodicidade: null,
    charge_original_id: null,
    created_at: `${dia(-90)}T12:00:00.000Z`,
    ...over,
  };
}

export const aVencer = (venc: number, valor = 100) => charge({ data_vencimento: dia(venc), valor });
export const vencida = (venc: number, valor = 100) => charge({ data_vencimento: dia(venc), valor });
export const paga = (venc: number, pago: number, valor = 100) =>
  charge({ data_vencimento: dia(venc), data_pagamento: dia(pago), status: 'pago', valor, valor_pago: valor });

export function client(over: Partial<Client> = {}): Client {
  return { id: 'cl', user_id: 'u', nome: 'Ana', telefone: null, email: null, score: 70, total_pago: 0, total_atrasado: 0, created_at: dia(-200), ...over };
}
