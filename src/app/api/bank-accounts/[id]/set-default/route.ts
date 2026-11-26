import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { getOrgBankAccounts, syncOrgDefaultBankFields } from '@/lib/bankAccounts';

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

    const existing = await db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.orgId, orgId)))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    await db.update(bankAccounts).set({ isDefault: 0 }).where(eq(bankAccounts.orgId, orgId));
    await db
      .update(bankAccounts)
      .set({ isDefault: 1 })
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.orgId, orgId)));

    await syncOrgDefaultBankFields(orgId);
    const updatedList = await getOrgBankAccounts(orgId);

    return NextResponse.json({ success: true, bankAccounts: updatedList });
  } catch (err) {
    console.error('Set default bank account error:', err);
    return NextResponse.json({ error: 'Failed to set default bank account' }, { status: 500 });
  }
}
