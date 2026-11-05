---
name: ledger-design-system
description: >-
  Editorial design system, color palette, typography rules, Living Paper Sheet layout,
  and Dark/Light theme contrast architecture for The Architect's Ledger.
  Activate this skill whenever creating or modifying UI components, pages, modals,
  buttons, forms, or CSS themes.
---

# The Architect's Ledger — Editorial Design System Skill

## 1. Key Files
- [`tailwind.config.ts`](../../../tailwind.config.ts): Custom theme tokens (`obsidian`, `paper`, `bone`, `ink`, `status`), fonts, and editorial shadows.
- [`src/app/globals.css`](../../../src/app/globals.css): Light (`#F0EBE1`) and Dark (`#111215`) canvas CSS variables and contrast rules.
- [`src/components/theme/ThemeToggle.tsx`](../../../src/components/theme/ThemeToggle.tsx): Light / Dark / System switcher syncing `.dark` class and `<meta name="color-scheme">`.
- [`src/components/invoice/InvoicePaperSheet.tsx`](../../../src/components/invoice/InvoicePaperSheet.tsx): The inline-editable "Living Document" sheet.

---

## 2. Two-Surface Architecture (Canvas vs. Paper Sheet)

The application is strictly divided into two physical metaphors:

### Surface A: The Studio Desk Canvas (`bg-obsidian`, `bg-obsidian-light`)
Adapts between **Dark Mode** (`html.dark`) and **Light Mode** (`html:not(.dark)`):

| Token / Class | Dark Mode (Obsidian Slate) | Light Mode (Limestone Desk) | Usage |
| :--- | :--- | :--- | :--- |
| `bg-obsidian` | `#111215` | `#F0EBE1` | Main page background |
| `bg-obsidian-light` | `#1A1C20` | `#FAF8F5` | Navigation bar, metric cards, table containers |
| `border-obsidian-border` | `#27292E` | `#DED8CE` | Hairline structural borders |
| `text-paper` | `#FAF8F5` (Warm White) | `#18191B` (Deep Carbon) | Primary headings & values on canvas |
| `text-bone-dark` | `#D5CFC5` (Muted Bone) | `#5C5E62` (Pencil Graphite) | Secondary copy, navigation links, dates |
| `text-ink-ghost` | `#A1A3A8` (Guide Gray) | `#5C5E62` (Pencil Graphite) | Section labels, table headers, metadata |

### Surface B: The Living Archival Paper Sheet (`bg-paper`)
**Always static warm cotton paper** in both light and dark modes (like a physical legal sheet resting on a desk):
- Background: `bg-paper` (`#FAF8F5`), nested inputs/stubs use `bg-paper-dark` (`#F3EFEA`).
- Dividers: `border-bone` (`#E6E1D9`) or `border-ink-primary` (`#18191B`).
- Primary Text: `text-ink-primary` (`#18191B`).
- Secondary Text: `text-ink-secondary` (`#5C5E62`).

---

## 3. Button & Control Contrast Rules (CRITICAL)

To prevent invisible light-on-light or dark-on-dark text across themes:
1. **Bone / Brass Primary Action Buttons on Canvas**:
   - Use `bg-bone hover:bg-paper text-obsidian font-mono text-xs uppercase tracking-wider font-bold rounded-[2px]`.
   - `.text-obsidian` is locked to `#111215 !important` in `globals.css` so it is always dark carbon ink.
2. **Dark Ink Action Buttons (Inside Paper / Modals)**:
   - Use `bg-ink-primary hover:bg-black text-paper font-mono text-xs uppercase tracking-wider font-bold rounded-[1px]`.
   - `globals.css` preserves `--text-paper-val: #FAF8F5 !important` inside `.bg-ink-primary` and `.bg-black`.
3. **Canvas Form Inputs (`SettingsForm`, `InvoiceCopilotBar`)**:
   - Use `bg-obsidian border border-obsidian-border text-paper`.
   - In light mode, `globals.css` automatically maps `input.bg-obsidian`, `select.bg-obsidian`, and `textarea.bg-obsidian` to `#FFFFFF` background with `#18191B` text.
4. **Never use opacity modifiers on `text-bone-dark`** (e.g. avoid `text-bone-dark/60`), as Tailwind compiles hex opacity statically and bypasses CSS variable overrides in light mode. Use `text-ink-ghost` instead.

---

## 4. Typography & Status Colors
- `font-serif` (`Newsreader` / `Georgia`): Display titles, company names, legal headers.
- `font-mono` (`Geist Mono` / `Courier`): All monetary figures, invoice numbers, dates, PINs, badges.
- `font-sans` (`Geist Sans` / `Inter`): Descriptions, form labels, body copy.
- **Status Colors**:
  - `status-hunter` (`#2B4C3F`): Verified / Paid / Default Client badge.
  - `status-brass` (`#D4AF37`): Draft / Pending / Accents.
  - `status-vermilion` (`#C84630`): Wax Seal / Overdue / Void / Errors.

