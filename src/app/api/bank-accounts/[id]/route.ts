import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { getOrgBankAccounts, syncOrgDefaultBankFields } from '@/lib/bankAccounts';

const updateBankAccountSchema = z.object({
  label: z.string().trim().min(1, 'Account label is required').max(80),
  bankName: z.string().trim().max(160).nullable().optional(),
  accountHolderName: z.string().trim().max(160).nullable().optional(),
  routingNumber: z.string().trim().max(80).nullable().optional(),
  accountNumber: z.string().trim().max(80).nullable().optional(),
  swiftBic: z.string().trim().max(40).nullable().optional(),
  paymentNotes: z.string().trim().max(300).nullable().optional(),
  isDefault: z.boolean().optional(),
});

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
    const orgId = session.organization.id;

    const existing = await db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.orgId, orgId)))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    const rawBody = await req.json();
    const parsed = updateBankAccountSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid bank account details' },
        { status: 400 }
      );
    }

    if (parsed.data.isDefault) {
      await db.update(bankAccounts).set({ isDefault: 0 }).where(eq(bankAccounts.orgId, orgId));
    }

    const [updated] = await db
      .update(bankAccounts)
      .set({
        label: parsed.data.label,
        bankName: parsed.data.bankName || null,
        accountHolderName: parsed.data.accountHolderName || null,
        routingNumber: parsed.data.routingNumber || null,
        accountNumber: parsed.data.accountNumber || null,
        swiftBic: parsed.data.swiftBic || null,
        paymentNotes: parsed.data.paymentNotes || null,
        ...(parsed.data.isDefault !== undefined ? { isDefault: parsed.data.isDefault ? 1 : 0 } : {}),
      })
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.orgId, orgId)))
      .returning();

    await syncOrgDefaultBankFields(orgId);
    const updatedList = await getOrgBankAccounts(orgId);

    return NextResponse.json({ success: true, bankAccount: updated, bankAccounts: updatedList });
  } catch (err) {
    console.error('Update bank account error:', err);
    return NextResponse.json({ error: 'Failed to update bank account' }, { status: 500 });
  }
}

export async function DELETE(
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

    const existing = await db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.orgId, orgId)))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    const wasDefault = existing[0].isDefault === 1;
    await db
      .delete(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.orgId, orgId)));

    // If the deleted account was default, promote the next remaining account
    if (wasDefault) {
      const remaining = await getOrgBankAccounts(orgId);
      if (remaining[0]) {
        await db
          .update(bankAccounts)
          .set({ isDefault: 1 })
          .where(eq(bankAccounts.id, remaining[0].id));
      }
    }

    await syncOrgDefaultBankFields(orgId);
    const updatedList = await getOrgBankAccounts(orgId);

    return NextResponse.json({ success: true, bankAccounts: updatedList });
  } catch (err) {
    console.error('Delete bank account error:', err);
    return NextResponse.json({ error: 'Failed to delete bank account' }, { status: 500 });
  }
}
