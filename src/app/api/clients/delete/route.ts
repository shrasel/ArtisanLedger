import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, invoices, invoiceItems, organizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, cascade = false } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const orgId = session.organization.id;

    // Verify client belongs to organization
    const existingClient = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.orgId, orgId)))
      .limit(1);

    if (existingClient.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check associated invoices
    const clientInvoices = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.clientId, clientId), eq(invoices.orgId, orgId)));

    if (clientInvoices.length > 0 && !cascade) {
      return NextResponse.json(
        {
          error: `This client has ${clientInvoices.length} invoice(s) on record. Confirm cascade deletion to remove the client and their associated invoices.`,
          requiresCascade: true,
          invoiceCount: clientInvoices.length,
        },
        { status: 409 }
      );
    }

    // If cascade confirmed, delete associated invoice items and invoices
    if (clientInvoices.length > 0 && cascade) {
      for (const inv of clientInvoices) {
        await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, inv.id));
      }
      await db
        .delete(invoices)
        .where(and(eq(invoices.clientId, clientId), eq(invoices.orgId, orgId)));
    }

    // Clear organization defaultClientId if pointing to this client
    if (session.organization.defaultClientId === clientId) {
      await db
        .update(organizations)
        .set({ defaultClientId: null })
        .where(eq(organizations.id, orgId));
    }

    // Delete client
    await db
      .delete(clients)
      .where(and(eq(clients.id, clientId), eq(clients.orgId, orgId)));

    return NextResponse.json({
      success: true,
      deletedClientId: clientId,
      deletedInvoicesCount: clientInvoices.length,
    });
  } catch (err: unknown) {
    console.error('Delete client error:', err);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}

