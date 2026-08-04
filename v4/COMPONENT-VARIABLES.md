# Components → variables

Every component the product needs, and the exact design variables it consumes.
Companion to [COMPONENTS.md](COMPONENTS.md), which carries the full state detail.

**Excluded** (prototype scaffolding, not product): the segmented switches for
Dichte / Erscheinungsbild / Hilfetexte, the phone preview frame, and the
`Feldzustände` reference card. The light/grey/dark and comfortable/compact
mechanics are excluded too — they only re-point the variables below, they are not
components of their own.

**Reading the variable column** — names are the CSS custom properties, which flatten
mechanically from the Figma path (`color.action.primary` → `--color-action-primary`).

- **†** = not in BETA-Foundations. Either genuinely missing from the design system
  (border widths, the focus glow, the card surface) or page furniture the system has
  no opinion on (widths, column minimums, measures).
- **‡** = a local *grouping* only — it aliases a real primitive, so the value still
  comes from Figma (`--card-padding` → `{spacing.8}`).

The last column is empty for you to fill in.

---

| Component | Variants | States | Variables needed | Exists / New |
|---|---|---|---|---|
| **Base / page** | — | — | **Colour** `--color-text-primary`, `--color-background-page`, `--color-background-surface`, `--surface-card`†, `--color-text-link` · **Type** `--font-family-sans`, `--font-body-md-size`, `--font-body-md-line`, `--font-weight-regular` | |
| **Skip link** | — | Hidden, focused | **Colour** `--color-text-link`, `--color-border-focus`, page bg · **Type** `--font-weight-medium` · **Space** `--spacing-2`, `--spacing-4` · **Other** `--border-width-emphasis`†, `--button-radius`‡ | |
| **App shell** | Desktop 2-col · ≤900px 1-col | — | **Space** `--spacing-4`, `--spacing-5`, `--spacing-10`, `--spacing-12`, `--spacing-16` · **Other** `--layout-nav-width`†, `--layout-content-max`†, `--layout-gutter`† | |
| **12-column grid** | Spans 3 / 4 / 6 / 8 / 12, row-break | ≤640px → full width | **Space** `--field-gap-stack`‡, `--spacing-4` | |
| **Sidebar nav** | Desktop column · ≤900px top bar | Scrollable, hidden on summary/sent | **Colour** `--color-border-default` (scrollbar) · **Space** `--spacing-1`, `--spacing-10` · **Other** `--layout-nav-width`†, `--actionbar-height` (derived from `--field-height` + `--spacing-3` + `--border-width-default`) | |
| **Nav link** | Top level · sub level · conditional | Default, hover, current, focus-visible | **Colour** `--color-text-secondary`, `--color-text-primary`, `--color-background-hover`, `--color-action-primary`, `--color-action-primary-subtle` · **Type** `--font-heading-sm-size/-line`, `--font-body-md-size/-line`, `--font-weight-medium` · **Space** `--spacing-2`, `--spacing-3`, `--spacing-6` · **Other** `--button-radius`‡ | |
| **Nav divider** | — | — | **Colour** `--color-border-default` · **Space** `--spacing-3`, `--spacing-5` · **Other** `--border-width-default`† | |
| **Nav section label (eyebrow)** | — | — | **Colour** `--color-text-secondary` · **Type** `--font-heading-eyebrow-size/-line`, `--font-weight-bold` · **Space** `--spacing-2`, `--spacing-3`, `--spacing-4` | |
| **Mobile nav toggle** | — | Closed, open, hover, focus-visible | **Colour** `--color-text-primary`, `--color-border-default`, `--color-background-hover`, `--color-action-primary`, `--color-action-primary-subtle`, `--color-border-focus` · **Type** `--font-body-md-size`, `--font-weight-medium` · **Space** `--spacing-2`, `--spacing-3`, `--spacing-5` · **Other** `--field-height`‡, `--border-width-default`†, `--focus-ring-width`†, `--button-radius`‡ | |
| **Mobile nav panel** | — | Closed, open | **Colour** `--color-background-raised`, `--color-border-default` · **Space** `--spacing-2`, `--spacing-4` · **Other** `--card-radius`‡, `--border-width-default`†, `--shadow-lg` | |
| **Page title** | — | — | **Colour** `--color-text-primary` · **Type** `--font-heading-lg-size/-line`, `--font-heading-weight` · **Space** `--spacing-2` | |
| **Lede / intro text** | — | — | **Colour** `--color-text-secondary` · **Space** `--spacing-8` · **Other** `--layout-measure-prose`† | |
| **Section card** | Collapsible · static · sub-section collapsible · sub-section static | Collapsed, expanded, settled, complete, hidden | **Colour** `--surface-card`† (card fill), `--color-background-active` (header hover), `--color-text-primary` · **Type** `--font-heading-md-size/-line`, `--font-heading-weight` · **Space** `--spacing-1`, `--spacing-3`, `--spacing-4`, `--card-padding`‡ · **Other** `--card-radius`‡, `--section-gap`‡, `--card-gap`‡ | |
| **Chevron** | — | Closed, open (180°) | **Colour** `--color-text-secondary` · **Space** `--spacing-5` (size) | |
| **Required-field counter** | — | Hidden, partial, complete | **Colour** `--color-text-secondary`, `--color-text-primary`, `--color-action-primary`, page bg (track) · **Type** `--font-input-text-sm-size/-line`, `--font-weight-regular`, `--font-weight-medium` · **Space** `--spacing-2` · **Other** `--meter-width`‡, `--meter-height`‡, `--pill-radius`‡ | |
| **Sub-section divider** | Hairline · inset rule | — | **Colour** `--color-border-default` · **Space** `--card-padding`‡, `--spacing-2` · **Other** `--border-width-default`† | |
| **Sub-section title** | — | — | **Colour** `--color-text-primary` · **Type** `--font-heading-sm-size/-line`, `--font-heading-weight` · **Space** `--card-gap`‡, `--card-padding`‡, `--spacing-4` | |
| **Subhead (accent)** | With rule · first (no rule) | — | **Colour** `--color-action-primary`, `--color-border-default` · **Type** `--font-heading-xs-size/-line`, `--font-weight-bold` · **Space** `--spacing-4`, `--spacing-6` · **Other** `--border-width-default`† | |
| **Field wrapper** | Spans 3 / 4 / 6 / 8 / 12 | Default, invalid | **Space** `--field-gap-label`‡ | |
| **Label** | Plain · required · with tooltip · group label | — | **Colour** `--color-text-primary` · **Type** `--font-input-text-md-size/-line`, `--font-weight-medium` | |
| **Required marker** | — | — | **Colour** `--color-feedback-error` · **Type** `--font-weight-bold` | |
| **Help text** | Inline · hidden | — | **Colour** `--color-text-secondary` · **Type** `--font-input-text-sm-size/-line` | |
| **Info icon** | — | Idle, hover, focus-visible, expanded | **Colour** `--color-text-secondary` (glyph + ring) · **Type** `--font-input-text-sm-size`, `--font-weight-medium` · **Space** `--spacing-1` (hit-area expansion), `--spacing-4` (size) · **Other** `--pill-radius`‡, `--border-width-default`† | |
| **Tooltip** | — | Hidden, shown | **Colour** `--color-text-primary`, `--color-border-default`, page bg · **Type** `--font-body-sm-size`, `--font-body-md-line`, `--font-weight-regular` · **Space** `--spacing-2`, `--spacing-3` · **Other** `--field-radius`‡, `--border-width-default`†, `--shadow-md`, `--layout-measure-tooltip`† | |
| **Text input** | Plain · numeric | Empty, filled, hover, focus, focus-visible, invalid, disabled, recessed | **Colour** `--color-text-primary`, `--color-border-default`, `--color-text-disabled` (placeholder), `--color-border-error`, `--color-background-disabled`, `--color-border-disabled`, `--color-border-focus`, `--color-focus-ring`, `--color-background-hover` (recessed) · **Type** `--font-input-value-size/-line`, `--font-weight-regular` · **Space** `--field-padding-x`, `--field-padding-y` · **Other** `--field-height`, `--field-radius`‡, `--border-width-default`†, `--border-width-emphasis`†, `--focus-glow`† | |
| **Select** | — | Placeholder, chosen, focus, invalid, disabled | Same as text input, plus **Colour** `--color-text-secondary` (chevron mask), `--color-text-disabled` (disabled chevron) · **Space** `--spacing-3`, `--spacing-4`, `--spacing-10` (chevron room) | |
| **Input with unit** | `€`, `m²`, `%`, `Jahre`, `kWh/m²` | Default, focus-within, invalid, disabled | Same as text input, plus **Colour** `--surface-card`† (unit fill), `--color-text-secondary` · **Type** `--font-body-md-size` · **Space** `--spacing-3` | |
| **Error message** | — | Hidden, shown | **Colour** `--color-feedback-error-strong` · **Type** `--font-input-text-sm-size/-line` · **Space** `--spacing-1` | |
| **Radio chip** | Row · grid | Unchecked, hover, checked, focus-visible, invalid | **Colour** `--color-text-primary`, `--color-border-default`, `--color-action-primary`, `--color-action-primary-subtle`, `--color-border-error`, `--color-border-focus` · **Type** `--font-body-md-size`, `--font-weight-medium` · **Space** `--spacing-2`, `--spacing-4` · **Other** `--field-height`, `--field-radius`‡, `--choice-mark-size`‡, `--radio-dot-radius`‡, `--pill-radius`‡, `--border-width-default`†, `--border-width-emphasis`†, `--layout-col-min-choice`† | |
| **Checkbox chip** | Row · grid | Unchecked, hover, checked, locked, focus-visible, invalid | Same as radio chip, plus **Colour** `--color-on-primary` (checkmark) · **Other** `--checkbox-radius`‡ | |
| **Bare checkbox** | Consent (wrapping label) · amount row | Unchecked, checked, invalid, focus-visible | **Colour** `--color-text-primary`, `--color-border-default`, `--color-action-primary`, `--color-on-primary`, `--color-border-error` · **Type** `--font-weight-regular`, `--font-body-md-line` (mark offset) · **Space** `--spacing-2` · **Other** `--choice-mark-size`‡, `--checkbox-radius`‡, `--border-width-default`† | |
| **Amount row** | Chip · bare checkbox | Not picked, picked, locked, provisional, invalid | **Colour** `--color-background-hover` (recessed field), `--color-text-primary` · **Space** `--spacing-1`, `--spacing-2`, `--spacing-3`, `--spacing-4` · **Other** `--layout-col-position`†, `--layout-col-amount`†, `--border-width-default`† | |
| **Conditional reveal** | — | Closed, open, settled | **Space** `--field-gap-stack`‡ | |
| **Applicant panel** | One (no panel) · two (bordered) | — | **Colour** `--color-border-default`, `--color-text-primary`, page bg · **Type** `--font-heading-xs-size/-line`, `--font-weight-bold` · **Space** `--spacing-2`, `--spacing-3`, `--spacing-4`, `--spacing-5` · **Other** `--card-radius`‡, `--border-width-default`†, `--layout-col-min-applicant`† | |
| **Nested panel (repeatable)** | — | Numbered, removable; nests one level | **Colour** `--color-border-default`, page bg · **Type** `--font-heading-xs-size`, `--font-weight-bold` · **Space** `--spacing-2`, `--spacing-4`, `--spacing-5` · **Other** `--card-radius`‡, `--border-width-default`† | |
| **Repeatable row** | — | First (no rule), subsequent (rule) | **Colour** `--color-border-default` · **Space** `--spacing-3`, `--spacing-4` · **Other** `--border-width-default`†, `--field-height`, `--layout-col-min-choice`† | |
| **Gate row** | Empty list · non-empty | Label text swaps | **Type** `--font-input-text-md-size/-line`, `--font-weight-medium` · **Space** `--spacing-3`, `--spacing-4`, `--spacing-6` | |
| **Button** | primary · ghost · danger | Default, hover, active *(danger only)*, focus-visible, **no disabled** | **Colour** `--color-on-primary`, `--color-action-primary`, `--color-action-primary-hover`, `--color-on-danger`, `--color-action-danger`, `--color-action-danger-hover`, `--color-action-danger-active`, `--color-text-primary`, `--color-border-default`, `--color-background-hover`, `--color-border-focus` · **Type** `--font-body-md-size`, `--font-weight-medium` · **Space** `--spacing-6` · **Other** `--field-height`, `--button-radius`‡, `--border-width-default`† | |
| **Add button** | — | Default, hover, focus-visible; label swaps | **Colour** `--color-action-primary`, `--color-action-primary-subtle`, page bg · **Type** `--font-body-md-size`, `--font-weight-medium` · **Space** `--spacing-2`, `--spacing-3`, `--spacing-4`, `--spacing-6` · **Other** `--button-radius`‡, `--border-width-default`† (dashed) | |
| **Icon button (remove)** | — | Default, hover → danger, focus-visible | **Colour** `--color-text-secondary`, `--color-feedback-error-strong` · **Type** `--font-input-value-size` · **Space** `--spacing-4` (glyph), `--spacing-6` (hit area) · **Other** `--field-radius`‡ | |
| **Link button** | — | Default, hover, focus-visible | **Colour** `--color-text-link`, `--color-text-link-hover` · **Type** `--font-body-sm-size` | |
| **Note / callout** | Default (warning-low) · info · success · warn | With / without title, multi-paragraph | **Colour** `--color-feedback-warning-low` + `-low-subtle`, `--color-feedback-info` + `-subtle`, `--color-feedback-success` + `-subtle`, `--color-feedback-warning` + `-subtle`, `--color-text-primary` · **Type** `--font-body-md-size`, `--font-weight-bold` · **Space** `--spacing-1` (left bar), `--spacing-2`, `--spacing-3`, `--spacing-4` · **Other** `--field-radius`‡, `--border-width-default`† | |
| **Modal** | Destructive · neutral | Closed, open | **Colour** `--color-background-surface`, `--color-background-overlay` (backdrop), `--color-text-primary`, `--color-text-secondary` · **Type** `--font-heading-sm-size/-line`, `--font-heading-weight`, `--font-body-md-size` · **Space** `--spacing-2`, `--spacing-3`, `--spacing-8`, `--card-padding`‡ · **Other** `--card-radius`‡, `--shadow-lg`, `--layout-measure-modal`† | |
| **Action bar** | Form · summary · sent | Sticky; wraps ≤640px | **Colour** `--color-border-default`, page bg · **Space** `--spacing-3`, `--spacing-4`, `--layout-gutter`† · **Other** `--border-width-default`†, `--layout-shell-max`† (derived) | |
| **Save-state indicator** | Saving · saved · unsent · incomplete · locked | Live region | **Colour** `--color-text-secondary`, `--color-text-primary`, `--color-feedback-success` (dot) · **Type** `--font-body-sm-size`, `--font-weight-medium` · **Space** `--spacing-2` · **Other** `--pill-radius`‡ | |
| **Numbered steps list** | — | Counter-generated | **Colour** `--color-action-primary`, `--color-action-primary-subtle`, `--color-text-secondary`, `--color-text-primary` · **Type** `--font-body-sm-size`, `--font-weight-bold`, `--font-weight-medium` · **Space** `--spacing-3`, `--spacing-4`, `--spacing-6`, `--spacing-8` · **Other** `--pill-radius`‡, `--layout-measure-prose`† | |
| **Review group (read-back)** | With edit action · with context crumb · empty | Stacks ≤640px | **Colour** `--color-text-primary`, `--color-text-secondary`, `--color-border-default` · **Type** `--font-heading-sm-size/-line`, `--font-heading-weight`, `--font-heading-eyebrow-size/-line`, `--font-input-text-sm-size/-line`, `--font-body-md-size`, `--font-weight-bold`, `--font-weight-medium` · **Space** `--spacing-1`, `--spacing-2`, `--spacing-3`, `--spacing-4`, `--spacing-6` · **Other** `--border-width-default`† | |
| **Reference ID box** | — | Idle, copied, copy unavailable | **Colour** `--color-text-primary`, `--color-border-default`, `--color-action-primary` (status), page bg · **Type** `--font-heading-md-size/-line`, `--font-weight-bold`, `--font-body-sm-size`, `--font-body-md-line` · **Space** `--spacing-3`, `--spacing-4` · **Other** `--field-radius`‡, `--border-width-default`† (dashed) | |

