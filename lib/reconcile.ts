export type Mapping = {
  gstin: string;
  invoiceNumber: string;
  invoiceDate?: string;
  taxableValue?: string;
  totalValue?: string;
};

export type RecordRow = Record<string, unknown>;

export type NormalizedRow = {
  gstin: string;
  invoiceNumber: string;
  invoiceDate?: string;
  taxableValue?: number;
  totalValue?: number;
  original: RecordRow;
};

export type ReconcileResult = {
  exactMatches: Array<{ twoB: NormalizedRow; books: NormalizedRow }>;
  probableMatches: Array<{
    twoB: NormalizedRow;
    books: NormalizedRow;
    reason: string;
  }>;
  missingInBooks: NormalizedRow[];
  missingIn2B: NormalizedRow[];
  valueMismatches: Array<{ twoB: NormalizedRow; books: NormalizedRow; diffs: string[] }>;
  duplicate2B: NormalizedRow[];
  duplicateBooks: NormalizedRow[];
  summary: Record<string, number>;
};

function normGstin(v: unknown): string {
  return String(v ?? '').toUpperCase().replace(/\s+/g, '');
}

function normInvoice(v: unknown): string {
  return String(v ?? '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[-/]/g, '')
    .replace(/^0+/, '');
}

function toNumber(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).replace(/[,\s]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function normDate(v: unknown): string | undefined {
  if (!v) return undefined;
  const s = String(v).trim();
  // Accept DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
  const parts =
    /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s) ||
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) ||
    /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (!parts) return s;
  let y: string, m: string, d: string;
  if (parts[0].includes('/')) {
    d = parts[1];
    m = parts[2];
    y = parts[3];
  } else if (parts[0].includes('-') && parts[0].match(/^\d{4}-/)) {
    y = parts[1];
    m = parts[2];
    d = parts[3];
  } else {
    d = parts[1];
    m = parts[2];
    y = parts[3];
  }
  return `${y}-${m}-${d}`; // ISO-ish
}

export function normalizeRows(rows: RecordRow[], mapping: Mapping): NormalizedRow[] {
  return rows.map((r) => ({
    gstin: normGstin(r[mapping.gstin]),
    invoiceNumber: normInvoice(r[mapping.invoiceNumber]),
    invoiceDate: mapping.invoiceDate ? normDate(r[mapping.invoiceDate]) : undefined,
    taxableValue: mapping.taxableValue ? toNumber(r[mapping.taxableValue]) : undefined,
    totalValue: mapping.totalValue ? toNumber(r[mapping.totalValue]) : undefined,
    original: r,
  }));
}

function keyOf(n: NormalizedRow): string {
  return `${n.gstin}__${n.invoiceNumber}`;
}

export function reconcile(
  twoB: NormalizedRow[],
  books: NormalizedRow[],
  opts?: { valueTolerance?: number }
): ReconcileResult {
  const tolerance = opts?.valueTolerance ?? 1; // 1 unit tolerance

  const twoBMap = new Map<string, NormalizedRow[]>();
  const booksMap = new Map<string, NormalizedRow[]>();

  for (const r of twoB) {
    const k = keyOf(r);
    const arr = twoBMap.get(k) ?? [];
    arr.push(r);
    twoBMap.set(k, arr);
  }
  for (const r of books) {
    const k = keyOf(r);
    const arr = booksMap.get(k) ?? [];
    arr.push(r);
    booksMap.set(k, arr);
  }

  const exactMatches: ReconcileResult['exactMatches'] = [];
  const valueMismatches: ReconcileResult['valueMismatches'] = [];
  const duplicate2B: NormalizedRow[] = [];
  const duplicateBooks: NormalizedRow[] = [];

  // Identify duplicates by same key appearing > 1
  for (const [, arr] of twoBMap) if (arr.length > 1) duplicate2B.push(...arr);
  for (const [, arr] of booksMap) if (arr.length > 1) duplicateBooks.push(...arr);

  const visitedBooks = new Set<NormalizedRow>();

  // Exact matches by key and close values
  for (const [k, twArr] of twoBMap) {
    const bkArr = booksMap.get(k) ?? [];
    if (twArr.length === 0) continue;

    for (const tw of twArr) {
      // Find best candidate in books
      let matched: NormalizedRow | undefined;
      let diffs: string[] = [];
      for (const bk of bkArr) {
        if (visitedBooks.has(bk)) continue;
        const d: string[] = [];
        if (tw.invoiceDate && bk.invoiceDate && tw.invoiceDate !== bk.invoiceDate) d.push('Date');
        const tvTw = tw.totalValue ?? tw.taxableValue;
        const tvBk = bk.totalValue ?? bk.taxableValue;
        if (tvTw !== undefined && tvBk !== undefined && Math.abs(tvTw - tvBk) > tolerance) d.push('Value');

        if (d.length === 0) {
          matched = bk;
          break;
        } else {
          // Keep track of closest even if mismatch
          if (!matched) {
            matched = bk;
            diffs = d;
          }
        }
      }

      if (matched) {
        if (diffs.length === 0) {
          exactMatches.push({ twoB: tw, books: matched });
        } else {
          valueMismatches.push({ twoB: tw, books: matched, diffs });
        }
        visitedBooks.add(matched);
      }
    }
  }

  const matchedTwoB = new Set(exactMatches.map((m) => m.twoB).concat(valueMismatches.map((m) => m.twoB)));
  const matchedBooks = new Set(exactMatches.map((m) => m.books).concat(valueMismatches.map((m) => m.books)));

  const missingInBooks: NormalizedRow[] = [];
  for (const arr of twoBMap.values()) {
    for (const r of arr) if (!matchedTwoB.has(r)) missingInBooks.push(r);
  }

  const missingIn2B: NormalizedRow[] = [];
  for (const arr of booksMap.values()) {
    for (const r of arr) if (!matchedBooks.has(r)) missingIn2B.push(r);
  }

  // Probable matches across different keys by same GSTIN + close value
  const booksByGstin = new Map<string, NormalizedRow[]>();
  for (const b of books) {
    const arr = booksByGstin.get(b.gstin) ?? [];
    arr.push(b);
    booksByGstin.set(b.gstin, arr);
  }
  const probableMatches: ReconcileResult['probableMatches'] = [];
  for (const tw of missingInBooks) {
    const candidates = booksByGstin.get(tw.gstin) ?? [];
    const tvTw = tw.totalValue ?? tw.taxableValue;
    for (const bk of candidates) {
      const tvBk = bk.totalValue ?? bk.taxableValue;
      if (
        tvTw !== undefined &&
        tvBk !== undefined &&
        Math.abs(tvTw - tvBk) <= tolerance &&
        tw.invoiceDate && bk.invoiceDate
      ) {
        probableMatches.push({ twoB: tw, books: bk, reason: 'GSTIN + amount match; invoice no differs' });
        break;
      }
    }
  }

  const summary = {
    total2B: twoB.length,
    totalBooks: books.length,
    exactMatches: exactMatches.length,
    valueMismatches: valueMismatches.length,
    missingInBooks: missingInBooks.length,
    missingIn2B: missingIn2B.length,
    probableMatches: probableMatches.length,
    duplicate2B: duplicate2B.length,
    duplicateBooks: duplicateBooks.length,
  };

  return {
    exactMatches,
    probableMatches,
    missingInBooks,
    missingIn2B,
    valueMismatches,
    duplicate2B,
    duplicateBooks,
    summary,
  };
}
