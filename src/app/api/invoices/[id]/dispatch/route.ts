import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import {
  generatePasscode,
  hashPasscode,
  generateAccessToken,
  formatCentsToCurrency,
  formatEditorialDate,
} from '@/lib/utils';
import { sendInvoiceEmail } from '@/lib/email';

export async function POST(
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

    // Parse optional custom email dispatch parameters
    let customBody: {
      to?: string[];
      cc?: string[];
      bcc?: string[];
      subject?: string;
      customMessage?: string;
    } = {};

    try {
      const text = await req.text();
      if (text) {
        customBody = JSON.parse(text);
      }
    } catch {
      // Ignore empty/invalid JSON body and fall back to defaults
    }

    // Fetch invoice
    const invList = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.orgId, orgId)))
      .limit(1);

    const invoice = invList[0];
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch client
    const clientList = await db
      .select()
      .from(clients)
      .where(eq(clients.id, invoice.clientId))
      .limit(1);
    const client = clientList[0];

    if (!client) {
      return NextResponse.json({ error: 'Client record not found' }, { status: 400 });
    }

    const toRecipients =
      Array.isArray(customBody.to) && customBody.to.filter((e) => e?.trim()).length > 0
        ? customBody.to.map((e) => e.trim()).filter(Boolean)
        : [client.email];

    const ccRecipients = Array.isArray(customBody.cc)
      ? customBody.cc.map((e) => e.trim()).filter(Boolean)
      : [];

    const bccRecipients = Array.isArray(customBody.bcc)
      ? customBody.bcc.map((e) => e.trim()).filter(Boolean)
      : [];

    // Generate fresh passcode & token if needed
    const rawPin = generatePasscode();
    const hashedPin = await hashPasscode(rawPin);
    const accessToken = invoice.accessToken || generateAccessToken(24);
    const now = new Date().toISOString();

    await db
      .update(invoices)
      .set({
        accessPasscode: hashedPin,
        accessToken,
        status: 'SENT',
        sentAt: now,
      })
      .where(eq(invoices.id, id));

    // Construct view URL
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const viewUrl = `${protocol}://${host}/view/${accessToken}`;

    const senderDisplayName =
      session.organization.letterheadTitle ||
      session.organization.companyName ||
      session.organization.principalName ||
      "The Architect's Ledger";

    // Dispatch email
    const emailRes = await sendInvoiceEmail({
      recipientEmail: toRecipients,
      ccEmails: ccRecipients,
      bccEmails: bccRecipients,
      recipientName: client.name,
      senderName: session.organization.principalName || session.organization.companyName,
      companyName: senderDisplayName,
      invoiceNumber: invoice.invoiceNumber,
      totalFormatted: formatCentsToCurrency(invoice.totalCents, invoice.currency || 'USD'),
      dueDateFormatted: formatEditorialDate(invoice.dueDate),
      passcode: rawPin,
      viewUrl,
      customSubject: customBody.subject,
      customMessage: customBody.customMessage,
      resendApiKeyOverride: session.organization.resendApiKey,
      emailFromOverride: session.organization.emailFrom,
    });

    return NextResponse.json({
      success: true,
      passcode: rawPin,
      accessToken,
      viewUrl,
      recipients: {
        to: toRecipients,
        cc: ccRecipients,
        bcc: bccRecipients,
      },
      simulated: emailRes.simulated || false,
      emailError: emailRes.error || null,
    });
  } catch (err: unknown) {
    console.error('Dispatch invoice error:', err);
    return NextResponse.json({ error: 'Failed to dispatch invoice' }, { status: 500 });
  }
}
