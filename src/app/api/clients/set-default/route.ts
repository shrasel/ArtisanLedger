import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, organizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.organization.id;
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Verify client belongs to organization
    const existing = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.orgId, orgId)))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Clear previous default
    await db.update(clients).set({ isDefault: 0 }).where(eq(clients.orgId, orgId));

    // Set new default
    await db.update(clients).set({ isDefault: 1 }).where(eq(clients.id, id));
    await db.update(organizations).set({ defaultClientId: id }).where(eq(organizations.id, orgId));

    return NextResponse.json({ success: true, defaultClientId: id });
  } catch (err: unknown) {
    console.error('Set default client error:', err);
    return NextResponse.json({ error: 'Failed to set default client' }, { status: 500 });
  }
}

