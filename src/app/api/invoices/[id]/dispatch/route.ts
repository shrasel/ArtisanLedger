import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, organizations, clients } from '@/db/schema';
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

    // Dispatch email
    const emailRes = await sendInvoiceEmail({
      recipientEmail: client.email,
      recipientName: client.name,
      senderName: session.organization.companyName,
      companyName: session.organization.companyName,
      invoiceNumber: invoice.invoiceNumber,
      totalFormatted: formatCentsToCurrency(invoice.totalCents, invoice.currency || 'USD'),
      dueDateFormatted: formatEditorialDate(invoice.dueDate),
      passcode: rawPin,
      viewUrl,
    });

    return NextResponse.json({
      success: true,
      passcode: rawPin,
      accessToken,
      viewUrl,
      simulated: emailRes.simulated || false,
    });
  } catch (err: unknown) {
    console.error('Dispatch invoice error:', err);
    return NextResponse.json({ error: 'Failed to dispatch invoice' }, { status: 500 });
  }
}

