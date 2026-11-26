import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { invoices, invoiceItems, organizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { generateAccessToken, generatePasscode, hashPasscode } from '@/lib/utils';

const saveInvoiceItemSchema = z.object({
  description: z.string().max(500, 'Line item description must be 500 characters or fewer').optional().default(''),
  quantity: z.number().int().min(0).max(9999999).optional().default(1),
  unitPriceCents: z.number().int().min(0).max(9999999999).optional().default(0),
  totalCents: z.number().int().min(0).max(999999999999).optional().default(0),
});

const saveInvoiceSchema = z.object({
  id: z.string().max(128).optional(),
  clientId: z.string().min(1, 'Client selection is required').max(128),
  invoiceNumber: z.string().trim().min(1, 'Invoice number is required').max(80, 'Invoice number must be 80 characters or fewer'),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'PAID', 'VOID']).optional().default('DRAFT'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid issue date format'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid due date format'),
  currency: z.string().min(3).max(6).optional().default('USD'),
  subtotalCents: z.number().int().min(0).optional().default(0),
  discountCents: z.number().int().min(0).optional().default(0),
  taxRateBasisPoints: z.number().int().min(0).max(100000).optional().default(0),
  taxAmountCents: z.number().int().min(0).optional().default(0),
  totalCents: z.number().int().min(0).optional().default(0),
  notes: z.string().max(4000, 'Notes must be 4,000 characters or fewer').nullable().optional(),
  termsConditions: z.string().max(4000, 'Terms must be 4,000 characters or fewer').nullable().optional(),
  bankAccountId: z.string().max(128).nullable().optional(),
  showBankDetails: z.boolean().optional().default(true),
  items: z.array(saveInvoiceItemSchema).max(500, 'Maximum 500 line items per invoice').optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organization) {
      return NextResponse.json({ error: 'Unauthorized or missing organization profile' }, { status: 401 });
    }

    const orgId = session.organization.id;
    const rawBody = await req.json();
    const parsed = saveInvoiceSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || 'Invalid invoice payload' },
        { status: 400 }
      );
    }

    const {
      id,
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
      bankAccountId,
      showBankDetails,
      items,
    } = parsed.data;

    const showBankFlag = showBankDetails ? 1 : 0;
    const normalizedBankId = showBankDetails ? bankAccountId || null : null;

    let savedInvoiceId: string = id ?? '';

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
          bankAccountId: normalizedBankId,
          showBankDetails: showBankFlag,
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
          bankAccountId: normalizedBankId,
          showBankDetails: showBankFlag,
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

