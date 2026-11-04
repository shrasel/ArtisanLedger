'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Landmark, Settings2, Save, Check, Loader2 } from 'lucide-react';
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
    companyName: organization.companyName || '',
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

      {/* SECTION 1: FIRM ENTITY */}
      <div className="bg-obsidian-light border border-obsidian-border rounded-[2px] p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-obsidian-border text-paper">
          <Building2 className="w-4 h-4 text-status-brass" />
          <h2 className="font-serif text-lg font-bold">Firm Entity & Letterhead</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Company / Practice Name
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-sm font-serif font-bold text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
              Tax ID / EIN
            </label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => handleChange('taxId', e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone transition-colors"
            />
          </div>

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

