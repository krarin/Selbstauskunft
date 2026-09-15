# V5 — Selbstauskunft, generated from Finlink Core

V5 builds the form on the FinLink design tokens instead of hand-picked values.
Colour, typography, spacing, radius, elevation, field geometry, appearance and
density all come out of the token sources; only `css/components.css` is written by
hand, and it may reference **nothing but** public `--ds-*` tokens.

It follows the token contract in
[FINLINK-DESIGN-TOKENS.md](FINLINK-DESIGN-TOKENS.md). Where the contract cannot
express something this product needs, the deviation is applied, marked inline, and
escalated in [TOKEN-GAPS.md](TOKEN-GAPS.md) — never approximated silently.

Open `index.html` directly in a browser — no build step is needed to view it.

```
V5/
  tokens/
    finlink-core.json       the contract — Primitives, Semantics, Default (typography)
    finlink-core-ext.json   everything the contract cannot express, each set with a gap ID
    figma-foundations-variables.json  \ the outgoing BETA-Foundations sources. No longer
    local-layout.json                 / feed the build; kept as the provenance for the 13
                                        carried-over dark ramp steps (G-14). Delete once
                                        Finlink Core ships a Dark mode.
  build-tokens.py           JSON -> CSS custom properties + a WCAG pass
  css/
    tokens.css      GENERATED — §5.1-5.5: primitives, public scales, semantics,
                    the 14 typography roles and their .ds-text-* classes, base reset
    tokens.ext.css  GENERATED — dark appearance, elevation, density, focus geometry,
                    layout furniture
    tokens.a11y.css GENERATED — one override per measured WCAG failure
    components.css  hand-written
  index.html
  app.js
  prefill.js                Prototyp-Hilfe: Beispieldaten für die Strecke
  test/drive.mjs            browser-driven behaviour checks (see the file header)
  test/drive-senden.mjs     the same, for the send step (summary -> consent -> sent)
  TOKEN-GAPS.md             the escalation register — required by contract §0.3
```

Regenerate the CSS after editing anything in `tokens/`:

```
python3 build-tokens.py            # rewrite css/tokens*.css, print the contrast report
python3 build-tokens.py --check    # non-zero exit if the generated CSS is stale
```

The build fails, rather than warns, on three things: stale output, a `var()`
reference nothing declares, and a private `--_ds-*` primitive named in
`components.css`, `index.html` or `app.js`.

## How the layers work

```
LAYER 1  --_ds-*   PRIVATE   primitives — components must never name one
LAYER 2  --ds-*    PUBLIC    semantic colour, typography roles
LAYER 3  --ds-*    PUBLIC    the few component groupings, in tokens.ext.css
```

The one-way rule: Layer 3 → Layer 2 → Layer 1. Never skip, never reverse.

Names flatten mechanically from the token's path inside its collection, then take
the prefix their layer earns. Nothing is invented:

| Path | CSS |
|---|---|
| `color.grey.0` | `--_ds-color-grey-0` |
| `color.background.brand.bold.default` | `--ds-color-background-brand-bold-default` |
| `typography.body.md.strong.fontSize` | `--ds-typography-body-md-strong-font-size` |
| `space.16` | `--ds-spacing-16` |

Semantic tokens keep their aliases as **real `var()` references** rather than
resolved values:

```css
--ds-color-background-brand-bold-default: var(--_ds-color-teal-500);
```

So changing `teal.500` and rebuilding moves every accent here, exactly as it does
in the design file. A component that reached past this layer to
`--_ds-color-teal-500` would silently opt out of that — which is why the build
fails on it rather than trusting the house rule.

Four scales have no semantic layer yet and are consumed straight from Layer 1
through a public alias: spacing, radius, border-width, opacity and sizing. That is
the contract's documented §4.4 exception, gap G-07.

### Typography is applied as whole roles

There are 14 roles and no loose type properties anywhere. `tokens.css` defines each
role's four members and a matching `.ds-text-*` class; `components.css` binds its
own selectors to exactly one role each in a **role-adoption section**, so the markup
stays free of type classes and each role is authored once.

Two derivations happen in the build, once, rather than being restated:

- **font-size** is emitted in `rem` against a 16px root
- **line-height** is emitted as a **unitless ratio**, so user zoom and the WCAG
  1.4.12 text-spacing override compose correctly

