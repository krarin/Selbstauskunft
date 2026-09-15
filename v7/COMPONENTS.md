# V5 component inventory — developer handoff

Every component the Selbstauskunft prototype is built from, with the states each one
needs. Derived from [css/components.css](css/components.css) and
[index.html](index.html) — this is a description of what exists, not a wishlist.

**The last column is deliberately empty.** Fill in `Exists` / `New` per component once
you have compared against the current design system.

## How to read the state columns

Four things apply to almost everything and are **not repeated per row**:

| Cross-cutting | What it means |
|---|---|
| `:hover` vs `:focus` vs `:focus-visible` | Pointer focus gets the soft glow (`--ds-focus-glow`) only. Keyboard focus additionally gets a 2px outer ring in `--ds-color-border-brand-bold-default` at 1px offset. This split is intentional — do not collapse it. |
| Density | `[data-density="compact"]` on `<html>` swaps field height 40→32px, radius 8→4px and tightens card padding/gaps. Every component must survive both. |
| Appearance | `[data-appearance]` = `light` (default) / `grey` / `dark`. In `grey` the page carries the grey and cards are white — fields stay white and the 1px border is their only boundary. |
| Reduced motion | `prefers-reduced-motion: reduce` removes every transition and releases the overflow clipping on cards/reveals. |

Breakpoints: **900px** (sidebar → top bar) and **640px** (all grid columns → full width,
amount rows stack, review list stacks). Mobile typography comes from the token export's
Mobile mode at 640px.

---

## Master table

