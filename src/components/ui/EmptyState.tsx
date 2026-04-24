import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * EmptyState Blanchisserie SN — carte paper, icône ink-400 dans rond paper-2,
 * titre serif Bricolage, message ink-500, CTA primaire.
 */
export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-paper rounded-card border-hairline border-ink-200 px-6 py-12 text-center">
      {Icon && (
        <div className="inline-flex items-center justify-center w-14 h-14 bg-paper-2 rounded-full mb-4 border-hairline border-ink-200">
          <Icon className="w-7 h-7 text-ink-400" strokeWidth={1.6} />
        </div>
      )}
      <h3 className="font-serif text-xl font-medium tracking-tight text-ink-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
