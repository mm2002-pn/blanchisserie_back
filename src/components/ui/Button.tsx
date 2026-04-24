import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/**
 * Bouton Blanchisserie SN — radius 10, bordure hairline pour secondary.
 * Primary = brand-800 (bleu boubou), danger = danger-600, success = baobab-700.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-input transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

    const variants = {
      primary:
        'bg-brand-800 hover:bg-brand-700 active:bg-brand-900 text-paper',
      secondary:
        'bg-paper hover:bg-paper-2 text-ink-800 border-hairline border-ink-200',
      outline:
        'bg-transparent hover:bg-paper-2 text-ink-800 border-hairline border-ink-300',
      ghost: 'bg-transparent hover:bg-paper-2 text-ink-700',
      danger:
        'bg-danger-100 hover:bg-danger-600 hover:text-paper text-danger-600 border-hairline border-danger-600',
      success:
        'bg-baobab-600 hover:bg-baobab-700 text-paper',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-tiny',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
