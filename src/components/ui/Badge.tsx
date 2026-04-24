import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gray' | 'brand';
  /** Affiche un point coloré devant le label (comme dans le mockup) */
  dot?: boolean;
}

/**
 * Badge Blanchisserie SN — variantes mappées sur les couleurs sémantiques
 * (ok / warn / danger / brand / baobab / ink) avec point optionnel.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', dot = false, children, ...props }, ref) => {
    const variants = {
      success: { bg: 'bg-ok-100', fg: 'text-ok-700', dotC: 'bg-ok-700' },
      warning: { bg: 'bg-warn-100', fg: 'text-warn-700', dotC: 'bg-warn-700' },
      error: { bg: 'bg-danger-100', fg: 'text-danger-600', dotC: 'bg-danger-600' },
      info: { bg: 'bg-brand-100', fg: 'text-brand-700', dotC: 'bg-brand-700' },
      neutral: { bg: 'bg-ink-100', fg: 'text-ink-700', dotC: 'bg-ink-500' },
      gray: { bg: 'bg-ink-100', fg: 'text-ink-700', dotC: 'bg-ink-500' },
      brand: { bg: 'bg-brand-100', fg: 'text-brand-800', dotC: 'bg-brand-800' },
    } as const;

    const v = variants[variant];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-tiny font-semibold',
          v.bg,
          v.fg,
          className
        )}
        {...props}
      >
        {dot && <span className={cn('w-1.5 h-1.5 rounded-full', v.dotC)} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
