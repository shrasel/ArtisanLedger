import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Artisan Ledger — Self-Hosted Archival Invoicing Platform',
  description:
    'Minimalist, tactile, archival legal document invoicing platform with zero floating-point currency precision, tokenized PIN delivery, and server-side PDF generation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const scheme = localStorage.getItem("color-scheme");
                const isDark = scheme === "dark" || (!scheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
                const meta = document.querySelector('meta[name="color-scheme"]');
                if (scheme && meta) meta.content = scheme;
                if (isDark) {
                  document.documentElement.classList.add("dark");
                } else {
                  document.documentElement.classList.remove("dark");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-obsidian text-paper antialiased">
        {children}
      </body>
    </html>
  );
}
