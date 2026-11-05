---
name: ledger-delivery-engine
description: >-
  PDF streaming engine (@react-pdf/renderer), US Letter page geometry, tokenized
  PIN verification portal, and transactional email dispatch for The Architect's Ledger.
  Activate this skill whenever working on PDF layout, invoice dispatch, PIN gates,
  recipient view portals, or email templates.
---

# Ledger Delivery Engine & PDF Streaming Skill

## 1. Key Files
- [`src/lib/pdf/InvoicePdfTemplate.tsx`](../../../src/lib/pdf/InvoicePdfTemplate.tsx): `@react-pdf/renderer` document layout.
- [`src/app/api/invoices/[id]/pdf/route.ts`](../../../src/app/api/invoices/[id]/pdf/route.ts): Server-side PDF stream endpoint with dual authorization (session owner OR verified recipient token).
- [`src/app/api/invoices/[id]/dispatch/route.ts`](../../../src/app/api/invoices/[id]/dispatch/route.ts): Token & 6-digit PIN generation, bcrypt hashing, DB update (`status = 'SENT'`), and email dispatch.
- [`src/app/view/[token]/page.tsx`](../../../src/app/view/[token]/page.tsx) & [`actions.ts`](../../../src/app/view/[token]/actions.ts): Recipient portal and PIN unlock Server Action.
- [`src/lib/email.ts`](../../../src/lib/email.ts): Resend transactional email dispatcher with terminal simulation fallback.

---

## 2. `@react-pdf/renderer` Rules & Invariants (CRITICAL)

1. **US Letter Page Size**:
   - Always use `<Page size="LETTER" style={styles.page}>` (`612 x 792 pt` / `8.5" x 11"`).
2. **Preventing Vertical Text Overlap**:
   - **NEVER set `lineHeight` on `styles.page`**. In `@react-pdf/renderer` v4, a root `lineHeight` on a `9pt` page calculates a fixed `12.6pt` line box that is inherited by `22pt` headings (`brandTitle`), causing subtitles to collide with headings.
   - Always specify `lineHeight` explicitly on individual text styles that require it (`brandTitle: { fontSize: 22, lineHeight: 1.15, marginBottom: 4 }`, `brandSubtitle: { fontSize: 8, lineHeight: 1.2 }`, `addressLine: { fontSize: 8.5, lineHeight: 1.3 }`).
   - Keep `styles.brandContainer` bounded with `maxWidth: '75%'` so long company names never collide with the right-aligned status stamp.
3. **Null-Safe Cents Formatting**:
   - Drizzle nullable integer columns (`invoice.discountCents`, `invoice.taxAmountCents`, `invoice.taxRateBasisPoints`) must always coalesce to `0` (`invoice.discountCents || 0`) before passing to `formatCentsToCurrency`.

---

## 3. Tokenized Dispatch & PIN Verification Lifecycle

1. **Dispatch (`POST /api/invoices/[id]/dispatch`)**:
   - Generates a 6-digit numeric PIN (`generatePasscode()`) and hashes it with bcrypt (`hashPasscode()`).
   - Preserves existing `accessToken` or generates a 24-character token (`generateAccessToken(24)`).
   - Updates `invoices` row: `status = 'SENT'`, `sentAt = now`, `accessPasscode = hashedPin`.
   - Sends HTML email via `sendInvoiceEmail()` containing the plaintext PIN and `/view/[accessToken]` link.
2. **Recipient Unlock (`verifyPinAndUnlock` in `src/app/view/[token]/actions.ts`)**:
   - Validates submitted PIN against `invoice.accessPasscode` using `verifyPasscode()`.
   - Calls `grantInvoiceViewAccess(token)` to set an encrypted HTTP-only cookie (`ledger_view_access`).
   - Updates `lastViewedAt = now` and transitions `status` from `'SENT'` $\rightarrow$ `'VIEWED'`.
3. **PDF Download Authorization (`GET /api/invoices/[id]/pdf`)**:
   - Allows download if the requester is the authenticated organization owner OR has a valid `token` query parameter / verified view session cookie.

---

## 4. Verification Step
After modifying PDF styles or dispatch logic, verify PDF geometry and PIN flows:
```bash
node scripts/run-all-tests.js
```