A consequence worth knowing: a layout value that needs a role's *line box* as a
length has to multiply `font-size × line-height`. Three places do.

Roles are re-bound, never re-pointed. Below 640px the media query in the adoption
section gives the affected selectors a *different* role. Re-pointing a role's
variables instead looks obvious and is wrong — see G-18 in
[TOKEN-GAPS.md](TOKEN-GAPS.md) for why it steps the heading down twice.

### What the extension layer carries, and why

`tokens.ext.css` exists because Finlink Core is a light-only foundations set: no
second mode, no elevation, no density axis, no responsive typography. V5 ships all
four. The migration was scoped **behaviour-frozen**, so rather than delete working
features, each is applied as an interim and escalated:

| In `tokens.ext.css` | Gap |
|---|---|
| Dark appearance — 13 carried-over ramp steps, 52 semantic re-points | G-14 |
| Elevation — the four-step shadow scale | G-15 |
| Density — `:root[data-density="compact"]` | G-17 |
| Focus ring width and glow | G-01 / G-23 |
| Overlay / scrim | G-20 |
| `warning-strong`, consuming the orphaned orange ramp | G-25 |
| Layout furniture — widths, column minimums, measures, the phone frame | app-level |

Shadows still need composing: the source models them as separate `y` / `blur` /
`color` variables, so the build emits
`--ds-shadow-md: 0 var(--ds-shadow-md-y) …`. The composition is pure `var()`, so
the colour follows the appearance.

## Surfaces and appearances

`<html>` starts on `data-appearance="grey"`, which is the **Default** half of the
**Erscheinungsbild** toggle, opposite **Dunkel**. That scheme wants a grey page with
white cards, and Finlink's two neutrals supply exactly that:

| | Light (default) | Dark |
|---|---|---|
| `--ds-surface-page` | `background.neutral.subtle` (grey.100) | `background.neutral.subtlest` → grey.950 |
| `--ds-surface-card` | `background.neutral.subtlest` (white) | `background.neutral.subtle` → grey.800 |
| `--ds-surface-field` | white | grey.950 |

Dark keeps the conventional order — page darkest, cards raised above it — which is
why the two swap roles rather than being separate tokens.

`--ds-surface-field` is split out so the interior of a control can part company with
the page level: in the default scheme fields stay white on white cards and the
outline is the whole boundary. That outline is `border.neutral.bold.hovered`
(`#78909C`, 3.35:1) rather than `border.neutral.bold.default` (`#CFD8DC`, 1.45:1),
per contract §8.4 — an input's border is the only thing identifying it as a control,
so 1.4.11 applies to it. Dividers and panel edges keep the lighter hairline.

The three surface levels used to be declared in `components.css`; they live in the
token layer now, which is where an appearance switch belongs.

`--ds-surface-card` sits on the header block (`.card-toggle`) and the body block
(`.card-body-inner`) rather than on `.card`, which is what puts a 4px gap between
the title bar and the fields of an open section. The gap is applied to `.card-body`
only under `[data-open="true"]` and transitions with the height, so closed cards
keep a clean `--ds-section-gap` to their neighbour.

## Layout

The shell is anchored left rather than centred: `.app` has no `max-width` of its own,
so the sidebar sits one `--ds-layout-gutter` from the viewport edge at every width and
the form column absorbs whatever space is left. The cap moved onto that column —
`grid-template-columns: var(--ds-layout-nav-width) minmax(0, var(--ds-layout-content-max))`
— so the form grows with the window up to 1180px and then stops, leaving the rest of
a wide monitor empty instead of stretching the fields across it. The sticky action bar
is left-aligned to the same outer width (`--ds-layout-shell-max`, composed from the nav,
the gap, the cap and two gutters) so *Weiter* always lands on the form's right edge.
Measured at 1280 / 1440 / 1920 / 2560 the form is 929 / 1089 / 1180 / 1180 wide with
the sidebar fixed at 32px; the ≤900px branch is untouched.

Field geometry is the contract's own scales: **40px tall** (`sizing.10`) with a
**4px radius** (`radius.base`) and a **12px inset** (`spacing.12`). Compact density
drops to 32px, which still clears WCAG 2.5.8's 24px target.

