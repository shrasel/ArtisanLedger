import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "The Architect's Ledger — Minimalist High-End Invoicing",
  description:
    'Editorial, tactile, archival legal document invoicing platform with zero floating-point currency precision, tokenized PIN delivery, and server-side PDF generation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-obsidian text-paper antialiased">
        {children}
      </body>
    </html>
  );
}

