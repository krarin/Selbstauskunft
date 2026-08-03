# V4 — Selbstauskunft, generated from BETA-Foundations

V4 rebuilds the form on the FinLink design tokens instead of hand-picked values.
Colour, typography, spacing, radius, elevation, field geometry, light/dark and
density all come out of the Figma variable export; only `css/components.css` is
written by hand, and it may reference **nothing but** semantic tokens.

Open `index.html` directly in a browser — no build step is needed to view it.

```
v4/
  tokens/
    figma-foundations-variables.json  BETA-Foundations export — the source of truth
    local-layout.json                 the short list of names Figma does not define
  build-tokens.py                     JSON -> CSS custom properties + a WCAG pass
  css/
    tokens.primitives.css   GENERATED — collection "1 Primitives"
    tokens.semantic.css     GENERATED — collections "2 Semantic" + "3 Theme"
    tokens.local.css        GENERATED — local-layout.json + the density mapping
    tokens.a11y.css         GENERATED — one override per measured WCAG failure
    components.css          hand-written
  index.html
  app.js
  test/drive.mjs            browser-driven behaviour checks (see the file header)
```

Regenerate the CSS after editing anything in `tokens/`:

```
python3 v4/build-tokens.py            # rewrite css/tokens.*.css, print the contrast report
python3 v4/build-tokens.py --check    # non-zero exit if the generated CSS is stale
```

## How the layers work

Names flatten mechanically from the token's path inside its collection, never
invented: `color.action.primary` → `--color-action-primary`,
`font/heading/md/size` → `--font-heading-md-size`, `spacing.0-5` → `--spacing-0-5`.

Semantic tokens keep their aliases as **real `var()` references** rather than
resolved values:

```css
--color-action-primary: var(--teal-500);
--input-default-radius: var(--radius-lg);
```

So changing `teal.500` in Figma and re-exporting moves every accent here, exactly
as it does in the design file. A component that reached past this layer to
`--teal-500` would silently opt out of that, which is why `components.css` is
forbidden from naming a primitive.

The export's modes become CSS like this:

| Collection | Mode | Becomes |
|---|---|---|
| 1 Primitives | Mode 1 | `:root` |
| 2 Semantic | Desktop | `:root` |
| 2 Semantic | Mobile | `@media (max-width: 640px)` |
| 3 Theme | Light | `:root, :root[data-appearance="light"]` |
| 3 Theme | Dark | `:root[data-appearance="dark"]` |

Two translations the build has to make, both spelled out in the script:

- **The Mobile breakpoint is not in the export.** The file says *which* values
  change on Mobile but not at what width, and CSS cannot read a custom property
  inside a media query. `640px` comes from `$breakpoints` in `local-layout.json`
  and is inlined at build time. Only the 6 variables that actually differ from
  Desktop are re-declared — the two largest heading steps and body copy, which
  Mobile sets one notch smaller and one notch taller respectively.
- **Density is not a Figma mode.** The export ships `input.default.*` and
  `input.compact.*` as separate paths, so `local-layout.json` maps both onto one
  set of names under `:root` and `:root[data-density="compact"]`. Components
  reference `--field-height`; the attribute picks the branch.

Shadows also need composing: Figma models them as separate `y` / `blur` / `color`
variables, so the build emits `--shadow-md: 0 var(--shadow-md-y) …`. The
composition is pure `var()`, so the colour still follows the theme.

## What comes from Figma, and what does not

The page is white and the cards are a light grey one step darker
(`neutral.100`), which the export has no *surface* token for — only
`background.page` (`neutral.50`) and `background.surface` (`neutral.0`) exist, and
the greys that fit are held by state tokens (`background.hover`, `background.active`)
that would be wrong to borrow. So a third level, `surface.card`, is declared in
[local-layout.json](tokens/local-layout.json) per appearance: light is one step off
the white page, dark is two steps up from `neutral.950`, which is what
`background.raised` already is. **A third surface token is the cleanest thing to add
to the design system.**

`components.css` then keeps two aliases, `--page-bg` and `--card-bg`. Dark keeps the
conventional order, page darkest with the cards raised above it. Everything meant to
read as *on the base level* (inputs, nested panels, the action bar) uses
`--page-bg`, so it always contrasts with the card fill in both appearances. The light
card fill collides with `background.hover` (`neutral.100`) exactly, so the card
header's own hover has to step one further, to `background.active` — the counter's
meter track stays on `--page-bg` for the same reason, since a `neutral.200` track
would disappear the moment the header is hovered.

