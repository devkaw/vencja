'use client';

import { use } from 'react';
import { ClientDetailScreen } from '@/components/screens/client-detail-screen';

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ClientDetailScreen id={id} />;
}
