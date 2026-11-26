'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Coins, Users, Landmark } from 'lucide-react';
import type { CurrencyBucket, EntityCurrencyBucket } from '@/lib/ledgerAggregation';
import { formatCentsToCurrency } from '@/lib/utils';

interface LedgerBreakdownStripProps {
  currencyBuckets: CurrencyBucket[];
  clientBuckets: EntityCurrencyBucket[];
  bankBuckets: EntityCurrencyBucket[];
  defaultExpanded?: boolean;
}

type BreakdownTab = 'currency' | 'client' | 'bank';

export function LedgerBreakdownStrip({
  currencyBuckets,
  clientBuckets,
  bankBuckets,
  defaultExpanded = false,
}: LedgerBreakdownStripProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<BreakdownTab>('currency');

  if (currencyBuckets.length === 0) return null;

  const tabs: Array<{ id: BreakdownTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'currency', label: 'By Currency', icon: Coins },
    { id: 'client', label: 'By Client', icon: Users },
    { id: 'bank', label: 'By Bank Account', icon: Landmark },
  ];

  return (
    <div className="border border-obsidian-border bg-obsidian-light/70 rounded-[2px] overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-obsidian-border/60">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-2 text-left text-[11px] font-mono uppercase tracking-wider text-paper hover:text-status-brass transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>
            Ledger Breakdown ({currencyBuckets.length}{' '}
            {currencyBuckets.length === 1 ? 'Currency' : 'Currencies'})
          </span>
        </button>

        {expanded && (
          <div className="inline-flex bg-obsidian border border-obsidian-border rounded-[2px] p-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-[1px] transition-colors ${
                    isActive
                      ? 'bg-bone text-obsidian font-bold shadow-xs'
                      : 'text-ink-ghost hover:text-paper'
                  }`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Body */}
      {expanded && (
        <div className="overflow-x-auto">
          {activeTab === 'currency' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-obsidian-border text-[10px] font-mono uppercase tracking-wider text-ink-ghost bg-obsidian/40">
                  <th className="py-2.5 px-4">Currency</th>
                  <th className="py-2.5 px-4 text-right">Outstanding</th>
                  <th className="py-2.5 px-4 text-right">Certified Paid</th>
                  <th className="py-2.5 px-4 text-right">Invoices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-border/60">
                {currencyBuckets.map((b) => (
                  <tr key={b.currency} className="hover:bg-obsidian-border/20">
                    <td className="py-2.5 px-4 font-mono font-bold text-paper">{b.currency}</td>
                    <td className="py-2.5 px-4 font-mono tabular-nums whitespace-nowrap text-right text-status-brass font-semibold">
                      {formatCentsToCurrency(b.outstandingCents, b.currency)}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums whitespace-nowrap text-right text-status-hunter font-semibold">
                      {formatCentsToCurrency(b.paidCents, b.currency)}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-right text-bone-dark">
                      {b.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(activeTab === 'client' || activeTab === 'bank') && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-obsidian-border text-[10px] font-mono uppercase tracking-wider text-ink-ghost bg-obsidian/40">
                  <th className="py-2.5 px-4">
                    {activeTab === 'client' ? 'Client Entity' : 'Bank / Remittance Account'}
                  </th>
                  <th className="py-2.5 px-4">Currency</th>
                  <th className="py-2.5 px-4 text-right">Outstanding</th>
                  <th className="py-2.5 px-4 text-right">Certified Paid</th>
                  <th className="py-2.5 px-4 text-right">Invoices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-border/60">
                {(activeTab === 'client' ? clientBuckets : bankBuckets).map((row) => (
                  <tr key={row.key} className="hover:bg-obsidian-border/20">
                    <td className="py-2.5 px-4 min-w-0 max-w-[260px]">
                      <div dir="auto" className="font-serif font-bold text-paper truncate">
                        {row.label}
                      </div>
                      {row.sublabel && (
                        <div className="text-[10px] font-mono text-ink-ghost truncate">
                          {row.sublabel}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-bone-dark">
                      {row.currency}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums whitespace-nowrap text-right text-status-brass font-semibold">
                      {formatCentsToCurrency(row.outstandingCents, row.currency)}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums whitespace-nowrap text-right text-status-hunter font-semibold">
                      {formatCentsToCurrency(row.paidCents, row.currency)}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-right text-bone-dark">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
