"use client";

import { useMemo } from 'react';
import type { Mapping } from '@/lib/reconcile';

const FIELDS: Array<{ key: keyof Mapping; label: string; required?: boolean }> = [
  { key: 'gstin', label: 'GSTIN', required: true },
  { key: 'invoiceNumber', label: 'Invoice Number', required: true },
  { key: 'invoiceDate', label: 'Invoice Date' },
  { key: 'taxableValue', label: 'Taxable Value' },
  { key: 'totalValue', label: 'Total Invoice Value' },
];

function guessMapping(headers: string[]): Partial<Mapping> {
  const map: Partial<Mapping> = {};
  const by = (needle: RegExp) => headers.find((h) => needle.test(h.toLowerCase()));
  map.gstin = by(/gstin|gst no|gstin of supplier|supplier gst/i) ?? '';
  map.invoiceNumber = by(/invoice no|inv no|bill no|document number|doc no/i) ?? '';
  map.invoiceDate = by(/invoice date|inv date|bill date|doc date/i) ?? '';
  map.taxableValue = by(/taxable value|taxable amt|taxable/i) ?? '';
  map.totalValue = by(/total value|invoice value|grand total|total amt|total/i) ?? '';
  return map;
}

export function ColumnMapper({
  headers,
  mapping,
  onChange,
  title,
}: {
  headers: string[];
  mapping: Mapping;
  onChange: (m: Mapping) => void;
  title: string;
}) {
  const guessed = useMemo(() => guessMapping(headers), [headers]);

  function setField<K extends keyof Mapping>(key: K, value: string) {
    onChange({ ...mapping, [key]: value });
  }

  return (
    <div className="card p-4">
      <div className="font-medium mb-2">{title} Column Mapping</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <label key={String(f.key)} className="text-sm">
            <div className="mb-1">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </div>
            <select
              value={(mapping[f.key] as string) || (guessed[f.key] as string) || ''}
              onChange={(e) => setField(f.key, e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
            >
              <option value="">Select column...</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
