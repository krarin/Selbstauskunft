# Finlink Core — Design Token Contract

**Version:** 1.0 · **Generated from:** `Finlink Core Primitives`, `Finlink Core Semantics`, `Default` (typography)
**Format:** W3C Design Token Community Group (`$value` / `$type`) with Figma extensions
**Status:** Single mode (light only). Ships 109 primitives, 93 semantic colours, 14 typography roles.

> **For the agent reading this file:** This is a binding contract, not a style suggestion. Sections 1–7 tell you what to produce. **Section 9 is mandatory** — it lists the things this token system cannot currently express, and the exact escalation format to use instead of inventing a value. Never silently substitute. Never round to the nearest hex.

---

## 0. Agent operating instructions

Follow this loop for every UI request in this repository.

### 0.1 The four laws

1. **No raw values in component code.** No hex, no `rgb()`, no `px` font sizes, no arbitrary spacing. Every visual property resolves to a token.
2. **Components consume semantic tokens only.** Primitives are private (`--_ds-` prefix). If you find yourself writing `var(--_ds-color-teal-500)` in a component, you have skipped a layer — find or request the semantic token instead.
3. **Typography is applied as a whole role, never as loose properties.** Use `.ds-text-body-md-default`, not `font-size: 14px; line-height: 20px`.
4. **When a token does not exist, stop and escalate** using the format in §9.4. Do not approximate.

### 0.2 Decision procedure

```
Need a colour?
  ├─ Is it a surface/fill?      → --ds-color-background-{intent}-{prominence}-{state}
  ├─ Is it text or a glyph?     → --ds-color-text-{intent}-{prominence}-{state}
  ├─ Is it a stroke/divider?    → --ds-color-border-{intent}-{prominence}-{state}
  ├─ Is it an icon?             → --ds-color-icon-{intent}-{prominence}-{state}
  └─ Not in the table (§4.2)?   → ESCALATE (§9.4). Do not use a primitive.

Need type?
  └─ Pick the closest role from the 14 in §4.3.
     No role fits (e.g. you want a 48px hero, a link style,
     an uppercase overline, or tabular numerals)? → ESCALATE (§9.4)

Need spacing / radius / border-width / icon size?
  └─ Use the scales in §4.4. Off-scale value needed? → ESCALATE (§9.4)

Need a shadow, an elevation, a focus ring, or a dark-mode value?
  └─ These do not exist yet. → ESCALATE (§9.4), then use the documented
     interim fallback listed in §9.2 so the prototype still ships.
```

### 0.3 Self-check before you finish

Run this against every file you touched:

- [ ] Zero hex literals outside `tokens.css`
- [ ] Zero `--_ds-*` references outside `tokens.css`
- [ ] Every text node carries exactly one `.ds-text-*` class or `<Text>` role
- [ ] Every interactive element defines `default`, `hovered`, `pressed`, `disabled` where the tokens exist
- [ ] Every foreground/background pair appears as a **PASS** row in §8.2, or is justified in the escalation notes
- [ ] Every focusable element has a visible focus indicator (see §9.2 — token missing, interim rule applies)
- [ ] Any escalation is written into `TOKEN-GAPS.md` at the repo root

---

## 1. Overview

Finlink Core is a three-layer token system for a fintech product surface.

| Layer | Collection | Count | Consumed by | CSS prefix |
|---|---|---|---|---|
| 1 — Primitive | `Finlink Core Primitives` | 109 | Layer 2 only | `--_ds-` (private) |
| 2 — Semantic colour | `Finlink Core Semantics` | 93 | Components | `--ds-color-` |
| 2 — Typography role | `Default` | 14 | Components | `--ds-typography-` / `.ds-text-` |
| 3 — Component | *not yet authored* | 0 | — | `--ds-{component}-` |

Two structural facts you must internalise:

- **Semantics are alias-only.** Every one of the 93 semantic colours points at a primitive via `com.figma.aliasData`. Nothing is a raw value. This is why re-theming is possible later.
- **Typography roles are composites.** Each of the 14 roles bundles `fontSize` + `lineHeight` + `letterSpacing` + `fontStyle`, each independently aliased to a primitive. You apply the bundle, never a member of it.

### 1.1 What is deliberately absent

Do not interpret absence as freedom. These are gaps, and §9 tells you what to do about each:

| Missing | Consequence |
|---|---|
| Dark mode / any second mode | No `[data-theme]` switching is possible |
| Elevation / shadow tokens | Cards, menus, modals have no sanctioned depth |
| Focus-ring tokens | WCAG 2.4.7 cannot be satisfied from tokens alone |
| Semantic spacing layer | Spacing is consumed from primitives (documented exception, §4.4) |
| `text.warning.*` | Warning text has no colour token at all |
| Typography for label / caption / code / link / display | Only `heading` and `body` exist |
| Tabular-figure token | Numeric columns will not align — critical for fintech |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1 · PRIMITIVES            Finlink Core Primitives    │
│  Raw values. Colour ramps, type scale, space, radius.       │
│  --_ds-*   PRIVATE — components must never reference these  │
└────────────────────────────┬────────────────────────────────┘
                             │ alias (com.figma.aliasData)
┌────────────────────────────▼────────────────────────────────┐
│  LAYER 2 · SEMANTICS   Finlink Core Semantics + Default      │
│  Intent-bearing. Answers "what is this for", not "what      │
│  colour is it". 100% aliases.                               │
│  --ds-color-* · --ds-typography-*   PUBLIC — component API  │
└────────────────────────────┬────────────────────────────────┘
                             │ consume
