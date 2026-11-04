'use client';

import React, { useState } from 'react';
import { InvoicePaperSheet } from '@/components/invoice/InvoicePaperSheet';
import { InvoiceCopilotBar } from '@/components/agent/InvoiceCopilotBar';
import type { Organization, Client, Invoice, InvoiceItem } from '@/db/schema';
import type { EditableItem } from '@/components/invoice/LineItemEditor';
import { getRelativeDateString } from '@/lib/utils';

interface InvoiceEditViewProps {
  invoice: Invoice;
  items: InvoiceItem[];
  organization: Organization;
  clientsList: Client[];
}

export function InvoiceEditView({
  invoice,
  items: initialItems,
  organization,
  clientsList: initialClients,
}: InvoiceEditViewProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [activeInvoice, setActiveInvoice] = useState<Invoice>(invoice);
  const [items, setItems] = useState<EditableItem[]>(
    initialItems.map((it) => ({
      id: it.id,
      description: it.description,
      quantity: it.quantity,
      unitPriceCents: it.unitPriceCents,
      totalCents: it.totalCents,
    }))
  );

  const handleApplyCopilotDraft = async (draft: {
    clientName: string;
    currency: string;
    dueDateOffsetDays: number;
    items: Array<{
      description: string;
      quantity: number;
      unitPriceCents: number;
    }>;
    notes: string;
  }) => {
    let matchedClient = clients.find(
      (c) =>
        c.name.toLowerCase().includes(draft.clientName.toLowerCase()) ||
        (c.companyName && c.companyName.toLowerCase().includes(draft.clientName.toLowerCase()))
    );

    if (!matchedClient && draft.clientName) {
      try {
        const res = await fetch('/api/clients/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: draft.clientName,
            companyName: draft.clientName,
            email: `billing@${draft.clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com`,
          }),
        });
        const clientData = await res.json();
        if (clientData.client) {
          matchedClient = clientData.client;
          setClients((prev) => [clientData.client, ...prev]);
        }
      } catch (e) {
        console.warn('Could not auto-create client:', e);
      }
    }

    const calculatedDueDate = getRelativeDateString(draft.dueDateOffsetDays || 30);

    setActiveInvoice((prev) => ({
      ...prev,
      clientId: matchedClient?.id || prev.clientId,
      currency: draft.currency || prev.currency,
      dueDate: calculatedDueDate,
      notes: draft.notes || prev.notes,
    }));

    if (draft.items && draft.items.length > 0) {
      setItems(
        draft.items.map((it) => ({
          description: it.description,
          quantity: it.quantity || 1,
          unitPriceCents: it.unitPriceCents || 0,
          totalCents: (it.quantity || 1) * (it.unitPriceCents || 0),
        }))
      );
    }
  };

  return (
    <div className="flex flex-col items-center">
      <InvoiceCopilotBar onApplyDraft={handleApplyCopilotDraft} />

      <InvoicePaperSheet
        key={activeInvoice.id + (activeInvoice.notes || '') + items.length}
        initialInvoice={activeInvoice}
        initialItems={items}
        organization={organization}
        clientsList={clients}
      />
    </div>
  );
}

