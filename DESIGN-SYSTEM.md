# FinLink Forms — Design System

The reusable style layer behind the Selbstauskunft prototype. Use it as the single source of truth when adding sections so everything stays consistent. Design language: **single brand accent (themeable: Teal / Blue / Neutral), neutral surfaces, IBM Plex Sans, top-aligned persistent labels, 8px rhythm, power-user density with a comfortable/compact toggle.**

---

## 1. Design tokens

### Color

Accent colors are **brand tokens** — never hard-code an accent hex in components. Every accent use goes through `--brand-*`, which the active branding theme defines.

| Token | Role |
|---|---|
| `--brand-700` | Section headers, active nav, selected chip text, unit suffix text, primary button hover |
| `--brand-600` | Primary button, selected chip border, subheads, add-btn |
| `--brand-500` | Focus border, chip hover border, save-state dot |
| `--brand-100` | Reserved light accent (illustrations, charts) |
| `--brand-50` | Selected chip fill, unit suffix bg, active nav bg |
| `--brand-ring` | Focus ring (`rgba` of the primary at ~.28, Neutral ~.18) |

### Branding themes

Switched via a `body` class (`theme-teal` is the `:root` default); toggle lives in the sidebar under **Branding**. `document.body.classList.add('theme-blue' | 'theme-neutral')`.

| Token | Teal (default) | Blue (`.theme-blue`) | Neutral (`.theme-neutral`) |
|---|---|---|---|
| `--brand-700` | `#317574` | `#003EB4` | `#282828` |
| `--brand-600` | `#46A6A4` | `#2F70E8` | `#282828` |
| `--brand-500` | `#46A6A4` | `#2F70E8` | `#282828` |
| `--brand-100` | `#BEEAE9` | `#96B7F3` | `#A8AEBA` |
| `--brand-50` | `#E5F7F6` | `#CEDDFE` | `#EAEAEA` |
| `--brand-ring` | `rgba(70,166,164,.28)` | `rgba(47,112,232,.28)` | `rgba(40,40,40,.18)` |

Unused palette steps kept for reference: Teal `#7FD6D4`, Blue `#001F5B` (deep navy), Neutral `#F6F8FB` / `#686D78`.

**Neutral is fully greyscale** — even the form-field focus border/ring is dark black (`#282828`), and the primary button hovers to `#000`. Semantic colors (`--req` red, amber `.note`) stay constant across themes.

### Neutrals (theme-independent)

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#0f172a` | Primary / structural text, input values |
| `--ink-2` | `#334155` | Unselected chip text, ghost button text |
| `--muted` | `#64748b` | Labels, secondary text, help text |
| `--faint` | `#94a3b8` | Placeholders, kickers, eyebrow labels |
| `--line` | `#e2e8f0` | Hairlines, dividers, section borders |
| `--border` | `#cbd5e1` | Input resting border |
| `--surface` | `#f8fafc` | Section surface (never a tint) |
| `--white` | `#fff` | Inputs, chips, sub-cards |
| `--req` | `#e11d48` | Required asterisk |

**Rule: one brand accent at a time. Never mix themes, never introduce a second accent.**

### Spacing — 8px scale
`--s2:8` · `--s3:12` · `--s4:16` · `--s5:20` · `--s6:24` · `--s8:32` · `--s10:40`
Conventions: label→input `6px`, field→field `--s5`, section→section `--s6`, section inner padding `--s8`.

### Radius & borders
Inputs/chips `8px` · sections `14px` · sub-cards `12px` · buttons `9px`. Borders are `1px`; resting `--border`, hairlines `--line`.

### Density
Toggle swaps CSS vars via `body.compact`:

| | Comfortable | Compact |
|---|---|---|
| `--field-h` | `38px` | `30px` |
| `--input-size` | `14.5px` | `14px` |
| `--s5 / --s6 / --s8` | `20 / 24 / 32` | `14 / 18 / 24` |

Do not go below a 24px click target (WCAG 2.5.8).

---

## 2. Typography

**IBM Plex Sans** throughout (400/500/600/700).

| Element | Size / weight | Color |
|---|---|---|
| Page title | 26 / 600, `-0.01em` | `--ink` |
| Section header (h2) | 17 / 600 | `--brand-700` |
| Subhead (eyebrow) | 11 / 600, uppercase, `.12em` | `--brand-600` |
| Field label | 12.5 / 500 | `--muted` |
| Input value | 14.5 / 400 | `--ink` |
| Help text | 12 / 400, line-height 1.4 | `--muted` |
| Kicker (section meta) | 12 / 500 | `--faint` |