┌────────────────────────────▼────────────────────────────────┐
│  LAYER 3 · COMPONENTS                          (not authored)│
│  Optional per-component contracts, e.g.                      │
│  --ds-button-primary-background: var(--ds-color-background-  │
│                                      brand-bold-default)     │
└─────────────────────────────────────────────────────────────┘
```

**The one-way rule.** Layer 3 → Layer 2 → Layer 1. Never skip. Never reverse. A component that reads Layer 1 has hardcoded a brand decision and will break the next theme.

**The single documented exception:** spacing, radius, border-width, sizing and opacity have no semantic layer yet. Components consume them from Layer 1 under the public `--ds-spacing-*` alias (which Figma already emits). See §4.4 and gap **G-07**.

---

## 3. Naming

### 3.1 Semantic colour grammar

```
--ds-color-{property}-{intent}-{prominence}-{state}
```

| Slot | Allowed values | Meaning |
|---|---|---|
| `property` | `background` · `text` · `border` · `icon` | Which CSS property family |
| `intent` | `neutral` · `brand` · `info` · `success` · `warning` · `danger` | Communicative purpose |
| `prominence` | `subtlest` · `subtle` · `bold` · `inverse` | Visual weight, ascending |
| `state` | `default` · `hovered` · `pressed` · `disabled` | Interaction state |

Read it as a sentence: `--ds-color-background-danger-bold-hovered` = "the background of a high-prominence destructive element, on hover."

**`inverse` is special.** It exists only on `text`, `border` and `icon`, and always resolves to white. Use it for foregrounds sitting on a `*-bold` fill. There is no `background-*-inverse`.

### 3.2 Typography grammar

```
typography.{category}.{size}[.{emphasis}]
```

- `category`: `heading` | `body`
- `size`: `xl` `lg` `md` `sm` `xs` (heading) · `lg` `md` `sm` (body)
- `emphasis`: `default` → `medium` → `strong` (body only; weight ascends 400 → 500 → 600)

Headings have **no** emphasis axis — every heading is Medium (500).

### 3.3 CSS naming

| Kind | Pattern | Example |
|---|---|---|
| Primitive (private) | `--_ds-{group}-{...path}` | `--_ds-color-teal-500` |
| Semantic colour | `--ds-color-{...path}` | `--ds-color-text-brand-bold-default` |
| Typography prop | `--ds-typography-{role}-{prop}` | `--ds-typography-body-md-strong-font-size` |
| Typography class | `.ds-text-{role}` | `.ds-text-body-md-strong` |
| Spacing | `--ds-spacing-{px}` | `--ds-spacing-16` |

### 3.4 Naming inconsistencies present in the source

Flag these; do not "fix" them silently in the JSON.

| Issue | Detail | ID |
|---|---|---|
| Grey ramp double-named | Token path is `color/grey/*` but Figma `codeSyntax` emits `--_ds-color-neutral-*`. This contract uses **`grey`** in CSS (matching the alias paths) and treats codeSyntax as stale. | G-11 |
| Space keys contain their own prefix | Token keys are literally `space.--ds-spacing-16`. Any generator that concatenates group + key produces `--ds-space---ds-spacing-16`. **Special-case the `space` group.** | G-12 |
| Prefix split | Primitives use `--_ds-` (private-by-convention), spacing uses public `--ds-`. Intentional here, but must be documented for the build. | G-13 |

---

## 4. Token structure — complete inventory

This section is the authoritative reference. You should not need to open the JSON.

### 4.1 Layer 1 — Primitives (reference only, never consume directly)

**Colour ramps**

| Ramp | Steps |
|---|---|
| `grey` | `0` #FFFFFF · `50` #F9FAFC · `100` #F5F7F8 · `200` #ECEFF1 · `300` #CFD8DC · `400` #B0BEC5 · `500` #78909C · `600` #607D8B · `700` #4B5961 · `800` #37474F · `900` #263238 · `950` #161719 |
| `teal` (brand) | `100` #E6F5F3 · `200` #CCEAE7 · `300` #99D5CF · `400` #33ABA0 · `500` #009688 · `600` #00877A · `700` #00796B |
| `red` (danger) | `100` #FAEBED · `500` #E64D4D · `600` #AB3645 · `700` #892936 |
| `blue` (info) | `100` #EBF0FB · `500` #4B7BEC |
| `green` (success) | `100` #E9FCF2 · `500` #20BF6B |
| `yellow` (warning) | `100` #FDF5E4 · `500` #F5CD79 |
| `orange` | `100` #FFF5E8 · `500` #FF9F1A — **orphaned, no semantic alias** |
| `purple` | `100` #FAE9FD · `500` #E693F4 — **orphaned, no semantic alias** |

Only `grey`, `teal` and `red` have enough steps for full interaction ranges. `blue`, `green`, `yellow` have a 100 and a 500 and nothing else — this is why info / success / warning have no hover or pressed states (gap **G-04**).

**Type scale**

| Group | Values |
|---|---|
| `font.family.sans` | `"Roboto", -apple-system, blinkmacsystemfont, "Segoe UI", sans-serif` |
| `font.family.mono` | `"Courier New", courier, monospace` |
| `font.weight` | `regular` 400 · `medium` 500 · `semibold` 600 · `bold` 700 |
| `font.size` | `xs` 12 · `sm` 14 · `base` 16 · `lg` 18* · `xl` 20 · `2xl` 26 · `3xl` 30 · `4xl` 40* · `5xl` 64* · `6xl` 96* |
| `font.lineheight` | `xs` 16 · `sm` 20 · `base` 22 · `lg` 28 · `xl` 32* · `2xl` 36 · `3xl` 48* |
| `font.letterspacing` | `tighter` −1.5* · `tight` −1* · `snug` −0.5* · `normal-tight` −0.25* · `normal` 0 · `wide` 0.25 · `wider` 0.5* · `widest` 1* · `display` 1.25* · `display-wide` 1.5* |
| `font.textdecoration` | `none` · `underline` — *both orphaned; no role sets decoration* |
| `font.style` | `Regular` · `Medium` · `SemiBold` · `Bold` — **Figma-only strings. Never emit as CSS.** Map to `font-weight` via §6.1. |

`*` = orphaned: no typography role references it. Nine of ten letter-spacing steps and four of ten sizes are unused (gap **G-08**).

**Other primitive scales**

| Group | Values (px unless noted) |
|---|---|
| `borderRadius` | `none` 0 · `sm` 2 · `base` 4 · `lg` 8 · `xl` 16 · `full` 9999 |
| `borderWidth` | `0` · `1` · `2` · `4` |
| `opacity` | `0` 0 · `25` 0.25 · `50` 0.5 · `75` 0.75 · `100` 1 (unitless) |
| `sizing` | `2` 8 · `3` 12 · `4` 16 · `5` 20 · `6` 24 · `8` 32 · `10` 40 · `12` 48 · `16` 64 |

Note `sizing` keys are 4× -scale indices, not pixel values: `sizing.4` = 16px. Use for icon boxes and control squares.

### 4.2 Layer 2 — Semantic colour (the component API)

93 tokens. Every cell below is an alias. **If a combination is not listed, it does not exist — escalate rather than assume.**

#### background

| intent | prominence | default | hovered | pressed | disabled |
|---|---|---|---|---|---|
| neutral | subtlest | `grey/0` #FFFFFF | `grey/50` #F9FAFC | `grey/100` #F5F7F8 | `grey/100` #F5F7F8 |
| neutral | subtle | `grey/100` #F5F7F8 | `grey/200` #ECEFF1 | `grey/300` #CFD8DC | `grey/100` #F5F7F8 |
| neutral | bold | `grey/100` #F5F7F8 ⚠ | `grey/200` #ECEFF1 ⚠ | `grey/300` #CFD8DC ⚠ | `grey/100` #F5F7F8 ⚠ |
| brand | subtlest | `teal/100` #E6F5F3 | `teal/200` #CCEAE7 | `teal/300` #99D5CF | — |
| brand | subtle | `teal/200` #CCEAE7 | `teal/300` #99D5CF | `teal/400` #33ABA0 | — |
| brand | bold | `teal/500` #009688 | `teal/600` #00877A | `teal/700` #00796B | — |
| info | subtlest | `blue/100` #EBF0FB | — | — | — |
| info | bold | `blue/500` #4B7BEC | — | — | — |
| success | subtlest | `green/100` #E9FCF2 | — | — | — |
| success | bold | `green/500` #20BF6B | — | — | — |
| warning | subtlest | `yellow/100` #FDF5E4 | — | — | — |
| warning | bold | `yellow/500` #F5CD79 | — | — | — |
| danger | subtlest | `red/100` #FAEBED | — | — | — |
| danger | bold | `red/500` #E64D4D | `red/600` #AB3645 | `red/700` #892936 | — |

⚠ **`background.neutral.bold.*` is identical to `background.neutral.subtle.*`.** This is almost certainly an unresolved alias — a "bold" neutral surface should be dark (`grey/800`/`900`), giving an inverse surface. Treat as gap **G-03**: do not rely on it to produce a dark surface, and do not pair it with `text.neutral.inverse` (white on #F5F7F8 = **1.07:1**).

#### text

| intent | prominence | default | hovered | disabled |
|---|---|---|---|---|
| neutral | subtlest | `grey/500` #78909C | — | `grey/400` #B0BEC5 |
| neutral | subtle | `grey/700` #4B5961 | — | `grey/400` #B0BEC5 |
| neutral | bold | `grey/900` #263238 | `grey/950` #161719 | `grey/400` #B0BEC5 |
| neutral | inverse | `grey/0` #FFFFFF | — | — |
| brand | subtle | `teal/500` #009688 | — | — |
| brand | bold | `teal/600` #00877A | `teal/700` #00796B | — |
| info | bold | `blue/500` #4B7BEC | — | — |
| success | bold | `green/500` #20BF6B | — | — |
| danger | subtle | `red/500` #E64D4D | — | — |
| danger | bold | `red/600` #AB3645 | `red/700` #892936 | — |

**There is no `text.warning.*`.** For warning copy use `--ds-color-text-neutral-bold-default` on a warning surface and carry the semantics with an icon (see gap **G-05**).

#### border

| intent | prominence | default | hovered | pressed | disabled |
|---|---|---|---|---|---|
| neutral | subtlest | `grey/100` #F5F7F8 | — | — | — |
| neutral | subtle | `grey/200` #ECEFF1 | `grey/300` #CFD8DC | `grey/400` #B0BEC5 | `grey/100` #F5F7F8 |
| neutral | bold | `grey/300` #CFD8DC | `grey/500` #78909C | `grey/600` #607D8B | `grey/200` #ECEFF1 |
| neutral | inverse | `grey/0` #FFFFFF | — | — | — |
| brand | subtle | `teal/300` #99D5CF | `teal/400` #33ABA0 | — | — |
| brand | bold | `teal/500` #009688 | `teal/600` #00877A | `teal/700` #00796B | — |
| info | subtle | `blue/100` #EBF0FB | — | — | — |
| info | bold | `blue/500` #4B7BEC | — | — | — |
| success | subtle | `green/100` #E9FCF2 | — | — | — |
| success | bold | `green/500` #20BF6B | — | — | — |
| warning | subtle | `yellow/100` #FDF5E4 | — | — | — |
| warning | bold | `yellow/500` #F5CD79 | — | — | — |
| danger | subtle | `red/100` #FAEBED | — | — | — |
| danger | bold | `red/500` #E64D4D | `red/600` #AB3645 | `red/700` #892936 | — |

#### icon

| intent | prominence | default | hovered | pressed | disabled |
|---|---|---|---|---|---|
| neutral | subtlest | `grey/400` #B0BEC5 | — | — | `grey/300` #CFD8DC |
| neutral | subtle | `grey/600` #607D8B | `grey/700` #4B5961 | `grey/800` #37474F | `grey/400` #B0BEC5 |
| neutral | bold | `grey/800` #37474F | `grey/900` #263238 | `grey/950` #161719 | `grey/500` #78909C |
| neutral | inverse | `grey/0` #FFFFFF | — | — | — |
| brand | subtle | `teal/400` #33ABA0 | — | — | — |
| brand | bold | `teal/500` #009688 | `teal/600` #00877A | `teal/700` #00796B | — |
| info | bold | `blue/500` #4B7BEC | — | — | — |
| success | bold | `green/500` #20BF6B | — | — | — |
| warning | bold | `yellow/500` #F5CD79 | — | — | — |
| danger | bold | `red/500` #E64D4D | `red/600` #AB3645 | `red/700` #892936 | — |

### 4.3 Layer 2 — Typography roles

All 14 roles. `font-family` is always `sans` (Roboto). Line-height is expressed as a unitless ratio in CSS so user zoom and text-spacing overrides behave correctly; the px column is the Figma-authored source value.

| Role token | CSS class | font-size | line-height | ratio | letter-spacing | weight | Primitive refs |
|---|---|---|---|---|---|---|---|
| `typography.heading.xl` | `.ds-text-heading-xl` | 30px / 1.875rem | 36px | 1.2 | 0px | 500 (Medium) | `3xl` / `2xl` / `normal` / `medium` |
| `typography.heading.lg` | `.ds-text-heading-lg` | 26px / 1.625rem | 28px | 1.0769 | 0px | 500 (Medium) | `2xl` / `lg` / `normal` / `medium` |
| `typography.heading.md` | `.ds-text-heading-md` | 20px / 1.25rem | 22px | 1.1 | 0px | 500 (Medium) | `xl` / `base` / `normal` / `medium` |
| `typography.heading.sm` | `.ds-text-heading-sm` | 16px / 1rem | 20px | 1.25 | 0px | 500 (Medium) | `base` / `sm` / `normal` / `medium` |
| `typography.heading.xs` | `.ds-text-heading-xs` | 12px / 0.75rem | 16px | 1.3333 | 0px | 500 (Medium) | `xs` / `xs` / `normal` / `medium` |
| `typography.body.lg.strong` | `.ds-text-body-lg-strong` | 16px / 1rem | 22px | 1.375 | 0.25px | 600 (SemiBold) | `base` / `base` / `wide` / `semibold` |
| `typography.body.lg.medium` | `.ds-text-body-lg-medium` | 16px / 1rem | 22px | 1.375 | 0.25px | 500 (Medium) | `base` / `base` / `wide` / `medium` |
| `typography.body.lg.default` | `.ds-text-body-lg-default` | 16px / 1rem | 22px | 1.375 | 0.25px | 400 (Regular) | `base` / `base` / `wide` / `regular` |
| `typography.body.md.strong` | `.ds-text-body-md-strong` | 14px / 0.875rem | 20px | 1.4286 | 0.25px | 600 (SemiBold) | `sm` / `sm` / `wide` / `semibold` |
| `typography.body.md.medium` | `.ds-text-body-md-medium` | 14px / 0.875rem | 20px | 1.4286 | 0.25px | 500 (Medium) | `sm` / `sm` / `wide` / `medium` |
| `typography.body.md.default` | `.ds-text-body-md-default` | 14px / 0.875rem | 20px | 1.4286 | 0.25px | 400 (Regular) | `sm` / `sm` / `wide` / `regular` |
| `typography.body.sm.strong` | `.ds-text-body-sm-strong` | 12px / 0.75rem | 16px | 1.3333 | 0.25px | 600 (SemiBold) | `xs` / `xs` / `wide` / `semibold` |
| `typography.body.sm.medium` | `.ds-text-body-sm-medium` | 12px / 0.75rem | 16px | 1.3333 | 0.25px | 500 (Medium) | `xs` / `xs` / `wide` / `medium` |
| `typography.body.sm.default` | `.ds-text-body-sm-default` | 12px / 0.75rem | 16px | 1.3333 | 0.25px | 400 (Regular) | `xs` / `xs` / `wide` / `regular` |

**Read this table carefully before choosing a role:**

- `heading.lg` has a **1.08** line-height ratio (26px type in a 28px box) and `heading.md` has **1.10**. Descenders will clip against following content. Do not tighten further; add block spacing between headings and body.
- Body ratios are **1.375 / 1.4286 / 1.3333** — all below the 1.5 that WCAG 1.4.12 requires layouts to *survive* when a user overrides. Authoring below 1.5 is legal; your layout must not break when the user forces 1.5. See gap **G-02** and §8.4.
- `heading.xs` (12px) and `body.sm` (12px) are the same size; the only difference is letter-spacing (0 vs 0.25px). Prefer `body.sm.*` for anything that isn't a structural heading.
- **`heading.md` at 20px Medium is NOT "large text" for WCAG.** Large text means ≥24px, or ≥18.66px at weight 700. Medium (500) does not qualify. So `heading.md` and everything smaller needs the full **4.5:1**.

### 4.4 Spacing, radius, border, sizing

**Spacing** — the only scale with a public primitive alias. Consume directly; there is no semantic spacing layer (gap **G-07**).

| Token path | CSS variable | px | rem |
|---|---|---|---|
| `space.--ds-spacing-0` | `--ds-spacing-0` | 0px | 0rem |
| `space.--ds-spacing-4` | `--ds-spacing-4` | 4px | 0.25rem |
| `space.--ds-spacing-8` | `--ds-spacing-8` | 8px | 0.5rem |
| `space.--ds-spacing-12` | `--ds-spacing-12` | 12px | 0.75rem |
| `space.--ds-spacing-16` | `--ds-spacing-16` | 16px | 1rem |
| `space.--ds-spacing-20` | `--ds-spacing-20` | 20px | 1.25rem |
| `space.--ds-spacing-24` | `--ds-spacing-24` | 24px | 1.5rem |
| `space.--ds-spacing-32` | `--ds-spacing-32` | 32px | 2rem |
| `space.--ds-spacing-40` | `--ds-spacing-40` | 40px | 2.5rem |
| `space.--ds-spacing-48` | `--ds-spacing-48` | 48px | 3rem |
| `space.--ds-spacing-64` | `--ds-spacing-64` | 64px | 4rem |
| `space.--ds-spacing-80` | `--ds-spacing-80` | 80px | 5rem |
| `space.--ds-spacing-96` | `--ds-spacing-96` | 96px | 6rem |

The scale is a strict 4px grid up to 24, then jumps 32 · 40 · 48 · 64 · 80 · 96. **There is no 28, 56, or 72.** If a design needs one, escalate — do not use `calc()` to synthesise it.

**Radius** — no semantic layer. Use `--_ds-radius-*` via the aliases emitted in §5, and follow this convention:

| Use | Radius |
|---|---|
| Inputs, buttons, small controls | `base` (4px) |
| Cards, panels, sheets | `lg` (8px) |
| Modals, large containers | `xl` (16px) |
| Pills, avatars, badges | `full` |
| Tables, flush dividers | `none` |

**Border width:** `1` for all resting strokes; `2` for selected/active emphasis and focus rings; `4` reserved (e.g. left accent bars). `borderWidth.0` for none.

**Sizing** (icon and control squares): `sizing.4` (16px) inline with `body.sm`/`body.md`; `sizing.5` (20px) inline with `body.lg`; `sizing.6` (24px) standalone actions; `sizing.10` (40px) default control height; `sizing.12` (48px) large control / min touch target.

---

## 5. `tokens.css` — canonical build output

Create this file at `src/styles/tokens.css` and import it once, first, in your root. **This is the only file in the repository permitted to contain literal values.** Everything below is generated from the three token JSONs; if you regenerate, regenerate the whole file rather than hand-editing.

### 5.1 Layer 1 — primitives

```css
/* ============================================================
   LAYER 1 — PRIMITIVES  (private: never reference in components)
   Source: Finlink Core Primitives
   ============================================================ */
