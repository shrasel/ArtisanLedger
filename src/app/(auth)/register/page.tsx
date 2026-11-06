'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { registerAction } from '../actions';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await registerAction(formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-obsidian text-paper flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-paper text-ink-primary border border-bone shadow-sheet rounded-[2px] p-8 md:p-10 relative">
        <div className="text-center pb-6 mb-6 border-b border-bone">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-secondary block mb-1">
            ORIGINATE LEDGER ACCOUNT
          </span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink-primary">
            Artisan Ledger
          </h1>
          <p className="text-xs font-sans text-ink-secondary mt-1">
            Establish your certified firm registry & billing authority.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-status-vermilion/10 border border-status-vermilion text-status-vermilion text-xs font-mono rounded-[1px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              name="fullName"
              required
              placeholder="Marcus Vance, AIA"
              className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
              Professional Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="vance@archstudio.com"
              className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans uppercase font-bold tracking-wider text-ink-secondary block mb-1">
              Account Password (Min. 6 chars)
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••••••"
              className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-ink-primary hover:bg-black disabled:opacity-50 text-paper font-mono text-xs uppercase tracking-[0.2em] font-bold rounded-[1px] flex items-center justify-center gap-2 transition-all shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Configuring Registry...</span>
                </>
              ) : (
                <>
                  <span>Initialize Firm Ledger</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-4 border-t border-bone flex items-center justify-between text-xs font-sans text-ink-secondary">
          <span>Already registered?</span>
          <Link
            href="/login"
            className="font-mono text-xs uppercase tracking-wider text-ink-primary hover:underline font-semibold"
          >
            Access Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