Because both levels are aliases, a third scheme costs three declarations:
`data-appearance="grey"` keeps the light palette but trades them — the page carries
the grey and the cards are white. It is a sibling of Hell and Dunkel in the
**Erscheinungsbild** toggle.

The third declaration is `--field-bg`, split out of `--page-bg` so the interior of a
control can part company with the page level: in the grey scheme the fields stay
white on the white cards and their `border.default` outline is the whole boundary —
a `neutral.300` hairline at 1.45:1, so in that scheme a field is a very quiet shape
(see the accepted failure below). Inputs, selects and the choice chips use it; the nested panels, the
meter track and the tooltip stay on `--page-bg`, so they still read as a level
below the card in every scheme.

`--card-bg` sits on the header block (`.card-toggle`) and the body block
(`.card-body-inner`) rather than on `.card`, which is what puts a 4px gap between
the title bar and the fields of an open section. The gap is applied to
`.card-body` only under `[data-open="true"]` and transitions with the height, so
closed cards keep a clean `--section-gap` to their neighbour.

## Layout

The shell is anchored left rather than centred: `.app` has no `max-width` of its own,
so the sidebar sits one `--layout-gutter` from the viewport edge at every width and
the form column absorbs whatever space is left. The cap moved onto that column —
`grid-template-columns: var(--layout-nav-width) minmax(0, var(--layout-content-max))`
— so the form grows with the window up to 1180px and then stops, leaving the rest of
a wide monitor empty instead of stretching the fields across it. The sticky action bar
is left-aligned to the same outer width (`--layout-shell-max`, composed from the nav,
the gap, the cap and two gutters) so *Weiter* always lands on the form's right edge.
Measured at 1280 / 1440 / 1920 / 2560 the form is 929 / 1089 / 1180 / 1180 wide with
the sidebar fixed at 32px; the ≤900px branch is untouched.

Everything else visual comes from the export: the palette (11 ramps, 50–950), the
type scale, `spacing.*`, `radius.*`, shadow geometry and colour, and the field geometry
— fields are **40px tall with an 8px radius and a 12px inset** because that is
`input.default.*`, not a choice made here. Compact density is the export's
`input.compact.*`: 32px and a 4px radius.

[local-layout.json](tokens/local-layout.json) holds the remainder. Most of it
aliases real primitives, so only the *grouping* is local (`card.padding` →
`{spacing.8}`). Three things are genuinely absent from the design system rather
than out of scope:

- **border widths** — Figma defines `color.focus-ring` but no thickness for it,
  and no border width anywhere
- **the focus-ring width**
- **page furniture** — content max width, sidebar width, column minimums, measure.
  Reasonably outside a foundations file, but noted so nothing looks token-backed
  when it isn't.

## What the contrast pass found

`build-tokens.py` measures every foreground/background pair the components
actually render and re-points each failure to the nearest step of its **own** ramp
that clears the threshold. It solves all constraints on a token together, so a
token measured against several backgrounds cannot be "fixed" twice with the last
fix silently winning.

`css/tokens.a11y.css` is that output — a list of one-line changes to make in
Figma. As they land, the file shrinks. Remove the `<link>` from `index.html` to
see the export's own values. 7 of 42 measured pairs currently take an override, and
one measured failure is accepted as-is:

| Token | In the export | Override | Why |
|---|---|---|---|
| `color.action.primary` (light) | `teal.500` | `teal.700` | white label on the fill was 3.67:1; also 3.27:1 as accent text on `primary-subtle` |
| `color.action.primary-hover` (light + dark) | `teal.600` / `teal.500` | `teal.700` | 4.42:1 / 3.67:1 |
| `color.action.danger` (light + dark) | `red.500` / `red.600` | `red.700` | 3.13:1 / 3.80:1 |
| `color.border.default` (light) | `neutral.300` | **none — accepted** | 1.45:1, kept by design decision; see below |
| `color.border.default` (dark) | `neutral.800` | `neutral.600` | 1.36:1, and `neutral.800` is the card colour itself |

Declining a fix is explicit rather than a hand-edit of a generated file: the
`ACCEPTED` table in `build-tokens.py` names the (appearance, token) pair, the pass
still measures and reports it — as `FAIL` plus a `KEEP` line — and the generated CSS
carries an `ACCEPTED FAILURE` comment with the ratio and the reason. An accepted
failure therefore never reads as a passing one.