:root {

  /* --- color ramps --- */

  --_ds-color-grey-0: #FFFFFF;
  --_ds-color-grey-50: #F9FAFC;
  --_ds-color-grey-100: #F5F7F8;
  --_ds-color-grey-200: #ECEFF1;
  --_ds-color-grey-300: #CFD8DC;
  --_ds-color-grey-400: #B0BEC5;
  --_ds-color-grey-500: #78909C;
  --_ds-color-grey-600: #607D8B;
  --_ds-color-grey-700: #4B5961;
  --_ds-color-grey-800: #37474F;
  --_ds-color-grey-900: #263238;
  --_ds-color-grey-950: #161719;

  --_ds-color-teal-100: #E6F5F3;
  --_ds-color-teal-200: #CCEAE7;
  --_ds-color-teal-300: #99D5CF;
  --_ds-color-teal-400: #33ABA0;
  --_ds-color-teal-500: #009688;
  --_ds-color-teal-600: #00877A;
  --_ds-color-teal-700: #00796B;

  --_ds-color-red-100: #FAEBED;
  --_ds-color-red-500: #E64D4D;
  --_ds-color-red-600: #AB3645;
  --_ds-color-red-700: #892936;

  --_ds-color-blue-100: #EBF0FB;
  --_ds-color-blue-500: #4B7BEC;

  --_ds-color-yellow-100: #FDF5E4;
  --_ds-color-yellow-500: #F5CD79;

  --_ds-color-green-100: #E9FCF2;
  --_ds-color-green-500: #20BF6B;

  --_ds-color-orange-100: #FFF5E8;
  --_ds-color-orange-500: #FF9F1A;

  --_ds-color-purple-100: #FAE9FD;
  --_ds-color-purple-500: #E693F4;

  /* --- font family --- */
  --_ds-font-family-sans: "Roboto", -apple-system, blinkmacsystemfont, "Segoe UI", sans-serif;
  --_ds-font-family-mono: "Courier New", courier, monospace;

  /* --- font weight (web source of truth) --- */
  --_ds-font-weight-regular: 400;
  --_ds-font-weight-medium: 500;
  --_ds-font-weight-semibold: 600;
  --_ds-font-weight-bold: 700;

  /* --- font size (px) --- */
  --_ds-font-size-xs: 12px;   /* 0.75rem */
  --_ds-font-size-sm: 14px;   /* 0.875rem */
  --_ds-font-size-base: 16px;   /* 1rem */
  --_ds-font-size-lg: 18px;   /* 1.125rem */
  --_ds-font-size-xl: 20px;   /* 1.25rem */
  --_ds-font-size-2xl: 26px;   /* 1.625rem */
  --_ds-font-size-3xl: 30px;   /* 1.875rem */
  --_ds-font-size-4xl: 40px;   /* 2.5rem */
  --_ds-font-size-5xl: 64px;   /* 4rem */
  --_ds-font-size-6xl: 96px;   /* 6rem */

  /* --- line height (px) --- */
  --_ds-font-lineheight-xs: 16px;
  --_ds-font-lineheight-sm: 20px;
  --_ds-font-lineheight-base: 22px;
  --_ds-font-lineheight-lg: 28px;
  --_ds-font-lineheight-xl: 32px;
  --_ds-font-lineheight-2xl: 36px;
  --_ds-font-lineheight-3xl: 48px;

  /* --- letter spacing (px) --- */
  --_ds-font-letterspacing-tighter: -1.5px;
  --_ds-font-letterspacing-tight: -1px;
  --_ds-font-letterspacing-snug: -0.5px;
  --_ds-font-letterspacing-normal-tight: -0.25px;
  --_ds-font-letterspacing-normal: 0px;
  --_ds-font-letterspacing-wide: 0.25px;
  --_ds-font-letterspacing-wider: 0.5px;
  --_ds-font-letterspacing-widest: 1px;
  --_ds-font-letterspacing-display: 1.25px;
  --_ds-font-letterspacing-display-wide: 1.5px;

  /* --- text decoration --- */
  --_ds-font-textdecoration-none: none;
  --_ds-font-textdecoration-underline: underline;

  /* --- radius --- */
  --_ds-radius-none: 0px;
  --_ds-radius-sm: 2px;
  --_ds-radius-base: 4px;
  --_ds-radius-lg: 8px;
  --_ds-radius-xl: 16px;
  --_ds-radius-full: 9999px;

  /* --- border width --- */
  --_ds-border-width-0: 0px;
  --_ds-border-width-1: 1px;
  --_ds-border-width-2: 2px;
  --_ds-border-width-4: 4px;

  /* --- opacity --- */
  --_ds-opacity-0: 0;
  --_ds-opacity-25: 0.25;
  --_ds-opacity-50: 0.5;
  --_ds-opacity-75: 0.75;
  --_ds-opacity-100: 1;

  /* --- sizing (icon / control squares) --- */
  --_ds-sizing-2: 8px;
  --_ds-sizing-3: 12px;
  --_ds-sizing-4: 16px;
  --_ds-sizing-5: 20px;
  --_ds-sizing-6: 24px;
  --_ds-sizing-8: 32px;
  --_ds-sizing-10: 40px;
  --_ds-sizing-12: 48px;
  --_ds-sizing-16: 64px;
}
```

### 5.2 Public spacing aliases

```css
/* ============================================================
   SPACING — public primitive alias (no semantic layer yet, G-07)
   NOTE: token keys in the JSON literally contain "--ds-spacing-";
   a naive generator will emit --ds-space---ds-spacing-16. (G-12)
   ============================================================ */
:root {
  --ds-spacing-0: 0px;
  --ds-spacing-4: 4px;
  --ds-spacing-8: 8px;
  --ds-spacing-12: 12px;
  --ds-spacing-16: 16px;
  --ds-spacing-20: 20px;
  --ds-spacing-24: 24px;
  --ds-spacing-32: 32px;
  --ds-spacing-40: 40px;
  --ds-spacing-48: 48px;
  --ds-spacing-64: 64px;
  --ds-spacing-80: 80px;
  --ds-spacing-96: 96px;

  /* radius / border / opacity / sizing — public aliases */
  --ds-radius-none: var(--_ds-radius-none);
  --ds-radius-sm: var(--_ds-radius-sm);
  --ds-radius-base: var(--_ds-radius-base);
  --ds-radius-lg: var(--_ds-radius-lg);
  --ds-radius-xl: var(--_ds-radius-xl);
  --ds-radius-full: var(--_ds-radius-full);

  --ds-border-width-0: var(--_ds-border-width-0);
  --ds-border-width-1: var(--_ds-border-width-1);
  --ds-border-width-2: var(--_ds-border-width-2);
  --ds-border-width-4: var(--_ds-border-width-4);

  --ds-opacity-0: var(--_ds-opacity-0);
  --ds-opacity-25: var(--_ds-opacity-25);
  --ds-opacity-50: var(--_ds-opacity-50);
  --ds-opacity-75: var(--_ds-opacity-75);
  --ds-opacity-100: var(--_ds-opacity-100);

  --ds-sizing-2: var(--_ds-sizing-2);
  --ds-sizing-3: var(--_ds-sizing-3);
  --ds-sizing-4: var(--_ds-sizing-4);
  --ds-sizing-5: var(--_ds-sizing-5);
  --ds-sizing-6: var(--_ds-sizing-6);
  --ds-sizing-8: var(--_ds-sizing-8);
  --ds-sizing-10: var(--_ds-sizing-10);
  --ds-sizing-12: var(--_ds-sizing-12);
  --ds-sizing-16: var(--_ds-sizing-16);

  --ds-font-family-sans: var(--_ds-font-family-sans);
  --ds-font-family-mono: var(--_ds-font-family-mono);
}
```

### 5.3 Layer 2 — semantic colour

```css
/* ============================================================
   LAYER 2 — SEMANTIC COLOR  (public API: use these in components)
   Source: Finlink Core Semantics — every value is an alias
   ============================================================ */