---

## The variable set, by layer

What the components above actually draw on. Anything marked † has to be **added to
the design system** or accepted as app-level.

### Colour — semantic (all from Figma)

| Group | Tokens |
|---|---|
| Text | `text.primary`, `text.secondary`, `text.disabled`, `text.link`, `text.link-hover` |
| Background | `background.page`, `background.surface`, `background.raised`, `background.hover`, `background.active`, `background.disabled`, `background.overlay` |
| Border | `border.default`, `border.disabled`, `border.error`, `border.focus`, `focus-ring` |
| Action | `action.primary`, `action.primary-hover`, `action.primary-subtle`, `action.danger`, `action.danger-hover`, `action.danger-active`, `on.primary`, `on.danger` |
| Feedback | `feedback.error`, `feedback.error-strong`, `feedback.success`, `feedback.success-subtle`, `feedback.info`, `feedback.info-subtle`, `feedback.warning`, `feedback.warning-subtle`, `feedback.warning-low`, `feedback.warning-low-subtle` |
| **Missing** | **`surface.card`†** — the third level the cards need · **`text.accent`†** — accent text currently borrows the `action.primary` fill |

### Typography (all from Figma)

`font.family.sans` · weights `regular` / `medium` / `bold` · `heading.weight` ·
size + line pairs for `heading.lg`, `heading.md`, `heading.sm`, `heading.xs`,
`heading.eyebrow`, `body.md`, `body.sm`, `input.text.md`, `input.text.sm`,
`input.value`. Six of these change in the export's Mobile mode.

