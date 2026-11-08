'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const CHAVE = 'venceja-cookies';
const VERSAO = 1;
const ABRIR = 'venceja:abrir-cookies';

interface Escolha {
  v: number;
  medicao: boolean;
  em: string;
}

const Analytics = dynamic(() => import('@vercel/analytics/react').then((m) => m.Analytics), { ssr: false });

const ouvintes = new Set<() => void>();
let bruto: string | null | undefined;

function ler(): string | null {
  if (bruto !== undefined) return bruto;
  try {
    bruto = localStorage.getItem(CHAVE);
  } catch {
    bruto = null;
  }
  return bruto;
}

function assinar(fn: () => void) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

function salvar(medicao: boolean) {
  const valor = JSON.stringify({ v: VERSAO, medicao, em: new Date().toISOString() } satisfies Escolha);
  bruto = valor;
  try {
    localStorage.setItem(CHAVE, valor);
  } catch {
    // Blocked storage: the choice still holds for this visit.
  }
  ouvintes.forEach((fn) => fn());
}

function interpretar(valor: string | null): Escolha | null {
  if (!valor) return null;
  try {
    const e = JSON.parse(valor) as Escolha;
    return e.v === VERSAO ? e : null;
  } catch {
    return null;
  }
}

/** Banner plus the only place measurement loads: nothing runs before the person says yes. */
export function CookieConsent() {
  const valor = useSyncExternalStore<string | null | undefined>(assinar, ler, () => undefined);
  const carregado = valor !== undefined;
  const escolha = carregado ? interpretar(valor) : null;
  const [aberto, setAberto] = useState(false);
  const [medicao, setMedicao] = useState(false);
  const abrir = useCallback(() => {
    setMedicao(interpretar(ler())?.medicao ?? false);
    setAberto(true);
  }, []);

  useEffect(() => {
    window.addEventListener(ABRIR, abrir);
    return () => window.removeEventListener(ABRIR, abrir);
  }, [abrir]);

  const decidir = (valorMedicao: boolean) => {
    salvar(valorMedicao);
    setAberto(false);
  };

  const mostrar = carregado && (!escolha || aberto);

  return (
    <>
      {escolha?.medicao && <Analytics />}
      <AnimatePresence>
        {mostrar && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="glass-strong fixed inset-x-3 bottom-3 z-[70] max-h-[80dvh] overflow-y-auto rounded-3xl p-5 sm:left-auto sm:right-4 sm:w-[26rem]"
            role="region"
            aria-label="Preferências de cookies"
          >
            <h2 className="font-display text-base font-semibold text-ink">Cookies e privacidade</h2>
            <p className="mt-1 text-sm text-ink-2">
              Usamos o essencial para o site funcionar e manter você conectado. Com a sua permissão, também medimos visitas de forma agregada para melhorar o site. Veja a{' '}
              <Link href="/cookies" className="font-medium text-brand-ink underline underline-offset-2">
                Política de Cookies
              </Link>
              .
            </p>
            {aberto && (
              <div className="mt-4 space-y-3 rounded-2xl bg-surface/70 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block font-medium text-ink">Essenciais</span>
                    <span className="block text-xs text-ink-3">Login e preferências. Sempre ligados.</span>
                  </span>
                  <Switch checked disabled onCheckedChange={() => {}} aria-label="Cookies essenciais, sempre ligados" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="cookies-medicao">
                    <span className="block font-medium text-ink">Medição</span>
                    <span className="block text-xs text-ink-3">Visitas agregadas, sem cookies de identificação.</span>
                  </label>
                  <Switch id="cookies-medicao" checked={medicao} onCheckedChange={setMedicao} />
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {aberto ? (
                <Button size="sm" className="flex-1" onClick={() => decidir(medicao)}>
                  Salvar escolhas
                </Button>
              ) : (
                <>
                  <Button size="sm" className="flex-1" onClick={() => decidir(true)}>
                    Aceitar
                  </Button>
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => decidir(false)}>
                    Recusar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={abrir}>
                    Preferências
                  </Button>
                </>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(ABRIR))}>
      Preferências de cookies
    </button>
  );
}
