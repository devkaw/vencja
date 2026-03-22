'use client';

import { Suspense } from 'react';
import ResetPasswordContent from './reset-password-content';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Verificando link...</p>
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
