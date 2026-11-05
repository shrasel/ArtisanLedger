import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { NavHeader } from '@/components/layout/NavHeader';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.organization) {
    redirect('/onboarding');
  }

  const { organization } = session;

  return (
    <div className="min-h-screen bg-obsidian text-paper flex flex-col font-sans overflow-x-hidden">
      {/* Top Archival Navigation Bar (Responsive across Mobile, Tablet, Desktop & 4K TV) */}
      <NavHeader
        companyName={
          organization.letterheadTitle ||
          organization.companyName ||
          organization.principalName ||
          "The Architect's Ledger"
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {children}
      </main>

      {/* Bottom Archival Ledger Bar */}
      <footer className="border-t border-obsidian-border bg-obsidian-light/50 py-4 px-4 text-center font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-ink-ghost">
        The Architect&apos;s Ledger &bull; Standard WAL Mode &bull; Integer Cent Precision &bull; Editorial Archival Engine
      </footer>
    </div>
  );
}