:root {

  /* ---------- BACKGROUND ---------- */

  --ds-color-background-neutral-subtlest-default: var(--_ds-color-grey-0);
  --ds-color-background-neutral-subtlest-hovered: var(--_ds-color-grey-50);
  --ds-color-background-neutral-subtlest-pressed: var(--_ds-color-grey-100);
  --ds-color-background-neutral-subtlest-disabled: var(--_ds-color-grey-100);
  --ds-color-background-neutral-subtle-default: var(--_ds-color-grey-100);
  --ds-color-background-neutral-subtle-hovered: var(--_ds-color-grey-200);
  --ds-color-background-neutral-subtle-pressed: var(--_ds-color-grey-300);
  --ds-color-background-neutral-subtle-disabled: var(--_ds-color-grey-100);
  --ds-color-background-neutral-bold-default: var(--_ds-color-grey-100);
  --ds-color-background-neutral-bold-hovered: var(--_ds-color-grey-200);
  --ds-color-background-neutral-bold-pressed: var(--_ds-color-grey-300);
  --ds-color-background-neutral-bold-disabled: var(--_ds-color-grey-100);

  --ds-color-background-brand-subtlest-default: var(--_ds-color-teal-100);
  --ds-color-background-brand-subtlest-hovered: var(--_ds-color-teal-200);
  --ds-color-background-brand-subtlest-pressed: var(--_ds-color-teal-300);
  --ds-color-background-brand-subtle-default: var(--_ds-color-teal-200);
  --ds-color-background-brand-subtle-hovered: var(--_ds-color-teal-300);
  --ds-color-background-brand-subtle-pressed: var(--_ds-color-teal-400);
  --ds-color-background-brand-bold-default: var(--_ds-color-teal-500);
  --ds-color-background-brand-bold-hovered: var(--_ds-color-teal-600);
  --ds-color-background-brand-bold-pressed: var(--_ds-color-teal-700);

  --ds-color-background-info-subtlest-default: var(--_ds-color-blue-100);
  --ds-color-background-info-bold-default: var(--_ds-color-blue-500);

  --ds-color-background-success-subtlest-default: var(--_ds-color-green-100);
  --ds-color-background-success-bold-default: var(--_ds-color-green-500);

  --ds-color-background-warning-subtlest-default: var(--_ds-color-yellow-100);
  --ds-color-background-warning-bold-default: var(--_ds-color-yellow-500);

  --ds-color-background-danger-subtlest-default: var(--_ds-color-red-100);
  --ds-color-background-danger-bold-default: var(--_ds-color-red-500);
  --ds-color-background-danger-bold-hovered: var(--_ds-color-red-600);
  --ds-color-background-danger-bold-pressed: var(--_ds-color-red-700);

  /* ---------- TEXT ---------- */

  --ds-color-text-neutral-subtlest-default: var(--_ds-color-grey-500);
  --ds-color-text-neutral-subtlest-disabled: var(--_ds-color-grey-400);
  --ds-color-text-neutral-subtle-default: var(--_ds-color-grey-700);
  --ds-color-text-neutral-subtle-disabled: var(--_ds-color-grey-400);
  --ds-color-text-neutral-bold-default: var(--_ds-color-grey-900);
  --ds-color-text-neutral-bold-hovered: var(--_ds-color-grey-950);
  --ds-color-text-neutral-bold-disabled: var(--_ds-color-grey-400);
  --ds-color-text-neutral-inverse-default: var(--_ds-color-grey-0);

  --ds-color-text-brand-subtle-default: var(--_ds-color-teal-500);
  --ds-color-text-brand-bold-default: var(--_ds-color-teal-600);
  --ds-color-text-brand-bold-hovered: var(--_ds-color-teal-700);

  --ds-color-text-info-bold-default: var(--_ds-color-blue-500);

  --ds-color-text-success-bold-default: var(--_ds-color-green-500);

  --ds-color-text-danger-subtle-default: var(--_ds-color-red-500);
  --ds-color-text-danger-bold-default: var(--_ds-color-red-600);
  --ds-color-text-danger-bold-hovered: var(--_ds-color-red-700);

  /* ---------- BORDER ---------- */

  --ds-color-border-neutral-subtlest-default: var(--_ds-color-grey-100);
  --ds-color-border-neutral-subtle-default: var(--_ds-color-grey-200);
  --ds-color-border-neutral-subtle-hovered: var(--_ds-color-grey-300);
  --ds-color-border-neutral-subtle-pressed: var(--_ds-color-grey-400);
  --ds-color-border-neutral-subtle-disabled: var(--_ds-color-grey-100);
  --ds-color-border-neutral-bold-default: var(--_ds-color-grey-300);
  --ds-color-border-neutral-bold-hovered: var(--_ds-color-grey-500);
  --ds-color-border-neutral-bold-pressed: var(--_ds-color-grey-600);
  --ds-color-border-neutral-bold-disabled: var(--_ds-color-grey-200);
  --ds-color-border-neutral-inverse-default: var(--_ds-color-grey-0);

  --ds-color-border-brand-subtle-default: var(--_ds-color-teal-300);
  --ds-color-border-brand-subtle-hovered: var(--_ds-color-teal-400);
  --ds-color-border-brand-bold-default: var(--_ds-color-teal-500);
  --ds-color-border-brand-bold-hovered: var(--_ds-color-teal-600);
  --ds-color-border-brand-bold-pressed: var(--_ds-color-teal-700);

  --ds-color-border-info-subtle-default: var(--_ds-color-blue-100);
  --ds-color-border-info-bold-default: var(--_ds-color-blue-500);

  --ds-color-border-success-subtle-default: var(--_ds-color-green-100);
  --ds-color-border-success-bold-default: var(--_ds-color-green-500);

  --ds-color-border-warning-subtle-default: var(--_ds-color-yellow-100);
  --ds-color-border-warning-bold-default: var(--_ds-color-yellow-500);

  --ds-color-border-danger-subtle-default: var(--_ds-color-red-100);
  --ds-color-border-danger-bold-default: var(--_ds-color-red-500);
  --ds-color-border-danger-bold-hovered: var(--_ds-color-red-600);
  --ds-color-border-danger-bold-pressed: var(--_ds-color-red-700);

  /* ---------- ICON ---------- */

  --ds-color-icon-neutral-subtlest-default: var(--_ds-color-grey-400);
  --ds-color-icon-neutral-subtlest-disabled: var(--_ds-color-grey-300);
  --ds-color-icon-neutral-subtle-default: var(--_ds-color-grey-600);
  --ds-color-icon-neutral-subtle-hovered: var(--_ds-color-grey-700);
  --ds-color-icon-neutral-subtle-pressed: var(--_ds-color-grey-800);
  --ds-color-icon-neutral-subtle-disabled: var(--_ds-color-grey-400);
  --ds-color-icon-neutral-bold-default: var(--_ds-color-grey-800);
  --ds-color-icon-neutral-bold-hovered: var(--_ds-color-grey-900);
  --ds-color-icon-neutral-bold-pressed: var(--_ds-color-grey-950);
  --ds-color-icon-neutral-bold-disabled: var(--_ds-color-grey-500);
  --ds-color-icon-neutral-inverse-default: var(--_ds-color-grey-0);

  --ds-color-icon-brand-subtle-default: var(--_ds-color-teal-400);
  --ds-color-icon-brand-bold-default: var(--_ds-color-teal-500);
  --ds-color-icon-brand-bold-hovered: var(--_ds-color-teal-600);
  --ds-color-icon-brand-bold-pressed: var(--_ds-color-teal-700);

  --ds-color-icon-info-bold-default: var(--_ds-color-blue-500);

  --ds-color-icon-success-bold-default: var(--_ds-color-green-500);

  --ds-color-icon-warning-bold-default: var(--_ds-color-yellow-500);

  --ds-color-icon-danger-bold-default: var(--_ds-color-red-500);
  --ds-color-icon-danger-bold-hovered: var(--_ds-color-red-600);
  --ds-color-icon-danger-bold-pressed: var(--_ds-color-red-700);
}
```

### 5.4 Layer 2 — typography roles

```css
/* ============================================================
   TYPOGRAPHY ROLES — Source: Default collection
   font-size  : rem (÷16 root)
   line-height: unitless ratio, derived from the Figma px value
   letter-spacing: px, matching Figma and the Roboto Material spec
   font-weight: mapped from Figma font.style (Regular/Medium/SemiBold)
   ============================================================ */
:root {
  --ds-typography-heading-xl-font-size: 1.875rem;
  --ds-typography-heading-xl-line-height: 1.2;
  --ds-typography-heading-xl-letter-spacing: 0px;
  --ds-typography-heading-xl-font-weight: 500;
  --ds-typography-heading-lg-font-size: 1.625rem;
  --ds-typography-heading-lg-line-height: 1.0769;
  --ds-typography-heading-lg-letter-spacing: 0px;
  --ds-typography-heading-lg-font-weight: 500;
  --ds-typography-heading-md-font-size: 1.25rem;
  --ds-typography-heading-md-line-height: 1.1;
  --ds-typography-heading-md-letter-spacing: 0px;
  --ds-typography-heading-md-font-weight: 500;
  --ds-typography-heading-sm-font-size: 1rem;
  --ds-typography-heading-sm-line-height: 1.25;
  --ds-typography-heading-sm-letter-spacing: 0px;
  --ds-typography-heading-sm-font-weight: 500;
  --ds-typography-heading-xs-font-size: 0.75rem;
  --ds-typography-heading-xs-line-height: 1.3333;
  --ds-typography-heading-xs-letter-spacing: 0px;
  --ds-typography-heading-xs-font-weight: 500;
  --ds-typography-body-lg-strong-font-size: 1rem;
  --ds-typography-body-lg-strong-line-height: 1.375;
  --ds-typography-body-lg-strong-letter-spacing: 0.25px;
  --ds-typography-body-lg-strong-font-weight: 600;
  --ds-typography-body-lg-medium-font-size: 1rem;
  --ds-typography-body-lg-medium-line-height: 1.375;
  --ds-typography-body-lg-medium-letter-spacing: 0.25px;
  --ds-typography-body-lg-medium-font-weight: 500;
  --ds-typography-body-lg-default-font-size: 1rem;
  --ds-typography-body-lg-default-line-height: 1.375;
  --ds-typography-body-lg-default-letter-spacing: 0.25px;
  --ds-typography-body-lg-default-font-weight: 400;
  --ds-typography-body-md-strong-font-size: 0.875rem;
  --ds-typography-body-md-strong-line-height: 1.4286;
  --ds-typography-body-md-strong-letter-spacing: 0.25px;
  --ds-typography-body-md-strong-font-weight: 600;
  --ds-typography-body-md-medium-font-size: 0.875rem;
  --ds-typography-body-md-medium-line-height: 1.4286;
  --ds-typography-body-md-medium-letter-spacing: 0.25px;
  --ds-typography-body-md-medium-font-weight: 500;
  --ds-typography-body-md-default-font-size: 0.875rem;
  --ds-typography-body-md-default-line-height: 1.4286;
  --ds-typography-body-md-default-letter-spacing: 0.25px;
  --ds-typography-body-md-default-font-weight: 400;
  --ds-typography-body-sm-strong-font-size: 0.75rem;
  --ds-typography-body-sm-strong-line-height: 1.3333;
  --ds-typography-body-sm-strong-letter-spacing: 0.25px;
  --ds-typography-body-sm-strong-font-weight: 600;
  --ds-typography-body-sm-medium-font-size: 0.75rem;
  --ds-typography-body-sm-medium-line-height: 1.3333;
  --ds-typography-body-sm-medium-letter-spacing: 0.25px;
  --ds-typography-body-sm-medium-font-weight: 500;
  --ds-typography-body-sm-default-font-size: 0.75rem;
  --ds-typography-body-sm-default-line-height: 1.3333;
  --ds-typography-body-sm-default-letter-spacing: 0.25px;
  --ds-typography-body-sm-default-font-weight: 400;
}

