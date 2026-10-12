# Components → variables

Every component the product needs, and the exact design variables it consumes.
Companion to [COMPONENTS.md](COMPONENTS.md), which carries the full state detail.

Rebuilt against **Finlink Core** — see [README.md](README.md) for the layers and
[TOKEN-GAPS.md](TOKEN-GAPS.md) for everything the contract could not express.

**Excluded** (prototype scaffolding, not product): the segmented switches for
Dichte / Erscheinungsbild and the phone preview frame. The default/dark and
comfortable/compact mechanics are excluded too — they only re-point the variables
below, they are not components of their own.

**Reading the variable column**

- **Colour** names are the public semantic tokens, which flatten from the token
  path (`color.text.brand.bold.default` → `--ds-color-text-brand-bold-default`).
  Components never name a `--_ds-*` primitive; the build fails if one appears.
- **Type** is named as a **role**, not as properties. Every text node takes exactly
  one of the 14 roles, applied whole. `components.css` binds selectors to roles in
  its role-adoption section, so the markup carries no type classes.
- **†** = not in Finlink Core. Either genuinely missing (border widths, the focus
  glow, the overlay) or page furniture the system has no opinion on (widths, column
  minimums, measures). Each carries a gap ID in TOKEN-GAPS.md.
- **‡** = a local *grouping* only — it aliases a real token, so the value still
  comes from the design system (`--ds-card-padding` → `{space.32}`).

The last column is empty for you to fill in.

---

