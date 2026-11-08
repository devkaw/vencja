'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// The first paint stays visible (it is the LCP); only later navigations fade.
let firstLoad = true;

// Remounts on every top-level navigation (landing, auth, app). Opacity only:
// a transform here would break the fixed nav and sidebar during the fade.
export default function Template({ children }: { children: React.ReactNode }) {
  const [skip] = useState(firstLoad);

  useEffect(() => {
    firstLoad = false;
  }, []);

  return (
    <motion.div initial={skip ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}
