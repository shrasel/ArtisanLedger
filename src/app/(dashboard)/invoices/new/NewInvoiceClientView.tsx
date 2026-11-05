'use client';

import React, { useState } from 'react';
import { InvoicePaperSheet } from '@/components/invoice/InvoicePaperSheet';
import { InvoiceCopilotBar } from '@/components/agent/InvoiceCopilotBar';
import type { Organization, Client } from '@/db/schema';
import type { EditableItem } from '@/components/invoice/LineItemEditor';
import { getRelativeDateString } from '@/lib/utils';

interface NewInvoiceClientViewProps {
  organization: Organization;
  clientsList: Client[];
  initialClientId?: string;
}

export function NewInvoiceClientView({
  organization,
  clientsList: initialClients,
  initialClientId,
}: NewInvoiceClientViewProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [draftVersion, setDraftVersion] = useState(0);

  const defaultSelectedClientId =
    initialClientId ||
    organization.defaultClientId ||
    initialClients.find((c) => c.isDefault === 1)?.id ||
    initialClients[0]?.id ||
    '';

  const [initialDraft, setInitialDraft] = useState<{
    invoiceNumber?: string;
    clientId?: string;
    issueDate?: string;
    dueDate?: string;
    currency?: string;
    notes?: string;
  }>({
    invoiceNumber: `${organization.invoicePrefix || 'INV-'}${organization.nextInvoiceNumber || 1001}`,
    clientId: defaultSelectedClientId,
    issueDate: getRelativeDateString(0),
    dueDate: getRelativeDateString(30),
    currency: organization.defaultCurrency || 'USD',
  });

  const [items, setItems] = useState<EditableItem[]>([
    {
      description: '',
      quantity: 1,
      unitPriceCents: 0,
      totalCents: 0,
    },
  ]);

  // When AI Copilot returns a parsed structured draft
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
    const trimmedClientName = (draft.clientName || '').trim();
    let matchedClient: Client | undefined;

    if (trimmedClientName) {
      // Check if client name matches an existing client
      matchedClient = clients.find(
        (c) =>
          c.name.toLowerCase().includes(trimmedClientName.toLowerCase()) ||
          (c.companyName &&
            c.companyName.toLowerCase().includes(trimmedClientName.toLowerCase()))
      );

      // If no client matches, create new client on the fly
      if (!matchedClient) {
        try {
          const res = await fetch('/api/clients/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: trimmedClientName,
              companyName: trimmedClientName,
              email: `billing@${trimmedClientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com`,
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
    }

    const calculatedDueDate = getRelativeDateString(
      typeof draft.dueDateOffsetDays === 'number' ? draft.dueDateOffsetDays : 30
    );

    setInitialDraft((prev) => ({
      ...prev,
      clientId: matchedClient?.id || prev.clientId,
      currency: draft.currency || prev.currency,
      dueDate: calculatedDueDate,
      notes: draft.notes ?? prev.notes,
    }));

    if (draft.items && draft.items.length > 0) {
      setItems(
        draft.items.map((it) => ({
          description: it.description,
          quantity: it.quantity || 1,
          unitPriceCents: it.unitPriceCents || 0,
          totalCents: Math.round((it.quantity || 1) * (it.unitPriceCents || 0)),
        }))
      );
    }

    // Always increment draftVersion so InvoicePaperSheet re-initializes with the new draft
    setDraftVersion((v) => v + 1);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Intent-to-Invoice Copilot Bar */}
      <InvoiceCopilotBar onApplyDraft={handleApplyCopilotDraft} />

      {/* Living Paper Canvas */}
      <InvoicePaperSheet
        key={`copilot-${draftVersion}-${initialDraft.clientId}`}
        initialInvoice={initialDraft}
        initialItems={items}
        organization={organization}
        clientsList={clients}
      />
    </div>
  );
}
