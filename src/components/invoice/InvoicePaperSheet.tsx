'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Send,
  Save,
  CheckCircle2,
  Copy,
  Plus,
  ExternalLink,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  Trash2,
} from 'lucide-react';
import { StatusStamp } from './StatusStamp';
import { LineItemEditor, type EditableItem } from './LineItemEditor';
import type { Organization, Client, Invoice } from '@/db/schema';
import {
  formatCentsToCurrency,
  formatBasisPointsToPercent,
  parsePercentToBasisPoints,
  parseCurrencyToCents,
  calculateInvoiceTotals,
  getRelativeDateString,
  formatEditorialDate,
} from '@/lib/utils';

interface InvoicePaperSheetProps {
  initialInvoice?: Partial<Invoice>;
  initialItems?: EditableItem[];
  organization: Organization;
  clientsList: Client[];
  readOnly?: boolean;
  isRecipientView?: boolean;
}

export function InvoicePaperSheet({
  initialInvoice,
  initialItems,
  organization,
  clientsList,
  readOnly = false,
  isRecipientView = false,
}: InvoicePaperSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Invoice form state
  const [invoiceId] = useState<string | undefined>(initialInvoice?.id);
  const [status, setStatus] = useState<string>(initialInvoice?.status || 'DRAFT');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    initialInvoice?.invoiceNumber || `${organization.invoicePrefix || 'INV-'}${organization.nextInvoiceNumber || '1001'}`
  );
  const defaultClientCandidate =
    initialInvoice?.clientId ||
    organization.defaultClientId ||
    clientsList.find((c) => c.isDefault === 1)?.id ||
    (clientsList[0]?.id ?? '');

  const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientCandidate);
  const [issueDate, setIssueDate] = useState<string>(
    initialInvoice?.issueDate || getRelativeDateString(0)
  );
  const [dueDate, setDueDate] = useState<string>(
    initialInvoice?.dueDate || getRelativeDateString(30)
  );
  const [currency, setCurrency] = useState<string>(
    initialInvoice?.currency || organization.defaultCurrency || 'USD'
  );
  const [notes, setNotes] = useState<string>(
    initialInvoice?.notes ?? ''
  );
  const [terms, setTerms] = useState<string>(
    initialInvoice?.termsConditions ?? ''
  );

  // Line items state
  const [items, setItems] = useState<EditableItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : [
          {
            description: '',
            quantity: 1,
            unitPriceCents: 0,
            totalCents: 0,
          },
        ]
  );

  // Financial rates
  const [taxRateBasisPoints, setTaxRateBasisPoints] = useState<number>(
    initialInvoice?.taxRateBasisPoints ?? (organization.defaultTaxRateBasisPoints || 0)
  );
  const [discountCents, setDiscountCents] = useState<number>(
    initialInvoice?.discountCents || 0
  );

  // Quick Client Drawer modal state
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [localClients, setLocalClients] = useState<Client[]>(clientsList);

  // Dispatch modal state
  const [dispatchInfo, setDispatchInfo] = useState<{
    passcode: string;
    accessToken: string;
    viewUrl: string;
    emailStatus: string;
  } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Calculated Totals
  const totals = calculateInvoiceTotals(items, taxRateBasisPoints, discountCents);

  // Find currently selected client
  const activeClient = localClients.find((c) => c.id === selectedClientId) || localClients[0];

  // Quick Add Client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;

    try {
      const res = await fetch('/api/clients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName,
          email: newClientEmail,
          companyName: newClientCompany,
          address: newClientAddress,
        }),
      });
      const data = await res.json();
      if (data.client) {
        setLocalClients((prev) => [data.client, ...prev]);
        setSelectedClientId(data.client.id);
        setShowAddClient(false);
        setNewClientName('');
        setNewClientEmail('');
        setNewClientCompany('');
        setNewClientAddress('');
      }
    } catch (err) {
      console.error('Failed to create client:', err);
    }
  };

  // Save Invoice Draft
  const handleSave = async (customStatus?: string) => {
    setFeedbackMessage(null);
    startTransition(async () => {
      try {
        const payload = {
          id: invoiceId,
          clientId: selectedClientId,
          invoiceNumber,
          status: customStatus || status,
          issueDate,
          dueDate,
          currency,
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          taxRateBasisPoints: totals.taxRateBasisPoints,
          taxAmountCents: totals.taxAmountCents,
          totalCents: totals.totalCents,
          notes,
          termsConditions: terms,
          items,
        };

        const res = await fetch('/api/invoices/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to save invoice');
        }

        if (customStatus) {
          setStatus(customStatus);
        }

        setFeedbackMessage({ type: 'success', text: 'Invoice record archived successfully.' });

        if (!invoiceId && data.invoice?.id) {
          router.push(`/invoices/${data.invoice.id}`);
        } else {
          router.refresh();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error saving invoice';
        setFeedbackMessage({ type: 'error', text: message });
      }
    });
  };

  // Dispatch / Send Invoice
  const handleDispatch = async () => {
    setFeedbackMessage(null);
    startTransition(async () => {
      try {
        // First ensure current state is saved
        const savePayload = {
          id: invoiceId,
          clientId: selectedClientId,
          invoiceNumber,
          status: 'SENT',
          issueDate,
          dueDate,
          currency,
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          taxRateBasisPoints: totals.taxRateBasisPoints,
          taxAmountCents: totals.taxAmountCents,
          totalCents: totals.totalCents,
          notes,
          termsConditions: terms,
          items,
        };

        const saveRes = await fetch('/api/invoices/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savePayload),
        });

        const saveData = await saveRes.json();
        const activeId = invoiceId || saveData.invoice?.id;

        // Trigger dispatch
        const dispatchRes = await fetch(`/api/invoices/${activeId}/dispatch`, {
          method: 'POST',
        });
        const dispatchData = await dispatchRes.json();

        if (!dispatchRes.ok) {
          throw new Error(dispatchData.error || 'Failed to dispatch invoice');
        }

        setStatus('SENT');
        setDispatchInfo({
          passcode: dispatchData.passcode,
          accessToken: dispatchData.accessToken,
          viewUrl: dispatchData.viewUrl,
          emailStatus: dispatchData.simulated
            ? 'Simulated Dispatch (Check terminal or use PIN below)'
            : 'Dispatched via Resend with tokenized link & PIN',
        });

        if (!invoiceId && activeId) {
          router.push(`/invoices/${activeId}`);
        } else {
          router.refresh();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error dispatching invoice';
        setFeedbackMessage({ type: 'error', text: message });
      }
    });
  };

  // Mark Paid
  const handleMarkPaid = async () => {
    if (!invoiceId) {
      await handleSave('PAID');
    } else {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/invoices/${invoiceId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PAID' }),
          });
          if (res.ok) {
            setStatus('PAID');
            setFeedbackMessage({ type: 'success', text: 'Invoice certified as PAID.' });
            router.refresh();
          }
        } catch (err) {
          console.error(err);
        }
      });
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async () => {
    if (!invoiceId) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/delete`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to delete invoice');
        }
        router.push('/invoices');
        router.refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error deleting invoice';
        setFeedbackMessage({ type: 'error', text: message });
        setShowDeleteConfirm(false);
      }
    });
  };

  const pdfDownloadUrl = invoiceId
    ? `/api/invoices/${invoiceId}/pdf${initialInvoice?.accessToken ? `?token=${initialInvoice.accessToken}` : ''}`
    : null;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Floating Operational Bar (Seller View) */}
      {!readOnly && (
        <div className="w-full max-w-[850px] mb-6 flex flex-wrap items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-ink-ghost">
              DOCUMENT STATUS:
            </span>
            <StatusStamp status={status} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            {invoiceId && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-status-vermilion hover:bg-status-vermilion/10 border border-status-vermilion/40 rounded-[2px] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            {invoiceId && pdfDownloadUrl && (
              <a
                href={pdfDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-bone-dark hover:text-paper bg-obsidian-light hover:bg-obsidian-border border border-obsidian-border rounded-[2px] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Document</span>
              </a>
            )}

            {status !== 'PAID' && (
              <button
                type="button"
                onClick={handleMarkPaid}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-status-hunter hover:bg-status-hunter/10 border border-status-hunter/40 rounded-[2px] transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Paid</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-paper bg-obsidian-light hover:bg-obsidian-border border border-obsidian-border rounded-[2px] transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isPending ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={handleDispatch}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-obsidian bg-bone hover:bg-paper font-semibold rounded-[2px] transition-colors shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPending ? 'Dispatching...' : 'Dispatch Invoice'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Recipient Action Bar */}
      {isRecipientView && (
        <div className="w-full max-w-[850px] mb-6 flex items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-ink-ghost">
              VERIFIED PORTAL:
            </span>
            <StatusStamp status={status} size="sm" />
          </div>
          {pdfDownloadUrl && (
            <a
              href={pdfDownloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest text-paper bg-obsidian hover:bg-obsidian-light border border-obsidian-border rounded-[2px] shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </a>
          )}
        </div>
      )}

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`w-full max-w-[850px] mb-4 p-3 rounded-[2px] text-xs font-mono flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-[#2B4C3F]/10 border-status-hunter text-status-hunter'
              : 'bg-[#C84630]/10 border-status-vermilion text-status-vermilion'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* THE ARCHIVAL COTTON PAPER CANVAS */}
      <div
        className="w-full max-w-[850px] bg-paper text-ink-primary shadow-sheet border border-bone rounded-[2px] p-8 md:p-14 relative overflow-hidden transition-all duration-300"
        style={{
          backgroundImage:
            'radial-gradient(#18191B 0.35px, transparent 0.35px), radial-gradient(#18191B 0.35px, #FAF8F5 0.35px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      >
        {/* Subtle Archival Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.025] rotate-[-25deg] text-center">
          <span className="font-serif text-8xl font-black uppercase tracking-widest text-ink-primary">
            ARCHIVAL
          </span>
        </div>

        {/* Paper Sheet Header */}
        <div className="relative border-b-2 border-ink-primary pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-secondary block mb-1">
              FINANCIAL INSTRUMENT &bull; CERTIFIED LEDGER
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink-primary">
              {organization.companyName || "The Architect's Ledger"}
            </h1>
            <p className="text-xs font-sans text-ink-secondary mt-1 tracking-wide">
              Document No. <span className="font-mono font-semibold">{invoiceNumber}</span>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <StatusStamp status={status} size="md" />
            <div className="text-[11px] font-mono text-ink-ghost">
              Ref ID: {initialInvoice?.id ? initialInvoice.id.slice(0, 8).toUpperCase() : 'PENDING'}
            </div>
          </div>
        </div>

        {/* Structured Grid Metadata: Issuer & Debtor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 mb-8 border-b border-bone">
          {/* Issuer / Seller Info */}
          <div>
            <h2 className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-ink-secondary mb-3 flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-ink-ghost" />
              <span>Issuer / Creditor</span>
            </h2>
            <div className="space-y-1 text-sm font-sans text-ink-secondary">
              <div className="font-serif font-bold text-base text-ink-primary">
                {organization.companyName}
              </div>
              {organization.addressLine && <div>{organization.addressLine}</div>}
              <div>
                {[organization.city, organization.state, organization.postalCode].filter(Boolean).join(', ')}
              </div>
              {organization.country && <div>Country: {organization.country}</div>}
              {organization.taxId && (
                <div className="font-mono text-xs pt-1 text-ink-primary">
                  Tax ID: {organization.taxId}
                </div>
              )}
              {organization.email && (
                <div className="text-xs text-ink-secondary">{organization.email}</div>
              )}
            </div>
          </div>

          {/* Client / Debtor Info */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-ink-secondary flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-ink-ghost" />
                <span>Debtor / Billed To</span>
              </h2>

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setShowAddClient(true)}
                  className="text-[10px] font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Client</span>
                </button>
              )}
            </div>

            {readOnly ? (
              <div className="space-y-1 text-sm font-sans text-ink-secondary">
                <div className="font-serif font-bold text-base text-ink-primary">
                  {activeClient?.companyName || activeClient?.name || '—'}
                </div>
                {activeClient?.companyName && <div>Attn: {activeClient?.name}</div>}
                {activeClient?.address && <div>{activeClient.address}</div>}
                {activeClient?.email && <div className="text-xs">{activeClient.email}</div>}
                {activeClient?.phone && <div className="text-xs font-mono">{activeClient.phone}</div>}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-sm font-serif text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary transition-colors"
                  >
                    {localClients.map((client) => {
                      const isDef = client.id === organization.defaultClientId || client.isDefault === 1;
                      const label = client.companyName ? `${client.companyName} (${client.name})` : client.name;
                      return (
                        <option key={client.id} value={client.id}>
                          {isDef ? `★ ${label} [Default]` : label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {activeClient && (
                  <div className="text-xs font-sans text-ink-secondary space-y-0.5 pl-1 border-l-2 border-bone">
                    <p className="font-semibold text-ink-primary">{activeClient.email}</p>
                    {activeClient.address && <p>{activeClient.address}</p>}
                    {activeClient.phone && <p className="font-mono">{activeClient.phone}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Key Dates & Number Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 mb-8 bg-paper-dark/70 border border-bone rounded-[1px]">
          <div>
            <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block">
              Invoice Identifier
            </label>
            {readOnly ? (
              <div className="font-mono text-sm font-bold text-ink-primary mt-1">
                {invoiceNumber}
              </div>
            ) : (
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-transparent font-mono text-sm font-bold text-ink-primary border-b border-transparent hover:border-bone focus:border-ink-primary focus:outline-none px-0 py-0.5 mt-0.5"
              />
            )}
          </div>

          <div>
            <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block">
              Date of Issue
            </label>
            {readOnly ? (
              <div className="font-mono text-xs text-ink-primary mt-1">
                {formatEditorialDate(issueDate)}
              </div>
            ) : (
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-transparent font-mono text-xs text-ink-primary border-b border-transparent hover:border-bone focus:border-ink-primary focus:outline-none px-0 py-0.5 mt-0.5"
              />
            )}
          </div>

          <div>
            <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block">
              Payment Due
            </label>
            {readOnly ? (
              <div className="font-mono text-xs text-ink-primary mt-1">
                {formatEditorialDate(dueDate)}
              </div>
            ) : (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-transparent font-mono text-xs text-ink-primary border-b border-transparent hover:border-bone focus:border-ink-primary focus:outline-none px-0 py-0.5 mt-0.5"
              />
            )}
          </div>

          <div>
            <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block">
              Ledger Currency
            </label>
            {readOnly ? (
              <div className="font-mono text-sm font-bold text-ink-primary mt-1">
                {currency}
              </div>
            ) : (
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-transparent font-mono text-sm font-bold text-ink-primary border-b border-transparent hover:border-bone focus:border-ink-primary focus:outline-none px-0 py-0.5 mt-0.5 cursor-pointer"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="CHF">CHF</option>
              </select>
            )}
          </div>
        </div>

        {/* LINE ITEM EDITOR */}
        <div className="mb-8">
          <LineItemEditor
            items={items}
            currency={currency}
            onChange={setItems}
            readOnly={readOnly}
          />
        </div>

        {/* TOTALS & BREAKDOWN */}
        <div className="flex flex-col items-end mb-10">
          <div className="w-full max-w-sm space-y-2 border-t border-bone pt-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-xs font-sans text-ink-secondary">
              <span>Gross Subtotal</span>
              <span className="font-mono font-medium text-ink-primary">
                {formatCentsToCurrency(totals.subtotalCents, currency)}
              </span>
            </div>

            {/* Discount */}
            <div className="flex justify-between items-center text-xs font-sans text-ink-secondary">
              <span className="flex items-center gap-1">
                Discount
                {!readOnly && (
                  <span className="text-[10px] font-mono text-ink-ghost">(in currency)</span>
                )}
              </span>
              {readOnly ? (
                totals.discountCents > 0 ? (
                  <span className="font-mono font-medium text-status-vermilion">
                    -{formatCentsToCurrency(totals.discountCents, currency)}
                  </span>
                ) : (
                  <span className="font-mono text-ink-ghost">—</span>
                )
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs text-ink-ghost">-</span>
                  <input
                    type="text"
                    value={discountCents === 0 ? '' : (discountCents / 100).toFixed(2)}
                    placeholder="0.00"
                    onChange={(e) => setDiscountCents(parseCurrencyToCents(e.target.value))}
                    className="w-20 bg-paper-dark border border-bone px-1.5 py-0.5 font-mono text-xs text-right text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>
              )}
            </div>

            {/* Tax Rate (Basis Points) */}
            <div className="flex justify-between items-center text-xs font-sans text-ink-secondary">
              <span className="flex items-center gap-1">
                Tax
                {!readOnly && (
                  <span className="text-[10px] font-mono text-ink-ghost">
                    ({formatBasisPointsToPercent(taxRateBasisPoints)})
                  </span>
                )}
              </span>
              {readOnly ? (
                <div className="text-right">
                  <span className="font-mono font-medium text-ink-primary">
                    {formatCentsToCurrency(totals.taxAmountCents, currency)}
                  </span>
                  {totals.taxRateBasisPoints > 0 && (
                    <span className="text-[10px] font-mono text-ink-ghost block">
                      ({formatBasisPointsToPercent(totals.taxRateBasisPoints)})
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={taxRateBasisPoints === 0 ? '' : (taxRateBasisPoints / 100).toString()}
                    placeholder="0.00"
                    onChange={(e) => setTaxRateBasisPoints(parsePercentToBasisPoints(e.target.value))}
                    className="w-16 bg-paper-dark border border-bone px-1.5 py-0.5 font-mono text-xs text-right text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                  <span className="text-xs font-mono text-ink-secondary">%</span>
                  <span className="font-mono text-xs text-ink-primary w-20 text-right">
                    {formatCentsToCurrency(totals.taxAmountCents, currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Total Balance Due */}
            <div className="flex justify-between items-baseline pt-3 border-t-2 border-ink-primary">
              <span className="font-serif text-base font-bold uppercase tracking-wider text-ink-primary">
                Total Balance Due
              </span>
              <span className="font-mono text-2xl font-bold text-ink-primary">
                {formatCentsToCurrency(totals.totalCents, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* NOTES & TERMS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 mb-8 bg-paper-dark/50 border-l-2 border-ink-primary rounded-[1px]">
          <div>
            <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
              Instructions & Notes
            </label>
            {readOnly ? (
              <p className="text-xs font-sans text-ink-secondary leading-relaxed">
                {notes || '—'}
              </p>
            ) : (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Direct wire instructions, reference codes, or remarks..."
                className="w-full bg-transparent text-xs font-sans text-ink-secondary focus:text-ink-primary placeholder:text-ink-ghost/60 border border-transparent hover:border-bone focus:border-bone focus:bg-paper rounded-[1px] p-1.5 focus:outline-none resize-none transition-colors"
              />
            )}
          </div>

          <div>
            <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
              Terms & Legal Conditions
            </label>
            {readOnly ? (
              <p className="text-xs font-sans text-ink-secondary leading-relaxed">
                {terms || '—'}
              </p>
            ) : (
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
                placeholder="Payment timeline, late fee policies, governing terms..."
                className="w-full bg-transparent text-xs font-sans text-ink-secondary focus:text-ink-primary placeholder:text-ink-ghost/60 border border-transparent hover:border-bone focus:border-bone focus:bg-paper rounded-[1px] p-1.5 focus:outline-none resize-none transition-colors"
              />
            )}
          </div>
        </div>

        {/* TEAR-OFF WIRE TRANSFER REMITTANCE STUB */}
        <div className="relative pt-6">
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-dashed border-ink-ghost/60" />
            <span className="absolute bg-paper px-4 font-mono text-[9px] uppercase tracking-[0.25em] text-ink-ghost select-none">
              &bull; TEAR-OFF REMITTANCE ADVICE / WIRE TRANSFER INSTRUCTIONS &bull;
            </span>
          </div>

          <div className="p-5 border border-bone bg-paper-dark/30 rounded-[1px]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[9px] font-sans uppercase tracking-wider text-ink-ghost block">
                  Beneficiary Bank
                </span>
                <span className="font-mono text-xs font-semibold text-ink-primary">
                  {organization.bankName || 'Direct Wire Transfer'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-sans uppercase tracking-wider text-ink-ghost block">
                  Account Holder
                </span>
                <span className="font-mono text-xs font-semibold text-ink-primary">
                  {organization.accountHolderName || organization.companyName}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-sans uppercase tracking-wider text-ink-ghost block">
                  Routing / Transit / ABA
                </span>
                <span className="font-mono text-xs font-semibold text-ink-primary">
                  {organization.routingNumber || '—'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-sans uppercase tracking-wider text-ink-ghost block">
                  Account Number
                </span>
                <span className="font-mono text-xs font-semibold text-ink-primary">
                  {organization.accountNumber || '—'}
                </span>
              </div>
            </div>

            {(organization.swiftBic || organization.paymentNotes) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-bone/60">
                {organization.swiftBic && (
                  <div>
                    <span className="text-[9px] font-sans uppercase tracking-wider text-ink-ghost block">
                      SWIFT / BIC Code
                    </span>
                    <span className="font-mono text-xs font-semibold text-ink-primary">
                      {organization.swiftBic}
                    </span>
                  </div>
                )}
                {organization.paymentNotes && (
                  <div>
                    <span className="text-[9px] font-sans uppercase tracking-wider text-ink-ghost block">
                      Remittance Identifier / Reference
                    </span>
                    <span className="font-mono text-xs font-semibold text-ink-primary">
                      {organization.paymentNotes}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ADD CLIENT MODAL / DRAWER */}
      {showAddClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-paper border border-bone shadow-sheet p-6 rounded-[2px]">
            <h3 className="font-serif text-xl font-bold text-ink-primary mb-1">
              Add New Client
            </h3>
            <p className="text-xs font-sans text-ink-secondary mb-4">
              Enter primary contact information for invoice delivery.
            </p>

            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="text-[10px] font-sans uppercase tracking-wider text-ink-secondary block mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase tracking-wider text-ink-secondary block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="sarah@metrostudio.com"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase tracking-wider text-ink-secondary block mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  placeholder="Metro Studio Architecture"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase tracking-wider text-ink-secondary block mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  placeholder="450 Broadway, Suite 800, New York, NY"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-bone">
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-paper bg-ink-primary hover:bg-black rounded-[1px] font-semibold"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH CONFIRMATION / PIN DETAILS DRAWER */}
      {dispatchInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-paper border border-bone shadow-sheet p-8 rounded-[2px] text-ink-primary">
            <div className="text-center pb-4 border-b border-bone">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-status-hunter font-bold">
                &bull; INVOICE DISPATCHED &bull;
              </span>
              <h3 className="font-serif text-2xl font-bold mt-1 text-ink-primary">
                Secure Delivery Portal Generated
              </h3>
              <p className="text-xs font-sans text-ink-secondary mt-1">
                {dispatchInfo.emailStatus}
              </p>
            </div>

            <div className="my-6 p-4 bg-[#ECE6DC] border border-dashed border-[#5C5E62] rounded-[2px] text-center">
              <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink-secondary mb-1">
                Client Verification Passcode (PIN)
              </div>
              <div className="font-mono text-3xl font-bold tracking-[0.3em] text-status-vermilion select-all">
                {dispatchInfo.passcode}
              </div>
              <p className="text-[11px] font-sans text-ink-secondary mt-2">
                The recipient must enter this 6-digit PIN on the access envelope to view the invoice.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <label className="text-[10px] font-mono uppercase tracking-wider text-ink-secondary block">
                Secure Portal Link:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={dispatchInfo.viewUrl}
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 font-mono text-xs text-ink-primary rounded-[1px] select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(dispatchInfo.viewUrl);
                    alert('Portal URL copied to clipboard!');
                  }}
                  className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-ink-primary text-paper rounded-[1px] hover:bg-black transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-bone">
              <a
                href={dispatchInfo.viewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-ink-primary hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open View Portal as Recipient</span>
              </a>

              <button
                type="button"
                onClick={() => setDispatchInfo(null)}
                className="px-5 py-2 text-xs font-mono uppercase tracking-wider text-paper bg-ink-primary hover:bg-black rounded-[1px] font-bold transition-colors"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE INVOICE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-paper text-ink-primary border border-bone shadow-sheet rounded-[2px] p-6 relative">
            <div className="border-b border-bone pb-3 mb-4">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-status-vermilion block">
                ARCHIVAL EXPUNGEMENT
              </span>
              <h3 className="font-serif text-xl font-bold text-ink-primary">
                Delete Invoice {invoiceNumber}?
              </h3>
            </div>

            <p className="text-xs font-sans text-ink-secondary leading-relaxed mb-6">
              This will permanently remove invoice{' '}
              <span className="font-mono font-bold text-ink-primary">{invoiceNumber}</span> and
              all associated line items from your ledger. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-bone">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteInvoice}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-status-vermilion text-paper hover:opacity-90 rounded-[1px] font-bold transition-all shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPending ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