| Component | Variants | States | Variables needed | Exists / New |
|---|---|---|---|---|
| **Base / page** | — | — | **Colour** `--ds-color-text-neutral-bold-default`, `--ds-surface-page`, `--ds-surface-card`, `--ds-color-text-brand-bold-default` · **Type** `--ds-font-family-sans`, `body-md-default` role | |
| **Skip link** | — | Hidden, focused | **Colour** `--ds-color-text-brand-bold-default`, `--ds-color-border-brand-bold-default`, page bg · **Type** `*-medium` emphasis · **Space** `--ds-spacing-8`, `--ds-spacing-16` · **Other** `--ds-border-width-2`†, `--ds-button-radius`‡ | |
| **App shell** | Desktop 2-col · ≤900px 1-col | — | **Space** `--ds-spacing-16`, `--ds-spacing-20`, `--ds-spacing-40`, `--ds-spacing-48`, `--ds-spacing-64` · **Other** `--ds-layout-nav-width`†, `--ds-layout-content-max`†, `--ds-layout-gutter`† | |
| **12-column grid** | Spans 3 / 4 / 6 / 8 / 12, row-break | ≤640px → full width | **Space** `--ds-field-gap-stack`‡, `--ds-spacing-16` | |
| **Sidebar nav** | Desktop column · ≤900px top bar | Scrollable, hidden on summary/sent | **Colour** `--ds-color-border-neutral-bold-default` (scrollbar) · **Space** `--ds-spacing-4`, `--ds-spacing-40` · **Other** `--ds-layout-nav-width`†, `--ds-actionbar-height` (derived from `--ds-field-height` + `--ds-spacing-12` + `--ds-border-width-1`) | |
| **Nav link** | Top level · sub level · conditional | Default, hover, current, focus-visible | **Colour** `--ds-color-text-neutral-subtle-default`, `--ds-color-text-neutral-bold-default`, `--ds-color-background-neutral-subtle-default`, `--ds-color-background-brand-bold-default`, `--ds-color-background-brand-subtlest-default` · **Type** `heading-sm` role (top level), `body-md-default` / `body-md-medium` (sub level) · **Space** `--ds-spacing-8`, `--ds-spacing-12`, `--ds-spacing-24` · **Other** `--ds-button-radius`‡ | |
| **Nav divider** | — | — | **Colour** `--ds-color-border-neutral-bold-default` · **Space** `--ds-spacing-12`, `--ds-spacing-20` · **Other** `--ds-border-width-1`† | |
| **Nav section label (eyebrow)** | — | — | **Colour** `--ds-color-text-neutral-subtle-default` · **Type** `heading-xs` role · **Space** `--ds-spacing-8`, `--ds-spacing-12`, `--ds-spacing-16` | |
| **Mobile nav toggle** | — | Closed, open, hover, focus-visible | **Colour** `--ds-color-text-neutral-bold-default`, `--ds-color-border-neutral-bold-default`, `--ds-color-background-neutral-subtle-default`, `--ds-color-background-brand-bold-default`, `--ds-color-background-brand-subtlest-default`, `--ds-color-border-brand-bold-default` · **Type** `body-md-medium` role · **Space** `--ds-spacing-8`, `--ds-spacing-12`, `--ds-spacing-20` · **Other** `--ds-field-height`‡, `--ds-border-width-1`†, `--ds-focus-ring-width`†, `--ds-button-radius`‡ | |
| **Mobile nav panel** | — | Closed, open | **Colour** `--ds-surface-card`, `--ds-color-border-neutral-bold-default` · **Space** `--ds-spacing-8`, `--ds-spacing-16` · **Other** `--ds-card-radius`‡, `--ds-border-width-1`†, `--ds-shadow-lg` | |
| **Page title** | — | — | **Colour** `--ds-color-text-neutral-bold-default` · **Type** `heading-lg` role · **Space** `--ds-spacing-8` | |
| **Lede / intro text** | — | — | **Colour** `--ds-color-text-neutral-subtle-default` · **Space** `--ds-spacing-32` · **Other** `--ds-layout-measure-prose`† | |
| **Section card** | Collapsible · static · sub-section collapsible · sub-section static | Collapsed, expanded, settled, hidden | **Colour** `--ds-surface-card`† (card fill), `--ds-color-background-neutral-subtle-hovered` (header hover), `--ds-color-text-neutral-bold-default` · **Type** `heading-md` role · **Space** `--ds-spacing-4`, `--ds-spacing-12`, `--ds-spacing-16`, `--ds-card-padding`‡ · **Other** `--ds-card-radius`‡, `--ds-section-gap`‡, `--ds-card-gap`‡ | |
| **Chevron** | — | Closed, open (180°) | **Colour** `--ds-color-text-neutral-subtle-default` · **Space** `--ds-spacing-20` (size) | |
| **Sub-section divider** | Hairline · inset rule | — | **Colour** `--ds-color-border-neutral-bold-default` · **Space** `--ds-card-padding`‡, `--ds-spacing-8` · **Other** `--ds-border-width-1`† | |
| **Sub-section title** | — | — | **Colour** `--ds-color-text-neutral-bold-default` · **Type** `heading-sm` role · **Space** `--ds-card-gap`‡, `--ds-card-padding`‡, `--ds-spacing-16` | |
| **Subhead (accent)** | With rule · first (no rule) | — | **Colour** `--ds-color-background-brand-bold-default`, `--ds-color-border-neutral-bold-default` · **Type** `body-md-strong` role (G-22) · **Space** `--ds-spacing-16`, `--ds-spacing-24` · **Other** `--ds-border-width-1`† | |
| **Field wrapper** | Spans 3 / 4 / 6 / 8 / 12 | Default, invalid | **Space** `--ds-field-gap-label`‡ | |
| **Label** | Plain · required · with tooltip · group label | — | **Colour** `--ds-color-text-neutral-bold-default` · **Type** `body-md-medium` role | |
| **Required marker** | — | — | **Colour** `--ds-color-icon-danger-bold-default` · **Type** `*-strong` emphasis | |
| **Help text** | Inline · hidden | — | **Colour** `--ds-color-text-neutral-subtle-default` · **Type** `body-sm-default` role | |
| **Info icon** | — | Idle, hover, focus-visible, expanded | **Colour** `--ds-color-text-neutral-subtle-default` (glyph + ring) · **Type** `body-sm-medium` role · **Space** `--ds-spacing-4` (hit-area expansion), `--ds-spacing-16` (size) · **Other** `--ds-pill-radius`‡, `--ds-border-width-1`† | |
| **Tooltip** | — | Hidden, shown | **Colour** `--ds-color-text-neutral-bold-default`, `--ds-color-border-neutral-bold-default`, page bg · **Type** `body-sm-default` role · **Space** `--ds-spacing-8`, `--ds-spacing-12` · **Other** `--ds-field-radius`‡, `--ds-border-width-1`†, `--ds-shadow-md`, `--ds-layout-measure-tooltip`† | |
| **Text input** | Plain · numeric | Empty, filled, hover, focus, focus-visible, invalid, disabled, recessed | **Colour** `--ds-color-text-neutral-bold-default`, `--ds-color-border-neutral-bold-default`, `--ds-color-text-neutral-subtle-disabled` (placeholder), `--ds-color-border-danger-bold-default`, `--ds-color-background-neutral-subtle-disabled`, `--ds-color-border-neutral-subtle-disabled`, `--ds-color-border-brand-bold-default`, `--ds-color-border-brand-bold-default`, `--ds-color-background-neutral-subtle-default` (recessed) · **Type** `--ds-field-font-*`‡ (a density-switched role: `body-lg-default` 16/22, compact `body-md-medium` 14/20), `*-default` emphasis · **Space** `--ds-field-padding-x`, `--ds-field-padding-y` · **Other** `--ds-field-height`, `--ds-field-radius`‡, `--ds-border-width-1`†, `--ds-border-width-2`†, `--ds-focus-glow`† | |
| **Select** | — | Placeholder, chosen, focus, invalid, disabled | Same as text input, plus **Colour** `--ds-color-text-neutral-subtle-default` (chevron mask), `--ds-color-text-neutral-subtle-disabled` (disabled chevron) · **Space** `--ds-spacing-12`, `--ds-spacing-16`, `--ds-spacing-40` (chevron room) | |
| **Input with unit** | `€`, `m²`, `%`, `Jahre`, `kWh/m²` | Default, focus-within, invalid, disabled | Same as text input, plus **Colour** `--ds-surface-card`† (unit fill), `--ds-color-text-neutral-subtle-default` · **Type** `body-md-default` role · **Space** `--ds-spacing-12` | |
| **Error message** | — | Hidden, shown | **Colour** `--ds-color-text-danger-bold-default` · **Type** `body-sm-default` role · **Space** `--ds-spacing-4` | |
| **Radio chip** | Row · grid | Unchecked, hover, checked, focus-visible, invalid | **Colour** `--ds-color-text-neutral-bold-default`, `--ds-color-border-neutral-bold-default`, `--ds-color-background-brand-bold-default`, `--ds-color-background-brand-subtlest-default`, `--ds-color-border-danger-bold-default`, `--ds-color-border-brand-bold-default` · **Type** `body-md-medium` role · **Space** `--ds-spacing-8`, `--ds-spacing-16` · **Other** `--ds-field-height`, `--ds-field-radius`‡, `--ds-choice-mark-size`‡, `--ds-radio-dot-radius`‡, `--ds-pill-radius`‡, `--ds-border-width-1`†, `--ds-border-width-2`†, `--ds-layout-col-min-choice`† | |
| **Checkbox chip** | Row · grid | Unchecked, hover, checked, locked, focus-visible, invalid | Same as radio chip, plus **Colour** `--ds-color-text-neutral-inverse-default` (checkmark) · **Other** `--ds-checkbox-radius`‡ | |
| **Bare checkbox** | Consent (wrapping label) · amount row | Unchecked, checked, invalid, focus-visible | **Colour** `--ds-color-text-neutral-bold-default`, `--ds-color-border-neutral-bold-default`, `--ds-color-background-brand-bold-default`, `--ds-color-text-neutral-inverse-default`, `--ds-color-border-danger-bold-default` · **Type** `body-md-default` role (its line box also sets the mark offset) · **Space** `--ds-spacing-8` · **Other** `--ds-choice-mark-size`‡, `--ds-checkbox-radius`‡, `--ds-border-width-1`† | |
| **Amount row** | Chip · bare checkbox | Not picked, picked, locked, provisional, invalid | **Colour** `--ds-color-background-neutral-subtle-default` (recessed field), `--ds-color-text-neutral-bold-default` · **Space** `--ds-spacing-4`, `--ds-spacing-8`, `--ds-spacing-12`, `--ds-spacing-16` · **Other** `--ds-layout-col-position`†, `--ds-layout-col-amount`†, `--ds-border-width-1`† | |
| **Conditional reveal** | — | Closed, open, settled | **Space** `--ds-field-gap-stack`‡ | |
| **Applicant panel** | One (no panel) · two (bordered) | — | **Colour** `--ds-color-border-neutral-bold-default`, `--ds-color-text-neutral-bold-default`, page bg · **Type** `body-md-strong` role (G-22) · **Space** `--ds-spacing-8`, `--ds-spacing-12`, `--ds-spacing-16`, `--ds-spacing-20` · **Other** `--ds-card-radius`‡, `--ds-border-width-1`†, `--ds-layout-col-min-applicant`† | |
| **Nested panel (repeatable)** | — | Numbered, removable; nests one level | **Colour** `--ds-color-border-neutral-bold-default`, page bg · **Type** `body-md-strong` role (G-22) · **Space** `--ds-spacing-8`, `--ds-spacing-16`, `--ds-spacing-20` · **Other** `--ds-card-radius`‡, `--ds-border-width-1`† | |
| **Repeatable row** | — | First (no rule), subsequent (rule) | **Colour** `--ds-color-border-neutral-bold-default` · **Space** `--ds-spacing-12`, `--ds-spacing-16` · **Other** `--ds-border-width-1`†, `--ds-field-height`, `--ds-layout-col-min-choice`† | |
| **Gate row** | Empty list · non-empty | Label text swaps | **Type** `body-md-medium` role · **Space** `--ds-spacing-12`, `--ds-spacing-16`, `--ds-spacing-24` | |
| **Button** | primary · ghost · danger | Default, hover, active *(danger only)*, focus-visible, **no disabled** | **Colour** `--ds-color-text-neutral-inverse-default`, `--ds-color-background-brand-bold-default`, `--ds-color-background-brand-bold-hovered`, `--ds-color-text-neutral-inverse-default`, `--ds-color-background-danger-bold-default`, `--ds-color-background-danger-bold-hovered`, `--ds-color-background-danger-bold-pressed`, `--ds-color-text-neutral-bold-default`, `--ds-color-border-neutral-bold-default`, `--ds-color-background-neutral-subtle-default`, `--ds-color-border-brand-bold-default` · **Type** `body-md-medium` role · **Space** `--ds-spacing-24` · **Other** `--ds-field-height`, `--ds-button-radius`‡, `--ds-border-width-1`† | |
| **Add button** | — | Default, hover, focus-visible; label swaps | **Colour** `--ds-color-background-brand-bold-default`, `--ds-color-background-brand-subtlest-default`, page bg · **Type** `body-md-medium` role · **Space** `--ds-spacing-8`, `--ds-spacing-12`, `--ds-spacing-16`, `--ds-spacing-24` · **Other** `--ds-button-radius`‡, `--ds-border-width-1`† (dashed) | |
| **Icon button (remove)** | — | Default, hover → danger, focus-visible | **Colour** `--ds-color-text-neutral-subtle-default`, `--ds-color-text-danger-bold-default` · **Type** `--ds-field-font-size`‡ · **Space** `--ds-spacing-16` (glyph), `--ds-spacing-24` (hit area) · **Other** `--ds-field-radius`‡ | |
| **Link button** | — | Default, hover, focus-visible | **Colour** `--ds-color-text-brand-bold-default`, `--ds-color-text-brand-bold-hovered` · **Type** `body-sm-default` role | |
| **Note / callout** | Default (warning-low) · info · success · warn | With / without title, multi-paragraph | **Colour** `--ds-color-border-warning-bold-default` + `-low-subtle`, `--ds-color-icon-info-bold-default` + `-subtle`, `--ds-color-icon-success-bold-default` + `-subtle`, `--ds-color-border-warning-strong-bold-default` + `-subtle`, `--ds-color-text-neutral-bold-default` · **Type** `body-md-strong` role · **Space** `--ds-spacing-4` (left bar), `--ds-spacing-8`, `--ds-spacing-12`, `--ds-spacing-16` · **Other** `--ds-field-radius`‡, `--ds-border-width-1`† | |
| **Modal** | Destructive · neutral | Closed, open | **Colour** `--ds-surface-card`, `--ds-surface-overlay` (backdrop), `--ds-color-text-neutral-bold-default`, `--ds-color-text-neutral-subtle-default` · **Type** `heading-sm` role, `body-md-default` role · **Space** `--ds-spacing-8`, `--ds-spacing-12`, `--ds-spacing-32`, `--ds-card-padding`‡ · **Other** `--ds-card-radius`‡, `--ds-shadow-lg`, `--ds-layout-measure-modal`† | |
| **Action bar** | Form · summary · sent | Sticky; wraps ≤640px | **Colour** `--ds-color-border-neutral-bold-default`, page bg · **Space** `--ds-spacing-12`, `--ds-spacing-16`, `--ds-layout-gutter`† · **Other** `--ds-border-width-1`†, `--ds-layout-shell-max`† (derived) | |
| **Save-state indicator** | Saving · saved · unsent · incomplete · locked | Live region | **Colour** `--ds-color-text-neutral-subtle-default`, `--ds-color-text-neutral-bold-default`, `--ds-color-icon-success-bold-default` (dot) · **Type** `body-sm-default` role, `*-medium` emphasis · **Space** `--ds-spacing-8` · **Other** `--ds-pill-radius`‡ | |
| **Numbered steps list** | — | Counter-generated | **Colour** `--ds-color-background-brand-bold-default`, `--ds-color-background-brand-subtlest-default`, `--ds-color-text-neutral-subtle-default`, `--ds-color-text-neutral-bold-default` · **Type** `body-sm-strong` role, `*-medium` emphasis · **Space** `--ds-spacing-12`, `--ds-spacing-16`, `--ds-spacing-24`, `--ds-spacing-32` · **Other** `--ds-pill-radius`‡, `--ds-layout-measure-prose`† | |
| **Review group (read-back)** | With edit action · with context crumb · empty | Stacks ≤640px | **Colour** `--ds-color-text-neutral-bold-default`, `--ds-color-text-neutral-subtle-default`, `--ds-color-border-neutral-bold-default` · **Type** `heading-sm` role, `heading-xs` role, `body-sm-default` role, `body-md-medium` role · **Space** `--ds-spacing-4`, `--ds-spacing-8`, `--ds-spacing-12`, `--ds-spacing-16`, `--ds-spacing-24` · **Other** `--ds-border-width-1`† | |
| **Reference ID box** | — | Idle, copied, copy unavailable | **Colour** `--ds-color-text-neutral-bold-default`, `--ds-color-border-neutral-bold-default`, `--ds-color-background-brand-bold-default` (status), page bg · **Type** `heading-md` role, `body-sm-default` role, `.ds-numeric` (G-06) · **Space** `--ds-spacing-12`, `--ds-spacing-16` · **Other** `--ds-field-radius`‡, `--ds-border-width-1`† (dashed) | |

