# Artisan Ledger

<div align="center">

**Self-Hosted Archival Invoicing Platform for Independent Artisans, Creative Studios, Architects & Consultants**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.0_App_Router-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![SQLite WAL](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?style=flat-square&logo=sqlite)](https://sqlite.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-C5F74F?style=flat-square)](https://orm.drizzle.team/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

*Tactile Living Cotton Paper UI • Zero Floating-Point Cents Arithmetic • PIN-Gated Client Portal • Server-Side PDF Stream • Multi-Provider Dispatch (Resend + Gmail SMTP)*

</div>

---

## ✦ What is Artisan Ledger?

**Artisan Ledger** is an editorial, self-hosted financial ledger and invoice delivery engine. Designed for independent artisans, architects, industrial designers, ateliers, and specialized agencies who reject bloated corporate SaaS templates, cyan gradients, and glassmorphism.

Documents in Artisan Ledger render with the gravity of archival legal documents: crisp typographic hierarchy, warm living cotton paper surfaces (`#FAF8F5`), carbon black inks (`#18191B`), wax seal verification stamps, perforated tear-off remittance stubs, and encrypted recipient access portals.

---

## ✦ Architectural Highlights & Guarantees

| Invariant | Implementation Guarantee |
| :--- | :--- |
| **Zero Floating-Point Math** | All currency is stored strictly as **integer cents** (`$1,500.50` = `150050`). Tax rates stored in **basis points** (`8.25%` = `825`). No IEEE-754 decimal drift. |
| **Living Paper Document Canvas** | Invoices are edited directly in-place on a reactive, true-to-scale cotton paper sheet (`#FAF8F5`) centered over Obsidian Slate (`#111215`). |
| **Dual Delivery Engine** | Built-in transactional email dispatch via **Resend API** or direct **Gmail SMTP** (supports unlimited To, CC, and BCC recipients with Google App Passwords). |
| **PIN-Gated Recipient Portal** | Invoices are securely delivered via 24-char cryptographic token (`/view/[token]`) protected by a bcrypt-hashed 6-digit verification PIN. |
| **Server-Side PDF Streaming** | Generates pixel-perfect, archival US Letter (`size="LETTER"`) PDFs via `@react-pdf/renderer` with embedded typography and perforated wire transfer stubs. |
| **Natural Language AI Copilot** | Press `Cmd+K` anywhere in the app to draft full invoices using natural language instructions (supports OpenAI tool-calling with deterministic parser fallback). |
| **Zero External Database Overhead** | Single-file embedded SQLite (`ledger.db`) running with `journal_mode = WAL`, `busy_timeout = 10000`, and `foreign_keys = ON`. Single-container deployment friendly. |

---

## ✦ Design System: Living Cotton Paper & Obsidian Slate

Artisan Ledger's editorial design system is built from tactile physical stationery principles:

- **Canvas Background:** `#111215` (Obsidian Slate) / `#F0EBE1` (Limestone Light)
- **Document Paper:** `#FAF8F5` (Warm Archival Cotton Paper)
- **Hairline Dividers:** `#E6E1D9` (Muted Parchment)
- **Primary Ink:** `#18191B` (Deep Carbon)
- **Secondary Ink:** `#5C5E62` (Pencil Graphite)
- **Status Wax Vermilion:** `#C84630` (Overdue / Seal)
- **Status Hunter Green:** `#2B4C3F` (Verified / Paid)
- **Status Aged Brass:** `#D4AF37` (Draft / Pending)
- **Typography:** Serif headings (`Newsreader`, `Playfair Display`), Monospace figures (`Geist Mono`, `IBM Plex Mono`), and Humanist Sans copy (`Geist Sans`, `Inter`).

---

## ✦ Pre-Seeded Practitioner Accounts

The database seeds an initial practitioner account for rapid evaluation:

- **Practitioner Email:** `architect@ledger.com`
- **Password:** `architect123`
- **Firm Name:** `Atelier Vance Architects`

### Pre-Seeded Archival Invoices:
1. **Invoice `INV-1001` (Status: `SENT`)**
   - **Debtor:** Metro Studio Architecture
   - **Total:** \$11,799.25 (Subtotal \$10,900.00 + 8.25% Tax)
   - **Verification Passcode (PIN):** `482910`
   - **Encrypted Portal URL:** `/view/token-arch-exemplar-metro-2026`
   - **PDF Stream:** `/api/invoices/inv_1001/pdf?token=token-arch-exemplar-metro-2026`

2. **Invoice `INV-1002` (Status: `PAID`)**
   - **Debtor:** Sterling Engineering Associates
   - **Total:** \$6,000.00 (Certified Paid via wire transfer)
   - **Verification Passcode (PIN):** `193820`
   - **Encrypted Portal URL:** `/view/token-arch-exemplar-sterling-2026`

3. **Invoice `INV-1003` (Status: `DRAFT`)**
   - **Debtor:** Metro Studio Architecture
   - **Total:** \$3,788.75

---

## ✦ Core Workflows

### 1. In-Place Living Document Editor
- Invoices render as genuine physical paper sheets with true-to-scale margins.
- Click and edit line items inline with automatic row creation via `Tab` or `Enter`.
- Real-time cents calculation for subtotal, tax basis points, and grand total.
- Customizable perforated tear-off remittance stub with wire transfer routing.

### 2. Dispatch Studio & Preview Modal
- Review the exact email subject, body, and attached PDF before sending.
- Live CC / BCC recipient configuration with automatic tag management.
- Seamless provider switching between Resend API and Gmail SMTP.
- Instant fallback routing for unverified sandbox domains.

### 3. PIN-Gated Recipient Experience (`/view/[token]`)
- Debtors receive a minimalist email notice with an invitation to access the verified document.
- Protected by a 6-digit numeric PIN challenge styled like a physical envelope lock.
- Once verified, the debtor can inspect the living document, copy remittance wire coordinates, and stream an official signed PDF.

### 4. Intent-to-Invoice AI Copilot (`Cmd+K`)
- Invoke the copilot drawer with `Cmd+K`.
- Type unstructured conversational instructions:
  > *"Bill Metro Studio \$8,500 for Masterplan Schematics and 14 hrs CAD drafting at \$150/hr, Net 15"*
- The engine automatically structures deliverables, converts rates to cents, computes due dates, and binds the debtor.

---

## ✦ Installation & Local Development

```bash
# 1. Clone repository
git clone https://github.com/your-username/artisan-ledger.git
cd artisan-ledger

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env.local

# 4. Run automated test suite (invariants, math, schema)
node scripts/run-all-tests.js

# 5. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the platform.

---

## ✦ Deployment & Self-Hosting

Artisan Ledger is designed for seamless zero-maintenance self-hosting via Docker or [Coolify](https://coolify.io).

### Docker Deployment
```bash
# Build production Docker image
docker build -t artisan-ledger .

# Run with persistent SQLite volume
docker run -d \
  -p 3005:3005 \
  -v artisan_data:/app/data \
  -e DATABASE_URL=/app/data/ledger.db \
  --name artisan-ledger \
  artisan-ledger
```

### Self-Hosting on Coolify
1. Connect your Git repository in Coolify.
2. Select **Next.js** or **Dockerfile** deployment type.
3. Attach a persistent storage volume pointing to the directory containing `ledger.db`.
4. Configure domain and SSL (Let's Encrypt). Coolify will automatically handle zero-downtime rolling deploys.

---

## ✦ License

Distributed under the MIT License. Crafted with precision for independent creators and archival purists.
