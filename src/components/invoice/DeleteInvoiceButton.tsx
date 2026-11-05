'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, X, AlertTriangle } from 'lucide-react';

interface DeleteInvoiceButtonProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function DeleteInvoiceButton({
  invoiceId,
  invoiceNumber,
}: DeleteInvoiceButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/delete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete invoice');
      }
      setConfirmOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error deleting invoice';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        title={`Delete ${invoiceNumber}`}
        aria-label={`Delete invoice ${invoiceNumber}`}
        className="p-1 text-ink-ghost hover:text-status-vermilion transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4 text-left"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-paper text-ink-primary border border-bone shadow-sheet rounded-[2px] p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-bone pb-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-status-vermilion shrink-0" />
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-status-vermilion block">
                    ARCHIVAL EXPUNGEMENT
                  </span>
                  <h3 className="font-serif text-xl font-bold text-ink-primary">
                    Delete Invoice {invoiceNumber}?
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="p-1 text-ink-secondary hover:text-ink-primary transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-sans text-ink-secondary leading-relaxed mb-4">
              This will permanently remove invoice{' '}
              <span className="font-mono font-bold text-ink-primary">{invoiceNumber}</span> and
              all of its line item records from the ledger. This action cannot be undone.
            </p>

            {error && (
              <div className="mb-4 p-2.5 bg-status-vermilion/10 border border-status-vermilion text-status-vermilion text-xs font-mono rounded-[1px]">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-bone">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-status-vermilion text-paper hover:opacity-90 rounded-[1px] font-bold transition-all shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