### Spacing (all from Figma)

`spacing.1` · `2` · `3` · `4` · `5` · `6` · `8` · `10` · `12` · `16`

### Radius (all from Figma)

`radius.sm` · `md` · `lg` · `2xl` · `full`

### Elevation (all from Figma)

`shadow.md` · `shadow.lg` — composed at build time from the separate `y` / `blur` /
`color` variables the export ships.

### Field geometry (all from Figma)

`input.default.height` / `padding-x` / `padding-y` / `gap` and the matching
`input.compact.*`. Comfortable = 40px, compact = 32px.

### Genuinely missing from the design system †

| Variable | Why it is not there |
|---|---|
| `border.width.default` (1px), `border.width.emphasis` (2px) | Figma defines no border width anywhere |
| `focus-ring.width` (3px) | `color.focus-ring` exists, the thickness does not |
| `focus.glow` | The soft halo that *is* the focus state on a field; mixed from `color.focus-ring` locally |
| `surface.card` | The third surface level — see the colour table above |
| `text.accent` | See the colour table above |

### App-level, reasonably outside a foundations file †

`layout.content-max` (1180px) · `layout.nav-width` (232px) · `layout.gutter` ·
`layout.col-min-applicant` · `layout.col-min-choice` · `layout.col-position` ·
`layout.col-amount` · `measure.prose` (68ch) · `measure.tooltip` (32ch) ·
`measure.modal` (46ch) · breakpoints 900px / 640px (CSS cannot read a variable
inside a media query, so these are inlined at build time).

### Local groupings ‡ — alias a real primitive, so the value still comes from Figma

`field.height/padding-x/padding-y/gap/radius` (→ `input.*`) ·
`field.gap-label` / `field.gap-stack` · `card.padding` / `card.gap` / `card.radius` ·
`section.gap` · `button.radius` · `pill.radius` · `checkbox.radius` ·
`choice.mark-size` / `radio.dot-radius` · `meter.width` / `meter.height`

One deliberate departure: `field.radius` points at `radius.md` (4px) rather than the
export's `input.default.radius` (`radius.lg`, 8px). A change to
`input.default.radius` in Figma will therefore not land here until that override is
removed.