The remainder — content max width, sidebar width, column minimums, prose measures
and the phone preview frame — is page furniture the design system has no opinion on.
It is grouped in `finlink-core-ext.json` so nothing looks token-backed when it isn't.

## What the contrast pass found

`build-tokens.py` measures every foreground/background pair the components actually
render, in **both appearances**, and re-points each failure to the nearest step of
its **own** ramp that clears the threshold. It solves all constraints on a token
together, so a token measured against several backgrounds cannot be "fixed" twice
with the last fix silently winning. Dark is measured as *composed* — Finlink
semantics plus the extension overrides — so the numbers describe what ships, not
what the contract alone would render.

The pass independently reproduces the contract's own §8.2–8.4 audit (13.16, 7.24,
3.67, 4.42, 3.80, 6.28, 1.45, 2.25, 3.44), which is the main evidence that
`finlink-core.json` transcribes §4 correctly.

`css/tokens.a11y.css` is the output — a list of one-line changes to make in Figma.
As they land, the file shrinks. Remove the `<link>` from `index.html` to see the
sources' own values. 9 of 42 measured pairs take an override, one failure is
accepted as-is, and two cannot be fixed at all:

| Token | In the source | Override | Why |
|---|---|---|---|
| `background.brand.bold.default` (both) | `teal.500` | `teal.700` | white label was 3.67:1 |
| `background.brand.bold.hovered` (both) | `teal.600` | `teal.700` | 4.42:1 |
| `background.danger.bold.default` (both) | `red.500` | `red.600` | 3.80:1 |
| `text.brand.bold.default` (light) | `teal.600` | `teal.700` | 4.42:1 on white, 3.94:1 on brand subtlest |
| `border.neutral.bold.default` (light) | `grey.300` | **none — accepted** | 1.45:1; the resting input border uses `bold.hovered` instead, per §8.4 |
| `text.success.bold.default` | `green.500` | **none — palette gap** | 2.25:1; the green ramp has two steps |
| `text.info.bold.default` | `blue.500` | **none — palette gap** | 3.44:1; the blue ramp has two steps |

Declining a fix is explicit rather than a hand-edit of a generated file: the
`ACCEPTED` table in `build-tokens.py` names the (appearance, token) pair, the pass
still measures and reports it — as `FAIL` plus a `KEEP` line — and the generated CSS
carries an `ACCEPTED FAILURE` comment with the ratio and the reason. An accepted
failure therefore never reads as a passing one.

Three findings need a design decision rather than a token tweak. All three are
written up in [TOKEN-GAPS.md](TOKEN-GAPS.md):

1. **There is no accessible success or info text colour** (G-01). Both ramps have
   only a `100` and a `500`, so neither can be fixed from its own steps. Neither is
   used as text here — success is a dot beside the words *"Als Entwurf
   gespeichert"*, info is a `.note` border with a headline — so colour is never the
   only carrier. But the first person to write green text will ship a 2.25:1 failure.

2. **Primary hover collapses** (G-24). Resting moves to `teal.700` to clear 4.5:1,
   and `hovered` is `teal.600` — one step *lighter*. Finlink's teal ramp stops at
   700, so there is no darker step to hover into. `components.css` dims the fill
   instead, marked as an exception. A `teal.800` deletes that rule.

3. **`border.neutral.bold.default` is a shared hairline** (G-01). One token serves
   both control outlines and decorative edges, and the two have different
   requirements. Splitting it — decorative at `grey.300`, control at `grey.500` —
   satisfies both; today `components.css` picks `bold.hovered` for controls, which
   works but reads as a state token doing a resting job.

`text.*.disabled` is deliberately left below 4.5:1 — WCAG 1.4.3 exempts text in an
inactive control, and "fixing" it would make a disabled field look active.

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
- helper text is referenced with `aria-describedby`, not just placed near the field —
  inside a repeatable template that link cannot be written by hand (the id it points at
  has to be unique per copy), so `linkHelp` makes it per instance during hydration and
  leaves a field that already declares it alone
- compact density bottoms out at 32px, clearing WCAG 2.5.8's 24px
- destructive actions confirm in a native `<dialog>` (see below), so Esc, the focus
  trap and the inert page behind it are the browser's, and the safe answer holds
  the initial focus
