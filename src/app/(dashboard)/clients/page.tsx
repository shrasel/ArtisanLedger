import React from 'react';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ClientsManagerView } from './ClientsManagerView';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const session = await getSession();
  if (!session || !session.organization) {
    redirect('/login');
  }

  const clientsList = await db
    .select()
    .from(clients)
    .where(eq(clients.orgId, session.organization.id))
    .orderBy(desc(clients.createdAt));

  return <ClientsManagerView initialClients={clientsList} />;
}

