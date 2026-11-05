import React from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { invoices, clients } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { StatusStamp } from '@/components/invoice/StatusStamp';
import { DeleteInvoiceButton } from '@/components/invoice/DeleteInvoiceButton';
import { formatCentsToCurrency, formatEditorialDate } from '@/lib/utils';
import { Plus, Download, ExternalLink, ArrowUpRight, FileSpreadsheet } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InvoicesListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session || !session.organization) return null;

  const { status: filterStatus } = await searchParams;
  const orgId = session.organization.id;

  // Fetch all invoices for org
  const allInvoices = await db
    .select({
      invoice: invoices,
      client: clients,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.orgId, orgId))
    .orderBy(desc(invoices.createdAt));

  // Compute financial metrics
  const totalOutstandingCents = allInvoices
    .filter((row) => ['SENT', 'VIEWED', 'DRAFT'].includes(row.invoice.status || ''))
    .reduce((sum, row) => sum + (row.invoice.totalCents || 0), 0);

  const totalPaidCents = allInvoices
    .filter((row) => row.invoice.status === 'PAID')
    .reduce((sum, row) => sum + (row.invoice.totalCents || 0), 0);

  const totalDispatchedCount = allInvoices.filter(
    (row) => ['SENT', 'VIEWED'].includes(row.invoice.status || '')
  ).length;

  // Filter list if filter applied
  const filteredRows = filterStatus
    ? allInvoices.filter((row) => row.invoice.status === filterStatus.toUpperCase())
    : allInvoices;

  const statuses = ['ALL', 'DRAFT', 'SENT', 'VIEWED', 'PAID', 'VOID'];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Metrics Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-obsidian-border">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-ghost block mb-1">
            ARCHIVAL REGISTRY &bull; CERTIFIED ENTRIES
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-paper">
            Invoices &amp; Accounts Ledger
          </h1>
          <p className="text-xs font-sans text-bone-dark mt-1">
            Manage living document records, tokenized dispatches, and certified remittances.
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-obsidian bg-bone hover:bg-paper font-bold rounded-[2px] shadow-md transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Originate New Invoice</span>
        </Link>
      </div>

      {/* Financial Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-obsidian-light border border-obsidian-border rounded-[2px]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-ghost block mb-1">
            Total Outstanding Receivables
          </span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-status-brass">
            {formatCentsToCurrency(totalOutstandingCents, session.organization.defaultCurrency || 'USD')}
          </div>
          <span className="text-[10px] font-sans text-ink-ghost mt-1 block">
            Across draft &amp; dispatched balances
          </span>
        </div>

        <div className="p-4 sm:p-5 bg-obsidian-light border border-obsidian-border rounded-[2px]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-ghost block mb-1">
            Certified Paid Revenue
          </span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-status-hunter">
            {formatCentsToCurrency(totalPaidCents, session.organization.defaultCurrency || 'USD')}
          </div>
          <span className="text-[10px] font-sans text-ink-ghost mt-1 block">
            Verified remittances cleared
          </span>
        </div>

        <div className="p-4 sm:p-5 bg-obsidian-light border border-obsidian-border rounded-[2px]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-ghost block mb-1">
            Active Token Dispatches
          </span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-paper">
            {totalDispatchedCount}{' '}
            <span className="text-xs font-sans text-ink-ghost font-normal">in flight</span>
          </div>
          <span className="text-[10px] font-sans text-ink-ghost mt-1 block">
            Encrypted client access links
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-obsidian-border font-mono text-xs uppercase tracking-wider no-scrollbar">
        {statuses.map((s) => {
          const isSelected = (!filterStatus && s === 'ALL') || filterStatus === s;
          const href = s === 'ALL' ? '/invoices' : `/invoices?status=${s}`;
          return (
            <Link
              key={s}
              href={href}
              className={`px-3 py-1.5 rounded-[1px] shrink-0 transition-colors ${
                isSelected
                  ? 'bg-bone text-obsidian font-bold shadow-sm'
                  : 'text-bone-dark hover:text-paper hover:bg-obsidian-light'
              }`}
            >
              {s}
            </Link>
          );
        })}
      </div>

      {/* Invoices List (Mobile Cards + Tablet/Desktop Table) */}
      {filteredRows.length === 0 ? (
        <div className="p-8 sm:p-12 text-center border border-dashed border-obsidian-border rounded-[2px] bg-obsidian-light/30">
          <FileSpreadsheet className="w-10 h-10 text-ink-ghost mx-auto mb-3 opacity-50" />
          <h3 className="font-serif text-lg font-bold text-paper mb-1">
            No Archival Invoices Found
          </h3>
          <p className="text-xs font-sans text-bone-dark max-w-md mx-auto mb-6">
            There are no invoices matching the selected criteria. Draft your first living document with the Intent-to-Invoice Copilot.
          </p>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider text-obsidian bg-bone hover:bg-paper font-semibold rounded-[2px] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Invoice</span>
          </Link>
        </div>
      ) : (
        <>
          {/* MOBILE CARD STACK (Visible on iPhone & Android < 768px) */}
          <div className="md:hidden space-y-3">
            {filteredRows.map(({ invoice, client }) => (
              <div
                key={invoice.id}
                className="p-4 bg-obsidian-light border border-obsidian-border rounded-[2px] space-y-3"
              >
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-obsidian-border">
                  <div>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-mono text-sm font-bold text-paper hover:underline inline-flex items-center gap-1"
                    >
                      <span>{invoice.invoiceNumber}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-ink-ghost" />
                    </Link>
                    <div className="font-serif text-base font-bold text-paper mt-0.5">
                      {client?.companyName || client?.name || 'Unassigned Client'}
                    </div>
                    {client?.companyName && client?.name && (
                      <div className="text-[11px] font-sans text-ink-ghost">Attn: {client.name}</div>
                    )}
                  </div>
                  <StatusStamp status={invoice.status || 'DRAFT'} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-ink-ghost block">
                      Amount Due
                    </span>
                    <span className="font-mono text-base font-bold text-paper">
                      {formatCentsToCurrency(invoice.totalCents, invoice.currency || 'USD')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-ink-ghost block">
                      Due Date
                    </span>
                    <span className="font-mono text-xs text-bone-dark">
                      {formatEditorialDate(invoice.dueDate)}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-obsidian-border flex items-center justify-between gap-2 font-mono text-xs">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="flex-1 text-center py-1.5 px-3 bg-obsidian border border-obsidian-border text-paper font-bold rounded-[1px]"
                  >
                    Open &amp; Edit
                  </Link>

                  <a
                    href={`/api/invoices/${invoice.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    title="Download PDF"
                    className="inline-flex items-center gap-1 py-1.5 px-2.5 bg-obsidian border border-obsidian-border text-bone-dark hover:text-paper rounded-[1px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>

                  <a
                    href={`/view/${invoice.accessToken}`}
                    target="_blank"
                    rel="noreferrer"
                    title="View Client Portal"
                    className="inline-flex items-center gap-1 py-1.5 px-2.5 bg-obsidian border border-obsidian-border text-bone-dark hover:text-status-brass rounded-[1px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Portal</span>
                  </a>

                  <DeleteInvoiceButton
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoiceNumber}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* TABLET, DESKTOP & 4K TV LEDGER TABLE (>= 768px) */}
          <div className="hidden md:block border border-obsidian-border bg-obsidian-light rounded-[2px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-obsidian-border text-[10px] font-mono uppercase tracking-wider text-ink-ghost bg-obsidian/60">
                    <th className="py-3 px-4">Invoice No.</th>
                    <th className="py-3 px-4">Billed to / Client</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Amount Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-obsidian-border text-xs font-sans">
                  {filteredRows.map(({ invoice, client }) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-obsidian-border/30 transition-colors group"
                    >
                      {/* Invoice Number */}
                      <td className="py-4 px-4 font-mono font-bold text-paper">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          <span>{invoice.invoiceNumber}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>

                      {/* Client Name */}
                      <td className="py-4 px-4 text-bone-dark">
                        <div className="font-serif font-bold text-paper">
                          {client?.companyName || client?.name || 'Unassigned Client'}
                        </div>
                        {client?.companyName && client?.name && (
                          <div className="text-[11px] text-ink-ghost">Attn: {client.name}</div>
                        )}
                      </td>

                      {/* Issue Date */}
                      <td className="py-4 px-4 font-mono text-bone-dark">
                        {formatEditorialDate(invoice.issueDate)}
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4 font-mono text-bone-dark">
                        {formatEditorialDate(invoice.dueDate)}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 font-mono font-bold text-paper text-right">
                        {formatCentsToCurrency(invoice.totalCents, invoice.currency || 'USD')}
                      </td>

                      {/* Status Stamp */}
                      <td className="py-4 px-4 text-center">
                        <StatusStamp status={invoice.status || 'DRAFT'} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 font-mono text-[11px]">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="px-2.5 py-1 bg-obsidian border border-obsidian-border hover:border-bone/60 text-paper rounded-[1px] transition-colors"
                          >
                            Edit
                          </Link>

                          <a
                            href={`/api/invoices/${invoice.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            title="Download PDF"
                            className="p-1 text-ink-ghost hover:text-paper transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <a
                            href={`/view/${invoice.accessToken}`}
                            target="_blank"
                            rel="noreferrer"
                            title="View Client Portal"
                            className="p-1 text-ink-ghost hover:text-status-brass transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <DeleteInvoiceButton
                            invoiceId={invoice.id}
                            invoiceNumber={invoice.invoiceNumber}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
