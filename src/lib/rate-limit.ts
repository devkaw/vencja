import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { contadorLocal } from './rate-limit-local';

const local = contadorLocal();

export function ipDaRequisicao(request: NextRequest): string {
  return request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido';
}

/** True while the caller is within the limit. Counts in Postgres so all serverless instances share it. */
export async function dentroDoLimite(chave: string, maximo: number, janelaSegundos: number): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc('consumir_limite', { p_chave: chave, p_maximo: maximo, p_janela_segundos: janelaSegundos });
    if (error) throw error;
    return data === true;
  } catch {
    return local(chave, maximo, janelaSegundos);
  }
}
