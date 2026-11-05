import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const orgId = session.organization.id;

    // Verify ownership
    const existing = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Delete line items and invoice record
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)));

    return NextResponse.json({
      success: true,
      deletedId: id,
      invoiceNumber: existing[0].invoiceNumber,
    });
  } catch (err: unknown) {
    console.error('Delete invoice error:', err);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
