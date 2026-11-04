# The Architect's Ledger

> **A production-grade, minimalist, high-end invoice creation and delivery web application.** Built with an editorial, tactile, archival legal document aesthetic.

---

## 1. Architectural & Technical Stack
- **Framework:** Next.js 15+ (App Router, React 19, Server Actions, TypeScript)
- **Styling:** Tailwind CSS with raw, un-bloated bespoke components and `lucide-react`
- **Database & Storage:** SQLite using `better-sqlite3` via **Drizzle ORM**
  - **WAL Mode Active:** `PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 10000; PRAGMA foreign_keys = ON;`
  - **Financial Currency Rule:** All monetary figures stored as **integer cents** (e.g., \$150.50 -> `15050`) to eliminate floating-point precision errors. Tax rates stored in **basis points** (8.25% -> `825`).
- **Authentication:** Session-based authentication with encrypted HTTP-only session cookies (`jose` JWT) and `bcryptjs` password hashing.
- **PDF Engine:** `@react-pdf/renderer` rendering server-side streams matching the exact editorial theme.
- **Transactional Email:** Resend integration with tokenized delivery links and built-in simulation fallback for local development.
- **AI Copilot:** Intent-to-Invoice natural language drafting engine (supports both OpenAI tool-calling and deterministic parsing fallback).

---

## 2. Design System: "The Architect's Ledger"
Strictly avoids generic corporate SaaS layouts (no purple/indigo `#4F46E5`, no AI-style cyan gradients, no glassmorphism, no bloated cards).

### Color Palette
- **Deep Canvas Background:** `#111215` (Obsidian Slate)
- **Document Paper Surface:** `#FAF8F5` (Warm Archival Cotton Paper)
- **Hairline Dividers:** `#E6E1D9` (Muted Bone/Parchment)
- **Primary Ink:** `#18191B` (Deep Carbon)
- **Secondary Ink:** `#5C5E62` (Pencil Graphite)
- **Ghost/Metadata Ink:** `#A1A3A8` (Technical Guide Gray)
- **Status Vermilion:** `#C84630` (Wax Seal / Overdue / Warning)
- **Status Hunter Green:** `#2B4C3F` (Verified / Paid)
- **Status Brass:** `#D4AF37` (Draft / Pending)

### Typography Metaphor
- **Display Headings & Entity Names:** Editorial Serif (`Newsreader`, `Playfair Display`, `Georgia`)
- **Tabular Numbers, Dates, Code, Monetary Totals:** Crisp Monospace (`Geist Mono`, `IBM Plex Mono`, `Courier New`)
- **Explanatory Copy & Inputs:** Neutral Humanist Sans (`Geist Sans`, `Inter`, system-ui)

---

## 3. Pre-Seeded Practitioner Accounts & Sample Invoices

The database is pre-seeded with a firm and sample invoices:

- **Practitioner Email:** `architect@ledger.com`
- **Password:** `architect123`
- **Firm Name:** `Atelier Vance Architects`

### Seeded Documents:
1. **Invoice `INV-1001` (Status: `SENT`)**
   - **Debtor:** Metro Studio Architecture (Sarah Jenkins)
   - **Total:** \$11,799.25 (Subtotal \$10,900.00 + 8.25% Tax)
   - **Verification Passcode (PIN):** `482910`
   - **Encrypted Portal URL:** `/view/token-arch-exemplar-metro-2026`
   - **PDF Stream:** `/api/invoices/inv_1001/pdf?token=token-arch-exemplar-metro-2026`

2. **Invoice `INV-1002` (Status: `PAID`)**
   - **Debtor:** Sterling Engineering Associates (David Sterling)
   - **Total:** \$6,000.00 (Certified Paid via wire)
   - **Verification Passcode (PIN):** `193820`
   - **Encrypted Portal URL:** `/view/token-arch-exemplar-sterling-2026`

3. **Invoice `INV-1003` (Status: `DRAFT`)**
   - **Debtor:** Metro Studio Architecture
   - **Total:** \$3,788.75

---

## 4. Key Workflows & Features

### Phase 1: Practitioner Onboarding & Auth
- **Registration (`/register`)** & **Sign In (`/login`)**.
- **3-Step Setup Form (`/onboarding`)**:
  - *Step 1: User Profile* (Name, Phone).
  - *Step 2: Business Profile* (Company name, Address, Tax ID, Currency, Invoice Prefix).
  - *Step 3: Payout Information* (Bank name, Account holder, Routing/SWIFT, Account number, Wire instructions).

### Phase 2: The Living Document Invoice Editor
- Displays invoices as archival cotton paper sheets (`#FAF8F5`) centered on obsidian slate (`#111215`).
- Click and edit inline directly on the paper canvas:
  - Client selector dropdown + quick "Add New Client" drawer.
  - Interactive line item rows: auto-calculates total on typing quantity/rate; automatically adds new rows with `Tab` or `Enter`.
  - Subtotal, Tax toggle (basis points), and Total calculate reactively in state with integer cent precision.
  - Rubber stamp status badges (DRAFT in Brass, DISPATCHED in Graphite, PAID in Hunter Green, OPENED in Vermilion).
  - Remittance advice wire transfer stub at the foot of each document.

### Phase 3: Secure Delivery & Passcode Verification Portal (`/view/[token]`)
- Dispatching generates a cryptographically secure token and 6-digit numeric PIN.
- Recipient is challenged with an editorial envelope PIN pad.
- Upon entering the correct PIN:
  - Sets an encrypted HTTP-only session cookie granting temporary view access.
  - Updates `lastViewedAt = CURRENT_TIMESTAMP` and changes status to `VIEWED` if currently `SENT`.
  - Unfolds the full archival invoice document with wire instructions and a "Download Official PDF" action.

### Phase 4: Server-Side PDF Stream (`/api/invoices/[id]/pdf`)
- Rendered via `@react-pdf/renderer`.
- Displays serif header, structured grid metadata, mono line items table, and perforated tear-off remittance wire transfer stub.

### Phase 5: Intent-to-Invoice AI Copilot (`Cmd+K`)
- Triggered by `Cmd+K` (or floating brass pill).
- Parses unstructured plain text commands like:
  > *"Bill Metro Studio \$8,500 for Masterplan Schematics and 14 hrs CAD drafting at \$150/hr, Net 15"*
- Immediately populates the living paper sheet with parsed client, deliverables, rates, and due dates.

---

## 5. Development & Testing Commands

```bash
# Run production build
npm run build

# Start server
npx next start -p 3005

# Run automated test suite
node scripts/test-app.js
```