| # | Component | Class / element | Variants | States needed | Exists / New |
|---|---|---|---|---|---|
| **Foundations & layout** ||||||
| 1 | App shell | `.app` | — | Desktop 2-col (nav + capped content), ≤900px single column | |
| 2 | 12-column grid | `.grid`, `.col-3/4/6/8/12`, `.col-start` | — | ≤640px every span becomes full width; `.col-start` forces a row break | |
| 3 | Skip link | `.skip-link` | — | Hidden (off-canvas), **focused** (slides in) | |
| 4 | Visually-hidden text | `.sr-only` | — | Utility only — no visual state | |
| **Navigation** ||||||
| 5 | Sidebar nav | `.nav` | Desktop sticky column · ≤900px sticky top bar | Scrollable when tall (reserves space for the sticky action bar); hidden entirely on the summary/sent views | |
| 6 | Nav link | `.nav a` | Top level · sub level (`.sub`, indented, one type step down) · conditional (`.object-nav`, shown/hidden) | Default, hover, **current** (`aria-current="true"` → accent fill + accent text + medium weight), focus-visible | |
| 7 | Nav divider | `.nav-divider` | — | — (hidden on mobile) | |
| 8 | Nav section label | `.nav .eyebrow` | — | — (hidden on mobile) | |
| 9 | Mobile nav toggle | `.nav-toggle` + `.burger` | — | Closed, **open** (`aria-expanded="true"` → accent fill), hover, focus-visible; ≤900px only | |
| 10 | Mobile nav panel | `.nav-links` | — | Closed (`display:none`), open (absolute overlay over the form, `max-height:70vh`, scrolls, raised surface + `--ds-shadow-lg`) | |
| 11 | Segmented control | `.seg` / `.seg button` | 2 segments · 3 segments | Unselected, **selected** (`aria-pressed="true"`), hover, focus-visible; wraps; hidden ≤900px. *Prototype-only control (density/appearance/help switches)* | |
| **Cards & sections** ||||||
| 12 | Section card | `.card` | **Collapsible** (default) · **static** (`.card-static`, heading not a button) · **sub-section** (`.subsection-static`, heading not a button; the `.card.subsection` collapsible variant is no longer used in the form) | Collapsed, expanded, **settled** (`data-settled="true"` releases overflow clipping so tooltips are not cut off), hidden (whole card removed when not applicable), header hover, header focus-visible | |
| 13 | Card header | `.card-head` > `.card-toggle` | Button (collapsible) · plain heading (static) | Default, hover (steps to `background.active` — `background.hover` equals the card fill), focus-visible | |
| 14 | Chevron | `.chev` | — | Closed, open (rotate 180°, 0.18s) | |
| 15 | Sub-section divider | `.subsections > * + *` | Inset rule between statics (hairline variant for collapsibles unused) | — | |
| 16 | Sub-section title | `.subsection-title` | — | — | |
| 17 | Subhead | `.subhead` | With top rule · first-child (no rule) | — | |
| 18 | Nested panel | `.subcard` + `.subcard-head` | — | Numbered title (auto-renumbered on add/remove), remove button in head; nests one level (property → loan) | |
| 19 | Applicant panel | `.applicants` / `.applicant` | **One applicant** — no panel, no border, no head · **two** (`.two`) — bordered panel with title | Side by side ≥ column min, stacks ≤640px; title shows `Antragsteller 2 – <name>` once a name is typed | |
| **Fields** ||||||
| 20 | Field wrapper | `.field` | Spans 3/4/6/8/12 cols | Default, **invalid** (`.invalid` drives border + shows message on every control type inside) | |
| 21 | Label | `.field > label`, `.group-label`, `.gate-label` | Plain · with required marker · with info icon | — (all three are one visual style) | |
| 22 | Required marker | `.req` | — | Static, `aria-hidden` — never the only signal | |
| 23 | Help text | `.help` | — | **Three global modes:** `on` (inline under the label) · `icon` (visually hidden, moved into a tooltip, stays in the DOM for `aria-describedby`) · `off` (`display:none`) | |
| 24 | Info icon + tooltip | `.info-wrap` > `.info-btn` + `.info-bubble` | — | Idle (16px ring, 24px invisible hit area for WCAG 2.5.8), hover → bubble, focus-visible → bubble, `aria-expanded` → bubble. Bubble is `aria-hidden` (visual duplicate) | |
| 25 | Text input | `.input` | Plain · numeric (`.num` right-aligned, tabular figures) · multi-line (`<textarea class="input textarea">`, height from `rows`, floor of two field heights, vertical resize only) | Empty (placeholder), filled, hover, **focus** (glow, no size change), focus-visible (+ outer ring), **invalid** (error border), **disabled**, recessed (in an unpicked amount row) | |
| 26 | Select | `.select` inside `.select-wrap` | — | Placeholder (`Bitte wählen`), chosen, focus, invalid, **disabled** (chevron dims too). Chevron is a token-coloured mask, not an image | |
| 27 | Input with unit | `.with-unit` + `.unit` | Units in use: `€`, `m²`, `kWh/m²`, `%`, `Jahre` | Default, **focus-within** (the *group* carries the glow, the input inside carries none), invalid (unit box takes the error border too), disabled | |
| 28 | Error message | `.error-text` | — | Hidden, shown (only via `.field.invalid`); wired with `aria-describedby` | |
| 29 | Radio chip | `.choice` + `input[type="radio"]` | Row (`.choices`) · grid (`.grid-choices`, auto-fit) | Unchecked (**empty ring drawn**), hover, **checked** (accent fill + accent text + medium + 2px ring + centre dot), focus-visible, invalid (unchecked chips take the error border) | |
| 30 | Checkbox chip | `.choice` + `input[type="checkbox"]` | Same as above | Unchecked (**empty square drawn**), hover, **checked** (accent-filled box + white checkmark), **locked/mandatory** (stays checked, click and Space cancelled, keeps normal fill — *not* disabled styling), focus-visible, invalid | |
| 31 | Bare checkbox | `.choice.plain` | Consent (multi-line label) | Unchecked, checked, invalid (**the empty box** carries the error border), focus-visible. Mark stays on the first line of a wrapping label | |
| 32 | Amount row | `.amount-row` > `.choice` + `.amount-cell` | — (the position is a chip) | **Not picked** (`data-inactive` — field recedes but stays reachable and full-contrast), **picked** (amount becomes required), **locked** (mandatory position), **provisional** (picked by clicking into the field, taken back on blur if nothing was typed), invalid amount. Two fixed columns, always — a position with one further field to ask (Nebentätigkeit · Tag des Beginns) puts it in the `.amount-detail` row underneath rather than in a third column, which needed 784px across and squeezed the position label to four lines below that. Stacks ≤640px. Every cell on the row follows the toggle | |
| 33 | Conditional reveal | `.reveal` > `.reveal-inner` > `.pad` | — | Closed (`0fr`, `visibility:hidden`, excluded from validation and the summary), open, **settled** (releases clipping so the focus glow is not sliced) | |
| 34 | Gate row | `.gate-row` | — | Question and the button that answers it on one line (Darlehen, inside a property card). Empty list · non-empty — the button wording reads the list, not a click count | |
| 35 | Repeatable row | `.child-row` (+ `.c-name` / `.c-date`) | — | First row (no rule), subsequent rows (top rule + spacing); wraps; remove button bottom-aligned to the field line | |
| **Buttons** ||||||
| 36 | Button | `.btn` | **primary** · **ghost** · **danger** | Default, hover, active *(defined for `danger` only — see gaps)*, focus-visible. Full width ≤640px. **No disabled state — by design:** the send button always validates and reports what is missing | |
| 37 | Add button | `.add-btn` | — | Default (dashed accent border), hover, focus-visible; label text swaps with list state | |
| 38 | Icon button | `.icon-btn` + `.ico-trash` | — | Default (bare glyph, no box, 24px hit area), **hover → danger colour**, focus-visible | |
| 39 | Link button | `.link-btn` | — | Default (underlined link text), hover, focus-visible. Looks like a link, behaves as a button (`Bearbeiten`) | |
| **Feedback** ||||||
| 40 | Note / callout | `.note` | Default (`warning-low`) · `.info` · `.success` · `.warn` | With title (`.note-title`) · single paragraph · multi-paragraph. Tone is **never** the only signal — each note carries a headline saying the same thing. Text colour stays `text.primary` in all three appearances | |
| 41 | Modal | `.modal` (native `<dialog>`) + `.modal-inner` / `-title` / `-text` / `-actions` | Destructive (danger confirm) · neutral (primary confirm, used for sending) | Closed, open (`showModal()` → focus trap, Esc, `::backdrop` dimming, entry animation via `@starting-style`). **The safe answer always holds initial focus** | |
| 42 | Save state | `.save-state` | — | `Änderungen werden gespeichert …` · `Als Entwurf gespeichert · HH:MM` · `Noch nicht gesendet — Sie können weiterhin ändern` · `bitte ergänzen Sie das Markierte` · **`.locked`** (after sending). `role="status" aria-live="polite"`. Hidden ≤640px **except** `.locked` | |
| 43 | Action bar | `.actionbar` + `.actionbar-inner` | Form · summary · sent (one per view) | Sticky bottom; left-aligned to the form's outer width so the primary button lands on the form's right edge; wraps ≤640px | |
| **Send flow** ||||||
| 44 | Numbered steps | `.steps` > `li` + `.step-title` | — | Counter-generated circles — adding a step is one line of markup, no numbers to renumber | |
| 45 | Review group | `.review-group` / `-head` / `-title` / `-context` / `.review-list` | — | With `Bearbeiten` button; **context crumb** for repetitions (`Immobilie 1 · Darlehen 2`, omitted when there is only one); **empty state** (`.review-empty`); question-over-answer ≤640px | |
| 46 | Reference ID box | `.refbox` + `.ref-id` + `.ref-status` | — | Idle, **copied** (live-region confirmation), **copy unavailable** (selects the ID, tells the user Ctrl/Cmd+C — never claims a copy that did not happen). Status line reserves its height so the box does not jump | |
| 47 | Phone preview frame | `.phone` | — | **Prototype-only** — an iframe of the same page at 390×844 so the real breakpoints fire. Not a product component | |