- every money field and the reference number carry `.ds-numeric`, so digits align
  down a column — a correctness requirement in a Selbstauskunft, and one the token
  system has no token for (G-06)

Pointer users get exactly the mockup's clean accent focus border; keyboard users
additionally get an outer ring, which is easy to lose on a form this long.

## Provenance

Built against the token contract in
[FINLINK-DESIGN-TOKENS.md](FINLINK-DESIGN-TOKENS.md) (v1.0), which describes the
`Finlink Core Primitives`, `Finlink Core Semantics` and `Default` collections.

**`tokens/finlink-core.json` is a transcription of that contract's §4 tables, not a
Figma export** — the Finlink Core file itself was not supplied. It is verified two
ways: all 280 declarations in the generated `tokens.css` match contract §5.1–5.4
exactly, and the build's own contrast pass independently reproduces the §8.2–8.4
ratios. When the real export lands it should drop into `tokens/` and produce an
identical `tokens.css`. A **structural** diff means someone renamed a variable —
treat it as a breaking change.

V5 previously ran on **BETA-Foundations** (`ep87XnexxCF05Q8p1T0G9L`, node
`7660-2132`, supplied 2026-07-31), whose collections were `1 Primitives` /
`2 Semantic` / `3 Theme` and whose names were unprefixed (`--color-action-primary`,
`--spacing-4`). The two systems agree on only two ramps — grey and teal. Red, blue,
green, yellow and orange disagree about what each index *means*, which is why the
dark appearance's carried-over steps are namespaced `--_ds-ext-color-*` instead of
being grafted onto the Finlink ramps. The full comparison is at the top of
[TOKEN-GAPS.md](TOKEN-GAPS.md).


## Relationship to the other versions

`DESIGN-SYSTEM.md` at the repository root documents V1–V3, whose accent lives in
`--brand-*` variables and whose Teal/Blue/Neutral switch is a prototype construct
with no basis in the token system. V5 replaces that with the real token layers,
which is why it has no branding switcher and gains a light/dark switch instead.
The two do not share CSS.

## The section cards

The form has **six steps**, and only those six are cards:

| # | Card | Sub-sections |
|---|------|--------------|
| 1 | Finanzbedarf | — (the opening cascade: purpose, object type, use, applicant count, loan amount) |
| 2 | Antragsteller | Persönliche Details · Berufliche Situation · Einkommen · Ausgaben |
| 3 | Kinder | — |
| 4 | Finanzen | Vermögen · Immobilienvermögen · Verbindlichkeiten |
| 5 | Finanzierungsobjekt | whichever one of Immobilie / Neubau / Anschlussfinanzierung / Modernisierung / Kapitalbeschaffung applies |
| 6 | Finanzierungsdetails | — |

Each is a collapsible card: a chevron and one heading, nothing else. Only
**Finanzbedarf** is expanded on load, so the page opens as an overview of what the form
is going to ask for — six rows, one per step.

An earlier version put a Pflichtfeld counter in every header (`4/6`, a meter, `✓
Vollständig`). It is gone: the headers are quiet now, and *how far along am I* is
answered where it matters — by the action bar on the way out, which names how many
fields are still open and jumps to the first of them.

Everything the sidebar lists *underneath* one of those six is a **sub-section**, not a
step. It carries no fill and no gap of its own — a hairline rule separates it from the
one above, and its heading sits one level down — so an open card reads as one block
with parts rather than as a stack of cards inside a card. All of them are
`.subsection-static`: a heading and its fields, shown outright with the step, with no
toggle of its own. **Antragsteller**'s four parts, **Finanzen**'s three and
**Finanzierungsobjekt**'s five all follow it — one list, not twelve doors, so the
headings only say which part you are in. For the object parts that is doubly true:
exactly one of the five applies at a time and the reveal already picks it, so a toggle
on top would be a door in front of a door.

**Finanzen** is a step of its own rather than the tail of Antragsteller, because its
three parts are household figures, not personal ones: a Selbstauskunft asks for the
assets brought into the financing as one pot, and the same goes for property already
owned and for debts. It sits after Kinder, so the form runs personal → children →
money → object.

One heading level per nesting level, which the sidebar test asserts: `<h1>` page,
`<h2>` per step, `<h3>` per sub-section. There are no unclickable group labels left in
the sidebar either — every step is a link, so a heading above its sub-entries would
only duplicate it.

