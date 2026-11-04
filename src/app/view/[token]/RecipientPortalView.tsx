'use client';

import React, { useState } from 'react';
import { PinChallenge } from '@/components/invoice/PinChallenge';
import { InvoicePaperSheet } from '@/components/invoice/InvoicePaperSheet';
import type { Invoice, InvoiceItem, Organization, Client } from '@/db/schema';

interface RecipientPortalViewProps {
  token: string;
  invoice: Invoice;
  items: InvoiceItem[];
  organization: Organization;
  client: Client;
  initiallyUnlocked: boolean;
}

export function RecipientPortalView({
  token,
  invoice,
  items,
  organization,
  client,
  initiallyUnlocked,
}: RecipientPortalViewProps) {
  const [unlocked, setUnlocked] = useState(initiallyUnlocked);

  return (
    <div className="min-h-screen bg-obsidian text-paper px-4 py-8 md:py-12 flex flex-col items-center">
      {/* Editorial Top Brand Header */}
      <div className="w-full max-w-[850px] flex items-center justify-between pb-6 mb-8 border-b border-obsidian-border text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-brass" />
          <span className="font-serif font-bold text-sm tracking-wide text-paper uppercase">
            The Architect's Ledger
          </span>
        </div>
        <div className="text-ink-ghost tracking-wider uppercase text-[10px]">
          {unlocked ? 'Secure Certified Session' : 'Encrypted Access Gate'}
        </div>
      </div>

      {!unlocked ? (
        <PinChallenge
          token={token}
          invoiceNumber={invoice.invoiceNumber}
          senderCompanyName={organization.companyName}
          onUnlocked={() => setUnlocked(true)}
        />
      ) : (
        <div className="w-full flex justify-center animate-in fade-in zoom-in-95 duration-500">
          <InvoicePaperSheet
            initialInvoice={invoice}
            initialItems={items}
            organization={organization}
            clientsList={[client]}
            readOnly={true}
            isRecipientView={true}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-[850px] mt-16 pt-6 border-t border-obsidian-border text-center text-[10px] font-mono text-ink-ghost uppercase tracking-widest">
        Certified Financial Instrument &bull; The Architect's Ledger &bull; Archival Legal Record
      </footer>
    </div>
  );
}

