import { addDays, format } from 'date-fns';
import type { Charge, Client } from '@/types';

// Fictional data for the public demo only. Dates are relative to today so the
// statuses (overdue, due soon, paid) always look realistic.
const iso = (offset: number) => format(addDays(new Date(), offset), 'yyyy-MM-dd');

const cliente = (id: string, nome: string, telefone: string | null, desde: number, email: string | null = null): Client => ({ id, user_id: 'demo', nome, telefone, email, score: 70, total_pago: 0, total_atrasado: 0, created_at: iso(desde) });

type Seed = [client: string, valor: number, venc: number, desc: string, pago?: number];

function sementes(): Seed[] {
  const lista: Seed[] = [
    // Open charges: what the "Needs attention" lists show.
    ['c2', 650, -4, 'Manutenção do portão'],
    ['c5', 380, -12, 'Instalação elétrica'],
    ['c5', 220, -47, 'Visita técnica'],
    ['c1', 180, 0, 'Mensalidade · Pilates'],
    ['c3', 120, 2, 'Aula particular'],
    ['c4', 420, 5, 'Parcela 5/6'],
    ['c6', 950, 9, 'Cardápio e fotos'],
    ['c7', 1200, 16, 'Site institucional'],
    ['c8', 300, 21, 'Consultoria inicial'],
    ['c4', 420, 35, 'Parcela 6/6'],
    // Recent history.
    ['c6', 700, -18, 'Logo e identidade', -18],
    ['c5', 300, -90, 'Troca de disjuntores', -70],
    ['c4', 420, -25, 'Parcela 4/6', -22],
    ['c4', 420, -55, 'Parcela 3/6', -55],
    ['c4', 420, -85, 'Parcela 2/6', -85],
    ['c4', 420, -115, 'Parcela 1/6', -115],
  ];
  for (let m = 0; m < 13; m++) {
    const venc = -m * 30 - 5;
    lista.push(['c1', 180, venc, 'Mensalidade · Pilates', venc]);
    if (m % 2 === 0) lista.push(['c3', 240, venc - 3, 'Aulas particulares', venc - 3]);
    if (m % 3 === 0) lista.push(['c2', 480 + m * 20, venc - 6, 'Serviço na oficina', venc + 4]);
  }
  return lista;
}

export function createDemoData(): { clients: Client[]; charges: Charge[] } {
  const clients = [
    cliente('c1', 'Carla Mendes', '11987654321', -420, 'carla.mendes@exemplo.com'),
    cliente('c2', 'Oficina do Beto', '11976543210', -400),
    cliente('c3', 'Lucas Prado', '21998765432', -380),
    cliente('c4', 'Studio Aurora', '31991234567', -300, 'contato@studioaurora.exemplo'),
    cliente('c5', 'Rafael Lima', '41996543210', -240),
    cliente('c6', 'Padaria Bom Dia', '51993456789', -200, 'padaria@bomdia.exemplo'),
    cliente('c7', 'Clínica Sorriso', '11955554444', -40, 'financeiro@sorriso.exemplo'),
    cliente('c8', 'Marina Tavares', null, -5),
  ];
  const charges = sementes().map(([client, valor, venc, desc, pago], i): Charge => {
    const serie = desc.includes('Parcela') || desc.includes('Mensalidade');
    return {
      id: `d${i}`,
      user_id: 'demo',
      client_id: client,
      valor,
      valor_pago: pago !== undefined ? valor : 0,
      data_vencimento: iso(venc),
      status: pago !== undefined ? 'pago' : 'pendente',
      data_pagamento: pago !== undefined ? iso(pago) : null,
      dias_atraso: pago !== undefined ? Math.max(0, pago - venc) : 0,
      descricao: desc,
      recorrente: serie,
      periodicidade: serie ? 'mensal' : null,
      charge_original_id: null,
      created_at: `${iso(Math.min(venc, pago ?? venc, 0) - 10)}T12:00:00.000Z`,
    };
  });
  return { clients, charges };
}
