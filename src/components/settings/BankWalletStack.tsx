'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Landmark,
  Plus,
  Check,
  Pencil,
  Trash2,
  X,
  Star,
  CreditCard,
} from 'lucide-react';
import type { BankAccount } from '@/db/schema';
import { WALLET_CARD_PALETTES as CARD_PALETTES } from './walletPalettes';

interface BankWalletStackProps {
  initialAccounts: BankAccount[];
  defaultHolderName?: string;
}

interface BankFormState {
  id?: string;
  label: string;
  bankName: string;
  accountHolderName: string;
  routingNumber: string;
  accountNumber: string;
  swiftBic: string;
  paymentNotes: string;
  isDefault: boolean;
}

function maskAccountNumber(accountNum?: string | null): string {
  const clean = (accountNum || '').trim();
  if (!clean) return 'No Account #';
  if (clean.length <= 4) return clean;
  return `•••• ${clean.slice(-4)}`;
}

export function BankWalletStack({
  initialAccounts,
  defaultHolderName = '',
}: BankWalletStackProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const def = initialAccounts.find((a) => a.isDefault === 1) || initialAccounts[0];
    return def?.id ?? null;
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emptyForm = (): BankFormState => ({
    label: '',
    bankName: '',
    accountHolderName: defaultHolderName,
    routingNumber: '',
    accountNumber: '',
    swiftBic: '',
    paymentNotes: '',
    isDefault: accounts.length === 0,
  });

  const [form, setForm] = useState<BankFormState>(emptyForm);

  // Order wallet so non-active cards stack at the top, and the active (default or tapped) card sits in front
  const activeAccount =
    accounts.find((a) => a.id === activeId) ||
    accounts.find((a) => a.isDefault === 1) ||
    accounts[0] ||
    null;

  const stackedBackAccounts = accounts.filter((a) => a.id !== activeAccount?.id);

  const openCreateForm = () => {
    setError(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEditForm = (acc: BankAccount) => {
    setError(null);
    setForm({
      id: acc.id,
      label: acc.label,
      bankName: acc.bankName || '',
      accountHolderName: acc.accountHolderName || '',
      routingNumber: acc.routingNumber || '',
      accountNumber: acc.accountNumber || '',
      swiftBic: acc.swiftBic || '',
      paymentNotes: acc.paymentNotes || '',
      isDefault: acc.isDefault === 1,
    });
    setIsFormOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const isEditing = Boolean(form.id);
      const url = isEditing ? `/api/bank-accounts/${form.id}` : '/api/bank-accounts';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: form.label,
          bankName: form.bankName,
          accountHolderName: form.accountHolderName,
          routingNumber: form.routingNumber,
          accountNumber: form.accountNumber,
          swiftBic: form.swiftBic,
          paymentNotes: form.paymentNotes,
          isDefault: form.isDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save bank account');
      }

      setAccounts(data.bankAccounts || []);
      if (data.bankAccount?.id) {
        setActiveId(data.bankAccount.id);
      }
      setIsFormOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving bank account');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/bank-accounts/${id}/set-default`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set default account');
      setAccounts(data.bankAccounts || []);
      setActiveId(id);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating default account');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete bank account');
      const nextList: BankAccount[] = data.bankAccounts || [];
      setAccounts(nextList);
      const nextDefault = nextList.find((a) => a.isDefault === 1) || nextList[0] || null;
      setActiveId(nextDefault?.id ?? null);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting bank account');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + Add Account CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-mono text-ink-ghost">
          {accounts.length === 0
            ? 'No bank accounts saved yet.'
            : `${accounts.length} saved ${accounts.length === 1 ? 'account' : 'accounts'} • Tap any card to bring to front`}
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-bone text-obsidian hover:bg-paper font-bold rounded-[2px] shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Bank</span>
        </button>
      </div>

      {error && (
        <div className="p-2.5 bg-status-vermilion/10 border border-status-vermilion text-status-vermilion text-xs font-mono rounded-[1px]">
          {error}
        </div>
      )}

      {/* APPLE WALLET STACK */}
      {accounts.length === 0 && !isFormOpen ? (
        <div className="p-6 border border-dashed border-obsidian-border rounded-[4px] bg-obsidian/40 text-center space-y-2">
          <CreditCard className="w-7 h-7 text-ink-ghost mx-auto opacity-60" />
          <p className="text-xs font-sans text-bone-dark">
            Add your first bank or wire account to populate invoice remittance stubs automatically.
          </p>
        </div>
      ) : (
        <div className="relative pt-1">
          {/* Stacked Back Cards (peeking headers: Bank Name + Account Number) */}
          {stackedBackAccounts.map((acc, index) => {
            const palette = CARD_PALETTES[(index + 1) % CARD_PALETTES.length];
            const isDefault = acc.isDefault === 1;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => setActiveId(acc.id)}
                style={{ zIndex: index + 1 }}
                className={`relative w-full text-left px-4 pt-3 pb-5 rounded-t-[10px] border transition-all duration-200 hover:-translate-y-1 cursor-pointer shadow-[0_-2px_8px_rgba(24,25,27,0.08)] ${
                  index > 0 ? '-mt-3' : ''
                } ${palette.bg}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Landmark className={`w-3.5 h-3.5 shrink-0 ${palette.muted}`} />
                    <span className="font-serif text-sm font-bold truncate text-[#18191B]">
                      {acc.bankName || acc.label}
                    </span>
                    {isDefault && (
                      <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest bg-[#D4AF37]/20 text-[#7A5E08] border border-[#D4AF37]/50 rounded-[2px] font-bold shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-xs tabular-nums ${palette.muted}`}>
                      {maskAccountNumber(acc.accountNumber)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Front Active Card (Full Face Details — Living Cotton Paper) */}
          {activeAccount && (
            <div
              style={{ zIndex: stackedBackAccounts.length + 10 }}
              className={`relative rounded-[10px] border p-5 shadow-[0_8px_24px_rgba(24,25,27,0.12)] transition-all duration-200 ${
                stackedBackAccounts.length > 0 ? '-mt-3' : ''
              } ${CARD_PALETTES[0].bg}`}
            >
              {/* Card Top Row: Label, Bank Name & Default Badge */}
              <div className={`flex items-start justify-between gap-3 pb-4 border-b ${CARD_PALETTES[0].divider}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2B4C3F] font-bold">
                      {activeAccount.label}
                    </span>
                    {activeAccount.isDefault === 1 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-[#2B4C3F] text-[#FAF8F5] font-bold rounded-[2px]">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>Default</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#18191B] mt-1 break-words">
                    {activeAccount.bankName || 'Direct Wire Transfer'}
                  </h3>
                  {activeAccount.accountHolderName && (
                    <p className="text-xs font-sans text-[#5C5E62] mt-0.5 break-words">
                      {activeAccount.accountHolderName}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {activeAccount.isDefault !== 1 && (
                    <button
                      type="button"
                      disabled={busyId === activeAccount.id}
                      onClick={() => handleSetDefault(activeAccount.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-[2px] font-semibold transition-colors ${CARD_PALETTES[0].actionBtn}`}
                    >
                      <Check className="w-3 h-3" />
                      <span>Set Default</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditForm(activeAccount)}
                    title="Edit bank account"
                    className={`p-1.5 rounded-[2px] transition-colors ${CARD_PALETTES[0].iconBtn}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={busyId === activeAccount.id}
                    onClick={() => handleDelete(activeAccount.id)}
                    title="Delete bank account"
                    className={`p-1.5 rounded-[2px] transition-colors ${CARD_PALETTES[0].deleteBtn}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Wire Coordinates Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                <div className="min-w-0">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#5C5E62] block">
                    Account No.
                  </span>
                  <span className="font-mono font-semibold text-[#18191B] [overflow-wrap:anywhere] block mt-0.5">
                    {activeAccount.accountNumber || '—'}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#5C5E62] block">
                    Routing / ABA
                  </span>
                  <span className="font-mono font-semibold text-[#18191B] [overflow-wrap:anywhere] block mt-0.5">
                    {activeAccount.routingNumber || '—'}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#5C5E62] block">
                    SWIFT / BIC
                  </span>
                  <span className="font-mono font-semibold text-[#18191B] [overflow-wrap:anywhere] block mt-0.5">
                    {activeAccount.swiftBic || '—'}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#5C5E62] block">
                    Payment Memo
                  </span>
                  <span className="font-sans text-[#5C5E62] [overflow-wrap:anywhere] block mt-0.5">
                    {activeAccount.paymentNotes || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INLINE ADD / EDIT BANK ACCOUNT DRAWER */}
      {isFormOpen && (
        <div className="p-4 sm:p-5 bg-obsidian border border-obsidian-border rounded-[2px] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-obsidian-border">
            <h4 className="font-serif text-base font-bold text-paper">
              {form.id ? 'Edit Bank Account' : 'Add New Bank / Wire Account'}
            </h4>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1 text-ink-ghost hover:text-paper"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Account Label / Nickname *
              </label>
              <input
                type="text"
                required
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Primary USD Checking, EUR SEPA Wire"
                className="w-full bg-obsidian-light border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone"
              />
            </div>

            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Beneficiary Bank Name
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                placeholder="e.g. JPMorgan Chase"
                className="w-full bg-obsidian-light border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone"
              />
            </div>

            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={form.accountHolderName}
                onChange={(e) => setForm((p) => ({ ...p, accountHolderName: e.target.value }))}
                className="w-full bg-obsidian-light border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone"
              />
            </div>

            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Routing Number (ABA)
              </label>
              <input
                type="text"
                value={form.routingNumber}
                onChange={(e) => setForm((p) => ({ ...p, routingNumber: e.target.value }))}
                className="w-full bg-obsidian-light border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone"
              />
            </div>

            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Account Number / IBAN
              </label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                className="w-full bg-obsidian-light border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone"
              />
            </div>

            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                SWIFT / BIC
              </label>
              <input
                type="text"
                value={form.swiftBic}
                onChange={(e) => setForm((p) => ({ ...p, swiftBic: e.target.value }))}
                className="w-full bg-obsidian-light border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone"
              />
            </div>

            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Payment Memo Reference
              </label>
              <input
                type="text"
                value={form.paymentNotes}
                onChange={(e) => setForm((p) => ({ ...p, paymentNotes: e.target.value }))}
                className="w-full bg-obsidian-light border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-obsidian-border">
              <label className="inline-flex items-center gap-2 text-xs font-sans text-bone-dark cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="accent-[#D4AF37]"
                />
                <span>Set as default bank account for new invoices</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-ink-ghost hover:text-paper"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || !form.label.trim()}
                  onClick={handleSaveAccount}
                  className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-bone text-obsidian hover:bg-paper font-bold rounded-[1px] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : form.id ? 'Update Bank' : 'Save Bank'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