Everything else passes, including all four feedback pairs. **The three palette
gaps I reported from the older Tokens Studio export are gone** — the full 50–950
ramps give `error-strong`, `success-strong` and `info-strong` real contrast against
their own subtle backgrounds (5.19:1, 5.53:1, 5.82:1).

Four findings worth a design decision rather than a token tweak:

1. **`border.default` at 1.45:1 is an open 1.4.11 failure in light, accepted
   deliberately.** An input's border is the only thing identifying it as a control,
   so 1.4.11 asks for 3:1, and the nearest passing step is `neutral.500` — a
   visibly greyer hairline than the design wants. The design decision is to keep the
   export's `neutral.300`, so light fields do not meet 1.4.11 today. Two things make
   that worse rather than better and are the reason it is written down here: the
   single border token means the weight is shared with decorative edges (which are
   exempt and would have been the only beneficiaries of a fix), and in the grey
   scheme this hairline is the *only* separation between a white field and the white
   card behind it. A separate hairline token — decorative at `neutral.300`, control
   at `neutral.500` — is the fix that would satisfy both the design and 1.4.11.
   Dark is not accepted: there the export's `neutral.800` border is the same colour
   as the card, so it keeps the `neutral.600` override.

2. **Dark mode's primary action cannot be fixed from the ramp** (the one
   `PALETTE GAP` in the output). `color.on.primary` is `neutral.0` in Dark, and no
   teal is simultaneously dark enough for white text and light enough to read as
   accent text against `neutral.900`. The file already solves this for feedback —
   `on.success`, `on.warning`, `on.error` and `on.info` are all `neutral.950` in
   Dark — it just wasn't applied to the action tokens. Setting Dark
   `color.on.primary` to `neutral.950` makes `teal.400` work on every count:

   | | vs `on.primary` (dark text) | vs `background.surface` | vs `primary-subtle` |
   |---|---|---|---|
   | `teal.400` | 6.38:1 | 4.68:1 | 4.94:1 |

3. **Primary hover collapses.** Both `action.primary` and `action.primary-hover`
   land on `teal.700` after the pass, so hover would be invisible. The ramp now
   reaches `teal.800`/`900`, so the fix is available: re-point `action.primary` →
   `teal.700`, `primary-hover` → `teal.800`, `primary-active` → `teal.900`. Until
   then `components.css` uses a brightness shift, marked as an exception.

4. **There is no text-accent token.** Subheads, the selected chip and the add
   button are accent-coloured text, and the closest thing in the system is
   `color.action.primary`, which is a fill. Borrowing it means the fill has to
   satisfy text contrast too — that is why it carries three constraints and lands
   on `teal.700`. A dedicated `color.text.accent` would let the fill stay lighter.

Also observed but not overridden: `color.border.hover` (`neutral.400`) is
*lighter* than the value `border.default` needs for 3:1, so an input hover border
would read as a step backwards. No hover border is used, and the mockup has none.

`color.text.disabled` is deliberately left below 4.5:1 — WCAG 1.4.3 exempts text
in an inactive control, and "fixing" it would make a disabled field look active.

## Accessibility folded into the rebuild

These were open findings against V1–V3 and are fixed here, not deferred:

- every control is associated with its label (`for`/`id`), including those built
  from `<template>` and the applicant-2 copy, where ids, `for`, `name`,
  `aria-describedby` and `aria-labelledby` are all rewritten
- choice groups are radio inputs in a `role="group"` with `aria-labelledby`, so
  they announce as one question; selection is never colour-only (a checkmark
  appears too)
- `autocomplete` on personal-data fields; the applicant-2 copy moves to
  `section-antragsteller2 …` so the browser does not offer person 1's details
- the save state is a `role="status" aria-live="polite"` region
- a skip link, and `aria-invalid` plus a wired-up message on validation failure
- helper text is referenced with `aria-describedby`, not just placed near the field
- compact density bottoms out at the export's 32px, clearing WCAG 2.5.8's 24px
- destructive actions confirm in a native `<dialog>` (see below), so Esc, the focus
  trap and the inert page behind it are the browser's, and the safe answer holds
  the initial focus

Pointer users get exactly the mockup's clean accent focus border; keyboard users
additionally get an outer ring, which is easy to lose on a form this long.

## Provenance

