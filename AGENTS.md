# The Architect's Ledger — Agent Constitution & Operating Rules

You are working on **The Architect's Ledger**, a minimalist, tactile, archival legal document invoicing platform built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Drizzle ORM (`better-sqlite3` in WAL mode), and `@react-pdf/renderer`.

## 1. Progressive Disclosure & Token Conservation (CRITICAL)
To minimize token consumption and prevent context bloat:
- **DO NOT** read the entire codebase or unrelated files on every request.
- **ACTIVATE ONLY THE RELEVANT SKILL** from `.agents/skills/` for the specific domain you are modifying:
  - Database / Schema / Cents Math $\rightarrow$ Read [`.agents/skills/ledger-schema/SKILL.md`](.agents/skills/ledger-schema/SKILL.md)
  - UI / Styling / Dark & Light Theme $\rightarrow$ Read [`.agents/skills/ledger-design-system/SKILL.md`](.agents/skills/ledger-design-system/SKILL.md)
  - PDF Generation / PIN Gate / Email Dispatch $\rightarrow$ Read [`.agents/skills/ledger-delivery-engine/SKILL.md`](.agents/skills/ledger-delivery-engine/SKILL.md)
  - Testing / Verification / Regressions $\rightarrow$ Read [`.agents/skills/ledger-test-suite/SKILL.md`](.agents/skills/ledger-test-suite/SKILL.md)

---

## 2. Non-Negotiable Boundaries & Invariants

1. **Zero Floating-Point Currency Rule**:
   - Store and compute all monetary figures strictly as **integer cents** (`$150.50` = `15050`).
   - Store tax rates in **basis points** (`8.25%` = `825`).
   - Always use `Math.round()` when converting user input or calculating tax/discounts.
2. **Database & Data Loss Prevention Boundary**:
   - SQLite (`ledger.db`) must always run with `journal_mode = WAL`, `busy_timeout = 10000`, and `foreign_keys = ON`.
   - **STOP AND VERIFY**: Never run `DROP TABLE`, `TRUNCATE`, or delete `ledger.db` without explicit user consent.
   - Use idempotent `ALTER TABLE ... ADD COLUMN` checks in `src/db/index.ts` when adding new columns to preserve existing records.
3. **Editorial Design System Boundary**:
   - Strictly forbid generic SaaS styles (no indigo `#4F46E5`, no cyan/purple gradients, no glassmorphism).
   - Maintain the separation between **Canvas** (`bg-obsidian`: `#111215` dark / `#F0EBE1` light) and **Living Cotton Paper** (`bg-paper`: `#FAF8F5` with `#18191B` carbon ink).
   - Ensure high-contrast legibility in both Light Mode (`html:not(.dark)`) and Dark Mode (`html.dark`).
4. **Document & Security Delivery Boundary**:
   - Server-side PDF streams (`src/lib/pdf/InvoicePdfTemplate.tsx`) must always render in **US Letter** size (`size="LETTER"`, `612 x 792 pt`) with explicit `lineHeight` on headings to prevent vertical text overlap.
   - Recipient portal (`/view/[token]`) must remain gated by a 24-char `accessToken` and bcrypt-hashed 6-digit `accessPasscode` (PIN).

---

## 3. Mandatory Pre-Flight & Post-Change Protocol

Whenever asked to add, enhance, or remove any feature:
1. **Pre-Flight Check**: Identify affected files across DB (`src/db/schema.ts`), API (`src/app/api/*`), UI (`src/components/*`, `src/app/*`), and PDF (`src/lib/pdf/*`).
2. **Targeted Execution**: Apply minimal, surgical edits adhering to the relevant skill runbook.
3. **Mandatory Verification**:
   - Run `node scripts/run-all-tests.js` to validate all core invariants and regression suites.
   - If adding a new feature, add a corresponding test assertion to the verification suite.
   - Run `npm run build` when modifying routes, types, or global CSS.

---

## 4. Git & Version Control Governance (Industry Standard)

1. **Conventional Commits v1.0.0 Specification**:
   - Every commit message MUST follow `<type>(<scope>): <imperative summary>` (max 72 chars on the subject line).
   - **Allowed Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `security`.
   - **Allowed Scopes**: `schema`, `invoice`, `client`, `pdf`, `theme`, `auth`, `delivery`, `agent`.
   - *Example*: `feat(client): add cascade confirmation modal for client deletion`
2. **Pre-Commit Verification Gate (Zero Broken Commits)**:
   - **NEVER** create a git commit unless `node scripts/run-all-tests.js` (`npm test`) has just been executed and passed 100%.
   - **NEVER** bypass git hooks with `--no-verify`.
3. **Explicit Staging & Secret/Artifact Hygiene**:
   - **NEVER** run blind `git add .` or `git add -A` without inspecting `git status` first.
   - Stage explicit file paths (`git add <path1> <path2>`) and **NEVER** stage `.env*`, `ledger.db*`, `.next/`, or temporary test artifacts (`*.pdf`, `*.png`).
   - Keep commits **atomic**: one logical feature or bug fix per commit so any commit can be cleanly reverted (`git revert <sha>`).
4. **Forbidden Destructive Git Operations**:
   - **NEVER** execute `git reset --hard`, `git push --force`, `git clean -fd`, `git checkout -- .`, or `git branch -D` without explicit user authorization.


