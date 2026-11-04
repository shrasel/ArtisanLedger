import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { invoices, invoiceItems, organizations, clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hasInvoiceViewAccess } from '@/lib/auth';
import { RecipientPortalView } from './RecipientPortalView';

export const dynamic = 'force-dynamic';

export default async function ViewInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Find invoice by token
  const invList = await db.select().from(invoices).where(eq(invoices.accessToken, token)).limit(1);
  const invoice = invList[0];

  if (!invoice) {
    return (
      <div className="min-h-screen bg-obsidian text-paper flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-paper text-ink-primary p-8 border border-bone shadow-sheet text-center rounded-[2px]">
          <div className="w-12 h-12 mx-auto mb-4 border border-status-vermilion rounded-full flex items-center justify-center text-status-vermilion font-mono font-bold">
            !
          </div>
          <h1 className="font-serif text-2xl font-bold mb-2">Instrument Not Found</h1>
          <p className="text-xs font-sans text-ink-secondary leading-relaxed">
            The requested archival invoice could not be located. The link may have expired or was incorrectly referenced.
          </p>
        </div>
      </div>
    );
  }

  // Check if session has already verified the PIN
  const initiallyUnlocked = await hasInvoiceViewAccess(token);

  // Fetch items, org, client
  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoice.id))
    .orderBy(invoiceItems.sortOrder);

  const orgList = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, invoice.orgId))
    .limit(1);
  const organization = orgList[0];

  const clientList = await db
    .select()
    .from(clients)
    .where(eq(clients.id, invoice.clientId))
    .limit(1);
  const client = clientList[0];

  if (!organization || !client) {
    return notFound();
  }

  return (
    <RecipientPortalView
      token={token}
      invoice={invoice}
      items={items}
      organization={organization}
      client={client}
      initiallyUnlocked={initiallyUnlocked}
    />
  );
}