Built from the `Finlink Variables Figma.json` export of **BETA-Foundations**
(`ep87XnexxCF05Q8p1T0G9L`, node `7660-2132`), supplied 2026-07-31. An earlier pass
used three older exports — a Tokens Studio file plus two partial Figma variable
exports — which disagreed with this one on the neutral ramp numbering, on
`text.link` (teal rather than blue), on the entire semantic naming scheme, and
which contained no spacing, radius or sizing at all. Those files have been removed
so there is one source of colour, not two.

## Relationship to the other versions

`DESIGN-SYSTEM.md` at the repository root documents V1–V3, whose accent lives in
`--brand-*` variables and whose Teal/Blue/Neutral switch is a prototype construct
with no basis in the token system. V4 replaces that with the real token layers,
which is why it has no branding switcher and gains a light/dark switch instead.
The two do not share CSS.

The `Feldzustände` section at the bottom of the page renders every field state side
by side for comparison against the design mockup. It is excluded from live
validation and from the counters, and is not part of the form.

## The section cards

The form has **six steps**, and only those six are cards:

| # | Card | Sub-sections |
|---|------|--------------|
| 1 | Finanzbedarf | — (the opening cascade: purpose, object type, use, applicant count, loan amount) |
| 2 | Antragsteller | Persönliche Details · Berufliche Situation · Einkommen · Ausgaben |
| 3 | Kinder | — |
| 4 | Finanzen | Vermögen · Immobilien · Verbindlichkeiten |
| 5 | Finanzierungsobjekt | whichever one of Immobilie / Neubau / Anschlussfinanzierung / Modernisierung / Kapitalbeschaffung applies |
| 6 | Finanzierungsdetails | — |

Each is a collapsible card: chevron, one heading, and a counter of the mandatory
fields it still wants. Only **Finanzbedarf** is expanded on load, so the page opens
as an overview of what the form is going to ask for — seven rows, six of them the form
and one the `Feldzustände` reference at the bottom.

Everything the sidebar lists *underneath* one of those six is a **sub-section**
(`.card.subsection`), not a step. It is the same markup and the same counter, but it
carries no fill and no gap of its own — a hairline rule separates it from the one
above, and its header sits one heading level down — so an open card reads as one
block with parts rather than as a stack of cards inside a card.

**Finanzen** is a step of its own rather than the tail of Antragsteller, because its
three parts are household figures, not personal ones: a Selbstauskunft asks for the
assets brought into the financing as one pot, and the same goes for property already
owned and for debts. It sits after Kinder, so the form runs personal → children →
money → object.

One heading level per nesting level, which the sidebar test asserts: `<h1>` page,
`<h2>` per step, `<h3>` per sub-section. There are no unclickable group labels left in
the sidebar either — every step is a link, so a heading above its sub-entries would
only duplicate it.

A sub-section is not something anyone has to open. `setCardOpen` propagates
downwards, so expanding a step expands all of its sub-sections with it and collapsing
it takes them back down; reopening therefore never leaves a row of shut sub-headers
to click through. Their own toggle exists for exactly one thing — folding a part that
is finished back out of the way, without that folding the step around it. The
propagation is one-way: a sub-section never closes its parent.

Two consequences worth knowing:

- **Every `.card` state rule is written against a direct child** (`.card[data-open="true"]
  > .card-body`, not `… .card-body`). A descendant selector would let an outer card's
  state drive the chevrons, heights and meters of the sub-sections inside it.
- **A sidebar sub-entry has to open two things.** `revealCard` walks the whole chain
  of `.card` ancestors, so one line in `wireNav` handles step links and sub-section
  links alike — and so does the submit check when it jumps to the first missing field.

The five object sub-sections all live in card 5, which means the card has nothing to
show while no object is known at all (a purchase where the buyer has not found the
property yet). `updateStart` hides it outright in that case, along with its sidebar
entry — an `.object-nav` without a `data-navfor`, since it stands for whichever
object applies rather than for one of them.

The counter is the interesting part, because "how many mandatory fields does this
section have?" is not a fixed number:

- **A field only counts once the form is actually asking for it.** Anything inside
  a closed conditional or an inactive finance-type section is excluded, so
  Immobilie's total grows by three the moment Erbbaurecht is answered with *Ja*,
  and the Anschlussfinanzierung card shows no counter at all until that becomes
  the selected purpose. The test is "is this inside a closed `.reveal`?" —
  deliberately not a visibility test, which would also discount every field in a
  collapsed card.
- **Collapsing a card never hides its fields from the count or from validation.**
  Both use the same predicate, so the number on a closed card is trustworthy.
- **Adding the second applicant doubles the relevant totals**, since the copy's
  fields are equally mandatory.
