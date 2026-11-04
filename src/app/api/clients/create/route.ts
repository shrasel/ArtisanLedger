import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.organization.id;
    const { name, email, companyName, address, phone, isDefault } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check count of existing clients
    const existing = await db.select().from(clients).where(eq(clients.orgId, orgId));
    const shouldBeDefault = isDefault || existing.length === 0;

    if (shouldBeDefault && existing.length > 0) {
      await db.update(clients).set({ isDefault: 0 }).where(eq(clients.orgId, orgId));
    }

    const [client] = await db
      .insert(clients)
      .values({
        orgId,
        name,
        email,
        companyName: companyName || null,
        address: address || null,
        phone: phone || null,
        isDefault: shouldBeDefault ? 1 : 0,
      })
      .returning();

    if (shouldBeDefault) {
      await db.update(organizations).set({ defaultClientId: client.id }).where(eq(organizations.id, orgId));
    }

    return NextResponse.json({ success: true, client });
  } catch (err: unknown) {
    console.error('Create client error:', err);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
