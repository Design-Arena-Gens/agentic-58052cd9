"use client";

import { useRef, useState } from 'react';
import type { ParsedData } from '@/lib/parse';
import { parseFile } from '@/lib/parse';

export function FilePicker({
  label,
  onParsed,
}: {
  label: string;
  onParsed: (data: ParsedData, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [info, setInfo] = useState<string>('');

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setInfo('Parsing...');
    try {
      const parsed = await parseFile(file);
      setInfo(`${parsed.rows.length} rows, ${parsed.headers.length} columns`);
      onParsed(parsed, file);
    } catch (err) {
      console.error(err);
      setInfo('Failed to parse file');
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium mb-1">{label}</div>
          <div className="text-xs text-gray-500">Accepts .csv, .xlsx, .xls</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            Choose File
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleChange}
        className="hidden"
      />
      {fileName && (
        <div className="mt-3 text-sm">
          <div className="font-mono">{fileName}</div>
          <div className="text-gray-500">{info}</div>
        </div>
      )}
    </div>
  );
}
