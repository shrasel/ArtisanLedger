'use server';

import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPasscode } from '@/lib/utils';
import { grantInvoiceViewAccess } from '@/lib/auth';

export async function verifyPinAndUnlock(token: string, pin: string) {
  try {
    const list = await db.select().from(invoices).where(eq(invoices.accessToken, token)).limit(1);
    const invoice = list[0];

    if (!invoice) {
      return { success: false, error: 'Invoice not found or expired token.' };
    }

    if (!invoice.accessPasscode) {
      // If no passcode was set (e.g. legacy/open link), grant access directly
      await grantInvoiceViewAccess(token);
      return { success: true };
    }

    // Verify passcode against bcrypt hash (or direct string fallback if unhashed)
    let isMatch = false;
    if (invoice.accessPasscode.startsWith('$2')) {
      isMatch = await verifyPasscode(pin, invoice.accessPasscode);
    } else {
      isMatch = invoice.accessPasscode === pin;
    }

    if (!isMatch) {
      return { success: false, error: 'Incorrect passcode. Please check the PIN sent in your invoice notification.' };
    }

    // Passcode verified! Grant access cookie
    await grantInvoiceViewAccess(token);

    // Update lastViewedAt and change status to VIEWED if currently SENT
    const now = new Date().toISOString();
    const updatePayload: { lastViewedAt: string; status?: 'VIEWED' } = {
      lastViewedAt: now,
    };
    if (invoice.status === 'SENT') {
      updatePayload.status = 'VIEWED';
    }

    await db.update(invoices).set(updatePayload).where(eq(invoices.id, invoice.id));

    return { success: true };
  } catch (err: unknown) {
    console.error('Error verifying PIN:', err);
    return { success: false, error: 'An unexpected verification error occurred.' };
  }
}

