import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Artisan Ledger — Self-Hosted Archival Invoicing Platform',
  description:
    'Minimalist, tactile, archival legal document invoicing platform with zero floating-point currency precision, tokenized PIN delivery, and server-side PDF generation.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-light.svg', media: '(prefers-color-scheme: light)', type: 'image/svg+xml' },
      { url: '/favicon-dark.svg', media: '(prefers-color-scheme: dark)', type: 'image/svg+xml' },
      { url: '/favicon-light-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-light-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.ico',
  },
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