---

## 3. Components

Class names map 1:1 to the stylesheet. Copy the `<style>` block from `selbstauskunft.html` (or split it into `finlink-forms.css`) — it is the canonical implementation.

- **Section** — `.section` (surface + border + radius) → `.section-head` (`h2` + `.kicker`, hairline under). Chunk long sections with `.subhead` eyebrows.
- **Grid** — `.grid` is 12 columns. Field spans: `.col-12 / .col-8 / .col-6 / .col-4 / .col-3`. Width = expected content (PLZ `.col-3`, Ort `.col-6`, Straße `.col-8` + Hausnr `.col-4`).
- **Field** — `.field` wraps `label` → optional `.help` → control. Required: `<span class="req">*</span>` inside the label.
- **Input / select** — full-width, `--field-h` tall, brand `:focus-visible` ring. `select` uses a custom neutral chevron.
- **Unit input** — `.with-unit` wrapping `input` + `<span class="unit">m²</span>` (also `€`, `kWh/m²`). Right-aligns the number, tabular figures.
- **Segmented single-select** — `.choices[data-single]` of `.choice` buttons. **No radio dot.** Selection = `aria-pressed="true"` → brand-50 fill + brand-600 border + checkmark. Use for 2–5 options (§ power-user: visible beats a dropdown). `.grid-choices` for a 2-col grid (e.g. Stellplatz types).
- **Conditional reveal** — `.reveal > .reveal-inner > .pad`. Animates `grid-template-rows 0fr→1fr` + opacity. Toggle `.open`.
- **Sub-card / repeatable group** — `.subcard` (`.subcard-head` with title + `.x` remove) + `.add-btn` (dashed brand accent). See Stellplatz `<template>`.
- **Note** — `.note` (soft amber) for scaffolds / helper callouts.
- **Nav** — `.nav a`, active = `.active`. Conditional entries use `.object-nav` + `.show`.
- **Action bar** — sticky `.actionbar` with `.save-state`, `.btn.ghost`, `.btn.primary`.

---

## 4. The conditional pattern (how reveals wire up)

Two mechanisms, both declarative in the markup:

**A. Intra-section conditional** — a choice group reveals a block:
```html
<div class="choices" data-single data-controls="#target" data-show-when="Ja"> … </div>
<div class="reveal" id="target"><div class="reveal-inner"><div class="pad"> … </div></div></div>
```
`data-controls` = selector of the reveal; `data-show-when` = the value that opens it. The engine wires every `.choices[data-single]` automatically.

**B. Section swap by finance type** — object sections are mutually exclusive:
```html
<div class="reveal object-section" data-for="Kauf"> …Immobilie section… </div>
<a class="object-nav" data-navfor="Kauf">Immobilie</a>
```
`selectFinanceType(val)` opens the `.object-section` whose `data-for` matches and shows the matching `.object-nav`. Default is set by calling it with `"Kauf"` on load.

To add a new conditional: give the trigger `data-controls`/`data-show-when` and wrap the dependent fields in a `.reveal`. No JS edits needed.

---

## 5. German locale (non-negotiable)

- Decimal **comma**: `1.234,56 €`. `inputmode="decimal"`, accept both separators, store canonical.
- Dates **`tt.mm.jjjj`** (year-only `jjjj`, month-year `mm.jjjj`). Store ISO 8601.
- Currency `€` as a right-hand unit suffix; areas `m²`; energy `kWh/m²`.
- Copy is sentence-case, plain, user-facing (label what the person controls, not the system).

---

## 6. Recipe: add a new section

1. Add `<a href="#id">Titel</a>` to `.nav` (or `.object-nav` + `data-navfor` if it's finance-type-conditional).
2. Add `<section class="section" id="id">` with a `.section-head`; chunk with `.subhead` eyebrows.
3. Lay fields in a `.grid` using `.col-*` spans sized to content.
4. For conditionals, use pattern A above — trigger `data-controls`/`data-show-when` + a `.reveal`.
5. Keep to the tokens and type scale. Don't introduce new colors, radii, or a second accent.

Run the power-user checklist before shipping: keyboard-only completion in a confirmed tab order, one wide screen, live save-state, inline colour-blind-safe validation, density toggle, correct locale.