- **A required choice group counts as one item**, filled as soon as anything is
  picked. A radio group cannot carry `required` usefully, so the markup flags it
  with `data-required` — and submit validates those groups too, otherwise a card
  could read 5/6 while the form reported itself complete.
- **A card that asks for nothing shows no counter**, rather than `0/0`.
- **A step's counter is the sum of its sub-sections'**, and falls out of the same code:
  the tally walks descendants, so Antragsteller's `0/16` is `11 + 4 + 1` without
  anything having to add them up.
- **A position switched off in place is excluded too.** A closed `.reveal` is one way
  a field stops being asked for; `[data-inactive]` is the other, for a control that
  stays where it is instead of being revealed — an amount whose position has not been
  ticked. Both are the same predicate, `isAsked`.

## Finanzen — the amount list

**Vermögen** is a list of positions, each of which asks for a figure once it is
picked. **Einkommen** uses the same list for everything past the salary, under a
*Weitere Einkommensarten* subhead: the monthly net income is the one mandatory figure
and keeps its own section, while Zusätzliches Einkommen, Mieteinnahmen, Kindergeld,
Renteneinkommen and Sonstige Einkünfte are positions — most applicants have none of
them, and five permanently empty fields ask five questions where a list asks one.
It is per applicant there, so the list is cloned for Antragsteller 2 like the rest of
the panel. **Immobilien** and **Verbindlichkeiten** are scaffolds; the same shape
should fit the latter.

The positions are **checkboxes**, not radios. Several of them apply at once and each
is independently given up again, which is exactly what a radio group cannot express —
so they wear the radio ring from `.choice` (the mark the design asks for) over
checkbox semantics.

- **Sparguthaben is mandatory**, so it is listed already ticked and cannot be given
  up: the click is cancelled, which covers the keyboard too since space fires one as
  well. It keeps the normal fill rather than being greyed out — disabled styling would
  read as *not applicable* rather than *always applies*. Nothing in the Einkommen list
  is locked this way; the one mandatory figure there sits outside the list.
- **A picked position's amount is required**, so it counts towards the card the moment
  the position is ticked and stops counting the moment it is given up.
- **The subhead can be the group's label.** `Weitere Einkommensarten` is an `<h3>`
  above the list rather than a label inside it, so the group points at it with
  `aria-labelledby` — and `buildHelpIcons` follows that reference when there is no
  label inside the field, which is what puts the ⓘ after the heading in *Icon* mode.
- **Cloned lists start blank.** Applicant 2 inherits the markup, not the choices:
  the clone reset unticks checkboxes instead of clearing their `value`, which does
  nothing to a checkbox. Locked positions stay ticked, since that is what locked means.
- **Two fixed columns, left-aligned.** The position is one column wide
  (`--layout-col-position`) rather than stretched across the card, and the amount
  starts immediately beside it, so a short label and its figure read as one pair
  instead of being pulled apart by a gap the width of the card. Fixed rather than
  content-sized because each row is its own grid — a `max-content` column would land
  somewhere different on every row and the figures would stop lining up.
- **The value field is on every row**, ticked or not, so picking a position does not
  reflow the list and a list with three figures in it reads as a column of numbers
  rather than as ragged rows. Unpicked, only the fill recedes; it keeps full contrast,
  because this is an empty slot and not a disabled control. Nothing is clipped, so the
  focus glow survives — which is why this is not built on `.reveal`, which clips a row
  height while it animates.
- **Reaching into the amount picks the position.** Someone who clicks into a Betrag
  field has already decided the item applies, so the toggle follows rather than making
  them tick it first and aim twice. Pointerdown and the first character typed — not
  `focus`, which would claim every row a tab-through merely passes on the way down.
- **A pick made that way is provisional until the field holds a figure.** Clicking into
  an amount and moving on without typing anything is how someone reads the list, not how
  they claim a position, so the pick is taken back on blur — otherwise browsing the list
  would leave a trail of red Pflichtfelder nobody asked for. A figure settles the row:
  from then on it behaves like any other pick, so emptying it again reports the missing
  amount instead of quietly dropping the position. Ticking the box is the stronger
  signal and is never provisional.
- **An empty required amount reports itself on blur** like every other mandatory field —
  red border, `aria-invalid`, and the message wired up with `aria-describedby`. What
  changed for this to work: `validate` now also asks `isAsked`, so an amount whose
  position is not ticked is never flagged, whether it was tabbed through or just
  released.
