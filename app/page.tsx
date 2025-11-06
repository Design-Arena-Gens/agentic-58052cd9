"use client";

import { useMemo, useState } from 'react';
import { FilePicker } from '@/components/FilePicker';
import { ColumnMapper } from '@/components/ColumnMapper';
import { Results } from '@/components/Results';
import type { ParsedData } from '@/lib/parse';
import { normalizeRows, reconcile, type Mapping, type ReconcileResult } from '@/lib/reconcile';

export default function Page() {
  const [twoB, setTwoB] = useState<ParsedData | null>(null);
  const [books, setBooks] = useState<ParsedData | null>(null);

  const [map2B, setMap2B] = useState<Mapping>({ gstin: '', invoiceNumber: '', invoiceDate: '', taxableValue: '', totalValue: '' });
  const [mapBooks, setMapBooks] = useState<Mapping>({ gstin: '', invoiceNumber: '', invoiceDate: '', taxableValue: '', totalValue: '' });

  const canReconcile = useMemo(() => {
    return !!twoB && !!books && map2B.gstin && map2B.invoiceNumber && mapBooks.gstin && mapBooks.invoiceNumber;
  }, [twoB, books, map2B, mapBooks]);

  const result: ReconcileResult | null = useMemo(() => {
    if (!canReconcile || !twoB || !books) return null;
    const n2b = normalizeRows(twoB.rows, map2B);
    const nbk = normalizeRows(books.rows, mapBooks);
    return reconcile(n2b, nbk, { valueTolerance: 1 });
  }, [canReconcile, twoB, books, map2B, mapBooks]);

  return (
    <main className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <FilePicker label="Upload GSTR-2B" onParsed={(d) => setTwoB(d)} />
        <FilePicker label="Upload Tally Purchase Register" onParsed={(d) => setBooks(d)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {twoB && (
          <ColumnMapper headers={twoB.headers} mapping={map2B} onChange={setMap2B} title="GSTR-2B" />
        )}
        {books && (
          <ColumnMapper headers={books.headers} mapping={mapBooks} onChange={setMapBooks} title="Tally" />
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={!canReconcile} onClick={() => {}}>
          Reconcile
        </button>
        {!canReconcile && (
          <div className="text-sm text-gray-500">Upload both files and map GSTIN + Invoice No</div>
        )}
      </div>

      {result && <Results result={result} />}
    </main>
  );
}
