'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ResetPasswordContent from './reset-password-content';

function LoadingFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas" role="status">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 size-8 animate-spin text-ink-4" />
        <p className="text-ink-3">Verificando o link…</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