A sub-section is not something anyone has to open. A static one has nothing to open at
all, and for the collapsible kind `setCardOpen` propagates downwards, so expanding a
step expands its sub-sections with it and collapsing it takes them back down; reopening
therefore never leaves a row of shut sub-headers to click through. Their own toggle
exists for exactly one thing — folding a part that is finished back out of the way,
without that folding the step around it. The propagation is one-way: a sub-section
never closes its parent.

Two consequences worth knowing:

- **Every `.card` state rule is written against a direct child** (`.card[data-open="true"]
  > .card-body`, not `… .card-body`). A descendant selector would let an outer card's
  state drive the chevrons and heights of the sub-sections inside it.
- **A sidebar sub-entry has to open two things.** `revealCard` walks the whole chain
  of `.card` ancestors, so one line in `wireNav` handles step links and sub-section
  links alike — and so does the submit check when it jumps to the first missing field.

The five object sub-sections all live in card 5, which means the card has nothing to
show while no object is known at all (a purchase where the buyer has not found the
property yet). `updateStart` hides it outright in that case, along with its sidebar
entry — an `.object-nav` without a `data-navfor`, since it stands for whichever
object applies rather than for one of them.

"Which fields are mandatory here?" is not a fixed list, and one predicate answers it
everywhere — `isAsked` in `app.js`. It runs the submit check, the inline validation and
the summary's read-back, so those three can never disagree:

- **A field only counts once the form is actually asking for it.** Anything inside a
  closed conditional or an inactive finance-type section is excluded, so Immobilie asks
  for three fields more the moment Erbbaurecht is answered with *Ja*, and
  Anschlussfinanzierung asks for nothing until that becomes the selected purpose. The
  test is "is this inside a closed `.reveal`?" — deliberately not a visibility test,
  which would also discount every field in a collapsed card.
- **Collapsing a card never hides its fields from validation.** A shut card is not an
  answered one, so submit still finds what is missing inside it and opens it.
- **Adding the second applicant asks for the same set again**, since the copy's fields
  are equally mandatory.
- **A required choice group counts as one item**, answered as soon as anything is
  picked. A radio group cannot carry `required` usefully, so the markup flags it with
  `data-required` — and submit validates those groups too, otherwise the form could
  report itself complete with a question untouched.
- **A position switched off in place is excluded too.** A closed `.reveal` is one way a
  field stops being asked for; `[data-inactive]` is the other, for a control that stays
  where it is instead of being revealed — an amount whose position has not been ticked.

## Finanzen — the amount list

**Vermögen** is a list of positions, each of which asks for a figure once it is
picked. **Einkommen** uses the same list for everything past the salary, under a
*Weitere Einkommensarten* subhead: the monthly net income is the one mandatory figure
and keeps its own section, while the ten further income types — Nebentätigkeit,
Mieteinnahmen, Kindergeld, Elterngeld, Unterhaltseinnahmen, Renteneinkommen,
Erwerbsminderungsrente, Unbefristete Zusatzrente, Dividendeneinkünfte and Sonstige
Einkünfte — are positions: most applicants have none of them, and ten permanently
empty fields ask ten questions where a list asks one.
It is per applicant there, so the list is cloned for Antragsteller 2 like the rest of
the panel.

## Finanzen — Immobilienvermögen

Property already owned is a **list of properties, each with a list of loans on it**.
Both levels are the repeatable-panel pattern (`tpl-immobilie-besitz`, `tpl-darlehen`),
nested, because a charge in Abteilung III of the Grundbuch belongs to the object it is
registered on and not to the household — two properties with one loan each cannot be
expressed by a single flat list of loans.

The outer level sits behind a **Ja/Nein gate**, the same shape as Verbindlichkeiten:
*Sind Immobilien vorhanden?* opens a reveal holding the list and the add button.
Answering *Ja* is already the statement that there is a property, so the first card
comes with the answer and the button sits **under** it — only while the list is empty,
so reopening the gate does not discard what was typed. The button still says which of
the two it is doing (*+ Immobilie erfassen* / *+ Weitere Immobilie erfassen*), read
off the list rather than off a click count, because removing the last card leaves the
gate open with an empty list.

