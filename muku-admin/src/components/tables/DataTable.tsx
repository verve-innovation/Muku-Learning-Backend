import React, { ReactNode } from 'react';
import { Button } from '../ui/Button';

interface Column {
  header: string;
  accessor?: string;
  render?: (row: any) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onAdd?: () => void;
  addLabel?: string;
  onImport?: () => void;
}

export function DataTable({ columns, data, onAdd, addLabel = 'Add New Record', onImport }: DataTableProps) {
  return (
    <>
      {(onAdd || onImport) && (
        <div id="tab-header-actions" className="-mt-17.5 mb-8 flex justify-end gap-3">
          {onImport && (
            <Button
              onClick={onImport}
              variant="secondary"
              className="w-auto px-5 py-2.5 flex items-center gap-2 border border-border-color"
            >
              📥 Import CSV / Excel
            </Button>
          )}
          {onAdd && (
            <Button onClick={onAdd} className="w-auto px-5 py-2.5 flex items-center gap-2">
              ✚ {addLabel}
            </Button>
          )}
        </div>
      )}
      
      {data.length === 0 ? (
        <div className="bg-bg-card border border-border-color rounded-[15px] overflow-hidden mt-5">
          <div className="p-10 text-center text-text-muted">No records found in this table.</div>
        </div>
      ) : (
        <div className="bg-bg-card border border-border-color rounded-[15px] overflow-x-auto mt-5">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="p-4 px-5 border-b border-border-color bg-[rgba(0,0,0,0.15)] text-text-muted text-[0.85rem] font-semibold uppercase">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIdx) => (
                <tr key={rowIdx} className="last:border-b-0">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="p-4 px-5 border-b border-border-color">
                      {col.render ? col.render(row) : (col.accessor ? row[col.accessor] : null)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
