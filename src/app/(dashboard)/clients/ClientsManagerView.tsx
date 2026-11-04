'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Users, Mail, Phone, MapPin, FilePlus, Building2 } from 'lucide-react';
import type { Client } from '@/db/schema';

interface ClientsManagerViewProps {
  initialClients: Client[];
}

export function ClientsManagerView({ initialClients }: ClientsManagerViewProps) {
  const [clientsList, setClientsList] = useState<Client[]>(initialClients);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/clients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, companyName, address, phone }),
      });
      const data = await res.json();
      if (data.client) {
        setClientsList((prev) => [data.client, ...prev]);
        setShowModal(false);
        setName('');
        setEmail('');
        setCompanyName('');
        setAddress('');
        setPhone('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
            Manage client directory records and billing contacts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-obsidian bg-bone hover:bg-paper font-bold rounded-[2px] shadow-md transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Clients Grid */}
      {clientsList.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-obsidian-border rounded-[2px] bg-obsidian-light/30">
          <Users className="w-10 h-10 text-ink-ghost mx-auto mb-3 opacity-50" />
          <h3 className="font-serif text-lg font-bold text-paper mb-1">
            No Clients Enrolled
          </h3>
          <p className="text-xs font-sans text-bone-dark max-w-md mx-auto mb-6">
            Register clients to easily assign deliverables and dispatch encrypted invoice portals.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider text-obsidian bg-bone hover:bg-paper font-semibold rounded-[2px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enroll First Client</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientsList.map((client) => (
            <div
              key={client.id}
              className="bg-obsidian-light border border-obsidian-border hover:border-bone/60 rounded-[2px] p-6 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-paper">
                      {client.companyName || client.name}
                    </h3>
                    {client.companyName && (
                      <span className="text-xs font-sans text-bone-dark block">
                        Attn: {client.name}
                      </span>
                    )}
                  </div>
                  <span className="p-1.5 rounded-[1px] bg-obsidian border border-obsidian-border text-status-brass">
                    <Building2 className="w-4 h-4" />
                  </span>
                </div>

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

              <div className="mt-6 pt-4 border-t border-obsidian-border flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-ghost">
                  Active Entity
                </span>
                <Link
                  href={`/invoices/new`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-status-brass hover:text-paper transition-colors"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>Draft Invoice</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-paper text-ink-primary border border-bone shadow-sheet p-6 rounded-[2px]">
            <h3 className="font-serif text-xl font-bold mb-1 text-ink-primary">
              Enroll New Client Entity
            </h3>
            <p className="text-xs font-sans text-ink-secondary mb-4">
              Enter primary contact information for billing records.
            </p>

            <form onSubmit={handleAddClient} className="space-y-3">
              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Primary Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Sterling"
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="billing@sterlingcorp.com"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Sterling Engineering Associates"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="100 Wall Street, 24th Fl, New York, NY"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (212) 555-0812"
                  className="w-full bg-paper-dark border border-bone px-3 py-1.5 text-xs font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-bone">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-paper bg-ink-primary hover:bg-black rounded-[1px] font-semibold"
                >
                  {loading ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