The inner level has no gate: on a property that is already there, `.gate-row` puts the
Abteilung-III question and the button that answers it on one line.

The loan buttons arrive with the property they belong to, so they are **delegated**
from `#immobilien-liste` rather than wired one by one; the enclosing `.subcard` is the
property, which is how `renumberDarlehen` finds the right list and the right button.

Two field decisions come from the source spec rather than from the layout:

- **Nutzung reveals the rent.** *Vermietet* and *Beides* both mean there is a monthly
  income to declare, so `data-show-when="Vermietet|Beides"` asks for it; *Eigengenutzt*
  closes it again and it stops being asked for, like everything else in a shut reveal.
- **Darlehensgeber is an excerpt.** The real register runs to several hundred
  institutions with near-identical names, which belongs behind a type-to-filter control
  — the same one Anschlussfinanzierung's `#an-geber` is standing in for. Until that
  exists the `<select>` carries about two dozen lenders plus *Sonstiger Darlehensgeber*,
  which is enough to prototype the field but is not the list to ship.

**Verbindlichkeiten** stays the household's own debts: loans on a property live with
that property, so the two lists do not overlap.

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
- **And the reverse: ticking a position hands the caret to its figure.** Picking is only
  half an answer, so the row drops the user into the field holding the other half
  instead of asking them to aim at a second target next to the one they just hit. It
  covers the keyboard too, since Space fires the same `change`. Nothing is skipped: the
  amount is the next stop in the tab order anyway. Giving a position up moves no focus —
  the user is somewhere else by then — and the click on a locked position, which has
  nothing to toggle, lands in its field rather than nowhere at all.
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

## Helper text is an icon

Helper text sits in a small info icon beside the label, shown on hover or keyboard
focus. V5 briefly carried a **Hilfetexte** switch offering three modes — inline,
icon, and off — on the theory that the same guidance suits a broker and a client
differently. It is gone: reading the form, the modes did not tell apart clearly
enough to be worth the choice, so the icon is the one form and the switch no longer
appears in the sidebar.

The icon and its tooltip are built at hydration from the helper paragraphs
themselves, so there is one source of wording and cloned applicant panels and
template rows get them too. The paragraph is **visually hidden but
left in the DOM** rather than `display: none`, because the field's
`aria-describedby` points at it and `display: none` would drop it from the
accessibility tree; the bubble is a visual duplicate and is `aria-hidden`, so the
text is not announced twice. The icon is a real focusable button with its own
accessible name — which does add a tab stop per annotated field, worth weighing on a
form this long.

The action bar's progress line is a `role="status"` live region, so "Noch 3
Pflichtfelder offen" is announced rather than only shown — and submit moves the focus
to the first of them, so the message and the caret always agree.

Auditing the required fields turned up 20 whose label showed a required asterisk while
the control carried no `required` attribute — invisible to validation. 18 were real
form fields and now carry it; the two in the reference card were left alone
deliberately.

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

## Deleting Antragsteller 2 or a child

Both throw away everything typed into them and there is no undo, so both confirm
first. The dialog is a native `<dialog>` opened with `showModal()`: Esc, the focus
trap, the inert page behind it and the dimming `::backdrop` all come from the
browser rather than being rebuilt. One element serves every case — `confirmAction()`
in `app.js` retitles it and resolves a promise with the answer, so the call site
reads as `if (!await confirmAction({…})) return;`. Sending uses the same dialog with
`tone: 'primary'`, because red has to mark destruction and sending produces something
rather than losing it.

Two details worth keeping:

- **Every delete asks, blank rows included.** An earlier version skipped the question
  for a row with nothing in it, on the grounds that a mis-click should not need two
  clicks to undo. It now asks in every case: the trash glyph sits right beside the
  fields it would throw away, "empty" from the outside is not the same as empty to the
  person who typed there, and a nested panel takes its children with it — the loans on a
  property go when the property does, and only one of the two is under the pointer.
- **The Darlehensnehmer radio is the second way to delete person 2**, so answering
  *Alleine* again asks the same question — and on Abbrechen the radio goes back to
  *Mit einer anderen Person*, because the choice it shows has to match the form
  underneath it.

