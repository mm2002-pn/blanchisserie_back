import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  count?: number;
}

export function Skeleton({ className, count = 1, ...props }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn('animate-pulse bg-ink-100 rounded', className)}
          {...props}
        />
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-paper rounded-card border-hairline border-ink-200 p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-paper rounded-card border-hairline border-ink-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-hairline border-ink-200">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="divide-y divide-ink-200">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="px-5 py-4 flex gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
