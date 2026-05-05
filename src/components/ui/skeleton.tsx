'use client';

import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-white/10 skeleton-shimmer', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex gap-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-20" /></div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-white/5 px-6 py-4">
          <div className="flex gap-4"><Skeleton className="h-4 w-full" /></div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

export function IconSkeleton() {
  return <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />;
}