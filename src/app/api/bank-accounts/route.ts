import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { getOrgBankAccounts, syncOrgDefaultBankFields } from '@/lib/bankAccounts';

const bankAccountSchema = z.object({
  label: z.string().trim().min(1, 'Account label is required').max(80),
  bankName: z.string().trim().max(160).nullable().optional(),
  accountHolderName: z.string().trim().max(160).nullable().optional(),
  routingNumber: z.string().trim().max(80).nullable().optional(),
  accountNumber: z.string().trim().max(80).nullable().optional(),
  swiftBic: z.string().trim().max(40).nullable().optional(),
  paymentNotes: z.string().trim().max(300).nullable().optional(),
  isDefault: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await getOrgBankAccounts(session.organization.id);
    return NextResponse.json({ bankAccounts: accounts });
  } catch (err) {
    console.error('List bank accounts error:', err);
    return NextResponse.json({ error: 'Failed to load bank accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.organization.id;
    const rawBody = await req.json();
    const parsed = bankAccountSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid bank account details' },
        { status: 400 }
      );
    }

    const existing = await getOrgBankAccounts(orgId);
    const shouldBeDefault = parsed.data.isDefault || existing.length === 0;

    if (shouldBeDefault) {
      await db.update(bankAccounts).set({ isDefault: 0 }).where(eq(bankAccounts.orgId, orgId));
    }

    const [created] = await db
      .insert(bankAccounts)
      .values({
        orgId,
        label: parsed.data.label,
        bankName: parsed.data.bankName || null,
        accountHolderName: parsed.data.accountHolderName || null,
        routingNumber: parsed.data.routingNumber || null,
        accountNumber: parsed.data.accountNumber || null,
        swiftBic: parsed.data.swiftBic || null,
        paymentNotes: parsed.data.paymentNotes || null,
        isDefault: shouldBeDefault ? 1 : 0,
      })
      .returning();

    await syncOrgDefaultBankFields(orgId);
    const updatedList = await getOrgBankAccounts(orgId);

    return NextResponse.json({ success: true, bankAccount: created, bankAccounts: updatedList });
  } catch (err) {
    console.error('Create bank account error:', err);
    return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 });
  }
}