/* Apply as a whole role — never set the members individually. */
.ds-text-heading-xl {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-heading-xl-font-size);
  line-height: var(--ds-typography-heading-xl-line-height);
  letter-spacing: var(--ds-typography-heading-xl-letter-spacing);
  font-weight: var(--ds-typography-heading-xl-font-weight);
}
.ds-text-heading-lg {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-heading-lg-font-size);
  line-height: var(--ds-typography-heading-lg-line-height);
  letter-spacing: var(--ds-typography-heading-lg-letter-spacing);
  font-weight: var(--ds-typography-heading-lg-font-weight);
}
.ds-text-heading-md {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-heading-md-font-size);
  line-height: var(--ds-typography-heading-md-line-height);
  letter-spacing: var(--ds-typography-heading-md-letter-spacing);
  font-weight: var(--ds-typography-heading-md-font-weight);
}
.ds-text-heading-sm {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-heading-sm-font-size);
  line-height: var(--ds-typography-heading-sm-line-height);
  letter-spacing: var(--ds-typography-heading-sm-letter-spacing);
  font-weight: var(--ds-typography-heading-sm-font-weight);
}
.ds-text-heading-xs {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-heading-xs-font-size);
  line-height: var(--ds-typography-heading-xs-line-height);
  letter-spacing: var(--ds-typography-heading-xs-letter-spacing);
  font-weight: var(--ds-typography-heading-xs-font-weight);
}
.ds-text-body-lg-strong {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-body-lg-strong-font-size);
  line-height: var(--ds-typography-body-lg-strong-line-height);
  letter-spacing: var(--ds-typography-body-lg-strong-letter-spacing);
  font-weight: var(--ds-typography-body-lg-strong-font-weight);
}
.ds-text-body-lg-medium {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-body-lg-medium-font-size);
  line-height: var(--ds-typography-body-lg-medium-line-height);
  letter-spacing: var(--ds-typography-body-lg-medium-letter-spacing);
  font-weight: var(--ds-typography-body-lg-medium-font-weight);
}
.ds-text-body-lg-default {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-body-lg-default-font-size);
  line-height: var(--ds-typography-body-lg-default-line-height);
  letter-spacing: var(--ds-typography-body-lg-default-letter-spacing);
  font-weight: var(--ds-typography-body-lg-default-font-weight);
}
.ds-text-body-md-strong {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-body-md-strong-font-size);
  line-height: var(--ds-typography-body-md-strong-line-height);
  letter-spacing: var(--ds-typography-body-md-strong-letter-spacing);
  font-weight: var(--ds-typography-body-md-strong-font-weight);
}
.ds-text-body-md-medium {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-body-md-medium-font-size);
  line-height: var(--ds-typography-body-md-medium-line-height);
  letter-spacing: var(--ds-typography-body-md-medium-letter-spacing);
  font-weight: var(--ds-typography-body-md-medium-font-weight);
}
.ds-text-body-md-default {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-body-md-default-font-size);
  line-height: var(--ds-typography-body-md-default-line-height);
  letter-spacing: var(--ds-typography-body-md-default-letter-spacing);
  font-weight: var(--ds-typography-body-md-default-font-weight);
}
.ds-text-body-sm-strong {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-body-sm-strong-font-size);
  line-height: var(--ds-typography-body-sm-strong-line-height);
  letter-spacing: var(--ds-typography-body-sm-strong-letter-spacing);
  font-weight: var(--ds-typography-body-sm-strong-font-weight);
}
.ds-text-body-sm-medium {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-body-sm-medium-font-size);
  line-height: var(--ds-typography-body-sm-medium-line-height);
  letter-spacing: var(--ds-typography-body-sm-medium-letter-spacing);
  font-weight: var(--ds-typography-body-sm-medium-font-weight);
}
.ds-text-body-sm-default {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-typography-body-sm-default-font-size);
  line-height: var(--ds-typography-body-sm-default-line-height);
  letter-spacing: var(--ds-typography-body-sm-default-letter-spacing);
  font-weight: var(--ds-typography-body-sm-default-font-weight);
}
```

### 5.5 Base reset

```css
:root {
  /* All rem maths in this system assumes a 16px root.
     Do not set html { font-size: 62.5% } — it will break every role. */
  font-size: 100%;
}

body {
  font-family: var(--ds-font-family-sans);
  background-color: var(--ds-color-background-neutral-subtlest-default);
  color: var(--ds-color-text-neutral-bold-default);
  /* body.md.default is the document default */
  font-size: var(--ds-typography-body-md-default-font-size);
  line-height: var(--ds-typography-body-md-default-line-height);
  letter-spacing: var(--ds-typography-body-md-default-letter-spacing);
  font-weight: var(--ds-typography-body-md-default-font-weight);
  -webkit-font-smoothing: antialiased;
}
```

### 5.6 Font loading — required, and a live risk

Roboto must supply weights **400, 500, 600, 700**. Classic static Roboto historically shipped no SemiBold (600); a browser asked for 600 with only 500 and 700 available will either synthesise or snap, and your `*.strong` roles will render wrong. **Load the variable font.**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap">
```

Verify in the browser that 600 is a real instance and not a synthetic one. If it is not available, escalate as gap **G-09** rather than silently substituting 700.

---

## 6. React implementation

### 6.1 Typed token contract

`src/design-system/tokens.ts` — the compile-time guard. If a value is not in these unions, TypeScript rejects it before a designer ever sees it.

```ts
// ---------- Typography ----------
export const TYPOGRAPHY_ROLES = [
  'heading-xl', 'heading-lg', 'heading-md', 'heading-sm', 'heading-xs',
  'body-lg-strong', 'body-lg-medium', 'body-lg-default',
  'body-md-strong', 'body-md-medium', 'body-md-default',
  'body-sm-strong', 'body-sm-medium', 'body-sm-default',
] as const;
export type TypographyRole = (typeof TYPOGRAPHY_ROLES)[number];

export const TYPOGRAPHY = {
  'heading-xl': { fontSize: '1.875rem', lineHeight: 1.2, letterSpacing: '0px', fontWeight: 500 },
  'heading-lg': { fontSize: '1.625rem', lineHeight: 1.0769, letterSpacing: '0px', fontWeight: 500 },
  'heading-md': { fontSize: '1.25rem', lineHeight: 1.1, letterSpacing: '0px', fontWeight: 500 },
  'heading-sm': { fontSize: '1rem', lineHeight: 1.25, letterSpacing: '0px', fontWeight: 500 },
  'heading-xs': { fontSize: '0.75rem', lineHeight: 1.3333, letterSpacing: '0px', fontWeight: 500 },
  'body-lg-strong': { fontSize: '1rem', lineHeight: 1.375, letterSpacing: '0.25px', fontWeight: 600 },
  'body-lg-medium': { fontSize: '1rem', lineHeight: 1.375, letterSpacing: '0.25px', fontWeight: 500 },
  'body-lg-default': { fontSize: '1rem', lineHeight: 1.375, letterSpacing: '0.25px', fontWeight: 400 },
  'body-md-strong': { fontSize: '0.875rem', lineHeight: 1.4286, letterSpacing: '0.25px', fontWeight: 600 },
  'body-md-medium': { fontSize: '0.875rem', lineHeight: 1.4286, letterSpacing: '0.25px', fontWeight: 500 },
  'body-md-default': { fontSize: '0.875rem', lineHeight: 1.4286, letterSpacing: '0.25px', fontWeight: 400 },
  'body-sm-strong': { fontSize: '0.75rem', lineHeight: 1.3333, letterSpacing: '0.25px', fontWeight: 600 },
  'body-sm-medium': { fontSize: '0.75rem', lineHeight: 1.3333, letterSpacing: '0.25px', fontWeight: 500 },
  'body-sm-default': { fontSize: '0.75rem', lineHeight: 1.3333, letterSpacing: '0.25px', fontWeight: 400 },
} as const;
// Figma font.style -> CSS font-weight. font.style is Figma-only; never emit it.
export const FONT_STYLE_TO_WEIGHT = {
  Regular: 400, Medium: 500, SemiBold: 600, Bold: 700,
} as const;

// ---------- Semantic colour ----------
export type ColorProperty = 'background' | 'text' | 'border' | 'icon';
export type Intent = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';
export type Prominence = 'subtlest' | 'subtle' | 'bold' | 'inverse';
export type State = 'default' | 'hovered' | 'pressed' | 'disabled';

/**
 * Only these combinations exist. Anything else is a gap — see §9.
 * Keep this list in sync with tokens.css; a missing entry must fail the
 * build, not fall back to a primitive.
 */
export const TEXT_TOKENS = [
  'neutral-subtlest-default', 'neutral-subtlest-disabled',
  'neutral-subtle-default',   'neutral-subtle-disabled',
  'neutral-bold-default',     'neutral-bold-hovered', 'neutral-bold-disabled',
  'neutral-inverse-default',
  'brand-subtle-default',     'brand-bold-default',   'brand-bold-hovered',
  'info-bold-default',        'success-bold-default',
  'danger-subtle-default',    'danger-bold-default',  'danger-bold-hovered',
] as const;
export type TextToken = (typeof TEXT_TOKENS)[number];

export const colorVar = (property: ColorProperty, token: string) =>
  `var(--ds-color-${property}-${token})`;

// ---------- Scales ----------
export const SPACE = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96] as const;
export type Space = (typeof SPACE)[number];
export const space = (n: Space) => `var(--ds-spacing-${n})`;

export const RADIUS = ['none', 'sm', 'base', 'lg', 'xl', 'full'] as const;
export type Radius = (typeof RADIUS)[number];
export const radius = (r: Radius) => `var(--ds-radius-${r})`;

export const SIZING = [2, 3, 4, 5, 6, 8, 10, 12, 16] as const;
export type Sizing = (typeof SIZING)[number];
```

### 6.2 `<Text>` — the only sanctioned way to render type

```tsx
import { forwardRef, type ElementType, type ReactNode } from 'react';
import type { TypographyRole, TextToken } from './tokens';

interface TextProps {
  /** One of the 14 roles. Required — there is no default type style. */
  role: TypographyRole;
  /** Semantic text colour, without the `--ds-color-text-` prefix. */
  color?: TextToken;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { role, color = 'neutral-bold-default', as: Tag = 'span', className, children, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={[`ds-text-${role}`, className].filter(Boolean).join(' ')}
      style={{ color: `var(--ds-color-text-${color})` }}
      {...rest}
    >
      {children}
    </Tag>
  );
});
```

`role` controls appearance; `as` controls semantics. They are independent on purpose — a visually small heading can still be an `<h2>`.

```tsx
<Text as="h1" role="heading-xl">Accounts</Text>
<Text as="h2" role="heading-sm">Recent activity</Text>
<Text role="body-md-default" color="neutral-subtle-default">Updated 2 minutes ago</Text>
<Text role="body-sm-strong" color="danger-bold-default">Payment failed</Text>
```

### 6.3 `<Button>` — full state coverage from tokens

```tsx
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const SIZE = {
  sm: { height: 'var(--ds-sizing-8)',  px: 'var(--ds-spacing-12)', role: 'ds-text-body-sm-strong' },
  md: { height: 'var(--ds-sizing-10)', px: 'var(--ds-spacing-16)', role: 'ds-text-body-md-strong' },
  lg: { height: 'var(--ds-sizing-12)', px: 'var(--ds-spacing-24)', role: 'ds-text-body-lg-strong' },
} as const;

export function Button({
  variant = 'primary', size = 'md', className, ...rest
}: { variant?: Variant; size?: Size } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const s = SIZE[size];
  return (
    <button
      className={[`ds-button ds-button--${variant}`, s.role, className].filter(Boolean).join(' ')}
      style={{ height: s.height, paddingInline: s.px }}
      {...rest}
    />
  );
}
```

```css
.ds-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-spacing-8);
  border-radius: var(--ds-radius-base);
  border: var(--ds-border-width-1) solid transparent;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
.ds-button:disabled { cursor: not-allowed; }

/* --- primary ------------------------------------------------------------
   ⚠️ ACCESSIBILITY: white on background.brand.bold.default (#009688) is
   3.67:1 — this FAILS WCAG 1.4.3 AA for the 14px SemiBold label.
   Interim rule (gap G-01): shift the resting fill one step darker to
   teal/700 (#00796B, 5.32:1 with white) until a compliant
   background.brand.bold.default is authored. Do NOT ship #009688 + white
   for normal-size button text.
   ------------------------------------------------------------------------ */
.ds-button--primary {
  background-color: var(--ds-color-background-brand-bold-pressed);   /* interim, G-01 */
  color: var(--ds-color-text-neutral-inverse-default);
}
.ds-button--primary:hover:not(:disabled) {
  background-color: var(--ds-color-background-brand-bold-hovered);
}
.ds-button--primary:active:not(:disabled) {
  background-color: var(--ds-color-background-brand-bold-pressed);
}
.ds-button--primary:disabled {
  background-color: var(--ds-color-background-neutral-subtle-default);
  color: var(--ds-color-text-neutral-subtle-disabled);
}

/* --- secondary (outline) --- */
.ds-button--secondary {
  background-color: var(--ds-color-background-neutral-subtlest-default);
  color: var(--ds-color-text-brand-bold-default);
  border-color: var(--ds-color-border-brand-bold-default);
}
.ds-button--secondary:hover:not(:disabled) {
  background-color: var(--ds-color-background-brand-subtlest-default);
  border-color: var(--ds-color-border-brand-bold-hovered);
  color: var(--ds-color-text-brand-bold-hovered);
}
.ds-button--secondary:active:not(:disabled) {
  background-color: var(--ds-color-background-brand-subtlest-hovered);
  border-color: var(--ds-color-border-brand-bold-pressed);
}
.ds-button--secondary:disabled {
  color: var(--ds-color-text-neutral-subtle-disabled);
  border-color: var(--ds-color-border-neutral-bold-disabled);
}

/* --- subtle (ghost) --- */
.ds-button--subtle {
  background-color: transparent;
  color: var(--ds-color-text-neutral-subtle-default);
}
.ds-button--subtle:hover:not(:disabled) {
  background-color: var(--ds-color-background-neutral-subtle-default);
  color: var(--ds-color-text-neutral-bold-default);
}
.ds-button--subtle:active:not(:disabled) {
  background-color: var(--ds-color-background-neutral-subtle-hovered);
}
.ds-button--subtle:disabled { color: var(--ds-color-text-neutral-subtle-disabled); }

/* --- danger ------------------------------------------------------------
   ⚠️ Same issue as primary: white on danger.bold.default (#E64D4D) is
   3.80:1 — fails AA for normal text. Interim: rest at red/600
   (#AB3645, 6.28:1). Gap G-01.
   ---------------------------------------------------------------------- */
.ds-button--danger {
  background-color: var(--ds-color-background-danger-bold-hovered);  /* interim, G-01 */
  color: var(--ds-color-text-neutral-inverse-default);
}
.ds-button--danger:hover:not(:disabled) {
  background-color: var(--ds-color-background-danger-bold-pressed);
}
.ds-button--danger:active:not(:disabled) {
  background-color: var(--ds-color-background-danger-bold-pressed);
}
.ds-button--danger:disabled {
  background-color: var(--ds-color-background-neutral-subtle-default);
  color: var(--ds-color-text-neutral-subtle-disabled);
}
```

