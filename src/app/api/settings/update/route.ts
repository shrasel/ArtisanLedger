import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations, clients } from '@/db/schema';
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
        entityType: body.entityType === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'FIRM',
        companyName:
          body.companyName ||
          body.principalName ||
          session.organization.companyName,
        principalName: body.principalName || null,
        letterheadTitle: body.letterheadTitle ?? null,
        letterheadTagline: body.letterheadTagline ?? null,
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
        defaultCustomTermsDays:
          body.defaultCustomTermsDays !== undefined
            ? Math.max(0, parseInt(body.defaultCustomTermsDays, 10) || 0)
            : session.organization.defaultCustomTermsDays ?? 14,
        defaultClientId: body.defaultClientId || null,
        invoicePrefix: body.invoicePrefix || 'INV-',
        nextInvoiceNumber: parseInt(body.nextInvoiceNumber, 10) || 1001,
        defaultTaxRateBasisPoints: parseInt(body.defaultTaxRateBasisPoints, 10) || 0,
        bankName: body.bankName || null,
        accountHolderName: body.accountHolderName || null,
        routingNumber: body.routingNumber || null,
        accountNumber: body.accountNumber || null,
        swiftBic: body.swiftBic || null,
        paymentNotes: body.paymentNotes || null,
        remittanceStubLabel: body.remittanceStubLabel ?? null,
        resendApiKey: body.resendApiKey !== undefined ? body.resendApiKey || null : session.organization.resendApiKey,
        emailDeliveryProvider: body.emailDeliveryProvider || 'RESEND',
        smtpUser: body.smtpUser !== undefined ? body.smtpUser || null : session.organization.smtpUser,
        smtpPass: body.smtpPass !== undefined ? body.smtpPass || null : session.organization.smtpPass,
        emailFrom:
          body.emailFrom !== undefined
            ? body.emailFrom || "Artisan Ledger <onboarding@resend.dev>"
            : session.organization.emailFrom,
        testRecipientEmail:
          body.testRecipientEmail !== undefined
            ? body.testRecipientEmail || 'shahjahan.rasell@gmail.com'
            : session.organization.testRecipientEmail,
      })
      .where(eq(organizations.id, session.organization.id));

    if (body.defaultClientId !== undefined) {
      await db.update(clients).set({ isDefault: 0 }).where(eq(clients.orgId, session.organization.id));
      if (body.defaultClientId) {
        await db.update(clients).set({ isDefault: 1 }).where(eq(clients.id, body.defaultClientId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Settings update error:', err);
    return NextResponse.json({ error: 'Failed to update organization settings' }, { status: 500 });
  }
}

