'use client';

import React, { useState } from 'react';
import {
  Send,
  X,
  Mail,
  FileText,
  RotateCcw,
  Plus,
  ShieldCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import type { Organization, Client } from '@/db/schema';
import type { EditableItem } from './LineItemEditor';
import {
  formatCentsToCurrency,
  formatEditorialDate,
  formatBasisPointsToPercent,
} from '@/lib/utils';

export interface DispatchEmailPayload {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  customMessage: string;
}

interface DispatchInvoiceModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmDispatch: (payload: DispatchEmailPayload) => void;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  items: EditableItem[];
  totals: {
    subtotalCents: number;
    discountCents: number;
    taxRateBasisPoints: number;
    taxAmountCents: number;
    totalCents: number;
  };
  notes: string;
  terms: string;
  organization: Organization;
  client?: Client;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function DispatchInvoiceModal({
  isOpen,
  isSubmitting,
  onClose,
  onConfirmDispatch,
  invoiceNumber,
  issueDate,
  dueDate,
  currency,
  items,
  totals,
  notes,
  terms,
  organization,
  client,
}: DispatchInvoiceModalProps) {
  const senderEntityName =
    organization.entityType === 'INDIVIDUAL'
      ? organization.principalName || organization.companyName || "The Architect's Ledger"
      : organization.companyName || organization.principalName || "The Architect's Ledger";

  const senderDisplayName =
    organization.letterheadTitle ||
    organization.companyName ||
    organization.principalName ||
    "The Architect's Ledger";

  const signerName =
    organization.entityType === 'INDIVIDUAL'
      ? organization.principalName || organization.companyName
      : organization.principalName
      ? `${organization.principalName}\n${organization.companyName}`
      : organization.companyName;

  const totalFormatted = formatCentsToCurrency(totals.totalCents, currency || 'USD');
  const dueDateFormatted = formatEditorialDate(dueDate);
  const issueDateFormatted = formatEditorialDate(issueDate);
  const testEmail = organization.testRecipientEmail || 'shahjahan.rasell@gmail.com';

  const buildDefaultSubject = () =>
    `Invoice # ${invoiceNumber} — ${totalFormatted} from ${senderEntityName}`;

  const buildDefaultMessage = () =>
    `Dear ${client?.name || 'Valued Client'},\n\nPlease find attached Invoice ${invoiceNumber} for ${totalFormatted}, due on ${dueDateFormatted}. You can also view and download the invoice as a PDF through the secure portal using the link and six-digit verification PIN below.\n\nThank you for your business and continued partnership.\n\nSincerely,\n${signerName}`;

  // Recipient chip states
  const [toEmails, setToEmails] = useState<string[]>(
    client?.email ? [client.email] : []
  );
  const [toInput, setToInput] = useState('');

  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');

  const [showBcc, setShowBcc] = useState(false);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState('');

  const [subject, setSubject] = useState<string>(buildDefaultSubject);
  const [customMessage, setCustomMessage] = useState<string>(buildDefaultMessage);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Preview tab: 'invoice' (exact client document) or 'email' (HTML email envelope)
  const [previewTab, setPreviewTab] = useState<'invoice' | 'email'>('invoice');
  // Mobile/Tablet active pane ('compose' vs 'preview') for < 1024px screens
  const [mobilePane, setMobilePane] = useState<'compose' | 'preview'>('compose');

  if (!isOpen) return null;

  const addEmailChip = (
    rawValue: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    clearInput: () => void
  ) => {
    const candidates = rawValue
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (candidates.length === 0) return true;

    for (const candidate of candidates) {
      if (!EMAIL_REGEX.test(candidate)) {
        setValidationError(`"${candidate}" is not a valid email address.`);
        return false;
      }
    }

    setValidationError(null);
    const merged = Array.from(new Set([...list, ...candidates]));
    setList(merged);
    clearInput();
    return true;
  };

  const handleKeyDownChip = (
    e: React.KeyboardEvent<HTMLInputElement>,
    inputVal: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    clearInput: () => void
  ) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      if (inputVal.trim()) {
        e.preventDefault();
        addEmailChip(inputVal, list, setList, clearInput);
      }
    } else if (e.key === 'Backspace' && !inputVal && list.length > 0) {
      setList(list.slice(0, -1));
    }
  };

  const removeChip = (
    emailToRemove: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.filter((item) => item !== emailToRemove));
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    // Flush any pending text in the input boxes first
    let finalTo = [...toEmails];
    if (toInput.trim()) {
      const candidates = toInput
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const c of candidates) {
        if (!EMAIL_REGEX.test(c)) {
          setValidationError(`Invalid To email address: "${c}"`);
          return;
        }
      }
      finalTo = Array.from(new Set([...finalTo, ...candidates]));
      setToEmails(finalTo);
      setToInput('');
    }

    let finalCc = [...ccEmails];
    if (ccInput.trim()) {
      const candidates = ccInput
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const c of candidates) {
        if (!EMAIL_REGEX.test(c)) {
          setValidationError(`Invalid CC email address: "${c}"`);
          return;
        }
      }
      finalCc = Array.from(new Set([...finalCc, ...candidates]));
      setCcEmails(finalCc);
      setCcInput('');
    }

    let finalBcc = [...bccEmails];
    if (bccInput.trim()) {
      const candidates = bccInput
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const c of candidates) {
        if (!EMAIL_REGEX.test(c)) {
          setValidationError(`Invalid BCC email address: "${c}"`);
          return;
        }
      }
      finalBcc = Array.from(new Set([...finalBcc, ...candidates]));
      setBccEmails(finalBcc);
      setBccInput('');
    }

    if (finalTo.length === 0) {
      setValidationError('Please provide at least one primary recipient in the "To" field.');
      return;
    }

    setValidationError(null);
    onConfirmDispatch({
      to: finalTo,
      cc: finalCc,
      bcc: finalBcc,
      subject: subject.trim() || buildDefaultSubject(),
      customMessage: customMessage.trim() || buildDefaultMessage(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 backdrop-blur-sm p-3 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispatch-studio-title"
    >
      <div className="w-full max-w-[1260px] bg-paper text-ink-primary border border-bone shadow-sheet rounded-[2px] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-paper-dark border-b border-bone flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-brass shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.18em] sm:tracking-[0.22em] text-ink-secondary font-bold truncate">
                PRE-DISPATCH REVIEW &amp; EMAIL COMPOSER STUDIO
              </span>
            </div>
            <h2
              id="dispatch-studio-title"
              className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-ink-primary mt-0.5 truncate"
            >
              Review Client Output &amp; Customize Dispatch — {invoiceNumber}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-ink-secondary hover:text-ink-primary border border-transparent hover:border-bone rounded-[2px] transition-colors shrink-0"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile / Tablet Pane Switcher (< 1024px) */}
        <div className="lg:hidden grid grid-cols-3 gap-1 p-2 bg-paper-dark border-b border-bone shrink-0 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setMobilePane('compose')}
            className={`py-2 px-2 rounded-[1px] flex items-center justify-center gap-1 transition-colors ${
              mobilePane === 'compose'
                ? 'bg-ink-primary text-paper font-bold'
                : 'text-ink-secondary hover:text-ink-primary bg-paper'
            }`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span>1. Compose</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobilePane('preview');
              setPreviewTab('invoice');
            }}
            className={`py-2 px-2 rounded-[1px] flex items-center justify-center gap-1 transition-colors ${
              mobilePane === 'preview' && previewTab === 'invoice'
                ? 'bg-ink-primary text-paper font-bold'
                : 'text-ink-secondary hover:text-ink-primary bg-paper'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>2. Client View</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobilePane('preview');
              setPreviewTab('email');
            }}
            className={`py-2 px-2 rounded-[1px] flex items-center justify-center gap-1 transition-colors ${
              mobilePane === 'preview' && previewTab === 'email'
                ? 'bg-ink-primary text-paper font-bold'
                : 'text-ink-secondary hover:text-ink-primary bg-paper'
            }`}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>3. Email Card</span>
          </button>
        </div>

        {/* Main Split Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
          {/* LEFT PANE (5 cols): Email Recipients & On-the-Fly Body Editor */}
          <form
            id="dispatch-email-form"
            onSubmit={handleConfirm}
            className={`${
              mobilePane === 'compose' ? 'block' : 'hidden lg:block'
            } lg:col-span-5 p-4 sm:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-bone space-y-4 sm:space-y-5 bg-paper`}
          >
            <div className="flex items-center justify-between border-b border-bone pb-2.5">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-ink-secondary" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-ink-primary">
                  1. Delivery &amp; Email Message
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubject(buildDefaultSubject());
                  setCustomMessage(buildDefaultMessage());
                }}
                className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary transition-colors"
                title="Reset Subject & Body to Default"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Text</span>
              </button>
            </div>

            {validationError && (
              <div className="p-3 bg-status-vermilion/10 border border-status-vermilion text-status-vermilion text-xs font-mono rounded-[2px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* TO RECIPIENTS (Multi-chip input) */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-ink-secondary font-bold">
                  To (Primary Recipients) *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setToEmails([testEmail]);
                      setToInput('');
                      setValidationError(null);
                    }}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded-[1px] border transition-colors ${
                      toEmails.length === 1 && toEmails[0] === testEmail
                        ? 'bg-status-hunter text-paper border-status-hunter font-bold'
                        : 'bg-paper-dark text-ink-primary border-bone hover:border-ink-primary'
                    }`}
                    title={`Route test email exclusively to ${testEmail}`}
                  >
                    Use Test Email ({testEmail})
                  </button>
                  {client?.email && (toEmails.length !== 1 || toEmails[0] !== client.email) && (
                    <button
                      type="button"
                      onClick={() => {
                        setToEmails([client.email]);
                        setToInput('');
                        setValidationError(null);
                      }}
                      className="text-[10px] font-mono underline text-ink-secondary hover:text-ink-primary"
                    >
                      Restore Client
                    </button>
                  )}
                </div>
              </div>
              <div className="min-h-[40px] w-full bg-paper-dark border border-bone p-1.5 rounded-[1px] flex flex-wrap items-center gap-1.5 focus-within:border-ink-primary transition-colors">
                {toEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-paper border border-bone text-xs font-mono text-ink-primary rounded-[1px]"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeChip(email, toEmails, setToEmails)}
                      className="text-ink-ghost hover:text-status-vermilion font-bold"
                      aria-label={`Remove ${email}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeyDownChip(e, toInput, toEmails, setToEmails, () => setToInput(''))
                  }
                  onBlur={() => {
                    if (toInput.trim()) {
                      addEmailChip(toInput, toEmails, setToEmails, () => setToInput(''));
                    }
                  }}
                  placeholder={
                    toEmails.length === 0 ? 'client@company.com, billing@company.com...' : 'Add another email...'
                  }
                  className="flex-1 min-w-[160px] bg-transparent px-1.5 py-0.5 text-xs font-mono text-ink-primary focus:outline-none"
                />
              </div>
            </div>

            {/* CC RECIPIENTS (Multi-chip input) */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-ink-secondary font-bold">
                  CC (Carbon Copy / Additional Recipients)
                </label>
                <div className="flex items-center gap-2">
                  {!ccEmails.includes(testEmail) && (
                    <button
                      type="button"
                      onClick={() => setCcEmails((prev) => Array.from(new Set([...prev, testEmail])))}
                      className="text-[10px] font-mono text-status-hunter hover:underline"
                    >
                      + CC {testEmail}
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      type="button"
                      onClick={() => setShowBcc(true)}
                      className="text-[10px] font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add BCC</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="min-h-[38px] w-full bg-paper-dark border border-bone p-1.5 rounded-[1px] flex flex-wrap items-center gap-1.5 focus-within:border-ink-primary transition-colors">
                {ccEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-paper border border-bone text-xs font-mono text-ink-primary rounded-[1px]"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeChip(email, ccEmails, setCcEmails)}
                      className="text-ink-ghost hover:text-status-vermilion font-bold"
                      aria-label={`Remove ${email}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeyDownChip(e, ccInput, ccEmails, setCcEmails, () => setCcInput(''))
                  }
                  onBlur={() => {
                    if (ccInput.trim()) {
                      addEmailChip(ccInput, ccEmails, setCcEmails, () => setCcInput(''));
                    }
                  }}
                  placeholder="accounting@client.com, partner@firm.com..."
                  className="flex-1 min-w-[160px] bg-transparent px-1.5 py-0.5 text-xs font-mono text-ink-primary focus:outline-none"
                />
              </div>
            </div>

            {/* OPTIONAL BCC RECIPIENTS */}
            {showBcc && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-ink-secondary font-bold">
                    BCC (Blind Carbon Copy)
                  </label>
                </div>
                <div className="min-h-[38px] w-full bg-paper-dark border border-bone p-1.5 rounded-[1px] flex flex-wrap items-center gap-1.5 focus-within:border-ink-primary transition-colors">
                  {bccEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-paper border border-bone text-xs font-mono text-ink-primary rounded-[1px]"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeChip(email, bccEmails, setBccEmails)}
                        className="text-ink-ghost hover:text-status-vermilion font-bold"
                        aria-label={`Remove ${email}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={bccInput}
                    onChange={(e) => setBccInput(e.target.value)}
                    onKeyDown={(e) =>
                      handleKeyDownChip(e, bccInput, bccEmails, setBccEmails, () => setBccInput(''))
                    }
                    onBlur={() => {
                      if (bccInput.trim()) {
                        addEmailChip(bccInput, bccEmails, setBccEmails, () => setBccInput(''));
                      }
                    }}
                    placeholder="archive@yourfirm.com..."
                    className="flex-1 min-w-[160px] bg-transparent px-1.5 py-0.5 text-xs font-mono text-ink-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* SUBJECT LINE */}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-ink-secondary font-bold block mb-1">
                Email Subject Line *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-paper-dark border border-bone px-3 py-2 text-xs font-sans font-medium text-ink-primary rounded-[1px] focus:outline-none focus:border-ink-primary"
              />
            </div>

            {/* EMAIL BODY MESSAGE */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-ink-secondary font-bold">
                  Email Body (Editable on the Fly) *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTab('email');
                    setMobilePane('preview');
                  }}
                  className="text-[10px] font-mono uppercase tracking-wider text-status-hunter hover:underline"
                >
                  Preview in Email &rarr;
                </button>
              </div>
              <textarea
                rows={9}
                required
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-paper-dark border border-bone p-3 text-xs font-sans text-ink-primary leading-relaxed rounded-[1px] focus:outline-none focus:border-ink-primary resize-y"
              />
            </div>

            {/* Security Gate Notice */}
            <div className="p-3 bg-paper-dark/80 border border-bone rounded-[2px] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-status-hunter shrink-0 mt-0.5" />
              <div className="text-[11px] font-sans text-ink-secondary leading-relaxed">
                <span className="font-semibold text-ink-primary">
                  Cryptographic PIN &amp; Summary Block Anchored:
                </span>{' '}
                Your custom message above is automatically followed by the{' '}
                <span className="font-mono text-[10px]">Invoice Summary Table</span>, a newly generated{' '}
                <span className="font-mono text-[10px]">6-Digit Verification PIN</span>, and the{' '}
                <span className="font-mono text-[10px]">Access Verified Document</span> portal link.
              </div>
            </div>
          </form>

          {/* RIGHT PANE (7 cols): Live Client Invoice View & Email Template Preview */}
          <div
            className={`${
              mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'
            } lg:col-span-7 flex-col bg-[#E8E2D7] overflow-hidden min-h-0`}
          >
            {/* Preview Mode Switcher Bar */}
            <div className="px-6 py-3 bg-paper-dark border-b border-bone flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-ink-secondary" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-ink-primary">
                  2. Live Recipient Output Preview
                </span>
              </div>

              <div className="inline-flex rounded-[2px] border border-bone bg-paper p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewTab('invoice')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded-[1px] transition-colors ${
                    previewTab === 'invoice'
                      ? 'bg-ink-primary text-paper font-bold'
                      : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Client Invoice View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('email')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded-[1px] transition-colors ${
                    previewTab === 'email'
                      ? 'bg-ink-primary text-paper font-bold'
                      : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Template Preview</span>
                </button>
              </div>
            </div>

            {/* Scrollable Preview Viewport */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              {previewTab === 'invoice' ? (
                /* EXACT CLIENT INVOICE VIEW (Matches Clean US Letter PDF & Recipient Portal) */
                <div className="max-w-[740px] mx-auto bg-[#FAF8F5] text-[#18191B] shadow-sheet border border-[#E6E1D9] rounded-[2px] p-8 md:p-12">
                  {/* Header (Document Letterhead — No underline, no status badge) */}
                  <div className="mb-7">
                    <h1 className="font-serif text-2xl md:text-3xl font-bold uppercase tracking-tight text-[#18191B] leading-tight">
                      {organization.letterheadTitle ||
                        organization.companyName ||
                        organization.principalName ||
                        "The Architect's Ledger"}
                    </h1>
                    {(organization.letterheadTagline ??
                      'Archival Financial Document / Certified Ledger') && (
                      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#5C5E62] mt-1">
                        {organization.letterheadTagline ??
                          'Archival Financial Document / Certified Ledger'}
                      </p>
                    )}
                  </div>

                  {/* Metadata Grid: From & Billed to */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 mb-6 border-b border-[#E6E1D9]">
                    <div>
                      <div className="text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-[#5C5E62] mb-1.5">
                        From
                      </div>
                      {organization.entityType === 'INDIVIDUAL' ? (
                        <>
                          <div className="font-serif text-base font-bold text-[#18191B]">
                            {organization.principalName || organization.companyName}
                          </div>
                          {organization.companyName &&
                            organization.principalName &&
                            organization.companyName !== organization.principalName && (
                              <div className="text-xs text-[#5C5E62]">{organization.companyName}</div>
                            )}
                        </>
                      ) : (
                        <>
                          <div className="font-serif text-base font-bold text-[#18191B]">
                            {organization.companyName || organization.principalName}
                          </div>
                          {organization.principalName &&
                            organization.principalName !== organization.companyName && (
                              <div className="text-xs text-[#5C5E62]">
                                Principal: {organization.principalName}
                              </div>
                            )}
                        </>
                      )}
                      {organization.addressLine && (
                        <div className="text-xs text-[#5C5E62]">{organization.addressLine}</div>
                      )}
                      <div className="text-xs text-[#5C5E62]">
                        {[organization.city, organization.state, organization.postalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                      {organization.taxId && (
                        <div className="text-xs text-[#5C5E62]">
                          Tax ID / EIN: {organization.taxId}
                        </div>
                      )}
                      {organization.email && (
                        <div className="text-xs text-[#5C5E62]">{organization.email}</div>
                      )}
                      {organization.phone && (
                        <div className="text-xs text-[#5C5E62]">{organization.phone}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-[#5C5E62] mb-1.5">
                        Billed to
                      </div>
                      <div className="font-serif text-base font-bold text-[#18191B]">
                        {client?.companyName || client?.name || '—'}
                      </div>
                      {client?.companyName && (
                        <div className="text-xs text-[#5C5E62]">Attn: {client.name}</div>
                      )}
                      {client?.address && (
                        <div className="text-xs text-[#5C5E62]">{client.address}</div>
                      )}
                      {client?.email && (
                        <div className="text-xs text-[#5C5E62]">{client.email}</div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Key Details Grid (3 Columns: Invoice No., Issue Date, Due Date — No Currency USD) */}
                  <div className="grid grid-cols-3 gap-4 bg-[#F3EFEA] p-3.5 rounded-[2px] border border-[#E6E1D9] mb-6">
                    <div>
                      <div className="text-[9px] font-sans uppercase tracking-wider text-[#5C5E62]">
                        Invoice No.
                      </div>
                      <div className="font-mono text-xs font-bold text-[#18191B] mt-0.5">
                        {invoiceNumber}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-sans uppercase tracking-wider text-[#5C5E62]">
                        Issue Date
                      </div>
                      <div className="font-mono text-xs font-bold text-[#18191B] mt-0.5">
                        {issueDateFormatted}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-sans uppercase tracking-wider text-[#5C5E62]">
                        Due Date
                      </div>
                      <div className="font-mono text-xs font-bold text-[#18191B] mt-0.5">
                        {dueDateFormatted}
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="mb-6">
                    <div className="grid grid-cols-12 border-b border-[#18191B] pb-2 mb-2 text-[10px] font-sans font-bold uppercase tracking-wider text-[#5C5E62]">
                      <div className="col-span-7">Description &amp; Deliverables</div>
                      <div className="col-span-1 text-center">Qty</div>
                      <div className="col-span-2 text-right">Rate</div>
                      <div className="col-span-2 text-right">Amount</div>
                    </div>
                    {items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="grid grid-cols-12 py-2.5 border-b border-[#E6E1D9] text-xs items-baseline"
                      >
                        <div className="col-span-7 pr-3 text-[#18191B]">
                          {item.description || '—'}
                        </div>
                        <div className="col-span-1 text-center font-mono text-[#18191B]">
                          {item.quantity}
                        </div>
                        <div className="col-span-2 text-right font-mono text-[#18191B]">
                          {formatCentsToCurrency(item.unitPriceCents, currency)}
                        </div>
                        <div className="col-span-2 text-right font-mono font-bold text-[#18191B]">
                          {formatCentsToCurrency(
                            Math.round(item.quantity * item.unitPriceCents),
                            currency
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals Summary */}
                  <div className="flex justify-end mb-6">
                    <div className="w-full max-w-[260px] space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="uppercase text-[10px] text-[#5C5E62]">Subtotal</span>
                        <span className="font-mono text-[#18191B]">
                          {formatCentsToCurrency(totals.subtotalCents, currency)}
                        </span>
                      </div>
                      {totals.discountCents > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="uppercase text-[10px] text-[#5C5E62]">Discount</span>
                          <span className="font-mono text-[#18191B]">
                            -{formatCentsToCurrency(totals.discountCents, currency)}
                          </span>
                        </div>
                      )}
                      {totals.taxRateBasisPoints > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="uppercase text-[10px] text-[#5C5E62]">
                            Tax ({formatBasisPointsToPercent(totals.taxRateBasisPoints)})
                          </span>
                          <span className="font-mono text-[#18191B]">
                            {formatCentsToCurrency(totals.taxAmountCents, currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-baseline pt-2 border-t border-b-2 border-[#18191B] pb-1.5">
                        <span className="font-serif text-xs font-bold uppercase text-[#18191B]">
                          Balance Due
                        </span>
                        <span className="font-mono text-base font-bold text-[#18191B]">
                          {totalFormatted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Terms */}
                  {(notes || terms) && (
                    <div className="mb-6 p-3.5 bg-[#F3EFEA] border-l-2 border-[#5C5E62] space-y-2">
                      {notes && (
                        <div>
                          <div className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#5C5E62]">
                            Notes &amp; Instructions
                          </div>
                          <div className="text-xs text-[#18191B] whitespace-pre-line">{notes}</div>
                        </div>
                      )}
                      {terms && (
                        <div>
                          <div className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#5C5E62]">
                            Terms &amp; Conditions
                          </div>
                          <div className="text-xs text-[#18191B] whitespace-pre-line">{terms}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tear-Off Remittance Advice */}
                  <div className="relative flex items-center justify-center my-5">
                    <div className="flex-1 border-t border-dashed border-[#A1A3A8]" />
                    <span className="bg-[#FAF8F5] px-3 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#A1A3A8] select-none text-center sm:whitespace-nowrap">
                      &bull; TEAR-OFF REMITTANCE ADVICE / WIRE INSTRUCTIONS &bull;
                    </span>
                    <div className="flex-1 border-t border-dashed border-[#A1A3A8]" />
                  </div>
                  <div className="p-3.5 border border-[#E6E1D9] bg-[#FAF8F5] rounded-[2px] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] uppercase text-[#5C5E62] block">
                        Beneficiary Bank
                      </span>
                      <span className="font-mono font-bold text-[#18191B]">
                        {organization.bankName || 'Direct Wire Transfer'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-[#5C5E62] block">
                        Account Holder
                      </span>
                      <span className="font-mono font-bold text-[#18191B]">
                        {organization.accountHolderName || organization.companyName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-[#5C5E62] block">
                        Routing / Transit / ABA
                      </span>
                      <span className="font-mono font-bold text-[#18191B]">
                        {organization.routingNumber || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-[#5C5E62] block">
                        Account Number
                      </span>
                      <span className="font-mono font-bold text-[#18191B]">
                        {organization.accountNumber || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* EXACT TRANSACTIONAL EMAIL TEMPLATE PREVIEW */
                <div className="max-w-[600px] mx-auto">
                  {/* Simulated Email Client Envelope Header */}
                  <div className="bg-paper-dark border border-bone border-b-0 rounded-t-[2px] p-4 space-y-1.5 text-xs font-mono">
                    <div className="flex items-start gap-2">
                      <span className="text-ink-secondary uppercase w-16 shrink-0">To:</span>
                      <span className="text-ink-primary font-semibold break-all">
                        {[...toEmails, toInput.trim()].filter(Boolean).join(', ') || '—'}
                      </span>
                    </div>
                    {([...ccEmails, ccInput.trim()].filter(Boolean).length > 0) && (
                      <div className="flex items-start gap-2">
                        <span className="text-ink-secondary uppercase w-16 shrink-0">CC:</span>
                        <span className="text-ink-primary break-all">
                          {[...ccEmails, ccInput.trim()].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {([...bccEmails, bccInput.trim()].filter(Boolean).length > 0) && (
                      <div className="flex items-start gap-2">
                        <span className="text-ink-secondary uppercase w-16 shrink-0">BCC:</span>
                        <span className="text-ink-primary break-all">
                          {[...bccEmails, bccInput.trim()].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-ink-secondary uppercase w-16 shrink-0">Subject:</span>
                      <span className="text-ink-primary font-sans font-bold">{subject}</span>
                    </div>
                  </div>

                  {/* Styled HTML Email Card */}
                  <div className="bg-[#FAF8F5] text-[#18191B] border border-[#E6E1D9] shadow-sheet rounded-b-[2px] overflow-hidden">
                    <div className="px-8 pt-8 pb-5 border-b-2 border-[#18191B]">
                      <h3 className="font-serif text-xl font-bold uppercase tracking-tight text-[#18191B]">
                        {senderDisplayName}
                      </h3>
                    </div>

                    <div className="p-8">
                      {/* Live Custom Message */}
                      <div className="font-serif text-sm leading-relaxed text-[#18191B] whitespace-pre-line mb-6">
                        {customMessage}
                      </div>

                      {/* From & Billed to Party Block */}
                      <div className="grid grid-cols-2 gap-4 py-3.5 my-4 border-y border-[#E6E1D9] text-xs font-sans">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C5E62] mb-1">
                            From
                          </div>
                          <div className="font-serif font-bold text-[#18191B]">
                            {organization.entityType === 'INDIVIDUAL'
                              ? organization.principalName || organization.companyName
                              : organization.companyName || organization.principalName}
                          </div>
                          {organization.email && (
                            <div className="text-[#5C5E62]">{organization.email}</div>
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C5E62] mb-1">
                            Billed to
                          </div>
                          <div className="font-serif font-bold text-[#18191B]">
                            {client?.companyName || client?.name || '—'}
                          </div>
                          {client?.email && <div className="text-[#5C5E62]">{client.email}</div>}
                        </div>
                      </div>

                      {/* Anchored Metadata Table */}
                      <div className="bg-[#F3EFEA] border border-[#E6E1D9] my-5 text-xs font-sans">
                        <div className="flex justify-between px-3.5 py-2 border-b border-[#E6E1D9]">
                          <span className="uppercase text-[11px] tracking-wider text-[#5C5E62]">
                            Invoice No.
                          </span>
                          <span className="font-mono font-bold text-sm text-[#18191B]">
                            {invoiceNumber}
                          </span>
                        </div>
                        <div className="flex justify-between px-3.5 py-2 border-b border-[#E6E1D9]">
                          <span className="uppercase text-[11px] tracking-wider text-[#5C5E62]">
                            Issue Date
                          </span>
                          <span className="font-mono font-bold text-sm text-[#18191B]">
                            {issueDateFormatted}
                          </span>
                        </div>
                        <div className="flex justify-between px-3.5 py-2 border-b border-[#E6E1D9]">
                          <span className="uppercase text-[11px] tracking-wider text-[#5C5E62]">
                            Due Date
                          </span>
                          <span className="font-mono font-bold text-sm text-[#18191B]">
                            {dueDateFormatted}
                          </span>
                        </div>
                        <div className="flex justify-between px-3.5 py-2">
                          <span className="uppercase text-[11px] tracking-wider text-[#5C5E62]">
                            Total Balance Due
                          </span>
                          <span className="font-mono font-bold text-sm text-[#18191B]">
                            {totalFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Line Items Breakdown inside Email */}
                      <div className="my-5 text-xs font-sans">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C5E62] mb-2">
                          Line Items &amp; Deliverables
                        </div>
                        <div className="grid grid-cols-12 border-b border-[#18191B] pb-1.5 mb-1.5 text-[10px] font-bold uppercase text-[#5C5E62]">
                          <div className="col-span-6">Description</div>
                          <div className="col-span-2 text-center">Qty</div>
                          <div className="col-span-2 text-right">Rate</div>
                          <div className="col-span-2 text-right">Amount</div>
                        </div>
                        {items.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="grid grid-cols-12 py-1.5 border-b border-[#E6E1D9] text-xs"
                          >
                            <div className="col-span-6 pr-2 text-[#18191B]">
                              {item.description || '—'}
                            </div>
                            <div className="col-span-2 text-center font-mono">
                              {item.quantity}
                            </div>
                            <div className="col-span-2 text-right font-mono">
                              {formatCentsToCurrency(item.unitPriceCents, currency)}
                            </div>
                            <div className="col-span-2 text-right font-mono font-bold">
                              {formatCentsToCurrency(
                                Math.round(item.quantity * item.unitPriceCents),
                                currency
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Attached PDF Badge */}
                      <div className="p-2.5 bg-[#F3EFEA] border border-[#E6E1D9] rounded-[2px] flex items-center justify-between text-xs font-mono my-4">
                        <span className="text-[#5C5E62]">📎 Attached Official US Letter PDF:</span>
                        <span className="font-bold text-[#18191B]">
                          Invoice-{invoiceNumber}.pdf
                        </span>
                      </div>

                      {/* Anchored PIN Box */}
                      <div className="bg-[#ECE6DC] border border-dashed border-[#5C5E62] p-5 text-center my-6 rounded-[2px]">
                        <div className="text-[10px] font-sans uppercase tracking-[0.12em] text-[#5C5E62] mb-1.5">
                          Secure Access Verification Code (PIN)
                        </div>
                        <div className="font-mono text-2xl font-bold tracking-[0.25em] text-[#C84630]">
                          &bull; &bull; &bull; &bull; &bull; &bull;
                        </div>
                        <div className="text-[10px] font-mono text-[#5C5E62] mt-1">
                          (Fresh 6-digit PIN generated upon confirmation)
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="text-center my-6">
                        <span className="inline-block bg-[#18191B] text-[#FAF8F5] px-7 py-3 text-xs font-sans font-semibold uppercase tracking-[0.08em] rounded-[2px]">
                          Access Verified Document &rarr;
                        </span>
                      </div>
                    </div>

                    <div className="px-8 py-4 bg-[#F3EFEA] border-t border-[#E6E1D9] text-center text-[11px] font-sans text-[#A1A3A8]">
                      This is a secure archival document dispatch issued via The Architect&apos;s Ledger.
                      <br />
                      Please do not share your verification PIN with unauthorized third parties.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="px-6 py-4 bg-paper-dark border-t border-bone flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="text-xs font-mono text-ink-secondary">
            Sending to:{' '}
            <span className="font-bold text-ink-primary">
              {[...toEmails, toInput.trim()].filter(Boolean).length} recipient(s)
            </span>
            {[...ccEmails, ccInput.trim()].filter(Boolean).length > 0 && (
              <span>
                {' '}
                &bull; CC: {[...ccEmails, ccInput.trim()].filter(Boolean).length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-ink-secondary hover:text-ink-primary border border-bone rounded-[2px] transition-colors"
            >
              Cancel &amp; Edit Invoice
            </button>
            <button
              type="submit"
              form="dispatch-email-form"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2 text-xs font-mono uppercase tracking-wider text-paper bg-ink-primary hover:bg-black font-bold rounded-[2px] shadow-md transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSubmitting ? 'Encrypting & Dispatching...' : 'Confirm & Dispatch Invoice'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