---

## The variable set, by layer

What the components above actually draw on. Anything marked † has to be **added to
the design system** or accepted as app-level; each has an entry in
[TOKEN-GAPS.md](TOKEN-GAPS.md).

### Colour — semantic (Finlink Core)

Read the grammar as a sentence:
`--ds-color-{background|text|border|icon}-{intent}-{prominence}-{state}`.

| Property | Combinations in use |
|---|---|
| Text | `neutral.{subtlest,subtle,bold,inverse}`, `brand.bold`, `danger.bold` |
| Background | `neutral.{subtlest,subtle}` × `{default,hovered,disabled}`, `brand.{subtlest,bold}`, `danger.bold`, `{info,success,warning}.subtlest` |
| Border | `neutral.{subtle,bold}` × `{default,hovered,disabled}`, `brand.bold`, `danger.bold`, `{info,success,warning}.bold` |
| Icon | `neutral.{subtle,bold}`, `{success,warning,info,danger}.bold` |
| **Extension †** | `--ds-surface-{page,card,field}` — three levels out of Finlink's two · `--ds-surface-overlay` (G-20) · `warning-strong` (G-25) |

Two combinations are deliberately unused: `background.neutral.bold.*`, which is
identical to `subtle.*` and produces no inverse surface (G-03), and
`text.warning.*`, which does not exist — warning copy is `text.neutral.bold` on a
warning surface plus a headline (G-05).

