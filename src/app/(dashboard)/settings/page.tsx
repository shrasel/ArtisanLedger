import React from 'react';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || !session.organization) {
    redirect('/login');
  }

  const clientList = await db
    .select()
    .from(clients)
    .where(eq(clients.orgId, session.organization.id))
    .orderBy(desc(clients.createdAt));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-obsidian-border">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-ghost block mb-1">
          CONFIGURATIONS &bull; FIRM STANDARDS
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-paper">
          Ledger & Payout Settings
        </h1>
        <p className="text-xs font-sans text-bone-dark mt-1">
          Configure banking wire instructions, default currencies, invoice numbering, letterhead, and default billing client.
        </p>
      </div>

      <SettingsForm
        organization={session.organization}
        clientsList={clientList}
      />
    </div>
  );
}

