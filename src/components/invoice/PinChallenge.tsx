'use client';

import React, { useState, useTransition } from 'react';
import { Lock, KeyRound, ShieldAlert, Check, ArrowRight, Loader2 } from 'lucide-react';
import { verifyPinAndUnlock } from '@/app/view/[token]/actions';

interface PinChallengeProps {
  token: string;
  invoiceNumber: string;
  senderCompanyName: string;
  onUnlocked: () => void;
}

export function PinChallenge({
  token,
  invoiceNumber,
  senderCompanyName,
  onUnlocked,
}: PinChallengeProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setError('Please enter your 4 to 6 digit verification code.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await verifyPinAndUnlock(token, pin);
      if (res.success) {
        onUnlocked();
      } else {
        setError(res.error || 'Invalid verification passcode.');
        setPin('');
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto py-8">
      {/* Editorial Envelope Card */}
      <div className="bg-paper text-ink-primary border border-bone shadow-sheet rounded-[2px] p-8 md:p-10 relative overflow-hidden">
        {/* Wax Seal Stamp Motif */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-status-vermilion/10 border-2 border-status-vermilion flex items-center justify-center relative shadow-[0_4px_12px_rgba(200,70,48,0.25)]">
            <div className="w-12 h-12 rounded-full border border-dashed border-status-vermilion/60 flex items-center justify-center">
              <Lock className="w-5 h-5 text-status-vermilion" />
            </div>
            {/* Small decorative seal ribbon */}
            <div className="absolute -bottom-2 w-4 h-3 bg-status-vermilion/80 clip-ribbon" />
          </div>
        </div>

        {/* Envelope Title */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-secondary block mb-1">
            PROTECTED FINANCIAL DISPATCH
          </span>
          <h2 className="font-serif text-2xl font-bold text-ink-primary">
            Archival Verification Gate
          </h2>
          <p className="text-xs font-sans text-ink-secondary mt-1">
            Invoice <span className="font-mono font-semibold text-ink-primary">{invoiceNumber}</span> issued by{' '}
            <span className="font-serif font-bold text-ink-primary">{senderCompanyName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PIN Input Display */}
          <div>
            <div className="flex justify-center gap-2 mb-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const char = pin[idx];
                return (
                  <div
                    key={idx}
                    className={`w-10 h-12 md:w-12 md:h-14 border rounded-[2px] flex items-center justify-center font-mono text-xl font-bold transition-all ${
                      char
                        ? 'border-ink-primary bg-paper-dark text-ink-primary'
                        : 'border-bone bg-paper-dark/30 text-ink-ghost'
                    }`}
                  >
                    {char ? '•' : ''}
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] font-sans text-center text-ink-secondary mt-3">
              Enter the verification PIN provided in your dispatch notification.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 bg-status-vermilion/10 border border-status-vermilion text-status-vermilion text-xs font-mono flex items-center justify-center gap-2 rounded-[1px] text-center">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tactile Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="h-11 bg-paper-dark hover:bg-bone/50 border border-bone font-mono text-base font-bold text-ink-primary rounded-[1px] active:scale-95 transition-all"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 bg-paper-dark hover:bg-bone/50 border border-bone font-mono text-xs uppercase tracking-wider text-ink-secondary rounded-[1px] active:scale-95 transition-all"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-11 bg-paper-dark hover:bg-bone/50 border border-bone font-mono text-base font-bold text-ink-primary rounded-[1px] active:scale-95 transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 bg-paper-dark hover:bg-bone/50 border border-bone font-mono text-xs uppercase tracking-wider text-ink-secondary rounded-[1px] active:scale-95 transition-all"
            >
              Del
            </button>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || pin.length < 4}
              className="w-full py-3 bg-ink-primary hover:bg-black disabled:opacity-40 text-paper font-mono text-xs uppercase tracking-[0.2em] font-bold rounded-[1px] flex items-center justify-center gap-2 transition-all shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Passcode...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Unlock Sheet</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Assurance */}
        <div className="mt-8 pt-4 border-t border-bone text-center">
          <p className="text-[10px] font-mono text-ink-ghost uppercase tracking-wider">
            256-Bit Encrypted Archival Access Gateway &bull; The Architect's Ledger
          </p>
        </div>
      </div>
    </div>
  );
}