### Typography — 14 roles, applied whole

`heading-xl` · `heading-lg` · `heading-md` · `heading-sm` · `heading-xs` ·
`body-lg-{default,medium,strong}` · `body-md-{default,medium,strong}` ·
`body-sm-{default,medium,strong}`

In use here: everything except `heading-xl`. The three `body-lg` roles are used
only below 640px, where the media query re-binds selectors to them (G-18).

Two roles do a job the system has no role for: `body-md-strong` stands in for a
14px heading (G-22), and `--ds-field-font-*` is a density-switched bundle
(`body-lg-default`, dropping to `body-md-medium` when compact) because CSS cannot
swap a class from a custom property (G-17).

### Spacing

`--ds-spacing-` `4` · `8` · `12` · `16` · `20` · `24` · `32` · `40` · `48` · `64`
— keys are pixel values. Consumed straight from Layer 1: there is no semantic
spacing layer (G-07).

### Radius

`--ds-radius-` `sm` (2) · `base` (4) · `lg` (8) · `xl` (16) · `full`

### Elevation †

`--ds-shadow-md` · `--ds-shadow-lg` — composed at build time from separate `y` /
`blur` / `color` variables. Finlink Core has no elevation tokens at all (G-15);
these carry over from the outgoing system rather than downgrading to the
contract's single hardcoded interim.

