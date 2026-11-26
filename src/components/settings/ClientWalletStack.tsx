'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Check,
  Pencil,
  Trash2,
  X,
  Star,
  FilePlus,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import type { Client } from '@/db/schema';
import { WALLET_CARD_PALETTES } from './walletPalettes';

interface ClientWalletStackProps {
  initialClients: Client[];
  initialDefaultClientId?: string | null;
}

interface ClientFormState {
  id?: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

export function ClientWalletStack({
  initialClients,
  initialDefaultClientId,
}: ClientWalletStackProps) {
  const router = useRouter();
  const [clientsList, setClientsList] = useState<Client[]>(initialClients);
  const [defaultClientId, setDefaultClientId] = useState<string | null>(
    initialDefaultClientId || initialClients.find((c) => c.isDefault === 1)?.id || null
  );
  const [activeId, setActiveId] = useState<string | null>(() => {
    const def =
      initialClients.find((c) => c.id === initialDefaultClientId || c.isDefault === 1) ||
      initialClients[0];
    return def?.id ?? null;
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [cascadeInvoiceCount, setCascadeInvoiceCount] = useState<number>(0);

  const emptyForm = (): ClientFormState => ({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    isDefault: clientsList.length === 0,
  });

  const [form, setForm] = useState<ClientFormState>(emptyForm);

  // Order wallet so non-active cards stack above, and active (default or tapped) card sits in front
  const activeClient =
    clientsList.find((c) => c.id === activeId) ||
    clientsList.find((c) => c.id === defaultClientId || c.isDefault === 1) ||
    clientsList[0] ||
    null;

  const stackedBackClients = clientsList.filter((c) => c.id !== activeClient?.id);

  const openCreateForm = () => {
    setError(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEditForm = (client: Client) => {
    setError(null);
    setForm({
      id: client.id,
      name: client.name || '',
      companyName: client.companyName || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      isDefault: client.id === defaultClientId || client.isDefault === 1,
    });
    setIsFormOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const isEditing = Boolean(form.id);
      const url = isEditing ? '/api/clients/update' : '/api/clients/create';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing ? { id: form.id } : {}),
          name: form.name.trim(),
          email: form.email.trim(),
          companyName: form.companyName.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          isDefault: form.isDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save client');

      if (data.client) {
        if (isEditing) {
          setClientsList((prev) =>
            prev.map((c) =>
              c.id === data.client.id
                ? { ...data.client, isDefault: form.isDefault ? 1 : 0 }
                : form.isDefault
                ? { ...c, isDefault: 0 }
                : c
            )
          );
          if (form.isDefault) {
            setDefaultClientId(data.client.id);
          } else if (defaultClientId === form.id) {
            setDefaultClientId(null);
          }
        } else {
          setClientsList((prev) => [
            { ...data.client, isDefault: form.isDefault ? 1 : 0 },
            ...(form.isDefault ? prev.map((c) => ({ ...c, isDefault: 0 })) : prev),
          ]);
          if (form.isDefault) {
            setDefaultClientId(data.client.id);
          }
        }
        setActiveId(data.client.id);
        setIsFormOpen(false);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving client');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (clientId: string) => {
    setBusyId(clientId);
    setError(null);
    try {
      const res = await fetch('/api/clients/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set default client');

      setDefaultClientId(clientId);
      setClientsList((prev) =>
        prev.map((c) => ({ ...c, isDefault: c.id === clientId ? 1 : 0 }))
      );
      setActiveId(clientId);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating default client');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteClient = async (cascade = false) => {
    if (!deletingClient) return;
    setBusyId(deletingClient.id);
    setError(null);
    try {
      const res = await fetch('/api/clients/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: deletingClient.id, cascade }),
      });
      const data = await res.json();

      if (res.status === 409 && data.requiresCascade) {
        setCascadeInvoiceCount(data.invoiceCount || 1);
        setBusyId(null);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to delete client');

      const nextList = clientsList.filter((c) => c.id !== deletingClient.id);
      setClientsList(nextList);
      if (defaultClientId === deletingClient.id) {
        setDefaultClientId(null);
      }
      const nextActive =
        nextList.find((c) => c.id === defaultClientId || c.isDefault === 1) || nextList[0] || null;
      setActiveId(nextActive?.id ?? null);
      setDeletingClient(null);
      setCascadeInvoiceCount(0);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting client');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + Add Client CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-mono text-ink-ghost">
          {clientsList.length === 0
            ? 'No clients saved yet.'
            : `${clientsList.length} saved ${clientsList.length === 1 ? 'client' : 'clients'} • Tap any card to bring to front`}
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-bone text-obsidian hover:bg-paper font-bold rounded-[2px] shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Client</span>
        </button>
      </div>

      {error && (
        <div className="p-2.5 bg-status-vermilion/10 border border-status-vermilion text-status-vermilion text-xs font-mono rounded-[1px]">
          {error}
        </div>
      )}

      {/* APPLE WALLET STACK */}
      {clientsList.length === 0 && !isFormOpen ? (
        <div className="p-6 border border-dashed border-obsidian-border rounded-[4px] bg-obsidian/40 text-center space-y-2">
          <Users className="w-7 h-7 text-ink-ghost mx-auto opacity-60" />
          <p className="text-xs font-sans text-bone-dark">
            Add your first client or studio entity to auto-populate invoice recipients.
          </p>
        </div>
      ) : (
        <div className="relative pt-1">
          {/* Stacked Back Cards (peeking headers: Company/Client Name + Email) */}
          {stackedBackClients.map((client, index) => {
            const palette = WALLET_CARD_PALETTES[(index + 1) % WALLET_CARD_PALETTES.length];
            const isDefault = client.id === defaultClientId || client.isDefault === 1;
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => setActiveId(client.id)}
                style={{ zIndex: index + 1 }}
                className={`relative w-full text-left px-4 pt-3 pb-5 rounded-t-[10px] border transition-all duration-200 hover:-translate-y-1 cursor-pointer shadow-[0_-2px_8px_rgba(24,25,27,0.08)] ${
                  index > 0 ? '-mt-3' : ''
                } ${palette.bg}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className={`w-3.5 h-3.5 shrink-0 ${palette.muted}`} />
                    <span dir="auto" className="font-serif text-sm font-bold truncate text-[#18191B]">
                      {client.companyName || client.name}
                    </span>
                    {isDefault && (
                      <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest bg-[#D4AF37]/20 text-[#7A5E08] border border-[#D4AF37]/50 rounded-[2px] font-bold shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  <span className={`font-mono text-[11px] truncate max-w-[48%] ${palette.muted}`}>
                    {client.email}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Front Active Card (Full Face Details — Living Cotton Paper) */}
          {activeClient && (
            <div
              style={{ zIndex: stackedBackClients.length + 10 }}
              className={`relative rounded-[10px] border p-5 shadow-[0_8px_24px_rgba(24,25,27,0.12)] transition-all duration-200 ${
                stackedBackClients.length > 0 ? '-mt-3' : ''
              } ${WALLET_CARD_PALETTES[0].bg}`}
            >
              {/* Card Top Row */}
              <div
                className={`flex items-start justify-between gap-3 pb-4 border-b ${WALLET_CARD_PALETTES[0].divider}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2B4C3F] font-bold">
                      {activeClient.companyName ? 'Organization / Studio' : 'Individual Client'}
                    </span>
                    {(activeClient.id === defaultClientId || activeClient.isDefault === 1) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-[#2B4C3F] text-[#FAF8F5] font-bold rounded-[2px]">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>Default</span>
                      </span>
                    )}
                  </div>
                  <h3
                    dir="auto"
                    className="font-serif text-lg sm:text-xl font-bold text-[#18191B] mt-1 break-words"
                  >
                    {activeClient.companyName || activeClient.name}
                  </h3>
                  {activeClient.companyName && (
                    <p dir="auto" className="text-xs font-sans text-[#5C5E62] mt-0.5 break-words">
                      Attn: {activeClient.name}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {activeClient.id !== defaultClientId && activeClient.isDefault !== 1 && (
                    <button
                      type="button"
                      disabled={busyId === activeClient.id}
                      onClick={() => handleSetDefault(activeClient.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-[2px] font-semibold transition-colors ${WALLET_CARD_PALETTES[0].actionBtn}`}
                    >
                      <Check className="w-3 h-3" />
                      <span>Set Default</span>
                    </button>
                  )}
                  <Link
                    href={`/invoices/new?clientId=${activeClient.id}`}
                    title="Originate invoice for client"
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded-[2px] transition-colors ${WALLET_CARD_PALETTES[0].iconBtn}`}
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Invoice</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEditForm(activeClient)}
                    title="Edit client"
                    className={`p-1.5 rounded-[2px] transition-colors ${WALLET_CARD_PALETTES[0].iconBtn}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={busyId === activeClient.id}
                    onClick={() => {
                      setDeletingClient(activeClient);
                      setCascadeInvoiceCount(0);
                    }}
                    title="Delete client"
                    className={`p-1.5 rounded-[2px] transition-colors ${WALLET_CARD_PALETTES[0].deleteBtn}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Client Contact Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
                <div className="min-w-0">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#5C5E62] flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>Email</span>
                  </span>
                  <span className="font-mono font-semibold text-[#18191B] [overflow-wrap:anywhere] block mt-0.5">
                    {activeClient.email}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#5C5E62] flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>Phone</span>
                  </span>
                  <span className="font-mono font-semibold text-[#18191B] [overflow-wrap:anywhere] block mt-0.5">
                    {activeClient.phone || '—'}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#5C5E62] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Billing Address</span>
                  </span>
                  <span dir="auto" className="font-sans text-[#5C5E62] break-words block mt-0.5">
                    {activeClient.address || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INLINE ADD / EDIT CLIENT DRAWER */}
      {isFormOpen && (
        <div className="p-4 sm:p-5 bg-obsidian border border-obsidian-border rounded-[2px] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-obsidian-border">
            <h4 className="font-serif text-base font-bold text-paper">
              {form.id ? 'Edit Client Entity' : 'Add New Client Entity'}
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
            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Primary Contact Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-obsidian-light border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone"
              />
            </div>

            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Billing Email Address *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="billing@studio.com"
                className="w-full bg-obsidian-light border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone"
              />
            </div>

            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Company / Studio Name
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                placeholder="e.g. Metro Studio Architecture"
                className="w-full bg-obsidian-light border border-obsidian-border px-3 py-2 text-xs font-sans text-paper rounded-[1px] focus:outline-none focus:border-bone"
              />
            </div>

            <div>
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 (212) 555-0144"
                className="w-full bg-obsidian-light border border-obsidian-border px-3 py-2 text-xs font-mono text-paper rounded-[1px] focus:outline-none focus:border-bone"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-ghost block mb-1">
                Physical / Billing Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="450 Broadway, Suite 800, New York, NY 10013"
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
                <span>Set as default billing client for new invoices</span>
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
                  disabled={saving || !form.name.trim() || !form.email.trim()}
                  onClick={handleSaveClient}
                  className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-bone text-obsidian hover:bg-paper font-bold rounded-[1px] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : form.id ? 'Update Client' : 'Save Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE / CASCADE CONFIRMATION MODAL */}
      {deletingClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-paper text-ink-primary border border-bone shadow-sheet rounded-[2px] p-6 relative">
            <div className="border-b border-bone pb-3 mb-4">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-status-vermilion block">
                {cascadeInvoiceCount > 0 ? 'CASCADE DELETION WARNING' : 'CLIENT EXPUNGEMENT'}
              </span>
              <h3 className="font-serif text-xl font-bold text-ink-primary">
                Remove {deletingClient.companyName || deletingClient.name}?
              </h3>
            </div>

            {cascadeInvoiceCount > 0 ? (
              <div className="p-3 mb-4 bg-status-vermilion/10 border border-status-vermilion/40 rounded-[1px] flex items-start gap-2.5 text-xs font-sans text-status-vermilion">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  This client has <strong>{cascadeInvoiceCount}</strong> linked invoice(s).
                  Proceeding will permanently delete this client and all associated invoices.
                </div>
              </div>
            ) : (
              <p className="text-xs font-sans text-ink-secondary leading-relaxed mb-6">
                This will permanently remove{' '}
                <span className="font-bold text-ink-primary">
                  {deletingClient.companyName || deletingClient.name}
                </span>{' '}
                from your client directory.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-bone">
              <button
                type="button"
                onClick={() => {
                  setDeletingClient(null);
                  setCascadeInvoiceCount(0);
                }}
                className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === deletingClient.id}
                onClick={() => handleDeleteClient(cascadeInvoiceCount > 0)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-status-vermilion text-paper hover:opacity-90 rounded-[1px] font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {busyId === deletingClient.id
                    ? 'Removing...'
                    : cascadeInvoiceCount > 0
                    ? 'Delete Client & Invoices'
                    : 'Delete Client'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
