'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Lightweight "is someone logged in?" check for marketing CTAs. */
export function useIsLoggedIn() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      createClient()
        .auth.getSession()
        .then(({ data }) => {
          if (!cancelled) setLoggedIn(Boolean(data.session));
        })
        .catch(() => {});
    } catch {
      // Missing env in local previews: treat as logged out.
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return loggedIn;
}
