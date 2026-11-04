import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    await db
      .update(organizations)
      .set({
        companyName: body.companyName || session.organization.companyName,
        taxId: body.taxId || null,
        phone: body.phone || null,
        email: body.email || null,
        addressLine: body.addressLine || null,
        city: body.city || null,
        state: body.state || null,
        postalCode: body.postalCode || null,
        country: body.country || 'US',
        defaultCurrency: body.defaultCurrency || 'USD',
        defaultTerms: body.defaultTerms || 'NET_30',
        invoicePrefix: body.invoicePrefix || 'INV-',
        nextInvoiceNumber: parseInt(body.nextInvoiceNumber, 10) || 1001,
        defaultTaxRateBasisPoints: parseInt(body.defaultTaxRateBasisPoints, 10) || 0,
        bankName: body.bankName || null,
        accountHolderName: body.accountHolderName || null,
        routingNumber: body.routingNumber || null,
        accountNumber: body.accountNumber || null,
        swiftBic: body.swiftBic || null,
        paymentNotes: body.paymentNotes || null,
      })
      .where(eq(organizations.id, session.organization.id));

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Settings update error:', err);
    return NextResponse.json({ error: 'Failed to update organization settings' }, { status: 500 });
  }
}