### Field geometry

`--ds-field-height` (`sizing.10`, 40px) · `padding-x` (`spacing.12`) ·
`padding-y` (`spacing.8`) · `gap` · `radius` (`radius.base`). All real Finlink
scales. Compact drops the height to 32px, which is off-scale — the contract has
nothing between `sizing.8` (32) as an icon box and `sizing.10` as a control
height (G-17). 32px still clears WCAG 2.5.8's 24px target.

### Genuinely missing from the design system †

| Variable | Why it is not there | Gap |
|---|---|---|
| `--ds-focus-ring-width` (3px) | No focus token of any kind exists, and 3px is off the 0/1/2/4 border scale | G-01 / G-23 |
| `--ds-focus-glow` | The soft halo that *is* the focus state on a field; mixed from the brand border colour with `color-mix()` | G-23 |
| `--ds-surface-overlay` | The `<dialog>` backdrop has no scrim token | G-20 |
| `--ds-surface-{page,card,field}` | Three levels out of two neutrals — the shipping arrangement fits, but the naming is local | — |
| `warning-strong` | Two warning levels; Finlink aliases only yellow, and orange is an orphaned primitive | G-25 / G-08 |
| a link colour | `text.info.bold` is 3.93:1 — large-text only. Links use `text.brand.bold` (5.32:1 after the contrast pass), so they are teal, not blue | G-21 |
| 13 dark ramp steps | `--_ds-ext-color-*`. Finlink is single-mode and its ramps are too short to build a dark palette from | G-14 |