### 6.4 Tabular numerals — required for every money value

The token system has no tabular-figures token (gap **G-06**), but unaligned digits in a fintech ledger is a correctness problem, not a polish problem. Use this utility everywhere a number is compared vertically, and log the gap.

```css
/* INTERIM — pending a font.fontVariantNumeric primitive (G-06) */
.ds-numeric {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
```

```tsx
<Text role="body-md-medium" className="ds-numeric">£1,284.05</Text>
```

### 6.5 Tailwind mapping

Map to the CSS variables — never re-declare the values, or you now have two sources of truth.

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const c = (p: string, t: string) => `var(--ds-color-${p}-${t})`;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    // `extend` is deliberately NOT used for these: replacing the scales
    // removes Tailwind's defaults, so off-token utilities stop compiling.
    spacing: {
      0: 'var(--ds-spacing-0)',   1: 'var(--ds-spacing-4)',
      2: 'var(--ds-spacing-8)',   3: 'var(--ds-spacing-12)',
      4: 'var(--ds-spacing-16)',  5: 'var(--ds-spacing-20)',
      6: 'var(--ds-spacing-24)',  8: 'var(--ds-spacing-32)',
      10: 'var(--ds-spacing-40)', 12: 'var(--ds-spacing-48)',
      16: 'var(--ds-spacing-64)', 20: 'var(--ds-spacing-80)',
      24: 'var(--ds-spacing-96)',
    },
    borderRadius: {
      none: 'var(--ds-radius-none)', sm: 'var(--ds-radius-sm)',
      DEFAULT: 'var(--ds-radius-base)', lg: 'var(--ds-radius-lg)',
      xl: 'var(--ds-radius-xl)', full: 'var(--ds-radius-full)',
    },
    borderWidth: {
      0: 'var(--ds-border-width-0)', DEFAULT: 'var(--ds-border-width-1)',
      2: 'var(--ds-border-width-2)', 4: 'var(--ds-border-width-4)',
    },
    fontFamily: {
      sans: 'var(--ds-font-family-sans)',
      mono: 'var(--ds-font-family-mono)',
    },
    backgroundColor: {
      'neutral-subtlest': c('background', 'neutral-subtlest-default'),
      'neutral-subtle': c('background', 'neutral-subtle-default'),
      'brand-subtlest': c('background', 'brand-subtlest-default'),
      'brand-subtle': c('background', 'brand-subtle-default'),
      'brand-bold': c('background', 'brand-bold-default'),
      'info-subtlest': c('background', 'info-subtlest-default'),
      'success-subtlest': c('background', 'success-subtlest-default'),
      'warning-subtlest': c('background', 'warning-subtlest-default'),
      'danger-subtlest': c('background', 'danger-subtlest-default'),
      'danger-bold': c('background', 'danger-bold-default'),
      transparent: 'transparent',
    },
    textColor: {
      'neutral-subtlest': c('text', 'neutral-subtlest-default'),
      'neutral-subtle': c('text', 'neutral-subtle-default'),
      'neutral-bold': c('text', 'neutral-bold-default'),
      inverse: c('text', 'neutral-inverse-default'),
      brand: c('text', 'brand-bold-default'),
      info: c('text', 'info-bold-default'),
      success: c('text', 'success-bold-default'),
      danger: c('text', 'danger-bold-default'),
    },
    borderColor: {
      DEFAULT: c('border', 'neutral-subtle-default'),
      subtle: c('border', 'neutral-subtle-default'),
      bold: c('border', 'neutral-bold-default'),
      brand: c('border', 'brand-bold-default'),
      danger: c('border', 'danger-bold-default'),
    },
    // Type is applied via .ds-text-* classes, not Tailwind's fontSize scale.
    fontSize: {},
  },
} satisfies Config;
```

**Do not use Tailwind arbitrary values** (`text-[15px]`, `bg-[#009688]`, `p-[13px]`, `mt-[7px]`). Ban them in lint (§11.2). An arbitrary value is a token violation wearing a bracket.

---

## 7. Figma alignment

Keep these true or Figma and code will drift.

| Rule | Why |
|---|---|
| Semantic variables alias primitives — never re-enter a hex | An unaliased semantic silently forks the ramp |
| Line height must be set to **Fixed** in Figma before a variable can bind | Auto blocks variable binding entirely |
| Font style bindings need **string** variables matching Roboto's exact style names | Numeric weight variables cannot bind to the style field |
| Restrict variable scopes — never leave `ALL_SCOPES` | Prevents a line-height token appearing in a colour picker. All 34 colour primitives and all 93 semantics currently sit on `ALL_SCOPES` (gap **G-10**) |
| `font.style.*` is Figma-only | It never becomes CSS; §6.1 maps it to `font-weight` |
| One text style per typography role, named to match the token path | `Heading/XL` ↔ `typography.heading.xl` |

When you export from Figma, the JSON should differ from the committed files in **values only**, never in structure. A structural diff means someone renamed a variable — treat it as a breaking change.

---

## 8. Accessibility

Target: **WCAG 2.2 Level AA**. For a regulated fintech surface, treat AA as the floor.

### 8.1 Non-negotiables

1. Text contrast ≥ **4.5:1**; large text (≥24px, or ≥18.66px at weight 700) ≥ **3:1**. Only `heading.xl` (30px) and `heading.lg` (26px) qualify as large. **`heading.md` at 20px Medium does not** — Medium is 500, not bold.
2. UI components and meaningful graphics ≥ **3:1** (1.4.11).
3. Colour is never the only carrier of meaning (1.4.1) — pair every status colour with an icon or text label. This matters more than usual here: `text.success.bold` is unusable as text (§8.2), so status must be legible without it.
4. Every focusable element has a visible focus indicator (2.4.7). No tokens exist for this — see §9.2.
5. Minimum target size **24×24 CSS px** (2.5.8). `sizing.6` = 24px is the floor; `sizing.10` = 40px is the comfortable default.
6. Disabled text is exempt from contrast rules, but never encode required information in a disabled state.

### 8.2 Verified contrast — text on light surfaces

Computed from the actual token values. ✅AAA ≥7 · ✅AA ≥4.5 · ⚠️L = large-text only (3–4.5) · ❌ <3.

| text token | subtlest #FFFFFF | n.subtle #F5F7F8 | brand.subtlest #E6F5F3 | info.subtlest #EBF0FB | success.subtlest #E9FCF2 | warning.subtlest #FDF5E4 | danger.subtlest #FAEBED |
|---|---|---|---|---|---|---|---|
| `text.neutral.subtlest` | 3.35 ⚠️L | 3.12 ⚠️L | 2.99 ❌ | 2.93 ❌ | 3.14 ⚠️L | 3.09 ⚠️L | 2.90 ❌ |
| `text.neutral.subtle` | **7.24** ✅AAA | **6.74** ✅AA | **6.45** ✅AA | **6.34** ✅AA | **6.78** ✅AA | **6.67** ✅AA | **6.26** ✅AA |
| `text.neutral.bold` | **13.16** ✅AAA | **12.25** ✅AAA | **11.73** ✅AAA | **11.52** ✅AAA | **12.33** ✅AAA | **12.13** ✅AAA | **11.39** ✅AAA |
| `text.brand.subtle` | 3.67 ⚠️L | 3.42 ⚠️L | 3.27 ⚠️L | 3.22 ⚠️L | 3.44 ⚠️L | 3.39 ⚠️L | 3.18 ⚠️L |
| `text.brand.bold` | 4.42 ⚠️L | 4.12 ⚠️L | 3.94 ⚠️L | 3.87 ⚠️L | 4.14 ⚠️L | 4.08 ⚠️L | 3.83 ⚠️L |
| `text.info.bold` | 3.93 ⚠️L | 3.66 ⚠️L | 3.50 ⚠️L | 3.44 ⚠️L | 3.68 ⚠️L | 3.62 ⚠️L | 3.40 ⚠️L |
| `text.success.bold` | 2.41 ❌ | 2.24 ❌ | 2.15 ❌ | 2.11 ❌ | 2.25 ❌ | 2.22 ❌ | 2.08 ❌ |
| `text.danger.subtle` | 3.80 ⚠️L | 3.53 ⚠️L | 3.38 ⚠️L | 3.32 ⚠️L | 3.56 ⚠️L | 3.50 ⚠️L | 3.28 ⚠️L |
| `text.danger.bold` | **6.28** ✅AA | **5.84** ✅AA | **5.60** ✅AA | **5.50** ✅AA | **5.88** ✅AA | **5.79** ✅AA | **5.43** ✅AA |
| `text.neutral.*.disabled` | 1.91 ❌ | 1.77 ❌ | 1.70 ❌ | 1.67 ❌ | 1.79 ❌ | 1.76 ❌ | 1.65 ❌ |

**Rules that follow directly from this table:**

- **Safe body text:** `text.neutral.bold` (11.4–13.2) and `text.neutral.subtle` (6.3–7.2) on any surface. These are your workhorses.
- **`text.neutral.subtlest` (#78909C) fails AA everywhere** — 3.35 on white at best, and below 3 on brand/info/danger surfaces. Restrict to ≥24px, or replace with `text.neutral.subtle`. Never use it for metadata you expect people to read.
- **`text.success.bold` (#20BF6B) fails at every size on every surface** — 2.41 on white. There is currently **no accessible success text colour**. Gap **G-01**; use `text.neutral.bold` plus a check icon and the word "Complete".
- **`text.brand.bold` on white is 4.42** — misses 4.5 by a hair. Acceptable at ≥24px; for body copy use `text.neutral.bold` and carry brand elsewhere. Never use `text.brand.subtle` (3.67) as body copy.
- **`text.info.bold` (3.93) and `text.danger.subtle` (3.80) are large-text-only.** For error messages at 14px use **`text.danger.bold`** (6.28) — this is the one status colour that works as text.

### 8.3 Verified contrast — foreground on bold fills

| bold fill | `text.neutral.inverse` (#FFFFFF) | `text.neutral.bold` (#263238) | Verdict |
|---|---|---|---|
| `background.brand.bold.default` #009688 | 3.67 ⚠️L | 3.58 ⚠️L | White is large-text-only ⚠️ |
| `background.brand.bold.hovered` #00877A | 4.42 ⚠️L | 2.97 ❌ | White is large-text-only ⚠️ |
| `background.brand.bold.pressed` #00796B | **5.32** ✅AA | 2.47 ❌ | Use **inverse** (white) |
| `background.danger.bold.default` #E64D4D | 3.80 ⚠️L | 3.47 ⚠️L | White is large-text-only ⚠️ |
| `background.danger.bold.hovered` #AB3645 | **6.28** ✅AA | 2.10 ❌ | Use **inverse** (white) |
| `background.danger.bold.pressed` #892936 | **8.63** ✅AAA | 1.53 ❌ | Use **inverse** (white) |
| `background.info.bold.default` #4B7BEC | 3.93 ⚠️L | 3.35 ⚠️L | White is large-text-only ⚠️ |
| `background.success.bold.default` #20BF6B | 2.41 ❌ | **5.47** ✅AA | Use **text.neutral.bold** — white fails |
| `background.warning.bold.default` #F5CD79 | 1.51 ❌ | **8.71** ✅AAA | Use **text.neutral.bold** — white fails |
| `background.neutral.bold.default` #F5F7F8 | 1.07 ❌ | **12.25** ✅AAA | Use **text.neutral.bold** — white fails |

**This is the most consequential finding in the audit.** `background.brand.bold.default` (#009688) with white gives **3.67:1** — the primary button label fails AA at 14px. And `text.neutral.bold` on the same fill is 3.58, so there is no compliant foreground. Neither colour rescues the resting brand fill; the fill itself has to change. §6.3 applies the interim shift to `teal/700`.

### 8.4 UI component contrast (1.4.11)

| token | on #FFFFFF | 1.4.11 (3:1) | Safe for… |
|---|---|---|---|
| `border.neutral.subtlest` #F5F7F8 | 1.07 | ❌ FAIL | decorative dividers only — must not be the sole indicator |
| `border.neutral.subtle.default` #ECEFF1 | 1.15 | ❌ FAIL | decorative dividers only — must not be the sole indicator |
| `border.neutral.subtle.hovered` #CFD8DC | 1.45 | ❌ FAIL | decorative dividers only — must not be the sole indicator |
| `border.neutral.bold.default` #CFD8DC | 1.45 | ❌ FAIL | decorative dividers only — must not be the sole indicator |
| `border.neutral.bold.hovered` #78909C | 3.35 | ✅ PASS | meaningful boundaries, focus, control edges |
| `border.neutral.bold.pressed` #607D8B | 4.37 | ✅ PASS | meaningful boundaries, focus, control edges |
| `border.brand.bold.default` #009688 | 3.67 | ✅ PASS | meaningful boundaries, focus, control edges |
| `border.danger.bold.default` #E64D4D | 3.80 | ✅ PASS | meaningful boundaries, focus, control edges |
| `icon.neutral.subtlest.default` #B0BEC5 | 1.91 | ❌ FAIL | decorative dividers only — must not be the sole indicator |
| `icon.neutral.subtle.default` #607D8B | 4.37 | ✅ PASS | meaningful boundaries, focus, control edges |
| `icon.neutral.bold.default` #37474F | 9.65 | ✅ PASS | meaningful boundaries, focus, control edges |
| `icon.brand.subtle.default` #33ABA0 | 2.81 | ❌ FAIL | decorative dividers only — must not be the sole indicator |
| `icon.brand.bold.default` #009688 | 3.67 | ✅ PASS | meaningful boundaries, focus, control edges |
| `icon.success.bold.default` #20BF6B | 2.41 | ❌ FAIL | decorative dividers only — must not be the sole indicator |
| `icon.warning.bold.default` #F5CD79 | 1.51 | ❌ FAIL | decorative dividers only — must not be the sole indicator |
| `icon.info.bold.default` #4B7BEC | 3.93 | ✅ PASS | meaningful boundaries, focus, control edges |
| `icon.danger.bold.default` #E64D4D | 3.80 | ✅ PASS | meaningful boundaries, focus, control edges |

**Input borders are the problem here.** `border.neutral.bold.default` (#CFD8DC) is **1.45:1** — an input outlined with it is effectively invisible to a low-vision user, failing 1.4.11. Use **`border.neutral.bold.hovered`** (#78909C, 3.35) as the *resting* input border, and `border.neutral.bold.pressed` (#607D8B, 4.37) for focus/active. Reserve `#CFD8DC` for decorative dividers inside an already-bounded container.

Same logic for icons: `icon.neutral.subtlest` (1.91), `icon.brand.subtle` (2.81), `icon.success.bold` (2.41) and `icon.warning.bold` (1.51) all fail 3:1. They are decorative-only. A warning triangle in `icon.warning.bold` on white is not perceivable — pair it with `icon.neutral.bold` or place it on the warning surface with a text label.

### 8.5 Text spacing (1.4.12)

1.4.12 does not require you to author 1.5 line-height; it requires the layout to survive when a user forces it. Since all three body roles are authored below 1.5 (1.375 / 1.4286 / 1.3333), you must test with this override applied:

```css
/* Paste in devtools to verify nothing clips or overlaps */
* {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
p { margin-block-end: 2em !important; }
```

Concretely: **never set a fixed height on a text container.** Use `min-height` and let content grow. Prefer `padding` over `height` for controls that contain wrapping text. This matters most for `heading.lg` (ratio 1.08) and `heading.md` (1.10), which have almost no vertical slack.

### 8.6 Focus visibility

No focus token exists (gap **G-01**). Until one does, use this — and log it:

```css
/* INTERIM focus ring, pending --ds-color-border-focus-default (G-01).
   border.brand.bold.default (#009688) is 3.67:1 on white — clears the
   3:1 requirement for a focus indicator. */
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: var(--ds-border-width-2) solid var(--ds-color-border-brand-bold-default);
  outline-offset: var(--ds-spacing-4);
  border-radius: inherit;
}
```

Never `outline: none` without an equivalent replacement. On a brand-coloured fill the teal ring disappears — switch to `--ds-color-border-neutral-inverse-default` (white) in that context.

---

## 9. Known gaps and the escalation protocol

**This is the section that keeps prototypes honest.** When a request cannot be satisfied from tokens, you do not improvise. You apply the interim rule, and you tell the user.

### 9.1 Gap register

| ID | Gap | Impact | Proposed resolution |
|---|---|---|---|
| **G-01** | No accessible pairing for several intents. White on `brand.bold.default` = 3.67; on `danger.bold.default` = 3.80; `text.success.bold` on white = 2.41; `border.neutral.bold.default` = 1.45; no focus token | Primary CTA, destructive CTA, success text and input borders all fail WCAG AA | Darken `brand.bold.default` to `teal/700`; add `green/600`+`green/700` and `blue/600`+`blue/700` primitives; add `color.border.focus.default` |
| **G-02** | Body line-height ratios below 1.5 (1.375 / 1.4286 / 1.3333); `heading.lg` at 1.08 and `heading.md` at 1.10 are extremely tight | Long-form readability; layouts break under 1.4.12 text-spacing override | Add a 24px line-height step; re-map `body.lg`→24, `body.md`→20 (1.43 acceptable at 14px), `heading.lg`→32, `heading.md`→28 |
| **G-03** | `background.neutral.bold.*` is identical to `background.neutral.subtle.*` (grey/100–300) | No dark/inverse surface exists; pairing it with `text.neutral.inverse` yields 1.07:1 | Re-alias to `grey/800`/`grey/900` |
| **G-04** | `info`, `success`, `warning` have only `100` and `500` steps | No hover/pressed states for these intents; no accessible text variant | Add `600` and `700` to blue, green, yellow ramps |
| **G-05** | No `text.warning.*` | Warning copy has no token | Add `text.warning.bold` → a new `yellow/700` |
| **G-06** | No tabular-figures token | Numeric columns misalign — a correctness issue in a ledger | Add `font.fontVariantNumeric.tabular` |
| **G-07** | No semantic spacing layer | Spacing intent is uncommunicated; components consume primitives | Add `space.component.*` / `space.layout.*` semantics |
| **G-08** | 23 orphaned primitives: `font/size/lg,4xl,5xl,6xl`, `lineheight/xl,3xl`, 8 of 10 letterspacing steps, both textdecorations, `font/style/bold`, `orange/*`, `purple/*` | Dead surface area; invites direct primitive use | Either author roles that consume them, or deprecate |
| **G-09** | `font.style.semibold` = "SemiBold", but classic static Roboto ships no 600 | `*.strong` roles may render synthesised or snapped | Load Roboto variable font; verify 600 is a real instance |
| **G-10** | All colour variables scoped `ALL_SCOPES` | Line-height tokens surface in colour pickers and vice versa; designers pick wrong tokens | Restrict each scope to its property |
| **G-11** | Grey ramp is `color/grey/*` in paths but `--_ds-color-neutral-*` in `codeSyntax` | Figma Dev Mode shows names that do not exist in CSS | Pick one; update `codeSyntax` |
| **G-12** | `space` token keys literally contain `--ds-spacing-` | Naive generators emit `--ds-space---ds-spacing-16` | Rename keys to `0`,`4`,`8`…; special-case until then |
| **G-13** | Mixed `--_ds-` / `--ds-` prefixes | Ambiguous which layer is public | Document (done here) or unify |
| **G-14** | Single mode — no dark theme | `[data-theme="dark"]` is impossible | Add a Dark mode to the Semantics collection; primitives stay mode-less |
| **G-15** | No elevation/shadow tokens | Cards, dropdowns, modals have no sanctioned depth | Add `shadow.raised` / `overlay` / `sunken` |
| **G-16** | No typography roles for label, caption, code, link, overline, or display | Forms, tables, links, code and marketing heroes have no type | Author them; `font.family.mono` and `font.textdecoration.underline` already exist unused |

### 9.2 Interim fallbacks (use these, then report)

Never block a prototype. Apply the fallback, flag it inline, and record it.

| Missing | Interim | Marker |
|---|---|---|
| Focus ring | `2px solid var(--ds-color-border-brand-bold-default)`, offset 4px | `/* INTERIM G-01 */` |
| Accessible primary fill | `--ds-color-background-brand-bold-pressed` (teal/700) at rest | `/* INTERIM G-01 */` |
| Accessible danger fill | `--ds-color-background-danger-bold-hovered` (red/600) at rest | `/* INTERIM G-01 */` |
| Success text | `--ds-color-text-neutral-bold-default` + check icon + label | `/* INTERIM G-01 */` |
| Warning text | `--ds-color-text-neutral-bold-default` on warning surface + icon | `/* INTERIM G-05 */` |
| Input border | `--ds-color-border-neutral-bold-hovered` (#78909C) at rest | `/* INTERIM G-01 */` |
| Dark surface | `--ds-color-text-neutral-bold-default` as a background — **do not**; use `background.neutral.subtle` and escalate | `/* INTERIM G-03 */` |
| Elevation | `box-shadow: 0 1px 2px rgb(38 50 56 / 0.08), 0 2px 8px rgb(38 50 56 / 0.06)` — derived from `grey/900`, the only raw value permitted outside `tokens.css` | `/* INTERIM G-15 */` |
| Dark mode | Not possible. Build light-only and escalate | — |
| Label / caption type | `body-sm-medium` | `/* INTERIM G-16 */` |
| Link type | `body-md-default` + `text-decoration: underline` + `text.brand.bold` (4.42 — large text only; at 14px use `text.neutral.bold` with underline) | `/* INTERIM G-16 */` |
| Code type | `body-sm-default` + `font-family: var(--ds-font-family-mono)` | `/* INTERIM G-16 */` |
| Off-scale spacing | Round to the **nearest smaller** step. Never `calc()` | `/* INTERIM G-07 */` |
| Tabular numerals | `.ds-numeric` utility (§6.4) | `/* INTERIM G-06 */` |

### 9.3 What is never acceptable

- Inventing a hex, even by interpolating an existing ramp
- Referencing a `--_ds-*` primitive from a component
- Using `heading.*` roles for non-heading text just to get a size
- `calc()` on a spacing token to reach an off-scale value
- Setting `font-size`, `line-height`, `letter-spacing` or `font-weight` outside a `.ds-text-*` role
- Tailwind arbitrary values
- `outline: none` with no replacement
- Shipping a foreground/background pair marked ❌ in §8
- Suppressing an escalation because the deviation is small

### 9.4 Escalation format

When you deviate, print this in your response **and** append it to `TOKEN-GAPS.md`:

```markdown
### ⚠️ Token gap — [component / screen]

**Requested:** Success badge with green text on a white surface
**Blocked by:** G-01 — `text.success.bold` (#20BF6B) is 2.41:1 on
  `background.neutral.subtlest.default`. Fails WCAG 1.4.3 AA (needs 4.5:1)
  and also fails the 3:1 large-text threshold. No accessible green exists
  in the ramp; `green` has only steps 100 and 500.
**Applied instead:** `background.success.subtlest.default` surface +
  `text.neutral.bold.default` (12.33:1) + a check icon in
  `icon.neutral.bold.default` + the visible label "Complete".
  Marked `/* INTERIM G-01 */`.
**To resolve properly:** add `color/green/600` and `color/green/700`
  primitives, then author `color.text.success.bold.default → green/700`.
  Target ≥4.5:1 on white. Owner: Alireza (token build).
**Blast radius:** every success state — badges, toasts, inline validation,
  transaction status in the ledger.
```

Keep the register at the repo root so it becomes the backlog for the next token release, rather than a set of forgotten inline comments.

---

## 10. Migration playbook — porting an existing prototype

Your prototype was built against a different token set. Work in this order; do not start replacing values until step 3.

### Step 1 — Inventory (do not change anything yet)

```bash
# Every hex literal
rg -n --no-heading -o '#[0-9a-fA-F]{3,8}\b' src/ | sort | uniq -c | sort -rn

# rgb/rgba/hsl
rg -n 'rgba?\(|hsla?\(' src/

# Hardcoded type
rg -n 'font-size|lineHeight|line-height|letterSpacing|fontWeight|font-weight' src/

# Off-token spacing (px values not on the scale)
rg -n --pcre2 '(?:padding|margin|gap|top|left|right|bottom)[^;]*?\b(?!(?:0|4|8|12|16|20|24|32|40|48|64|80|96)px)\d+px' src/

# Tailwind arbitrary values
rg -n '\[(#|\d+px|\d+rem)' src/

# Old token references — adjust the prefix to your previous system
rg -n 'var\(--(?!_?ds-)[a-z]' src/
```

Write the results to `MIGRATION-INVENTORY.md`. You will need the counts to know when you are done.

### Step 2 — Install the new token layer

1. Create `src/styles/tokens.css` from §5 verbatim.
2. Import it first in the root entry, before any component CSS.
3. Create `src/design-system/tokens.ts` from §6.1.
4. Add the `.ds-text-*` classes (§5.4) and the base reset (§5.5).
5. Add the interim focus ring (§8.6) and `.ds-numeric` (§6.4).
6. Update `tailwind.config.ts` per §6.5 **and expect the build to break** — that is the point. Every failure is an off-token value.

### Step 3 — Map old → new, one property family at a time

Do colour, then type, then spacing. Commit between each. Do not batch.

**Colour.** For each old value, find the nearest primitive, then choose the semantic that *means* what the old value was doing:

| If the old value was… | Map to |
|---|---|
| Page background / card fill (white) | `background.neutral.subtlest.default` |
| Section or well background (light grey) | `background.neutral.subtle.default` |
| Primary body copy | `text.neutral.bold.default` |
| Secondary / helper copy | `text.neutral.subtle.default` — **not** `subtlest`, which fails AA |
| Placeholder / metadata | `text.neutral.subtle.default` + smaller role |
| Disabled text | `text.neutral.subtle.disabled` |
| Divider / hairline | `border.neutral.subtle.default` |
| Input border | `border.neutral.bold.hovered` (see §8.4 — `bold.default` fails 1.4.11) |
| Primary action fill | `background.brand.bold.pressed` (interim, G-01) |
| Link | `text.brand.bold.default` (large) / `text.neutral.bold.default` + underline (body) |
| Error text | `text.danger.bold.default` |
| Error surface | `background.danger.subtlest.default` |
| Success surface | `background.success.subtlest.default` + neutral text (G-01) |
| Icon, default | `icon.neutral.subtle.default` |
| Icon on a bold fill | `icon.neutral.inverse.default` |

Choose by **role, not by nearest hex.** If the old palette had a mid-grey used for both borders and secondary text, it splits into two different tokens here.

**Type.** Match on font-size first, then reconcile weight:

| Old size | New role |
|---|---|
| 30–32px | `heading-xl` |
| 24–28px | `heading-lg` |
| 20–22px | `heading-md` |
| 16–18px heading | `heading-sm` |
| 16px body | `body-lg-{default\|medium\|strong}` |
| 14px body | `body-md-{default\|medium\|strong}` |
| 12px body / caption / label | `body-sm-{default\|medium\|strong}` |
| 12px heading | `heading-xs` |
| >32px | **No role exists** → escalate G-16 |
| Weight 700 in body copy | `*-strong` is 600, not 700. Accept 600 or escalate |

Then delete every `font-size` / `line-height` / `letter-spacing` / `font-weight` declaration from component code. If a component still needs one, you picked the wrong role or found a gap.

**Spacing.** Snap to the scale. Values off-grid (7, 10, 14, 18, 28, 56, 72) round to the nearest **smaller** step so density does not creep; if the visual result is wrong, escalate G-07 rather than reaching for `calc()`.

### Step 4 — Verify

```bash
# Must return zero outside tokens.css
rg -n '#[0-9a-fA-F]{3,8}\b' src/ --glob '!**/tokens.css'

# Must return zero outside tokens.css
rg -n 'var\(--_ds-' src/ --glob '!**/tokens.css'

# Must return zero
rg -n 'font-size|font-weight|letter-spacing' src/ --glob '!**/tokens.css' --glob '!**/typography.css'
```

Then, manually:

- Walk every interactive element through default → hover → press → disabled → focus.
- Apply the 1.4.12 override from §8.5 and confirm nothing clips.
- Check every foreground/background pair against §8.2–8.4.
- Confirm `TOKEN-GAPS.md` exists and every `INTERIM` comment in the code has a matching entry.

### Step 5 — Report

Close with a summary: tokens applied, values replaced, gaps logged, and any pair still failing contrast with the reason. If the prototype ships with known failures, say so plainly rather than burying it.

---

## 11. Enforcement

### 11.1 Stylelint

```js
// .stylelintrc.cjs
module.exports = {
  rules: {
    'color-no-hex': true,
    'declaration-property-value-disallowed-list': {
      '/color/': ['/^#/', '/^rgb/', '/^hsl/'],
      '/^(padding|margin|gap|inset|top|right|bottom|left)/': ['/^\\d+px$/'],
      'font-size': ['/^\\d/'],
      'line-height': ['/^\\d+px$/'],
      'font-weight': ['/^\\d+$/'],
    },
    'declaration-property-value-allowed-list': {
      // primitives are private: only tokens.css may reference them
      '/.*/': [/^(?!.*var\(--_ds-).*$/],
    },
  },
  overrides: [{
    files: ['**/tokens.css'],
    rules: {
      'color-no-hex': null,
      'declaration-property-value-disallowed-list': null,
      'declaration-property-value-allowed-list': null,
    },
  }],
};
```

### 11.2 ESLint — ban Tailwind arbitrary values and inline hexes

```js
// eslint.config.js (flat)
export default [{
  files: ['src/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': ['error',
      {
        selector: 'Literal[value=/#[0-9a-fA-F]{3,8}/]',
        message: 'Hex literals are banned. Use a --ds-color-* semantic token (see §4.2).',
      },
      {
        selector: 'Literal[value=/\\[(#|\\d+px|\\d+rem)/]',
        message: 'Tailwind arbitrary values are banned. Use a token-mapped utility (see §6.5).',
      },
      {
        selector: 'Literal[value=/var\\(--_ds-/]',
        message: 'Primitives are private. Reference a --ds-* semantic token instead.',
      },
    ],
  },
}];
```

### 11.3 CI

```yaml
- run: npx stylelint "src/**/*.css"
- run: npx eslint src
- run: npx tsc --noEmit
# Fail the build on any primitive leak
- run: |
    if rg -q 'var\(--_ds-' src --glob '!**/tokens.css'; then
      echo "::error::Primitive token referenced outside tokens.css"; exit 1
    fi
```

---

## 12. Best practices

1. **Name by intent, never by appearance.** `text.danger.bold`, not `text.red`. The colour will change; the meaning will not.
2. **One role per text node.** If you are combining two `.ds-text-*` classes, you have found a gap.
3. **Cover all four states, always.** A button with only a default state is unfinished.
4. **Never colour-only.** Every status needs an icon or a label — mandatory here, since two of the four status colours are not usable as text.
5. **Let the build break.** A failing lint on an off-token value is the system working.
6. **Escalate small deviations too.** A 2px nudge is how systems rot.
7. **Aliases all the way down.** A semantic holding a raw value has forked the ramp.
8. **Author for the 1.4.12 override.** `min-height`, never `height`, on anything containing text.
9. **Tabular numerals on every compared number.** Non-negotiable in a ledger.
10. **Keep `TOKEN-GAPS.md` in the repo.** It is the input to the next token release, and the record that a deviation was a decision rather than an accident.

---

## 13. Quick reference

```
COLOUR   var(--ds-color-{background|text|border|icon}-{intent}-{prominence}-{state})
         intent      neutral · brand · info · success · warning · danger
         prominence  subtlest · subtle · bold · inverse
         state       default · hovered · pressed · disabled

TYPE     class .ds-text-{role}
         heading-xl · heading-lg · heading-md · heading-sm · heading-xs
         body-lg-{default|medium|strong}
         body-md-{default|medium|strong}
         body-sm-{default|medium|strong}

SPACE    var(--ds-spacing-{0|4|8|12|16|20|24|32|40|48|64|80|96})
RADIUS   var(--ds-radius-{none|sm|base|lg|xl|full})
BORDER   var(--ds-border-width-{0|1|2|4})
SIZING   var(--ds-sizing-{2|3|4|5|6|8|10|12|16})
OPACITY  var(--ds-opacity-{0|25|50|75|100})

SAFE PAIRS (body text)
  text.neutral.bold      on any subtlest surface   11.4–13.2  ✅
  text.neutral.subtle    on any subtlest surface    6.3–7.2   ✅
  text.danger.bold       on white                   6.28      ✅
  text.neutral.inverse   on brand.bold.pressed      5.32      ✅
  text.neutral.inverse   on danger.bold.hovered     6.28      ✅
  text.neutral.bold      on warning.bold            8.71      ✅
  text.neutral.bold      on success.bold            5.47      ✅

NEVER (fails AA as body text)
  text.neutral.subtlest  on anything                ≤3.35     ❌
  text.success.bold      on anything                ≤2.41     ❌
  text.neutral.inverse   on brand.bold.default      3.67      ❌
  text.neutral.inverse   on danger.bold.default     3.80      ❌
  text.neutral.inverse   on success/warning.bold    ≤2.41     ❌
  border.neutral.bold.default as an input border    1.45      ❌ (1.4.11)

BLOCKED — escalate (§9.4)
  dark mode · shadows · focus token · text.warning · tabular-nums token
  label/caption/code/link/display type · type >30px · off-scale spacing
```

**When in doubt: use the token that describes the purpose, verify the pair in §8, and if neither exists, escalate rather than approximate.**

