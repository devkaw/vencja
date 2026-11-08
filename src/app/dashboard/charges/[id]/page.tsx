'use client';

import { use } from 'react';
import { ChargeDetailScreen } from '@/components/screens/charge-detail-screen';

export default function ChargeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ChargeDetailScreen id={id} />;
}
