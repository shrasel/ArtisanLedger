'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Plus,
  Users,
  Mail,
  Phone,
  MapPin,
  FilePlus,
  Building2,
  Pencil,
  Star,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import type { Client } from '@/db/schema';

interface ClientsManagerViewProps {
  initialClients: Client[];
  initialDefaultClientId?: string | null;
}

export function ClientsManagerView({
  initialClients,
  initialDefaultClientId,
}: ClientsManagerViewProps) {
  const [clientsList, setClientsList] = useState<Client[]>(initialClients);
  const [defaultClientId, setDefaultClientId] = useState<string | null>(
    initialDefaultClientId || initialClients.find((c) => c.isDefault === 1)?.id || null
  );

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addCompany, setAddCompany] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addIsDefault, setAddIsDefault] = useState(false);

  // Edit Modal State
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsDefault, setEditIsDefault] = useState(false);

  const [loading, setLoading] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setEditingClient(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Open Edit Modal
  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setEditName(client.name || '');
    setEditEmail(client.email || '');
    setEditCompany(client.companyName || '');
    setEditAddress(client.address || '');
    setEditPhone(client.phone || '');
    setEditIsDefault(client.id === defaultClientId || client.isDefault === 1);
  };

  // Submit Edit Client
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editName || !editEmail) return;

    setLoading(true);
    try {
      const res = await fetch('/api/clients/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingClient.id,
          name: editName,
          email: editEmail,
          companyName: editCompany,
          address: editAddress,
          phone: editPhone,
          isDefault: editIsDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update client');

      if (data.client) {
        setClientsList((prev) =>
          prev.map((c) =>
            c.id === data.client.id
              ? { ...data.client, isDefault: editIsDefault ? 1 : 0 }
              : editIsDefault
              ? { ...c, isDefault: 0 }
              : c
          )
        );

        if (editIsDefault) {
          setDefaultClientId(data.client.id);
        } else if (defaultClientId === editingClient.id) {
          setDefaultClientId(null);
        }

        setEditingClient(null);
        showFeedback(`Client "${data.client.name}" successfully updated.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating client';
      showFeedback(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit Add Client
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addEmail) return;

    setLoading(true);
    try {
      const res = await fetch('/api/clients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          companyName: addCompany,
          address: addAddress,
          phone: addPhone,
          isDefault: addIsDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll client');

      if (data.client) {
        setClientsList((prev) => [
          data.client,
          ...prev.map((c) => (addIsDefault ? { ...c, isDefault: 0 } : c)),
        ]);
        if (addIsDefault || clientsList.length === 0) {
          setDefaultClientId(data.client.id);
        }
        setShowAddModal(false);
        setAddName('');
        setAddEmail('');
        setAddCompany('');
        setAddAddress('');
        setAddPhone('');
        setAddIsDefault(false);
        showFeedback(`Client "${data.client.name}" successfully enrolled.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating client';
      showFeedback(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Set Default Client
  const handleSetDefault = async (clientId: string, clientName: string) => {
    setSettingDefaultId(clientId);
    try {
      const res = await fetch('/api/clients/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set default');

      setDefaultClientId(clientId);
      setClientsList((prev) =>
        prev.map((c) => ({
          ...c,
          isDefault: c.id === clientId ? 1 : 0,
        }))
      );
      showFeedback(`"${clientName}" set as default client for new invoices.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error setting default';
      showFeedback(msg, 'error');
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-obsidian-border">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-ghost block mb-1">
            CLIENT DIRECTORY &bull; PRACTITIONER NETWORK
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-paper">
            Client Accounts & Entities
          </h1>
          <p className="text-xs font-sans text-bone-dark mt-1">
            Manage client directory records, edit contact deliverables, and set default billing recipients.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-obsidian bg-bone hover:bg-paper font-bold rounded-[2px] shadow-md transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`p-3 rounded-[2px] text-xs font-mono flex items-center justify-between border animate-in fade-in slide-in-from-top-1 ${
            notification.type === 'success'
              ? 'bg-status-hunter/10 border-status-hunter text-status-hunter'
              : 'bg-status-vermilion/10 border-status-vermilion text-status-vermilion'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs hover:opacity-80 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Clients Grid */}
      {clientsList.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-obsidian-border rounded-[2px] bg-obsidian-light/30">
          <Users className="w-10 h-10 text-ink-ghost mx-auto mb-3 opacity-50" />
          <h3 className="font-serif text-lg font-bold text-paper mb-1">
            No Clients Enrolled
          </h3>
          <p className="text-xs font-sans text-bone-dark max-w-md mx-auto mb-6">
            Register clients to easily assign deliverables, set default recipients, and dispatch encrypted invoice portals.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider text-obsidian bg-bone hover:bg-paper font-semibold rounded-[2px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enroll First Client</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientsList.map((client) => {
            const isDefault = client.id === defaultClientId || client.isDefault === 1;

            return (
              <div
                key={client.id}
                className={`bg-obsidian-light border rounded-[2px] p-6 transition-all flex flex-col justify-between relative group ${
                  isDefault
                    ? 'border-status-hunter/80 shadow-[0_0_0_1px_rgba(43,76,63,0.3)]'
                    : 'border-obsidian-border hover:border-bone/60'
                }`}
              >
                <div>
                  {/* Top Bar on Card: Title & Default Stamp */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="pr-2">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-serif text-xl font-bold text-paper">
                          {client.companyName || client.name}
                        </h3>
                        {isDefault && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[1px] bg-status-hunter/15 border border-status-hunter text-[9px] font-mono uppercase tracking-wider text-status-hunter font-bold"
                            title="Default client for newly originated invoices"
                          >
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>DEFAULT CLIENT</span>
                          </span>
                        )}
                      </div>
                      {client.companyName && (
                        <span className="text-xs font-sans text-bone-dark block">
                          Attn: {client.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(client)}
                        title="Edit Client Information"
                        className="p-1.5 rounded-[1px] bg-obsidian border border-obsidian-border text-ink-ghost hover:text-paper hover:border-bone/60 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <span className="p-1.5 rounded-[1px] bg-obsidian border border-obsidian-border text-status-brass">
                        <Building2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-2 text-xs font-sans text-bone-dark mt-4 border-t border-obsidian-border pt-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-ink-ghost shrink-0" />
                      <span className="font-mono text-paper truncate">{client.email}</span>
                    </div>

                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-ink-ghost shrink-0" />
                        <span className="font-mono">{client.phone}</span>
                      </div>
                    )}

                    {client.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-ink-ghost shrink-0 mt-0.5" />
                        <span className="text-ink-ghost leading-tight">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-6 pt-4 border-t border-obsidian-border flex items-center justify-between gap-2">
                  <div>
                    {!isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(client.id, client.name)}
                        disabled={settingDefaultId === client.id}
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-ghost hover:text-status-hunter transition-colors"
                      >
                        {settingDefaultId === client.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Setting...</span>
                          </>
                        ) : (
                          <>
                            <Star className="w-3 h-3" />
                            <span>Set as Default</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-status-hunter font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Active Default</span>
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/invoices/new?clientId=${client.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-status-brass hover:text-paper transition-colors"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Draft Invoice</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT CLIENT MODAL */}
      {editingClient && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 backdrop-blur-sm p-4 overflow-y-auto"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="w-full max-w-md bg-paper text-ink-primary border border-bone shadow-sheet p-6 rounded-[2px] relative">
            <div className="flex items-start justify-between pb-3 mb-4 border-b border-bone">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-ink-secondary block mb-0.5">
                  CLIENT REGISTRY &bull; UPDATE ENTITY
                </span>
                <h2 id="edit-dialog-title" className="font-serif text-2xl font-bold text-ink-primary">
                  Edit Client Profile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="p-1 text-ink-secondary hover:text-ink-primary transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Primary Contact Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Billing Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="sjenkins@metrostudio.com"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  placeholder="Metro Studio Architecture"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Billing / Office Address
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="450 Broadway, Suite 800, New York, NY"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Direct Phone
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+1 (212) 555-0144"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              {/* Set as Default Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-2.5 bg-paper-dark border border-bone rounded-[1px] cursor-pointer hover:bg-bone/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={editIsDefault}
                    onChange={(e) => setEditIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded-xs border-bone text-status-hunter focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-sans font-bold text-ink-primary block leading-none">
                      Set as Default Client
                    </span>
                    <span className="text-[10px] font-sans text-ink-secondary block mt-0.5">
                      Automatically selected when drafting newly originated invoices.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-bone">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-paper bg-ink-primary hover:bg-black rounded-[1px] font-semibold transition-all shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 backdrop-blur-sm p-4 overflow-y-auto"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="w-full max-w-md bg-paper text-ink-primary border border-bone shadow-sheet p-6 rounded-[2px] relative">
            <div className="flex items-start justify-between pb-3 mb-4 border-b border-bone">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-ink-secondary block mb-0.5">
                  CLIENT REGISTRY &bull; ENROLL ENTITY
                </span>
                <h2 id="add-dialog-title" className="font-serif text-2xl font-bold text-ink-primary">
                  Enroll New Client
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-ink-secondary hover:text-ink-primary transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Primary Contact Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Billing Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="billing@metrostudio.com"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={addCompany}
                  onChange={(e) => setAddCompany(e.target.value)}
                  placeholder="Metro Studio Architecture"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={addAddress}
                  onChange={(e) => setAddAddress(e.target.value)}
                  placeholder="450 Broadway, Suite 800, New York, NY"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="+1 (212) 555-0144"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              {/* Set as Default Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-2.5 bg-paper-dark border border-bone rounded-[1px] cursor-pointer hover:bg-bone/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={addIsDefault}
                    onChange={(e) => setAddIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded-xs border-bone text-status-hunter focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-sans font-bold text-ink-primary block leading-none">
                      Set as Default Client
                    </span>
                    <span className="text-[10px] font-sans text-ink-secondary block mt-0.5">
                      Automatically selected when drafting newly originated invoices.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-bone">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-paper bg-ink-primary hover:bg-black rounded-[1px] font-semibold transition-all shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <span>Save Client</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
