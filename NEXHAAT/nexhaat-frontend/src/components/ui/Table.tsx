import { TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, forwardRef } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface TableProps<T> extends TableHTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  rowClassName?: (row: T) => string;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  rowClassName,
  emptyMessage = 'No data available',
  className = '',
  children,
  ...props
}: TableProps<T>) {
  return (
    <div className="table-wrap">
      <table className={`table ${className}`} {...props}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={keyExtractor(row)} className={rowClassName ? rowClassName(row) : ''}>
                {columns.map((column) => (
                  <td key={column.key} className={column.className}>
                    {column.render ? column.render(row, rowIndex) : String((row as Record<string, unknown>)[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export const Th = forwardRef<HTMLTableHeaderCellElement, ThHTMLAttributes<HTMLTableHeaderCellElement>>(
  ({ className = '', children, ...props }, ref) => (
    <th ref={ref} className={className} {...props}>
      {children}
    </th>
  )
);

Th.displayName = 'Th';

export const Td = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', children, ...props }, ref) => (
    <td ref={ref} className={className} {...props}>
      {children}
    </td>
  )
);

Td.displayName = 'Td';