Every `[data-remove]` button asks. `data-confirm="Kind"` names the thing in the prompt
and `data-confirm-article="dieser"` gives the case its noun takes — German wants *dieser
Immobilie* where it wants *diesem Darlehen*, and the default is `diesem`. A button with
no noun at all still asks, about an *Eintrag*.

Red belongs to the button that does the deleting (`.btn.danger`, on
`--color-action-danger`, which the contrast pass pins to `red.700` in both
appearances) and never to the one that backs out. Abbrechen holds the initial
focus, so Enter cannot delete.

## Sending: Zusammenfassung, Einwilligung, Referenz-ID

The form is step one of three. The action bar's primary button says **"Weiter zu
Zusammenfassung"**, so it names where it goes; it still runs the completeness check
first, and an incomplete form does not move on — it reports how many mandatory fields
are open and puts the caret in the first of them.

All three steps live in **one document**, as three `<main>` elements with one action
bar each (`#main` / `#summary-view` / `#sent-view`, `#bar-form` / `#bar-summary` /
`#bar-sent`). Exactly one pair is visible; `showView()` sets `hidden` on the others and
writes `data-view` on `<html>` for the stylesheet. Separate pages would have thrown away
everything typed, because the summary is read out of the form itself. `data-view` is what
takes the sidebar's section list off screen for the last two steps — those links point at
cards that are not there — while the prototype's own switches stay.

### The summary reads the form, it is not maintained

`buildReview()` walks the six cards and builds one group per step: label from the
field, answer from the control. A field added to the form therefore appears here with
no further work. What it leaves out is as much of the point as what it shows:

- **Anything not asked for.** A closed conditional, a position whose checkbox is not
  ticked, and a step switched off by the finance type (`#objekt` when no object is
  known) — the same `isAsked()` validation uses.
- **Anything empty.** The list is what was answered; a blank row saying nothing is
  worse than no row.
- **The label's decoration.** The required asterisk, and the info icon whose bubble
  carries the whole help text and would otherwise land in the middle of the read-back.

The answer is shown the way it was *displayed*, not the way it is stored: the selected
option's text rather than its value (*Kauf einer bestehenden Immobilie*, not `kauf`),
the chip's label for a radio group (*Alleine*, not `1`), and the unit box beside an
amount as part of the figure (*320.000,00 €*). Repetitions get a crumb above them —
*Antragsteller 2*, *Immobilie 1 · Darlehen 2* — because two fields called *Aktuelle
Restschuld* under one heading cannot be told apart otherwise. One applicant gets no
crumb; there is nothing to distinguish.

Each group has a **Bearbeiten** button that returns to the form, opens that step and
focuses its first field — correcting something is one click from where it was noticed.
The summary is rebuilt on every entry, so no answer can go stale between the two views.

### The consent, and what the customer has to do

Two things are asked for before sending, both required:

- **The broker's confirmation** that the customer's consent to transmit the data to
  the advisor exists — a checkbox with no chip around it (`.choice.plain`), because a
  consent is a sentence and the label has to be allowed to wrap. The mark stays on the
  first line rather than centring itself over the paragraph (`--choice-mark-offset`).
- **Two e-mail addresses**: the customer's, which is where the request for their own
  confirmation goes, and the broker's, which is where the reference ID goes. Neither is
  collected anywhere in the form, so both are asked for here.

Next to the checkbox, an info note says plainly that the customer receives an e-mail
with a confirmation link and that the consent is only complete once they click it, and
that nobody has to chase it. Directly above the send button — not at the top of the
page, where it would be forgotten by the time it matters — a warning note says that
after sending the form cannot be opened or corrected any more.

The send button is **never disabled**. It validates on click and shows what is missing,
the same way the form's own submit does: a disabled button announces nothing and
explains nothing. All three checks run at once, so someone who has to fix something
sees everything that is missing rather than one item at a time.

### Sent means gone

Sending asks first, in the shared dialog, restating the irreversibility and naming
both addresses. Abbrechen holds the initial focus, so Enter cannot send.

On confirmation the form is **locked, not merely hidden**: every control in `#main`
and `#summary-view` is disabled and both action bars go. Hiding alone would leave the
form a Tab-jump or a `#`-link away from being edited, and "you cannot change it any
more" has to be true of the page and not just of the way out of it. There is no way
back — the sent screen offers none, and says so in words.

