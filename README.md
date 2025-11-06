# GSTR-2B ↔ Tally Reconciliation (Client‑side)

Fast, private, and accurate reconciliation between GSTR‑2B and Tally Purchase Register. Runs 100% in the browser; your data never leaves your device.

## Features
- Upload `.csv` or `.xlsx/.xls` for both GSTR‑2B and Tally
- Smart column auto‑mapping (GSTIN, Invoice No, Date, Values)
- Exact match detection and value/date mismatch detection (with tolerance)
- Missing in Books / Missing in 2B
- Duplicate detection (by GSTIN + Invoice No)
- Probable matches (same GSTIN + close amount)
- One‑click export of all results to Excel (multi‑sheet workbook)

## Quick Start
```bash
npm install
npm run dev
# open http://localhost:3000
```

1) Download sample files from the header
2) Upload your GSTR‑2B and Tally files
3) Verify/adjust column mapping
4) View results and Export to Excel

## Notes
- Matching key: GSTIN + normalised Invoice Number (spaces/hyphens/leading zeros removed)
- Value tolerance: ±1 (can be tuned in code `reconcile(..., { valueTolerance: 1 })`)
- Date formats supported: `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`

## Tech
- Next.js (App Router) + React 18
- Tailwind CSS
- papaparse (CSV) + SheetJS (XLSX)

## Deploy
Optimized for Vercel. Build and deploy:
```bash
npm run build
vercel deploy --prod --yes --name agentic-58052cd9
```
