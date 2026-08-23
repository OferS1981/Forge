import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface Column<Row> {
  key: string;
  header: string;
  /** Renders the cell. Given the row so a column can be a link or a monospace value. */
  cell: (row: Row) => ReactNode;
  /** Monospace, because settings values exist to be copied. */
  mono?: boolean | undefined;
  width?: string | undefined;
}

export interface TableProps<Row> {
  /** Every table says what it is. Visually hidden unless the surrounding copy lacks a heading. */
  caption: string;
  hideCaption?: boolean | undefined;
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  empty?: string | undefined;
  className?: string | undefined;
}

/**
 * A real table with a caption and header cells, inside its own scroll container so a wide settings
 * table never makes the page scroll sideways at 375px.
 */
export function Table<Row>({
  caption,
  hideCaption = true,
  columns,
  rows,
  rowKey,
  empty = 'Nothing to show yet.',
  className,
}: TableProps<Row>): ReactNode {
  return (
    <div
      className={cn('fg-table-wrap fg-scroll fg-wide', className)}
      tabIndex={0}
      role="group"
      aria-label={caption}
    >
      <table className="fg-table">
        <caption className={cn('fg-table__caption', hideCaption && 'fg-visually-hidden')}>
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={c.width !== undefined ? { width: c.width } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="fg-table__empty">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={rowKey(row, i)}>
                {columns.map((c) => (
                  <td key={c.key} className={cn(c.mono === true && 'fg-mono')}>
                    {c.cell(row)}
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
