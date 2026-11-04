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
    const { id, name, email, companyName, address, phone, isDefault } = await req.json();

    if (!id || !name || !email) {
      return NextResponse.json({ error: 'Client ID, name, and email are required' }, { status: 400 });
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

    // If setting as default, clear other defaults in org first
    if (isDefault) {
      await db.update(clients).set({ isDefault: 0 }).where(eq(clients.orgId, orgId));
      await db.update(organizations).set({ defaultClientId: id }).where(eq(organizations.id, orgId));
    }

    await db
      .update(clients)
      .set({
        name,
        email,
        companyName: companyName || null,
        address: address || null,
        phone: phone || null,
        isDefault: isDefault ? 1 : 0,
      })
      .where(eq(clients.id, id));

    const [updatedClient] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (err: unknown) {
    console.error('Update client error:', err);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

