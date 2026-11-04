import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { db } from '@/db';
import { invoices, invoiceItems, organizations, clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession, hasInvoiceViewAccess } from '@/lib/auth';
import { InvoicePdfTemplate } from '@/lib/pdf/InvoicePdfTemplate';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const tokenQuery = searchParams.get('token');

    // Fetch invoice
    const invList = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    const invoice = invList[0];

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    // Check authorization:
    // 1. Session auth (org owner)
    const session = await getSession();
    const isOwner = session?.organization?.id === invoice.orgId;

    // 2. Token portal access (recipient who verified PIN or passed token matching invoice)
    const hasTokenAccess =
      (tokenQuery && tokenQuery === invoice.accessToken) ||
      (await hasInvoiceViewAccess(invoice.accessToken));

    if (!isOwner && !hasTokenAccess) {
      return new NextResponse('Unauthorized access to invoice PDF', { status: 401 });
    }

    // Fetch related items, organization, and client
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id))
      .orderBy(invoiceItems.sortOrder);

    const orgList = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, invoice.orgId))
      .limit(1);
    const organization = orgList[0];

    const clientList = await db
      .select()
      .from(clients)
      .where(eq(clients.id, invoice.clientId))
      .limit(1);
    const client = clientList[0];

    if (!organization || !client) {
      return new NextResponse('Invoice metadata incomplete', { status: 500 });
    }

    // Render PDF to buffer
    const pdfDocument = React.createElement(InvoicePdfTemplate, {
      invoice,
      items,
      organization,
      client,
    }) as unknown as React.ReactElement<any>;

    const pdfBuffer = await renderToBuffer(pdfDocument);

    const filename = `${invoice.invoiceNumber || 'invoice'}.pdf`;

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    console.error('Error generating PDF:', err);
    return new NextResponse('Error generating PDF document', { status: 500 });
  }
}
