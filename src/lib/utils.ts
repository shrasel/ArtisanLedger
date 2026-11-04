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
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

