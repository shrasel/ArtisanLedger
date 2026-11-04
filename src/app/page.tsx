import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import {
  FileText,
  ShieldCheck,
  Sparkles,
  Download,
  ArrowRight,
  Landmark,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { StatusStamp } from '@/components/invoice/StatusStamp';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    if (!session.organization) {
      redirect('/onboarding');
    } else {
      redirect('/invoices');
    }
  }

  return (
    <div className="min-h-screen bg-obsidian text-paper flex flex-col font-sans selection:bg-status-brass selection:text-obsidian">
      {/* Top Archival Header */}
      <header className="border-b border-obsidian-border bg-obsidian-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-status-brass" />
            <span className="font-serif text-lg font-bold tracking-tight text-paper">
              The Architect's Ledger
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-xs font-mono uppercase tracking-wider text-bone-dark hover:text-paper transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-obsidian bg-bone hover:bg-paper font-bold rounded-[2px] shadow-sm transition-all"
            >
              Originate Ledger &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-obsidian-light border border-obsidian-border rounded-full text-[10px] font-mono uppercase tracking-[0.2em] text-status-brass mb-6">
          <Scale className="w-3 h-3" />
          <span>Archival Legal Document & Remittance Engine</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-paper leading-[1.1] mb-6">
          Financial Instruments for the <br />
          <span className="italic font-normal text-bone">Modern Master Practitioner.</span>
        </h1>

        <p className="font-sans text-sm sm:text-base text-bone-dark max-w-2xl mx-auto leading-relaxed mb-10">
          Strictly devoid of generic SaaS bloat. Built on warm archival cotton canvas, zero floating-point cent arithmetic, cryptographic tokenized delivery gates, and server-side legal PDF streaming.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-bone hover:bg-paper text-obsidian font-mono text-xs uppercase tracking-[0.2em] font-bold rounded-[2px] shadow-sheet transition-all"
          >
            <span>Begin Master Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-obsidian-light hover:bg-obsidian-border border border-obsidian-border text-paper font-mono text-xs uppercase tracking-[0.2em] rounded-[2px] transition-all"
          >
            <span>Access Registry</span>
          </Link>
        </div>
      </section>

      {/* Tactile Living Paper Preview */}
      <section className="px-4 pb-20 max-w-4xl mx-auto w-full">
        <div className="bg-paper text-ink-primary border border-bone shadow-sheet rounded-[2px] p-6 sm:p-12 relative overflow-hidden">
          <div className="border-b-2 border-ink-primary pb-4 mb-6 flex items-start justify-between">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-ink-secondary block">
                EXEMPLAR &bull; CERTIFIED DISPATCH
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
                Atelier Vance Architecture
              </h2>
              <p className="text-xs font-mono text-ink-secondary">Document No. INV-1084</p>
            </div>
            <StatusStamp status="PAID" size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-4 pb-6 mb-6 border-b border-bone text-xs font-sans">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-ink-ghost block mb-0.5">
                Issued By
              </span>
              <p className="font-serif font-bold text-ink-primary">Atelier Vance Architects</p>
              <p className="text-ink-secondary">740 Broadway, 12th Floor, New York</p>
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-ink-ghost block mb-0.5">
                Billed To
              </span>
              <p className="font-serif font-bold text-ink-primary">Metro Studio Architecture</p>
              <p className="text-ink-secondary">Attn: Sarah Jenkins, Principal</p>
            </div>
          </div>

          {/* Sample Table */}
          <div className="space-y-2 mb-6 font-mono text-xs">
            <div className="flex justify-between pb-1 border-b border-ink-primary text-[10px] uppercase font-bold text-ink-secondary">
              <span>Scope of Deliverable</span>
              <span>Total</span>
            </div>
            <div className="flex justify-between py-1 border-b border-bone/60">
              <span className="font-serif text-ink-primary">Schematic Site Masterplan & Spatial Study</span>
              <span className="font-bold text-ink-primary">$8,500.00</span>
            </div>
            <div className="flex justify-between py-1 border-b border-bone/60">
              <span className="font-serif text-ink-primary">16 Hours Structural CAD Modeling ($150/hr)</span>
              <span className="font-bold text-ink-primary">$2,400.00</span>
            </div>
          </div>

          <div className="flex justify-end pt-2 mb-8">
            <div className="w-60 space-y-1 text-right">
              <div className="flex justify-between text-xs font-mono text-ink-secondary">
                <span>Subtotal</span>
                <span>$10,900.00</span>
              </div>
              <div className="flex justify-between text-xs font-mono text-ink-secondary">
                <span>Tax (8.25%)</span>
                <span>$899.25</span>
              </div>
              <div className="flex justify-between text-sm font-mono font-bold text-ink-primary pt-2 border-t border-ink-primary">
                <span>Total Balance Due</span>
                <span>$11,799.25</span>
              </div>
            </div>
          </div>

          {/* Tear-off wire stub */}
          <div className="border-t border-dashed border-ink-ghost/60 pt-4 text-[10px] font-mono text-ink-secondary">
            <div className="text-center text-[9px] uppercase tracking-[0.2em] text-ink-ghost mb-2">
              &bull; Tear-Off Remittance Advice / Wire Transfer Stub &bull;
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-paper-dark p-3 border border-bone">
              <div>
                <span className="text-ink-ghost block text-[8px] uppercase">Bank</span>
                <span className="font-bold text-ink-primary">J.P. Morgan Chase</span>
              </div>
              <div>
                <span className="text-ink-ghost block text-[8px] uppercase">Holder</span>
                <span className="font-bold text-ink-primary">Atelier Vance LLC</span>
              </div>
              <div>
                <span className="text-ink-ghost block text-[8px] uppercase">Routing (ABA)</span>
                <span className="font-bold text-ink-primary">021000021</span>
              </div>
              <div>
                <span className="text-ink-ghost block text-[8px] uppercase">Account</span>
                <span className="font-bold text-ink-primary">••••••4412</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="border-t border-obsidian-border bg-obsidian-light py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border border-obsidian-border bg-obsidian rounded-[2px] space-y-3">
            <div className="w-8 h-8 rounded-sm bg-status-brass/10 border border-status-brass/30 text-status-brass flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-paper">
              The Living Document Canvas
            </h3>
            <p className="text-xs font-sans text-bone-dark leading-relaxed">
              No modal-heavy forms. Click and type directly onto warm cotton parchment with auto-calculating line items and reactive financial totals.
            </p>
          </div>

          <div className="p-6 border border-obsidian-border bg-obsidian rounded-[2px] space-y-3">
            <div className="w-8 h-8 rounded-sm bg-status-vermilion/10 border border-status-vermilion/30 text-status-vermilion flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-paper">
              Tokenized PIN Access Gate
            </h3>
            <p className="text-xs font-sans text-bone-dark leading-relaxed">
              Each dispatch generates a secure nanoid link and 6-digit numeric PIN. Clients enter the passcode on an editorial envelope gate to unlock the document.
            </p>
          </div>

          <div className="p-6 border border-obsidian-border bg-obsidian rounded-[2px] space-y-3">
            <div className="w-8 h-8 rounded-sm bg-status-hunter/10 border border-status-hunter/30 text-status-hunter flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-paper">
              Intent-to-Invoice Copilot
            </h3>
            <p className="text-xs font-sans text-bone-dark leading-relaxed">
              Press Cmd+K and type plain instructions: "Bill Acme $4,500 for Brand Identity and 12 hrs CAD drafting, Net 15". Instantly parses into structured state.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Footer */}
      <footer className="mt-auto border-t border-obsidian-border py-8 px-4 text-center text-xs font-mono text-ink-ghost">
        <p className="tracking-widest uppercase text-[10px]">
          The Architect's Ledger &bull; Standard WAL SQLite &bull; Drizzle ORM &bull; React-PDF
        </p>
      </footer>
    </div>
  );
}

