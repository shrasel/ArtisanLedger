'use client';

import React, { useRef, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { formatCentsToCurrency, parseCurrencyToCents } from '@/lib/utils';

export interface EditableItem {
  id?: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

interface LineItemEditorProps {
  items: EditableItem[];
  currency: string;
  onChange: (items: EditableItem[]) => void;
  readOnly?: boolean;
}

export function LineItemEditor({
  items,
  currency,
  onChange,
  readOnly = false,
}: LineItemEditorProps) {
  const lastPriceInputRef = useRef<HTMLInputElement>(null);

  // Track the raw text of whichever Unit Rate input is currently focused
  // so `.toFixed(2)` never hijacks the cursor while the user is typing.
  const [focusedRateIndex, setFocusedRateIndex] = useState<number | null>(null);
  const [focusedRateText, setFocusedRateText] = useState<string>('');

  const updateItem = (index: number, patch: Partial<EditableItem>) => {
    const next = [...items];
    const current = next[index];
    const updated = { ...current, ...patch };
    // Recalculate row total
    const qty = Math.max(0, updated.quantity || 0);
    const price = Math.max(0, updated.unitPriceCents || 0);
    updated.totalCents = Math.round(qty * price);
    next[index] = updated;
    onChange(next);
  };

  const addItem = () => {
    const newItem: EditableItem = {
      description: '',
      quantity: 1,
      unitPriceCents: 0,
      totalCents: 0,
    };
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (focusedRateIndex === index) {
      setFocusedRateIndex(null);
      setFocusedRateText('');
    }
    if (items.length <= 1) {
      // keep at least 1 empty row
      onChange([{ description: '', quantity: 1, unitPriceCents: 0, totalCents: 0 }]);
      return;
    }
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field: 'desc' | 'qty' | 'price'
  ) => {
    if (readOnly) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === items.length - 1) {
        addItem();
        setTimeout(() => {
          lastPriceInputRef.current?.focus();
        }, 50);
      }
    } else if (e.key === 'Tab' && !e.shiftKey && field === 'price') {
      if (index === items.length - 1) {
        // Automatically add row on Tab out of the last price input
        e.preventDefault();
        addItem();
      }
    }
  };

  return (
    <div className="w-full">
      {/* Table Header (Visible on Tablet/Desktop >= 640px; Mobile uses per-card labels) */}
      <div className="hidden sm:grid sm:grid-cols-12 gap-2 pb-2 mb-2 border-b border-ink-primary text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary">
        <div className="sm:col-span-6">Description &amp; Scope of Work</div>
        <div className="sm:col-span-2 text-center">Qty</div>
        <div className="sm:col-span-2 text-right">Unit Rate</div>
        <div className="sm:col-span-2 text-right">Amount</div>
      </div>

      {/* Mobile Section Header (< 640px) */}
      <div className="sm:hidden pb-2 mb-2 border-b border-ink-primary text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary">
        Line Items &amp; Scope of Work
      </div>

      {/* Rows */}
      <div className="space-y-3 sm:space-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isRateFocused = focusedRateIndex === index;
          const formattedRate =
            item.unitPriceCents === 0 ? '' : (item.unitPriceCents / 100).toFixed(2);

          return (
            <div
              key={item.id || index}
              className="py-2.5 sm:py-1.5 border-b border-bone/70 group hover:border-bone transition-colors"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-2 items-center">
                {/* Description (Full width on mobile with delete icon; 6 cols on >=640px) */}
                <div className="sm:col-span-6 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    {readOnly ? (
                      <div className="text-sm font-serif text-ink-primary leading-snug py-1 break-words">
                        {item.description || '—'}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={item.description}
                        placeholder="e.g. Architectural Schematic Drafts (Stage 1)"
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        onKeyDown={(e) => handleKeyDown(e, index, 'desc')}
                        className="w-full bg-paper-dark/40 sm:bg-transparent px-2.5 sm:px-2 py-1.5 sm:py-1 text-sm font-serif text-ink-primary placeholder:text-ink-ghost/60 focus:bg-paper-dark/60 focus:outline-none rounded-[1px] border border-bone/60 sm:border-transparent focus:border-bone transition-all"
                      />
                    )}
                  </div>

                  {/* Mobile Delete Button (Top-right of mobile card) */}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      title="Remove item"
                      className="sm:hidden p-1.5 text-ink-secondary hover:text-status-vermilion border border-bone/60 rounded-[1px] shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Numeric Columns: 3-column sub-grid on Mobile, 6 columns across on Tablet/Desktop */}
                <div className="grid grid-cols-3 sm:col-span-6 sm:grid-cols-6 gap-2 items-center">
                  {/* Quantity */}
                  <div className="col-span-1 sm:col-span-2">
                    <span className="sm:hidden text-[9px] font-mono uppercase tracking-wider text-ink-ghost block mb-0.5">
                      Qty
                    </span>
                    {readOnly ? (
                      <div className="font-mono text-xs text-ink-primary py-1 sm:text-center">
                        {item.quantity}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity === 0 ? '' : item.quantity}
                        placeholder="1"
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          updateItem(index, { quantity: isNaN(val) ? 0 : val });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index, 'qty')}
                        className="w-full bg-paper-dark/40 sm:bg-transparent px-2 sm:px-1 py-1.5 sm:py-1 text-xs font-mono text-left sm:text-center text-ink-primary placeholder:text-ink-ghost/60 focus:bg-paper-dark/60 focus:outline-none rounded-[1px] border border-bone/60 sm:border-transparent focus:border-bone transition-all"
                      />
                    )}
                  </div>

                  {/* Unit Rate */}
                  <div className="col-span-1 sm:col-span-2">
                    <span className="sm:hidden text-[9px] font-mono uppercase tracking-wider text-ink-ghost block mb-0.5 text-right">
                      Unit Rate
                    </span>
                    {readOnly ? (
                      <div className="font-mono text-xs text-ink-primary py-1 text-right">
                        {formatCentsToCurrency(item.unitPriceCents, currency)}
                      </div>
                    ) : (
                      <input
                        ref={isLast ? lastPriceInputRef : undefined}
                        type="text"
                        inputMode="decimal"
                        value={isRateFocused ? focusedRateText : formattedRate}
                        placeholder="0.00"
                        onFocus={() => {
                          setFocusedRateIndex(index);
                          setFocusedRateText(
                            item.unitPriceCents === 0
                              ? ''
                              : Number.isInteger(item.unitPriceCents / 100)
                              ? String(item.unitPriceCents / 100)
                              : (item.unitPriceCents / 100).toFixed(2)
                          );
                        }}
                        onChange={(e) => {
                          const raw = e.target.value;
                          // Allow only digits and at most one decimal point while typing
                          if (!/^\d*\.?\d{0,2}$/.test(raw)) return;
                          setFocusedRateText(raw);
                          const cents = parseCurrencyToCents(raw);
                          updateItem(index, { unitPriceCents: cents });
                        }}
                        onBlur={() => {
                          setFocusedRateIndex(null);
                          setFocusedRateText('');
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index, 'price')}
                        className="w-full bg-paper-dark/40 sm:bg-transparent px-2 py-1.5 sm:py-1 text-xs font-mono text-right text-ink-primary placeholder:text-ink-ghost/60 focus:bg-paper-dark/60 focus:outline-none rounded-[1px] border border-bone/60 sm:border-transparent focus:border-bone transition-all"
                      />
                    )}
                  </div>

                  {/* Total Amount + Desktop Delete */}
                  <div className="col-span-1 sm:col-span-2 flex items-center justify-end gap-1.5">
                    <div className="text-right">
                      <span className="sm:hidden text-[9px] font-mono uppercase tracking-wider text-ink-ghost block mb-0.5">
                        Amount
                      </span>
                      <span className="font-mono text-xs font-semibold text-ink-primary">
                        {formatCentsToCurrency(item.totalCents, currency)}
                      </span>
                    </div>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        title="Remove item"
                        className="hidden sm:inline-flex opacity-30 group-hover:opacity-100 hover:text-status-vermilion p-1 transition-opacity text-ink-secondary shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Button */}
      {!readOnly && (
        <div className="mt-4 pt-2">
          <button
            type="button"
            onClick={addItem}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary bg-paper-dark/50 hover:bg-paper-dark border border-dashed border-bone rounded-[1px] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line Item (Enter/Tab)</span>
          </button>
        </div>
      )}
    </div>
  );
}
