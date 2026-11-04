import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { logoutAction } from '../(auth)/actions';
import { Plus, FileText, Users, Settings, LogOut } from 'lucide-react';

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

  const { organization, user } = session;

  return (
    <div className="min-h-screen bg-obsidian text-paper flex flex-col font-sans">
      {/* Top Archival Navigation Bar */}
      <header className="border-b border-obsidian-border bg-obsidian-light sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link href="/invoices" className="flex items-center gap-2.5 group">
              <span className="w-2.5 h-2.5 rounded-full bg-status-brass group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-paper block leading-none">
                  The Architect's Ledger
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-ghost block mt-0.5">
                  {organization.companyName}
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-bone-dark">
              <Link
                href="/invoices"
                className="px-3 py-1.5 rounded-[1px] hover:text-paper hover:bg-obsidian-border/60 transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Invoices</span>
              </Link>
              <Link
                href="/clients"
                className="px-3 py-1.5 rounded-[1px] hover:text-paper hover:bg-obsidian-border/60 transition-colors flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Clients</span>
              </Link>
              <Link
                href="/settings"
                className="px-3 py-1.5 rounded-[1px] hover:text-paper hover:bg-obsidian-border/60 transition-colors flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-obsidian bg-bone hover:bg-paper font-semibold rounded-[2px] transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Draft Invoice</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign Out"
                className="p-1.5 text-ink-ghost hover:text-status-vermilion transition-colors rounded-[1px]"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Bottom Archival Ledger Bar */}
      <footer className="border-t border-obsidian-border bg-obsidian-light/50 py-4 text-center font-mono text-[10px] uppercase tracking-widest text-ink-ghost">
        The Architect's Ledger &bull; Standard Wal Mode &bull; Integer Cent Precision &bull; Editorial Archival Engine
      </footer>
    </div>
  );
}

