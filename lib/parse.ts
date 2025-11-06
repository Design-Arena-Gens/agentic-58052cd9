import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type ParsedData = {
  headers: string[];
  rows: Record<string, unknown>[];
};

function isCSV(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.csv') || file.type === 'text/csv';
}

export async function parseFile(file: File): Promise<ParsedData> {
  if (isCSV(file)) {
    const text = await file.text();
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    const headers = (result.meta.fields ?? []).map((h) => h.trim());
    const rows = (result.data ?? []).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), v])));
    return { headers, rows };
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const headers = Object.keys(json[0] ?? {}).map((h) => h.trim());
  const rows = json.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), v])));
  return { headers, rows };
}
