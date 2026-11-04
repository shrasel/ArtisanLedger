'use client';

import React, { useRef } from 'react';
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
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 pb-2 mb-2 border-b border-ink-primary text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary">
        <div className="col-span-6 md:col-span-7">Description & Scope of Work</div>
        <div className="col-span-2 text-center">Qty</div>
        <div className="col-span-2 text-right">Unit Rate</div>
        <div className="col-span-2 md:col-span-1 text-right">Amount</div>
        {!readOnly && <div className="hidden md:block md:col-span-0 w-6" />}
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div
              key={item.id || index}
              className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-bone/60 group hover:border-bone transition-colors"
            >
              {/* Description */}
              <div className="col-span-6 md:col-span-7">
                {readOnly ? (
                  <div className="text-sm font-serif text-ink-primary leading-snug py-1">
                    {item.description || '—'}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={item.description}
                    placeholder="e.g. Architectural Schematic Drafts (Stage 1)"
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, index, 'desc')}
                    className="w-full bg-transparent px-2 py-1 text-sm font-serif text-ink-primary placeholder:text-ink-ghost/60 focus:bg-paper-dark/50 focus:outline-none rounded-[1px] border border-transparent focus:border-bone transition-all"
                  />
                )}
              </div>

              {/* Quantity */}
              <div className="col-span-2 text-center">
                {readOnly ? (
                  <div className="font-mono text-xs text-ink-primary py-1">
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
                    className="w-full bg-transparent px-1 py-1 text-xs font-mono text-center text-ink-primary placeholder:text-ink-ghost/60 focus:bg-paper-dark/50 focus:outline-none rounded-[1px] border border-transparent focus:border-bone transition-all"
                  />
                )}
              </div>

              {/* Unit Rate */}
              <div className="col-span-2 text-right">
                {readOnly ? (
                  <div className="font-mono text-xs text-ink-primary py-1 text-right">
                    {formatCentsToCurrency(item.unitPriceCents, currency)}
                  </div>
                ) : (
                  <input
                    ref={isLast ? lastPriceInputRef : undefined}
                    type="text"
                    value={item.unitPriceCents === 0 ? '' : (item.unitPriceCents / 100).toFixed(2)}
                    placeholder="0.00"
                    onChange={(e) => {
                      const cents = parseCurrencyToCents(e.target.value);
                      updateItem(index, { unitPriceCents: cents });
                    }}
                    onKeyDown={(e) => handleKeyDown(e, index, 'price')}
                    className="w-full bg-transparent px-2 py-1 text-xs font-mono text-right text-ink-primary placeholder:text-ink-ghost/60 focus:bg-paper-dark/50 focus:outline-none rounded-[1px] border border-transparent focus:border-bone transition-all"
                  />
                )}
              </div>

              {/* Total Amount */}
              <div className="col-span-2 md:col-span-1 text-right">
                <span className="font-mono text-xs font-medium text-ink-primary">
                  {formatCentsToCurrency(item.totalCents, currency)}
                </span>
              </div>

              {/* Delete Action */}
              {!readOnly && (
                <div className="col-span-12 md:col-span-0 flex justify-end md:w-6">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    title="Remove item"
                    className="opacity-20 group-hover:opacity-100 hover:text-status-vermilion p-1 transition-opacity text-ink-secondary"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary bg-paper-dark/50 hover:bg-paper-dark border border-dashed border-bone rounded-[1px] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line Item (Enter/Tab)</span>
          </button>
        </div>
      )}
    </div>
  );
}