What the sent screen carries:

- **The reference ID**, format `SA-JAHR-XXXXXX`. The alphabet leaves out I, O, 0 and
  1: the ID is read aloud and copied by hand, and those four are what gets confused
  doing it. A **Kopieren** button puts it on the clipboard and reports it in a live
  region; a page opened straight off disk often has no clipboard permission, so the
  fallback selects the ID and says that Ctrl/Cmd+C is one keystroke away rather than
  claiming a copy that did not happen.
- A note that the ID went to the address entered.
- **Was jetzt passiert** — the three next steps, numbered: the customer confirms, the
  advisor takes over, and any question about the case needs only the ID.
- A closing note that the form is shut for the broker, with what to do if something
  turns out to be wrong: ask the advisor, with the ID.

**Simulated, and only that.** No mail leaves the browser, the reference ID is generated
in the page, and the lock lives for as long as the tab does. `Prototyp neu starten` in
the last action bar reloads the page; it exists for demoing and has no counterpart in
the product. The mobile preview frame always starts on the form — it is a second copy
of this page with nothing typed into it, so its own summary would be empty.

### Beispieldaten einfügen

Der Weg zur Zusammenfassung führt durch rund 60 Pflichtangaben, was jede Vorführung
und jeden Test zu Tipparbeit macht. **Prototyp → Beispieldaten einfügen** in der
Sidebar füllt statt dessen einen Fall in einem Klick: Erika Mustermann kauft allein
eine Eigentumswohnung in Köln, 320.000 € Darlehen, 80.000 € Eigenkapital. Danach ist
das Formular vollständig und *Weiter zu Zusammenfassung* führt weiter.

[prefill.js](prefill.js) ist eine eigene Datei und kein Teil des Formulars: sie tippt
den Antrag von außen aus, wie eine Hand es täte — Wert setzen, `input` / `change` /
`blur` auslösen —, und kennt keine Interna von `app.js`. Die Kaskaden, die
Währungsformatierung, die Zähler und die Pflichtfeldprüfung reagieren deshalb genau
wie bei Handeingabe. Die Datei kann ersatzlos entfernt werden.

Vier Regeln machen den Unterschied zwischen einer Befüllung und einem Datenmüllhaufen:

- **Nur, wonach gefragt wird.** Ein Feld in einem geschlossenen Zweig, eine Position,
  die nicht angehakt ist, und die Objektkarte, die es zum gewählten Zweck nicht gibt,
  bleiben leer — dieselbe Regel wie `isAsked()`.
- **Nur, was leer ist.** Eigene Eingaben werden nicht überschrieben. Einzige Ausnahme
  ist der Darlehensbetrag, der mit `0,00` startet und damit nichts sagt.
- **Freiwillige Felder nur mit Eintrag im Katalog.** Ein Pflichtfeld ohne bekannte
  Beschriftung bekommt eine Angabe aus Einheit und Platzhalter; ein freiwilliges
  bleibt leer, statt im Antrag zu stehen, ohne dort etwas zu sagen. Genauso bei
  Auswahllisten: eine Pflichtliste nimmt notfalls ihren ersten echten Eintrag, eine
  freiwillige bleibt zu, damit sie keinen Folgezweig aufmacht.
- **Antworten aus Text, nicht aus Position.** Werte werden über die Beschriftung
  gefunden und Listeneinträge über ihren Text, nicht über ihren Index — eine
  umsortierte oder ergänzte Liste macht die Befüllung nicht falsch. Zwei Stellen
  fragen mit denselben Worten nach anderem und haben ihren eigenen Katalog: die
  Kinderzeile (*Name*, *Geburtsdatum*) und das Finanzierungsobjekt, dessen Adresse
  nicht die Wohnadresse der Antragstellerin ist.

Die beiden E-Mail-Adressen des Versandschritts kommen mit, damit die Strecke bis zur
Referenz-ID in drei Klicks durchläuft. Das Einwilligungshäkchen bleibt leer: es ist
die Entscheidung, um die es auf der Seite geht, und eine Beispielbefüllung trifft sie
nicht. Auf den letzten zwei Schritten ist der Knopf weg — er würde einen Antrag
ändern, dessen Zusammenfassung schon gelesen wird.
