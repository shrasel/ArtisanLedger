import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format monetary cents into localized currency string
 * e.g., 15050 -> "$150.50"
 */
export function formatCentsToCurrency(cents: number, currency = 'USD'): string {
  const amount = (cents || 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse a user input string (e.g., "150.50" or "1,200") to integer cents
 */
export function parseCurrencyToCents(value: string | number): number {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }
  const clean = value.replace(/[^0-9.-]/g, '');
  const floatVal = parseFloat(clean);
  if (isNaN(floatVal)) return 0;
  return Math.round(floatVal * 100);
}

/**
 * Convert basis points to percentage display
 * e.g., 825 -> "8.25%"
 */
export function formatBasisPointsToPercent(bps: number): string {
  return `${((bps || 0) / 100).toFixed(2)}%`;
}

/**
 * Convert percentage input (e.g., 8.25 or "8.25") to basis points (825)
 */
export function parsePercentToBasisPoints(value: string | number): number {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }
  const clean = value.replace(/[^0-9.-]/g, '');
  const floatVal = parseFloat(clean);
  if (isNaN(floatVal)) return 0;
  return Math.round(floatVal * 100);
}

/**
 * Calculate financial totals adhering to integer cent and basis point rules
 */
export function calculateInvoiceTotals(
  items: { quantity: number; unitPriceCents: number }[],
  taxRateBasisPoints = 0,
  discountCents = 0
) {
  const subtotalCents = items.reduce((acc, item) => {
    const qty = Math.max(0, item.quantity || 0);
    const price = Math.max(0, item.unitPriceCents || 0);
    return acc + qty * price;
  }, 0);

  const discountedSubtotal = Math.max(0, subtotalCents - (discountCents || 0));
  const taxAmountCents = Math.round((discountedSubtotal * (taxRateBasisPoints || 0)) / 10000);
  const totalCents = discountedSubtotal + taxAmountCents;

  return {
    subtotalCents,
    discountCents: discountCents || 0,
    taxRateBasisPoints: taxRateBasisPoints || 0,
    taxAmountCents,
    totalCents,
  };
}

/**
 * Generate a cryptographically secure token for client portal access
 */
export function generateAccessToken(length = 24): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Generate a 6-digit numeric passcode (PIN)
 */
export function generatePasscode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash passcode using bcrypt
 */
export async function hashPasscode(passcode: string): Promise<string> {
  return bcrypt.hash(passcode, 10);
}

/**
 * Verify passcode with bcrypt
 */
export async function verifyPasscode(passcode: string, hash: string): Promise<boolean> {
  return bcrypt.compare(passcode, hash);
}

/**
 * Formats a date string YYYY-MM-DD into editorial format (e.g., "14 November 2026")
 */
export function formatEditorialDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Get date with relative offset (e.g., +30 days for Net 30) in YYYY-MM-DD
 */
export function getRelativeDateString(offsetDays = 0): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays));
  return utc.toISOString().split('T')[0];
}

/**
 * Add offset days to a specific YYYY-MM-DD date string without timezone drift
 */
export function addDaysToDateString(baseDateStr?: string | null, offsetDays = 0): string {
  const safeOffset = Number.isFinite(offsetDays) ? Math.round(offsetDays) : 0;
  if (!baseDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)) {
    return getRelativeDateString(safeOffset);
  }
  const [y, m, d] = baseDateStr.split('-').map((n) => parseInt(n, 10));
  const target = new Date(Date.UTC(y, m - 1, d + safeOffset));
  return target.toISOString().split('T')[0];
}

/**
 * Resolve payment terms code (or custom days) into integer offset days
 * Supports: DUE_ON_RECEIPT (0), NET_5 (5), NET_10 (10), NET_15 (15), NET_30 (30), NET_60 (60), CUSTOM (customDays)
 */
export function resolveTermsDays(
  defaultTerms?: string | null,
  customDays?: number | string | null
): number {
  const term = (defaultTerms || 'NET_30').toUpperCase().trim();
  if (term === 'DUE_ON_RECEIPT' || term === 'NET_0') return 0;
  if (term === 'NET_5') return 5;
  if (term === 'NET_10') return 10;
  if (term === 'NET_15') return 15;
  if (term === 'NET_30') return 30;
  if (term === 'NET_60') return 60;
  if (term === 'CUSTOM') {
    const parsed = typeof customDays === 'number' ? customDays : parseInt(String(customDays ?? 14), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 14;
  }
  const match = term.match(/^NET_(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 30;
}

/**
 * Format payment terms code into a clean human-readable label
 */
export function formatTermsLabel(
  defaultTerms?: string | null,
  customDays?: number | string | null
): string {
  const days = resolveTermsDays(defaultTerms, customDays);
  const term = (defaultTerms || 'NET_30').toUpperCase().trim();
  if (term === 'DUE_ON_RECEIPT' || days === 0) return 'Due on Receipt';
  if (term === 'CUSTOM') return `Net ${days} Days (Custom)`;
  return `Net ${days} Days`;
}

/**
 * Format a customizable invoice number pattern with dynamic date tokens and sequence number.
 * Supported tokens (case-insensitive):
 *   {YEAR} or {YYYY} -> 4-digit year (e.g. 2026)
 *   {YY}             -> 2-digit year (e.g. 26)
 *   {MONTH} or {MM}  -> 2-digit month (e.g. 11)
 *   {DAY} or {DD}    -> 2-digit day (e.g. 05)
 *   {SEQ} or {NUM}   -> sequence number (e.g. 1001)
 *
 * Example:
 *   pattern = "INV-{YEAR}-{MONTH}-{DAY}", seq = 1001, date = "2026-11-05"
 *   -> "INV-2026-11-05-1001"
 */
export function formatInvoiceNumber(
  pattern?: string | null,
  seqNumber?: number | string | null,
  dateStr?: string | null
): string {
  const rawPattern = (pattern || 'INV-').trim() || 'INV-';
  const seqStr = String(seqNumber ?? 1001).trim() || '1001';

  let year4: string;
  let month2: string;
  let day2: string;

  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    year4 = parts[0];
    month2 = parts[1];
    day2 = parts[2];
  } else {
    const today = getRelativeDateString(0).split('-');
    year4 = today[0];
    month2 = today[1];
    day2 = today[2];
  }
  const year2 = year4.slice(-2);

  const hasExplicitSeqToken = /\{(SEQ|NUM|NUMBER)\}/i.test(rawPattern);

  let resolved = rawPattern
    .replace(/\{(YEAR|YYYY)\}/gi, year4)
    .replace(/\{YY\}/gi, year2)
    .replace(/\{(MONTH|MM)\}/gi, month2)
    .replace(/\{(DAY|DD)\}/gi, day2);

  if (hasExplicitSeqToken) {
    return resolved.replace(/\{(SEQ|NUM|NUMBER)\}/gi, seqStr);
  }

  // If pattern already ends with a delimiter ('-', '/', '_', ':'), append seq directly
  if (/[-/_:]$/.test(resolved)) {
    return `${resolved}${seqStr}`;
  }

  // Otherwise join with a hyphen (e.g. "INV-{YEAR}-{MONTH}-{DAY}" -> "INV-2026-11-05-1001")
  return `${resolved}-${seqStr}`;
}


