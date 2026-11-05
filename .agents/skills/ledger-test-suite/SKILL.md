---
name: ledger-test-suite
description: >-
  Automated verification harness, regression testing, and quality assurance protocol
  for The Architect's Ledger. Activate this skill before finishing any feature addition,
  bug fix, schema update, UI change, or refactoring.
---

# Ledger Automated Test Suite & Verification Skill

## 1. Master Verification Command
Always run the unified verification harness before marking any task complete:

```bash
node scripts/run-all-tests.js
```

This single script validates all 6 architectural pillars in under 1 second:
1. **SQLite WAL & Schema Integrity**: Confirms `journal_mode = WAL`, `foreign_keys = ON`, and presence of all tables/columns.
2. **Financial Integer Cent Math**: Verifies zero floating-point precision errors and checks every invoice in `ledger.db`.
3. **Client Edit & Default Exclusivity**: Ensures at most one default client per organization.
4. **Tokenized Access & Bcrypt PIN Gate**: Verifies 24-char `accessToken` and bcrypt PIN verification.
5. **PDF Engine Invariants**: Asserts `size="LETTER"` (`612 x 792 pt`) and ensures no root `lineHeight` collision on headings.
6. **Theme Contrast Invariants**: Confirms light/dark CSS variable mappings and `.text-obsidian` button contrast rules.

---

## 2. Targeted Feature Test Scripts
When working on a specific subsystem, you can also run individual test scripts in `scripts/`:
- `node scripts/test-app.js` — Core database, cent math, and semantic intent parser tests.
- `node scripts/test-pin-unlock.js` — End-to-end recipient PIN challenge and status transition (`SENT` $\rightarrow$ `VIEWED`).
- `node scripts/test-client-edit-and-default.js` — Client creation, editing, and default client switching.
- `node scripts/test-agent-draft.js` — Intent-to-Invoice AI Copilot natural language parser tests.

---

## 3. Adding Tests for New Features
Whenever you add or modify a feature:
1. Add an assertion block to [`scripts/run-all-tests.js`](file:///Users/shahjahanrasel/Development/myApps/ArtLedger/scripts/run-all-tests.js) or create a dedicated `scripts/test-<feature>.js` script.
2. If you modified TypeScript types, Next.js routes, or `globals.css`, run a production build check:
   ```bash
   npm run build
   ```
3. If the production server daemon is running on port `3005`, restart it after `npm run build` so the live server reflects the compiled changes.

---

## 4. Pre-Commit & Atomic Git Workflow
Before creating any git commit:
1. Run `node scripts/run-all-tests.js` and ensure 100% pass rate.
2. Inspect `git status` and stage only explicit modified/created source files (`git add <file1> <file2>`). Never stage `ledger.db*`, `.env*`, or temporary artifacts.
3. Format the commit message strictly using **Conventional Commits v1.0.0**:
   `<type>(<scope>): <imperative summary>` (e.g., `feat(invoice): ...`, `fix(pdf): ...`, `test(ledger): ...`).
4. Never use `--no-verify`, `git reset --hard`, or `git push --force`.