Border widths are **no longer missing**: Finlink ships `border.width.0/1/2/4`, so
`--ds-border-width-1` and `-2` are real tokens now.

### App-level, reasonably outside a foundations file †

`--ds-layout-content-max` (1180px) · `--ds-layout-nav-width` (232px) ·
`--ds-layout-gutter` · `--ds-layout-col-min-applicant` · `--ds-layout-col-min-choice` ·
`--ds-layout-col-position` · `--ds-layout-col-amount` · `--ds-layout-measure-prose`
(68ch) · `--ds-layout-measure-tooltip` (32ch) · `--ds-layout-measure-modal` (46ch) ·
`--ds-preview-*` (the phone frame) · breakpoints 900px / 640px (CSS cannot read a
variable inside a media query, so these are inlined).

### Local groupings ‡ — alias a real token, so the value still comes from the system

`--ds-field-{height,padding-x,padding-y,gap,radius}` ·
`--ds-field-{gap-label,gap-stack}` · `--ds-card-{padding,gap,radius}` ·
`--ds-section-gap` · `--ds-button-radius` · `--ds-pill-radius` ·
`--ds-checkbox-radius` · `--ds-choice-mark-size` · `--ds-radio-dot-radius`

Two values are genuinely derived rather than authored, and are declared in
`components.css` as `calc()` over tokens the components already use:
`--ds-actionbar-height` (tracks the density switch) and `--ds-layout-shell-max`.

Note `--ds-button-radius` is `radius.lg` (8px) while `--ds-field-radius` is
`radius.base` (4px). The contract's §4.4 convention puts buttons and inputs both on
`base`; the 8px button is kept because the migration was behaviour-frozen, and it
is the one place the prototype knowingly departs from that convention.
