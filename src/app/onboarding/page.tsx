'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { User, Building2, Landmark, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import { saveOnboardingAction } from '../(auth)/actions';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: User Profile
    fullName: '',
    phone: '',

    // Step 2: Business Profile
    companyName: '',
    taxId: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    defaultCurrency: 'USD',
    invoicePrefix: 'INV-',
    defaultTerms: 'NET_30',

    // Step 3: Payout Information
    bankName: '',
    accountHolderName: '',
    routingNumber: '',
    accountNumber: '',
    swiftBic: '',
    paymentNotes: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.fullName) {
        setError('Please enter your full name.');
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (!formData.companyName) {
        setError('Please enter your firm or company name.');
        return;
      }
      setError(null);
      setStep(3);
    } else if (step === 3) {
      setError(null);
      startTransition(async () => {
        const res = await saveOnboardingAction(formData);
        if (res?.error) {
          setError(res.error);
        } else {
          router.push('/invoices');
          router.refresh();
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-paper flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl bg-paper text-ink-primary border border-bone shadow-sheet rounded-[2px] p-8 md:p-12 relative">
        {/* Step Progress Indicators */}
        <div className="mb-8 pb-6 border-b border-bone">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-secondary">
              PRACTITIONER SETUP &bull; STEP {step} OF 3
            </span>
            <span className="text-xs font-mono font-bold text-status-brass">
              THE ARCHITECT'S LEDGER
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { num: 1, label: 'User Profile', icon: User },
              { num: 2, label: 'Firm Identity', icon: Building2 },
              { num: 3, label: 'Remittance & Wire', icon: Landmark },
            ].map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isPast = step > s.num;

              return (
                <div
                  key={s.num}
                  className={`p-2.5 border rounded-[1px] flex items-center gap-2 transition-all ${
                    isActive
                      ? 'border-ink-primary bg-paper-dark text-ink-primary font-bold shadow-sm'
                      : isPast
                      ? 'border-bone bg-paper-dark/40 text-status-hunter'
                      : 'border-bone/60 bg-transparent text-ink-ghost'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      isPast
                        ? 'bg-status-hunter text-paper'
                        : isActive
                        ? 'bg-ink-primary text-paper'
                        : 'bg-bone text-ink-secondary'
                    }`}
                  >
                    {isPast ? <Check className="w-3 h-3" /> : s.num}
                  </div>
                  <span className="text-xs font-sans truncate">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-status-vermilion/10 border border-status-vermilion text-status-vermilion text-xs font-mono rounded-[1px]">
            {error}
          </div>
        )}

        <form onSubmit={handleNextStep}>
          {/* STEP 1: USER PROFILE */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="mb-4">
                <h2 className="font-serif text-2xl font-bold text-ink-primary">
                  Step 1: Practitioner Credentials
                </h2>
                <p className="text-xs font-sans text-ink-secondary mt-1">
                  Enter your administrative and direct contact details.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="e.g. Jonathan Mercer, Lead Architect"
                  className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                  Direct Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 (212) 555-0198"
                  className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                />
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS PROFILE */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="mb-4">
                <h2 className="font-serif text-2xl font-bold text-ink-primary">
                  Step 2: Business & Firm Profile
                </h2>
                <p className="text-xs font-sans text-ink-secondary mt-1">
                  Official registry appearing on all certified invoice sheets.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Company / Studio Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    placeholder="Mercer Architecture & Design Group"
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-serif font-bold text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Tax ID / EIN / VAT
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value)}
                    placeholder="XX-XXXXXXX"
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Default Currency
                  </label>
                  <select
                    value={formData.defaultCurrency}
                    onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Studio Address Line
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine}
                    onChange={(e) => handleChange('addressLine', e.target.value)}
                    placeholder="740 Broadway, 12th Floor"
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="New York"
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                      State / Prov
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="NY"
                      className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      placeholder="10003"
                      className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={formData.invoicePrefix}
                    onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                    placeholder="INV-"
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Default Payment Terms
                  </label>
                  <select
                    value={formData.defaultTerms}
                    onChange={(e) => handleChange('defaultTerms', e.target.value)}
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  >
                    <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                    <option value="NET_15">Net 15 Days</option>
                    <option value="NET_30">Net 30 Days</option>
                    <option value="NET_60">Net 60 Days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PAYOUT & REMITTANCE */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="mb-4">
                <h2 className="font-serif text-2xl font-bold text-ink-primary">
                  Step 3: Remittance & Wire Instructions
                </h2>
                <p className="text-xs font-sans text-ink-secondary mt-1">
                  Printed in the tear-off bank remittance stub at the foot of each document.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Beneficiary Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    placeholder="J.P. Morgan Chase & Co."
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={formData.accountHolderName}
                    onChange={(e) => handleChange('accountHolderName', e.target.value)}
                    placeholder="Mercer Architecture LLC"
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Routing / Transit / ABA
                  </label>
                  <input
                    type="text"
                    value={formData.routingNumber}
                    onChange={(e) => handleChange('routingNumber', e.target.value)}
                    placeholder="021000021"
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                    placeholder="8821094412"
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    SWIFT / BIC Code (International)
                  </label>
                  <input
                    type="text"
                    value={formData.swiftBic}
                    onChange={(e) => handleChange('swiftBic', e.target.value)}
                    placeholder="CHASUS33"
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-mono text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                    Special Wire Notes / Reference
                  </label>
                  <input
                    type="text"
                    value={formData.paymentNotes}
                    onChange={(e) => handleChange('paymentNotes', e.target.value)}
                    placeholder="Include Invoice # in wire memo"
                    className="w-full bg-paper-dark border border-bone px-3 py-2 text-sm font-sans text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-bone flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink-primary hover:bg-black text-paper font-mono text-xs uppercase tracking-[0.2em] font-bold rounded-[1px] transition-all shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Finalizing Setup...</span>
                </>
              ) : step === 3 ? (
                <>
                  <span>Complete Setup & Launch Ledger</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Proceed to Step {step + 1}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

