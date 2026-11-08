'use client';

import { createContext, useContext } from 'react';

/** Where overlays mount. Null means <body>; the landing demo points this at its window. */
const PortalContext = createContext<HTMLElement | null>(null);
export const PortalContainerProvider = PortalContext.Provider;
export const usePortalContainer = () => useContext(PortalContext) ?? undefined;
