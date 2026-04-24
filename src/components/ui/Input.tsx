import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

/**
 * Input Blanchisserie SN — bordure hairline, focus brand-800 1.5px, label 11px semibold.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-tiny font-semibold text-ink-700 mb-1.5"
          >
            {label}
            {props.required && <span className="text-danger-600 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 bg-paper border-hairline border-ink-200 rounded-input text-sm text-ink-900 placeholder:text-ink-400',
            'focus:outline-none focus:border-brand-800 focus:ring-0 focus:border-2 transition-colors',
            error && 'border-danger-600 focus:border-danger-600',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-tiny text-danger-600">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-tiny text-ink-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