- **Giving a position up clears its amount**, or a figure nobody claims any more would
  still be submitted. It also drops any error left showing on a field that is no
  longer being asked for.
- **Below 640px the amount stacks under its position.** It stays on the row rather than
  collapsing away — the field is what a tap picks the position with, and it cannot be
  tapped if it is not there.

Vermögen is household-level, not per applicant — a Selbstauskunft asks for the assets
brought into the financing as one pot, and Eigenkapital only means anything as a
household figure.

## Helper text has three modes

The sidebar's **Hilfetexte** switch now has three settings, since the same guidance
suits a broker and a client differently:

| Mode | Behaviour |
|---|---|
| `Ein` | inline under the label — the default, best while learning the form |
| `Icon` | collapsed into a small info icon beside the label, shown on hover or keyboard focus |
| `Aus` | hidden outright, for a client-facing view |

The icon and its tooltip are built at hydration from the helper paragraphs
themselves, so there is one source of wording and cloned applicant panels and
template rows get them too. In `Icon` mode the paragraph is **visually hidden but
left in the DOM** rather than `display: none`, because the field's
`aria-describedby` points at it and `display: none` would drop it from the
accessibility tree; the bubble is a visual duplicate and is `aria-hidden`, so the
text is not announced twice. The icon is a real focusable button with its own
accessible name — which does add a tab stop per annotated field, worth weighing on a
form this long.

Completion is never colour alone: the fraction becomes a checkmark and the word
*Vollständig*, and the meter is a redundant cue rather than the only one. The
counter also carries a visually-hidden full sentence ("9 von 11 Pflichtfeldern
ausgefüllt"), so the compact `9/11` is not what gets announced.

Auditing this turned up 20 fields whose label showed a required asterisk while the
control carried no `required` attribute — invisible to both the counter and
validation. 18 were real form fields and now carry it; the two in the reference
card were left alone deliberately.

Three implementation notes worth keeping:

- The sidebar's `max-height` has to subtract the **sticky action bar**, not just the
  top offset. Without that the nav believes it has room, its last items sit behind
  the bar, and there is nothing to scroll — it looks like a broken scroll container
  when it is really a sizing bug. The reserve is derived from the tokens the bar is
  built from (`--field-height` plus its padding), so it follows the density switch.
  Fixing this also turned up a `<p>` keeping its default block margins inside the
  bar's flex row, which had been making it 69px tall instead of 65px.

- The collapse animates `grid-template-rows: 0fr → 1fr`, which needs an overflow
  container — and overflow clips to the *padding* box, so the padding lives on a
  separate `.card-pad` inside it. With padding on the clipping element, a 32px
  strip of the collapsed content stays visible. Clipping is released once the card
  has settled, so the info tooltips are not cut off at the card edge.
- `.card-count[hidden]` needs an explicit `display: none`, because the author-level
  `display: flex` otherwise beats the UA's `[hidden]` rule and leaves an empty
  meter behind.

## Deleting Antragsteller 2 or a child

Both throw away everything typed into them and there is no undo, so both confirm
first. The dialog is a native `<dialog>` opened with `showModal()`: Esc, the focus
trap, the inert page behind it and the dimming `::backdrop` all come from the
browser rather than being rebuilt. One element serves every case — `confirmDelete()`
in `app.js` retitles it and resolves a promise with the answer, so the call site
reads as `if (!await confirmDelete({…})) return;`.

Two details worth keeping:

- **Nothing filled in means nothing to ask about.** A row added by a mis-click and
  removed a second later would otherwise need two clicks to undo. "Blank" is
  measured against the state a fresh row or a fresh copy of applicant 1 starts in:
  no text, placeholder option selected, nothing ticked except the `data-locked`
  checkboxes that are ticked by definition.
- **The Darlehensnehmer radio is the second way to delete person 2**, so answering
  *Alleine* again asks the same question — and on Abbrechen the radio goes back to
  *Mit einer anderen Person*, because the choice it shows has to match the form
  underneath it.

The prompt is opt-in per remove button: `data-confirm="Kind"` on a `[data-remove]`
button supplies the noun and turns the question on. Stellplatz rows deliberately
do not carry it — they hold a lot less than a person or a child does. Adding it is
one attribute.

Red belongs to the button that does the deleting (`.btn.danger`, on
`--color-action-danger`, which the contrast pass pins to `red.700` in both
appearances) and never to the one that backs out. Abbrechen holds the initial
focus, so Enter cannot delete.
