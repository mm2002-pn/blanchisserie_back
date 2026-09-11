import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyIcon?: typeof Inbox;
}

/**
 * DataTable Blanchisserie SN — paper bg, hairline borders, caps headers,
 * paper-2 hover. Supports per-column alignment.
 */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
  emptyIcon: EmptyIcon = Inbox,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-paper rounded-card border-hairline border-ink-200 px-6 py-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-paper-2 rounded-full mb-3 border-hairline border-ink-200">
          <EmptyIcon className="w-5 h-5 text-ink-400" strokeWidth={1.6} />
        </div>
        <p className="text-sm text-ink-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-paper rounded-card border-hairline border-ink-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    'bg-paper-2 px-4 py-3 text-micro font-semibold uppercase tracking-caps text-ink-500 border-b border-hairline border-ink-200 whitespace-nowrap',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                    !column.align && 'text-left',
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-paper-2',
                  rowIndex < data.length - 1 && 'border-b border-hairline border-ink-200',
                )}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      'px-4 py-3 text-sm text-ink-900',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                    )}
                  >
                    {column.cell
                      ? column.cell(row)
                      : String(row[column.accessorKey] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
