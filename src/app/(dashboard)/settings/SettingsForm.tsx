'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Landmark, Settings2, Save, Check, Loader2, FileText, User } from 'lucide-react';
import type { Organization, Client } from '@/db/schema';
import { parsePercentToBasisPoints, formatBasisPointsToPercent } from '@/lib/utils';

interface SettingsFormProps {
  organization: Organization;
  clientsList?: Client[];
}

export function SettingsForm({ organization, clientsList = [] }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    entityType: (organization.entityType as 'INDIVIDUAL' | 'FIRM') || 'FIRM',
    companyName: organization.companyName || '',
    principalName: organization.principalName || '',
    letterheadTitle: organization.letterheadTitle || organization.companyName || '',
    letterheadTagline:
      organization.letterheadTagline ?? 'ARCHIVAL FINANCIAL DOCUMENT • CERTIFIED LEDGER',
    taxId: organization.taxId || '',
    email: organization.email || '',
    phone: organization.phone || '',
    addressLine: organization.addressLine || '',
    city: organization.city || '',
    state: organization.state || '',
    postalCode: organization.postalCode || '',
    country: organization.country || 'US',
    defaultCurrency: organization.defaultCurrency || 'USD',
    defaultTerms: organization.defaultTerms || 'NET_30',
    defaultClientId: organization.defaultClientId || '',
    invoicePrefix: organization.invoicePrefix || 'INV-',
    nextInvoiceNumber: organization.nextInvoiceNumber || 1001,
    defaultTaxPercent: ((organization.defaultTaxRateBasisPoints || 0) / 100).toString(),
    bankName: organization.bankName || '',
    accountHolderName: organization.accountHolderName || '',
    routingNumber: organization.routingNumber || '',
    accountNumber: organization.accountNumber || '',
    swiftBic: organization.swiftBic || '',
    paymentNotes: organization.paymentNotes || '',
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        ...formData,
        defaultTaxRateBasisPoints: parsePercentToBasisPoints(formData.defaultTaxPercent),
      };

      const res = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to update settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating settings';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Notifications */}
      {success && (
        <div className="p-3 bg-status-hunter/10 border border-status-hunter text-status-hunter text-xs font-mono rounded-[1px] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Organization settings and wire instructions successfully updated.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-status-vermilion/10 border border-status-vermilion text-status-vermilion text-xs font-mono rounded-[1px]">
          {error}
        </div>
      )}

      {/* SECTION 1: FIRM ENTITY & LEGAL IDENTITY */}
      <div className="bg-obsidian-light border border-obsidian-border rounded-[2px] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-obsidian-border text-paper">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-status-brass" />
            <div>
              <h2 className="font-serif text-lg font-bold leading-none">
                Firm Entity & Legal Identity
              </h2>
              <span className="text-[10px] font-sans text-bone-dark block mt-1">
                Defines the legal Issuer / Creditor record on invoices (Individual Practitioner or Registered Firm).
              </span>
            </div>
          </div>

          {/* Entity Classification Selector */}
          <div className="inline-flex bg-obsidian border border-obsidian-border rounded-[2px] p-0.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleChange('entityType', 'INDIVIDUAL')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-[1px] transition-colors ${
                formData.entityType === 'INDIVIDUAL'
                  ? 'bg-bone text-obsidian font-bold shadow-xs'
                  : 'text-ink-ghost hover:text-paper'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Individual</span>
            </button>
            <button
              type="button"
              onClick={() => handleChange('entityType', 'FIRM')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-[1px] transition-colors ${
                formData.entityType === 'FIRM'
                  ? 'bg-bone text-obsidian font-bold shadow-xs'
                  : 'text-ink-ghost hover:text-paper'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Firm / LLC</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              {formData.entityType === 'INDIVIDUAL'
                ? 'Practitioner Full Legal Name *'
                : 'Principal / Authorized Representative'}
            </label>
            <input
              type="text"
              required={formData.entityType === 'INDIVIDUAL'}
              placeholder="e.g. Md Shahjahan Rasel"
              value={formData.principalName}
              onChange={(e) => handleChange('principalName', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-sm font-serif font-bold text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              {formData.entityType === 'FIRM'
                ? 'Registered Firm / Company Name *'
                : 'Studio / Trade Name (DBA — Optional)'}
            </label>
            <input
              type="text"
              required={formData.entityType === 'FIRM'}
              placeholder="e.g. Atelier Vance Architecture LLC"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-sm font-serif font-bold text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              {formData.entityType === 'INDIVIDUAL' ? 'Tax ID / SSN / EIN' : 'Corporate Tax ID / EIN'}
            </label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => handleChange('taxId', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Practice Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Telephone
              </label>
              <input
                type="text"
                placeholder="+1 (212) 555-0188"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Physical Address Line
            </label>
            <input
              type="text"
              value={formData.addressLine}
              onChange={(e) => handleChange('addressLine', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: DOCUMENT LETTERHEAD & MASTHEAD */}
      <div className="bg-obsidian-light border border-obsidian-border rounded-[2px] p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-obsidian-border text-paper">
          <FileText className="w-4 h-4 text-status-brass" />
          <div>
            <h2 className="font-serif text-lg font-bold leading-none">
              Document Letterhead & Masthead
            </h2>
            <span className="text-[10px] font-sans text-bone-dark block mt-1">
              Configures the top masthead title and tagline printed across the Living Invoice Sheet and US Letter PDF.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Letterhead Title (Masthead Heading)
            </label>
            <input
              type="text"
              placeholder={
                formData.companyName ||
                formData.principalName ||
                "The Architect's Ledger"
              }
              value={formData.letterheadTitle}
              onChange={(e) => handleChange('letterheadTitle', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-sm font-serif font-bold text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
            <span className="text-[10px] font-sans text-ink-ghost block mt-1">
              Displayed in large serif typography at the top of the document.
            </span>
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Letterhead Tagline / Subtitle
            </label>
            <input
              type="text"
              placeholder="e.g. ARCHIVAL FINANCIAL DOCUMENT • CERTIFIED LEDGER"
              value={formData.letterheadTagline}
              onChange={(e) => handleChange('letterheadTagline', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
            <span className="text-[10px] font-sans text-ink-ghost block mt-1">
              Displayed in tracked uppercase small-caps alongside the letterhead title.
            </span>
          </div>
        </div>

        {/* Live Cotton Paper Masthead Preview */}
        <div className="p-4 bg-paper text-ink-primary border border-bone rounded-[2px] shadow-xs">
          <div className="text-[9px] font-mono uppercase tracking-widest text-ink-ghost mb-2">
            LIVE LETTERHEAD PREVIEW (ARCHIVAL PAPER)
          </div>
          <div className="border-b-2 border-ink-primary pb-3">
            {formData.letterheadTagline && (
              <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-ink-secondary block mb-0.5">
                {formData.letterheadTagline}
              </span>
            )}
            <div className="font-serif text-2xl font-bold tracking-tight text-ink-primary">
              {formData.letterheadTitle ||
                formData.companyName ||
                formData.principalName ||
                "The Architect's Ledger"}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: INVOICE DEFAULTS */}
      <div className="bg-obsidian-light border border-obsidian-border rounded-[2px] p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-obsidian-border text-paper">
          <Settings2 className="w-4 h-4 text-status-brass" />
          <h2 className="font-serif text-lg font-bold">Document Standards & Defaults</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Ledger Currency
            </label>
            <select
              value={formData.defaultCurrency}
              onChange={(e) => handleChange('defaultCurrency', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Invoice Prefix
            </label>
            <input
              type="text"
              value={formData.invoicePrefix}
              onChange={(e) => handleChange('invoicePrefix', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Next Invoice Number
            </label>
            <input
              type="number"
              value={formData.nextInvoiceNumber}
              onChange={(e) => handleChange('nextInvoiceNumber', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Default Terms
            </label>
            <select
              value={formData.defaultTerms}
              onChange={(e) => handleChange('defaultTerms', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            >
              <option value="DUE_ON_RECEIPT">Due on Receipt</option>
              <option value="NET_15">Net 15 Days</option>
              <option value="NET_30">Net 30 Days</option>
              <option value="NET_60">Net 60 Days</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Default Billing Client
            </label>
            <select
              value={formData.defaultClientId}
              onChange={(e) => handleChange('defaultClientId', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            >
              <option value="">(None - select on creation)</option>
              {clientsList.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.companyName ? `${client.companyName} (${client.name})` : client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Default Tax Rate (%)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={formData.defaultTaxPercent}
                onChange={(e) => handleChange('defaultTaxPercent', e.target.value)}
                placeholder="0.00"
                className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
              />
              <span className="text-xs font-mono text-bone-dark">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: WIRE REMITTANCE INSTRUCTIONS */}
      <div className="bg-obsidian-light border border-obsidian-border rounded-[2px] p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-obsidian-border text-paper">
          <Landmark className="w-4 h-4 text-status-brass" />
          <h2 className="font-serif text-lg font-bold">Banking & Wire Remittance Stub</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Beneficiary Bank Name
            </label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              placeholder="e.g. JPMorgan Chase"
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Account Holder Name
            </label>
            <input
              type="text"
              value={formData.accountHolderName}
              onChange={(e) => handleChange('accountHolderName', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Routing Number (ABA)
            </label>
            <input
              type="text"
              value={formData.routingNumber}
              onChange={(e) => handleChange('routingNumber', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Account Number
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              SWIFT / BIC (International Wire)
            </label>
            <input
              type="text"
              value={formData.swiftBic}
              onChange={(e) => handleChange('swiftBic', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Payment Memo Reference Instructions
            </label>
            <input
              type="text"
              value={formData.paymentNotes}
              onChange={(e) => handleChange('paymentNotes', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-mono uppercase tracking-widest text-obsidian bg-bone hover:bg-paper font-bold rounded-[2px] shadow-md transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating Ledger Standards...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Ledger Configurations</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

