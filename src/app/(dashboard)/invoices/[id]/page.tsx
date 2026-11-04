import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/db';
import { invoices, invoiceItems, clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { InvoiceEditView } from './InvoiceEditView';

export const dynamic = 'force-dynamic';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || !session.organization) {
    redirect('/login');
  }

  const { id } = await params;
  const orgId = session.organization.id;

  // Fetch invoice
  const invList = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)))
    .limit(1);

  const invoice = invList[0];
  if (!invoice) {
    notFound();
  }

  // Fetch line items
  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoice.id))
    .orderBy(invoiceItems.sortOrder);

  // Fetch clients
  const clientList = await db.select().from(clients).where(eq(clients.orgId, orgId));

  return (
    <InvoiceEditView
      invoice={invoice}
      items={items}
      organization={session.organization}
      clientsList={clientList}
    />
  );
}

