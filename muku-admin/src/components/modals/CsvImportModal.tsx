import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { CrudModal } from './CrudModal';
import { Button } from '../ui/Button';
import { useApi } from '../../hooks/useApi';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** The API endpoint to POST each row to, e.g. '/categories' */
  endpoint: string;
  /** Human-readable name of the table, e.g. 'Categories' */
  tableName: string;
  /**
   * Expected CSV columns with optional transform function.
   * key = field name sent to API, label = CSV column header to match.
   */
  columns: {
    key: string;
    label: string;
    transform?: (v: string) => any;
  }[];
  /** Optional template row shown under the file picker */
  templateRow?: Record<string, string>;
}

// Parse Excel files using SheetJS
async function parseXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // sheet_to_aoa returns all rows as string[][] (including header)
  const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  return aoa.map(row => row.map(cell => String(cell ?? '')));
}

function parseCsv(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map(line => {
    const result: string[] = [];
    let inQuote = false;
    let cur = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (ch === ',' && !inQuote) {
        result.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result;
  });
}

type ImportStatus = 'idle' | 'parsing' | 'ready' | 'importing' | 'done' | 'error';

export function CsvImportModal({
  isOpen, onClose, onSuccess, endpoint, tableName, columns, templateRow,
}: CsvImportModalProps) {
  const { apiRequest } = useApi();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const handleClose = () => {
    setStatus('idle');
    setRows([]);
    setErrors([]);
    setProgress({ done: 0, total: 0 });
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('parsing');
    setErrors([]);
    setRows([]);

    try {
      let parsed: string[][];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        parsed = await parseXlsx(buffer);
      } else {
        const text = await file.text();
        parsed = parseCsv(text);
      }

      if (parsed.length < 2) {
        setErrors(['File has no data rows. Ensure the first row is the header.']);
        setStatus('error');
        return;
      }

      const header = parsed[0].map(h => h.trim().toLowerCase());
      const mapped: Record<string, any>[] = [];
      const rowErrors: string[] = [];

      for (let i = 1; i < parsed.length; i++) {
        const raw = parsed[i];
        // skip fully empty rows
        if (raw.every(c => c.trim() === '')) continue;

        const obj: Record<string, any> = {};
        for (const col of columns) {
          const idx = header.findIndex(h => h === col.label.toLowerCase());
          const raw_val = idx >= 0 ? raw[idx]?.trim() ?? '' : '';
          obj[col.key] = col.transform ? col.transform(raw_val) : raw_val;
        }
        mapped.push(obj);
      }

      if (rowErrors.length > 0) setErrors(rowErrors);
      setRows(mapped);
      setStatus('ready');
    } catch (err: any) {
      setErrors([err.message || 'Failed to parse file.']);
      setStatus('error');
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setStatus('importing');
    setProgress({ done: 0, total: rows.length });
    const errs: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        await apiRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(rows[i]),
        });
      } catch (err: any) {
        errs.push(`Row ${i + 1}: ${err.message}`);
      }
      setProgress({ done: i + 1, total: rows.length });
    }

    setErrors(errs);
    setStatus('done');
    if (errs.length === 0) {
      onSuccess();
      handleClose();
    }
  };

  const downloadTemplate = () => {
    const header = columns.map(c => c.label).join(',');
    const example = templateRow
      ? columns.map(c => templateRow[c.key] ?? '').join(',')
      : columns.map(() => '').join(',');
    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName.toLowerCase()}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <CrudModal isOpen={isOpen} title={`Import ${tableName} — CSV or Excel`} onClose={handleClose}>
      <div className="space-y-4">

        {/* Instructions */}
        <div className="bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] rounded-xl p-4 text-[0.85rem] text-text-muted leading-relaxed">
          <p className="font-semibold text-text-main mb-1">📋 How to Import</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Download the CSV template below.</li>
            <li>Fill in your data (do not rename column headers).</li>
            <li>Upload the completed <strong>CSV or Excel</strong> file and click <strong>Import All Rows</strong>.</li>
          </ol>
          <p className="mt-2 text-[0.8rem]">
            Expected columns: <span className="font-mono text-accent">{columns.map(c => c.label).join(', ')}</span>
          </p>
        </div>

        {/* Template download */}
        <button
          onClick={downloadTemplate}
          className="text-[0.85rem] font-semibold text-primary-blue hover:underline flex items-center gap-1"
        >
          ⬇️ Download CSV Template
        </button>

        {/* File picker */}
        <div>
          <label className="block text-[0.85rem] font-semibold text-text-muted mb-2">
            Upload CSV or Excel File (.csv, .xlsx, .xls)
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFile}
            disabled={status === 'importing'}
            className="block w-full text-[0.9rem] text-text-muted
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:font-semibold file:text-[0.85rem]
              file:bg-bg-input file:text-text-main
              hover:file:bg-border-color
              file:cursor-pointer cursor-pointer"
          />
        </div>

        {/* Preview */}
        {status === 'ready' && rows.length > 0 && (
          <div>
            <p className="text-[0.85rem] font-semibold text-text-muted mb-2">
              ✅ Preview — {rows.length} row{rows.length !== 1 ? 's' : ''} ready to import
            </p>
            <div className="bg-bg-input rounded-xl border border-border-color overflow-x-auto max-h-48 text-[0.78rem]">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {columns.map(c => (
                      <th key={c.key} className="px-3 py-2 text-left text-text-muted uppercase font-semibold border-b border-border-color whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-border-color last:border-0">
                      {columns.map(c => (
                        <td key={c.key} className="px-3 py-2 text-text-main whitespace-nowrap max-w-[160px] truncate">
                          {String(row[c.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {rows.length > 5 && (
                    <tr>
                      <td colSpan={columns.length} className="px-3 py-2 text-text-muted italic">
                        …and {rows.length - 5} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import progress */}
        {status === 'importing' && (
          <div>
            <div className="flex justify-between text-[0.82rem] text-text-muted mb-1">
              <span>Importing… {progress.done} / {progress.total}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-bg-input rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Done summary */}
        {status === 'done' && errors.length > 0 && (
          <div className="text-[0.85rem] text-danger font-semibold">
            ⚠️ Import completed with {errors.length} error{errors.length > 1 ? 's' : ''}:
            <ul className="mt-1 list-disc ml-4 font-normal text-[0.8rem] max-h-32 overflow-y-auto">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Parse errors */}
        {status === 'error' && errors.length > 0 && (
          <div className="text-[0.85rem] text-danger">
            {errors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="secondary" onClick={handleClose} className="w-auto px-6 py-2.5">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={status !== 'ready' || rows.length === 0}
            className="w-auto px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⬆️ Import All Rows
          </Button>
        </div>
      </div>
    </CrudModal>
  );
}
