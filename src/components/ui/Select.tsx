import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  error?: string;
  label?: string;
  placeholder?: string;
}

/**
 * Select Blanchisserie SN — même style que Input, chevron natif.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, error, label, id, placeholder, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-tiny font-semibold text-ink-700 mb-1.5"
          >
            {label}
            {props.required && <span className="text-danger-600 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-3 py-2 bg-paper border-hairline border-ink-200 rounded-input text-sm text-ink-900',
            'focus:outline-none focus:border-brand-800 focus:ring-0 focus:border-2 cursor-pointer transition-colors',
            error && 'border-danger-600 focus:border-danger-600',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-tiny text-danger-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
