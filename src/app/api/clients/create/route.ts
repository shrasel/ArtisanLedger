import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, companyName, address, phone } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const [client] = await db
      .insert(clients)
      .values({
        orgId: session.organization.id,
        name,
        email,
        companyName: companyName || null,
        address: address || null,
        phone: phone || null,
      })
      .returning();

    return NextResponse.json({ success: true, client });
  } catch (err: unknown) {
    console.error('Create client error:', err);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