---

## Gaps a developer will hit

Things the prototype needs but the token set / component set does not yet provide.
Worth resolving before build:

| Gap | Detail |
|---|---|
| **Third surface token** | The design needs page / card / raised. The export has only `background.page` and `background.surface`, so `surface.card` is declared locally. Cleanest single addition to the system. |
| **Border widths & focus ring** | Figma defines `color.focus-ring` but no thickness anywhere. `1px` / `2px` / `3px` and the focus glow are all local values. |
| **`color.text.accent`** | Subheads, selected chips and the add button are accent *text*, but the only accent token is a *fill* (`action.primary`), so the fill has to satisfy text contrast and is pinned darker than the design wants. |
| **Split hairline token** | One `border.default` serves both decorative edges and control borders. It sits at 1.45:1 in light — an accepted 1.4.11 failure. A decorative (`neutral.300`) / control (`neutral.500`) split fixes both. |
| **Primary hover collapses** | `action.primary` and `action.primary-hover` both resolve to `teal.700` after the contrast pass. Re-point to `teal.700` / `800` / `900`. Until then hover is a brightness shift. |
| **Dark primary needs `on.primary` = `neutral.950`** | No teal is simultaneously dark enough for white text and light enough as accent text on `neutral.900`. Feedback tokens already do this; the action tokens were missed. |
| **Disabled button** | Not styled. Deliberate here (the send button always validates and explains), but a real design system needs one. |
| **Input hover border** | `border.hover` (`neutral.400`) is *lighter* than what `border.default` needs for 3:1, so a hover border would read as a step backwards. Unused today. |
| **No typeahead / combobox** | `Darlehensgeber` and `#an-geber` are `<select>` excerpts standing in for a several-hundred-entry register. This needs a real type-to-filter control. |
| **Not present at all** | Textarea, date picker beyond the native one, toast/snackbar, table, tabs, pagination, top-of-form error summary, loading/skeleton states, file upload. |

## Behaviour a developer must not lose

Not styling, but the reason several components look the way they do:

- **A field only counts when the form is actually asking for it.** The same predicate
  (`isAsked`) drives the submit check, validation *and* the summary. A closed `.reveal`
  or an unticked amount position is out of all three.
- **Collapsing a card never hides its fields from validation** — submit finds what is
  missing inside a shut card and opens it.
- **A required choice group counts as one item** and is flagged with `data-required`
  (a radio group cannot carry `required` usefully).
- **Expanding a step expands its sub-sections; a sub-section never closes its parent.**
- **Every `.card` state rule is a direct-child selector** — cards nest, and a descendant
  selector would let an outer card drive the inner one's chevron and height.
- **Reaching into an amount field picks its position**, and ticking a position hands the
  caret to its figure. Both directions, both keyboard and pointer.
- **Every delete confirms, blank rows included** — a nested panel takes its children
  with it and only one of the two is under the pointer.
- **Progress is reported in the action bar, not in the headers** — a `role="status"`
  line naming how many mandatory fields are still open, plus focus on the first of them.
  There is deliberately no per-card counter.
- **The summary is read out of the form**, so a field added to the form appears there
  with no extra work.
