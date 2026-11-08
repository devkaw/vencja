'use client';

import { createContext, useContext, useMemo, type AnchorHTMLAttributes, type ReactNode } from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resumirClientes } from '@/lib/domain/clients';
import { calcularPainel } from '@/lib/domain/metrics';
import type { Client } from '@/types';
import type { ChargeWithClient, Workspace } from './types';

const WorkspaceContext = createContext<Workspace | null>(null);
export const WorkspaceProvider = WorkspaceContext.Provider;

export function useWorkspace(): Workspace {
  const ws = useContext(WorkspaceContext);
  if (!ws) throw new Error('useWorkspace must be used inside a workspace provider');
  return ws;
}

/** Everything both workspaces derive from the same raw rows. */
export function useDerived(clients: Client[], rawCharges: ChargeWithClient[], hoje: Date) {
  return useMemo(() => {
    const porId = new Map(clients.map((c) => [c.id, c]));
    const charges = rawCharges.map((c) => ({ ...c, client: porId.get(c.client_id) }));
    return { charges, summaries: resumirClientes(clients, charges, hoje), painel: calcularPainel(charges, hoje) };
  }, [clients, rawCharges, hoje]);
}

interface WorkspaceNav {
  push(href: string): void;
  /** Search params of the current screen. */
  params: URLSearchParams;
}

const NavContext = createContext<WorkspaceNav | null>(null);
export const WorkspaceNavProvider = NavContext.Provider;

export function useWorkspaceNav(): WorkspaceNav {
  const custom = useContext(NavContext);
  const router = useRouter();
  // The router's search params match the rendered page, unlike window.location, which lags one commit behind.
  const searchParams = useSearchParams();
  return useMemo(
    () =>
      custom ?? {
        push: (href: string) => router.push(href),
        params: new URLSearchParams(searchParams.toString()),
      },
    [custom, router, searchParams]
  );
}

type WLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; children?: ReactNode };

/** Route link in the dashboard, in-window navigation inside the landing demo. */
export function WLink({ href, onClick, children, ...rest }: WLinkProps) {
  const custom = useContext(NavContext);
  if (!custom) {
    return (
      <NextLink href={href} onClick={onClick} {...rest}>
        {children}
      </NextLink>
    );
  }
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        e.preventDefault();
        custom.push(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
