import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceItems, organizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { generateAccessToken, generatePasscode, hashPasscode } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organization) {
      return NextResponse.json({ error: 'Unauthorized or missing organization profile' }, { status: 401 });
    }

    const orgId = session.organization.id;
    const body = await req.json();

    const {
      id,
      clientId,
      invoiceNumber,
      status = 'DRAFT',
      issueDate,
      dueDate,
      currency = 'USD',
      subtotalCents = 0,
      discountCents = 0,
      taxRateBasisPoints = 0,
      taxAmountCents = 0,
      totalCents = 0,
      notes,
      termsConditions,
      items = [],
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client selection is required' }, { status: 400 });
    }

    let savedInvoiceId = id;

    if (id) {
      // Update existing
      const existing = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)))
        .limit(1);

      if (!existing[0]) {
        return NextResponse.json({ error: 'Invoice not found or unauthorized' }, { status: 404 });
      }

      await db
        .update(invoices)
        .set({
          clientId,
          invoiceNumber,
          status,
          issueDate,
          dueDate,
          currency,
          subtotalCents,
          discountCents,
          taxRateBasisPoints,
          taxAmountCents,
          totalCents,
          notes,
          termsConditions,
        })
        .where(eq(invoices.id, id));

      // Replace items
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

      if (items.length > 0) {
        const itemRows = items.map((it: any, index: number) => ({
          invoiceId: id,
          description: it.description || 'Deliverable',
          quantity: it.quantity || 1,
          unitPriceCents: it.unitPriceCents || 0,
          totalCents: it.totalCents || 0,
          sortOrder: index,
        }));
        await db.insert(invoiceItems).values(itemRows);
      }
    } else {
      // Create new
      const accessToken = generateAccessToken(24);
      const rawPin = generatePasscode();
      const hashedPin = await hashPasscode(rawPin);

      const [newInvoice] = await db
        .insert(invoices)
        .values({
          orgId,
          clientId,
          invoiceNumber,
          status,
          issueDate,
          dueDate,
          currency,
          subtotalCents,
          discountCents,
          taxRateBasisPoints,
          taxAmountCents,
          totalCents,
          notes,
          termsConditions,
          accessToken,
          accessPasscode: hashedPin,
        })
        .returning();

      savedInvoiceId = newInvoice.id;

      if (items.length > 0) {
        const itemRows = items.map((it: any, index: number) => ({
          invoiceId: savedInvoiceId,
          description: it.description || 'Deliverable',
          quantity: it.quantity || 1,
          unitPriceCents: it.unitPriceCents || 0,
          totalCents: it.totalCents || 0,
          sortOrder: index,
        }));
        await db.insert(invoiceItems).values(itemRows);
      }

      // Increment organization's nextInvoiceNumber if matches
      if (session.organization.nextInvoiceNumber) {
        await db
          .update(organizations)
          .set({ nextInvoiceNumber: session.organization.nextInvoiceNumber + 1 })
          .where(eq(organizations.id, orgId));
      }
    }

    const [saved] = await db.select().from(invoices).where(eq(invoices.id, savedInvoiceId)).limit(1);

    return NextResponse.json({ success: true, invoice: saved });
  } catch (err: unknown) {
    console.error('Save invoice error:', err);
    return NextResponse.json({ error: 'Failed to save invoice record' }, { status: 500 });
  }
}

