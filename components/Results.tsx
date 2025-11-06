"use client";

import { useMemo, useState } from 'react';
import type { ReconcileResult, NormalizedRow } from '@/lib/reconcile';
import * as XLSX from 'xlsx';

function Table({ rows, title }: { rows: NormalizedRow[]; title: string }) {
  if (rows.length === 0) return <div className="text-sm text-gray-500">No records</div>;
  const cols = Object.keys(rows[0].original ?? {});
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-medium border-b">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 whitespace-nowrap">{String(r.original[c] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Results({ result }: { result: ReconcileResult }) {
  const [tab, setTab] = useState<string>('summary');

  const exports = useMemo(() => ({
    exportAll: () => {
      const wb = XLSX.utils.book_new();
      const addSheet = (name: string, data: any[]) => {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, name);
      };
      addSheet('ExactMatches', result.exactMatches.map((m) => ({
        matchType: 'Exact',
        ...m.twoB.original,
        '__BOOKS__': '?',
        ...m.books.original,
      })));
      addSheet('ValueMismatches', result.valueMismatches.map((m) => ({
        mismatch: m.diffs.join(', '),
        ...m.twoB.original,
        '__BOOKS__': '?',
        ...m.books.original,
      })));
      addSheet('MissingInBooks', result.missingInBooks.map((r) => r.original));
      addSheet('MissingIn2B', result.missingIn2B.map((r) => r.original));
      addSheet('ProbableMatches', result.probableMatches.map((m) => ({ reason: m.reason, ...m.twoB.original, '__BOOKS__': '?', ...m.books.original })));
      addSheet('Duplicate2B', result.duplicate2B.map((r) => r.original));
      addSheet('DuplicateBooks', result.duplicateBooks.map((r) => r.original));
      XLSX.writeFile(wb, 'reconciliation.xlsx');
    },
  }), [result]);

  const cards = [
    { label: '2B Rows', value: result.summary.total2B },
    { label: 'Books Rows', value: result.summary.totalBooks },
    { label: 'Exact Matches', value: result.summary.exactMatches },
    { label: 'Value Mismatches', value: result.summary.valueMismatches },
    { label: 'Missing in Books', value: result.summary.missingInBooks },
    { label: 'Missing in 2B', value: result.summary.missingIn2B },
    { label: 'Probable Matches', value: result.summary.probableMatches },
    { label: 'Duplicate 2B', value: result.summary.duplicate2B },
    { label: 'Duplicate Books', value: result.summary.duplicateBooks },
  ];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="font-medium">Reconciliation Results</div>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary" onClick={exports.exportAll}>Export to Excel</button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {['summary', 'exact', 'mismatch', 'missing-books', 'missing-2b', 'probable', 'dup-2b', 'dup-books'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn btn-outline ${tab === t ? 'bg-gray-100' : ''}`}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="card p-3">
              <div className="text-xs text-gray-500">{c.label}</div>
              <div className="text-xl font-semibold">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'exact' && (
        <div className="space-y-3">
          <div className="font-medium">Exact Matches</div>
          <Table rows={result.exactMatches.map((m) => m.twoB)} title="Exact" />
        </div>
      )}

      {tab === 'mismatch' && (
        <div className="space-y-3">
          <div className="font-medium">Value/Date Mismatches</div>
          <Table rows={result.valueMismatches.map((m) => m.twoB)} title="Mismatches" />
        </div>
      )}

      {tab === 'missing-books' && (
        <div className="space-y-3">
          <div className="font-medium">In 2B but Missing in Books</div>
          <Table rows={result.missingInBooks} title="Missing in Books" />
        </div>
      )}

      {tab === 'missing-2b' && (
        <div className="space-y-3">
          <div className="font-medium">In Books but Missing in 2B</div>
          <Table rows={result.missingIn2B} title="Missing in 2B" />
        </div>
      )}

      {tab === 'probable' && (
        <div className="space-y-3">
          <div className="font-medium">Probable Matches</div>
          <Table rows={result.probableMatches.map((m) => m.twoB)} title="Probable" />
        </div>
      )}

      {tab === 'dup-2b' && (
        <div className="space-y-3">
          <div className="font-medium">Duplicate 2B Entries</div>
          <Table rows={result.duplicate2B} title="Dup 2B" />
        </div>
      )}

      {tab === 'dup-books' && (
        <div className="space-y-3">
          <div className="font-medium">Duplicate Books Entries</div>
          <Table rows={result.duplicateBooks} title="Dup Books" />
        </div>
      )}
    </div>
  );
}
