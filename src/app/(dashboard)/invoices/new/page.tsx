import React from 'react';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NewInvoiceClientView } from './NewInvoiceClientView';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  const session = await getSession();
  if (!session || !session.organization) {
    redirect('/login');
  }

  const orgId = session.organization.id;

  // Fetch clients for org
  let clientList = await db.select().from(clients).where(eq(clients.orgId, orgId));

  // If no clients exist yet, seed a professional sample client
  if (clientList.length === 0) {
    const [seededClient] = await db
      .insert(clients)
      .values({
        orgId,
        name: 'Sarah Jenkins',
        companyName: 'Metro Studio Architecture',
        email: 'sjenkins@metrostudio.com',
        address: '450 Broadway, Suite 800, New York, NY 10013',
        phone: '+1 (212) 555-0144',
      })
      .returning();
    clientList = [seededClient];
  }

  return (
    <NewInvoiceClientView
      organization={session.organization}
      clientsList={clientList}
    />
  );
}

