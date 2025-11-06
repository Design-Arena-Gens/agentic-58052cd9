import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GSTR-2B ? Tally Reconciliation',
  description: 'Fast, client-side reconciliation of GSTR-2B with Tally Purchase Register',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container-narrow py-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">GSTR-2B ? Tally Reconciliation</h1>
            <a className="btn btn-outline" href="/sample-gstr2b.csv" download>
              Download Sample CSVs
            </a>
          </header>
          {children}
        </div>
        <footer className="py-6 border-t mt-10">
          <div className="container-narrow text-sm text-gray-500">
            100% client-side. Files never leave your browser.
          </div>
        </footer>
      </body>
    </html>
  );
}
