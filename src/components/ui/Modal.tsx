import { Fragment, useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Modal Blanchisserie SN — backdrop ink-900/50, carte paper radius 14 shadow-strong,
 * titre serif Bricolage.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  return (
    <Fragment>
      <div
        className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={cn(
              'relative w-full bg-paper rounded-card shadow-strong border-hairline border-ink-200',
              sizes[size]
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-hairline border-ink-200">
              <div>
                <h2 className="font-serif text-xl font-medium tracking-tight text-ink-900">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-tiny text-ink-500 mt-1">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-ink-400 hover:text-ink-700 transition-colors p-1 -mr-1"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 max-h-[calc(100vh-240px)] overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-hairline border-ink-200 bg-paper-2 rounded-b-card">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
}
