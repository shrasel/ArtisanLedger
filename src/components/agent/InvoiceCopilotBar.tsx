'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Command, ArrowRight, Loader2, Check } from 'lucide-react';

interface DraftPayload {
  clientName: string;
  currency: string;
  dueDateOffsetDays: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  notes: string;
}

interface InvoiceCopilotBarProps {
  onApplyDraft: (draft: DraftPayload) => void;
}

export function InvoiceCopilotBar({ onApplyDraft }: InvoiceCopilotBarProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);

  // Keyboard shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/agent/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.data) {
        onApplyDraft(data.data);
        setAppliedNotice(true);
        setTimeout(() => setAppliedNotice(false), 3000);
        setIsOpen(false);
        setPrompt('');
      }
    } catch (err) {
      console.error('Failed to parse invoice instructions:', err);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Bill Metro Studio $6,500 for Architectural Schematics and 12 hrs CAD drafting at $150/hr, Net 15',
    'Invoice Apex Construction $14,000 for Structural Engineering Review and Site Inspection, Net 30',
    'Charge Studio Atelier $3,200 for Interior Lighting Plans due on receipt',
  ];

  return (
    <div className="w-full max-w-[850px] mb-6">
      {/* Trigger Button if closed */}
      {!isOpen ? (
        <div className="flex items-center justify-between p-2.5 bg-obsidian-light border border-obsidian-border rounded-[2px] shadow-sm">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 text-xs font-mono text-bone-dark hover:text-paper transition-colors group"
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-sm bg-status-brass/10 border border-status-brass/30 text-status-brass">
              <Sparkles className="w-3 h-3" />
            </span>
            <span className="font-semibold tracking-wider uppercase text-status-brass">
              Intent-to-Invoice Copilot
            </span>
            <span className="hidden sm:inline text-ink-ghost group-hover:text-bone-dark">
              &mdash; Draft entire invoices from natural language
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-ghost bg-obsidian border border-obsidian-border rounded-[1px]"
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </button>
        </div>
      ) : (
        /* Expanded Copilot Panel */
        <div className="bg-obsidian-light border border-status-brass/40 shadow-xl rounded-[2px] p-4 text-paper animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-obsidian-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-status-brass" />
              <span className="font-serif text-sm font-bold tracking-wide text-paper">
                Artisan Ledger &bull; Intent-to-Invoice Copilot
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-mono text-ink-ghost hover:text-paper uppercase tracking-wider"
            >
              [Esc] Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <textarea
                autoFocus
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Bill Acme Corp $4,500 for Brand Identity and 15 hrs design consultation at $120/hr, Net 15..."
                className="w-full bg-obsidian border border-obsidian-border focus:border-status-brass rounded-[2px] p-3 text-xs font-mono text-paper placeholder:text-ink-ghost focus:outline-none resize-none leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-ink-ghost">
                <span className="uppercase tracking-wider">Try quick preset:</span>
                {samplePrompts.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(s)}
                    className="px-2 py-0.5 bg-obsidian border border-obsidian-border hover:border-bone/40 rounded-[1px] text-bone-dark truncate max-w-[220px]"
                    title={s}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-obsidian bg-status-brass hover:bg-[#e0be49] disabled:opacity-50 rounded-[1px] font-bold transition-all shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Draft</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Applied Notice */}
      {appliedNotice && (
        <div className="mt-2 p-2 bg-status-hunter/10 border border-status-hunter text-status-hunter text-xs font-mono flex items-center gap-2 rounded-[1px]">
          <Check className="w-3.5 h-3.5" />
          <span>Invoice draft populated from Copilot intent! Review and adjust below.</span>
        </div>
      )}
    </div>
  );
}

