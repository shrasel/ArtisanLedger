import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!['DRAFT', 'SENT', 'VIEWED', 'PAID', 'VOID'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await db
      .update(invoices)
      .set({ status })
      .where(and(eq(invoices.id, id), eq(invoices.orgId, session.organization.id)));

    return NextResponse.json({ success: true, status });
  } catch (err: unknown) {
    console.error('Update status error:', err);
    return NextResponse.json({ error: 'Failed to update invoice status' }, { status: 500 });
  }
}

