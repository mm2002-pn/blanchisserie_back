import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-soft p-12 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(onRowClick && 'cursor-pointer hover:bg-primary-50')}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex}>
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
