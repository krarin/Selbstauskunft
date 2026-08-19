# Token gaps — V5 on Finlink Core

Required by `FINLINK-DESIGN-TOKENS.md` §0.3. Every deviation in this prototype is
recorded here in the §9.4 escalation format, and every `/* INTERIM G-nn */` marker
in the CSS has an entry below.

**Context.** V5 was built against BETA-Foundations (`1 Primitives` / `2 Semantic` /
`3 Theme`) and has been migrated onto Finlink Core. The migration was scoped
**behaviour-frozen**: names and values move to the contract, but nothing the
prototype already did was removed. Finlink Core is light-only with no elevation,
no density axis and no responsive typography, so the four capabilities V5 ships
had to be escalated rather than deleted. That is what most of this file is.

**Where the deviations live.** `css/tokens.css` is the contract, generated
verbatim from `tokens/finlink-core.json` — it contains no deviations at all.
Everything below is in `css/tokens.ext.css` (generated from
`tokens/finlink-core-ext.json`) or marked inline in `css/components.css`.

**Provenance warning.** `tokens/finlink-core.json` is a *transcription* of the
contract's §4 tables, not a Figma export — the Finlink Core file was not supplied.
It is byte-verified against §5: all 280 declarations match, and the build's own
contrast pass independently reproduces the §8.2–8.4 ratios (13.16, 3.67, 4.42,
3.80, 6.28, 1.45, 2.25, 3.44). When the real export lands it should drop into
`tokens/` and produce an identical `tokens.css`. **A structural diff means someone
renamed a variable — treat it as a breaking change.**

---

## Ramp compatibility — read this first

The two systems agree on only two ramps. This is the root cause of most entries
below, and of the whole `--_ds-ext-color-*` namespace.

| Ramp | Verdict |
|---|---|
| **grey** (was `neutral`) | Identical, 0–950. Pure rename. |
| **teal** | Identical on 100–700. Finlink stops at 700; BETA continued to 950. |
| **red** | **Conflict.** Finlink `red/500` `#E64D4D` *is* BETA `red/600`. Finlink `red/600` `#AB3645` and `red/700` `#892936` do not exist in BETA at all. |
| **blue** | **Conflict.** Finlink `blue/500` `#4B7BEC` *is* BETA `blue/400`. Only `blue/100` agrees. |
| **green · yellow · orange** | Index shift: BETA `50` = Finlink `100` (same hex). Finlink ships only 100 and 500. |
| **purple** | `100` differs (`#FAE6FD` vs `#FAE9FD`); `500` agrees. |
| **cyan** | Absent from Finlink. Only fed `feedback.notification`, which was unused — **dropped, no gap**. |

Because red/blue/green/yellow/orange disagree about what an index *means*, the
carried-over steps are namespaced `--_ds-ext-color-*` rather than grafted onto the
Finlink ramps. Grafting would fork the ramp, which §12.7 exists to prevent.

---

### ⚠️ G-14 — Dark appearance (the largest gap)

**Requested:** Keep the working `data-appearance="dark"` scheme the prototype
ships behind its *Erscheinungsbild → Dunkel* switch.

**Blocked by:** Finlink Core is single-mode. §1.1 lists dark mode as absent and
§9.2 says flatly *"Not possible. Build light-only and escalate."* Worse than the
missing mode is the missing palette: a dark theme needs steps the contract does
not define at all. Finlink stops at `teal/700` and ships only `100` and `500` for
blue, green, yellow and orange, so no arrangement of Finlink primitives produces
a usable dark surface set for the status intents.

**Applied instead:** 13 carried-over primitive steps in
`tokens/finlink-core-ext.json` under `--_ds-ext-color-*`, and 52 semantic
re-points under `:root[data-appearance="dark"]`. The grey ramp carries dark's
surfaces and text unaided — grey is identical in both systems — so only the brand's
darkest step and the status intents need the extension. Values carry over verbatim
from the BETA-Foundations build; nothing is invented.

The contrast pass measures dark as *composed* (Finlink semantics + the extension
overrides), not as the contract alone would render, so the 21 dark pairs in the
build report are real measurements of what ships. All but the three shared G-01
button fills pass.

**To resolve properly:** add a **Dark mode to the Finlink Core Semantics
collection**. Primitives stay mode-less; the ramps need extending first —
`teal/800·900·950`, `blue/200·300·950`, `red/400·800·950`, `green/400·950`,
`yellow/400·950`, `orange/400·950`. Deleting `--_ds-ext-color-*` is the acceptance
test.

**Blast radius:** every surface, every text colour, every status in the dark
appearance — 52 tokens.

---

### ⚠️ G-01 — No accessible pairing for several intents

**Requested:** A primary CTA, a destructive CTA, success text, info text and an
input outline that pass WCAG AA.

**Blocked by:** measured, not assumed — the build's contrast pass reproduces §8.3
exactly. White on `background.brand.bold.default` is **3.67:1**; on
`background.danger.bold.default` **3.80:1**; `text.success.bold` on its own subtle
surface **2.25:1**; `text.info.bold` **3.44:1**; `border.neutral.bold.default` on
white **1.45:1** against a 3:1 requirement. No focus token exists at all.

**Applied instead:** `css/tokens.a11y.css`, generated. Each failure is re-pointed
to the nearest step of its *own* ramp that clears the threshold — nothing invented,
each line a one-line change to make in Figma:

- `background.brand.bold.default` and `.hovered` → `teal/700` (5.32:1)
- `background.danger.bold.default` → `red/600` (6.28:1)
- `text.brand.bold.default` → `teal/700` (5.32:1 on white, 4.74:1 on brand subtlest)
- **input outline:** components.css uses `border.neutral.bold.hovered` (`#78909C`,
  3.35:1) as the *resting* border, per §8.4. `border.neutral.bold.default` keeps its
  value and is left to the dividers — recorded as an accepted failure in the
  generated file, so it never reads as passing.
- **focus:** a 2px `border.brand.bold.default` ring plus a soft halo (see G-23)
- `text.success.bold` and `text.info.bold`: **not fixed** — see below

**Still failing, and shipped that way:** `text.success.bold` (2.25:1) and
`text.info.bold` (3.44:1) cannot be fixed from their own ramps, which have only two
steps each. Neither is used as text in this prototype: success is a dot beside the
words *"Als Entwurf gespeichert"*, and the info tone is a `.note` border with a
headline. Colour is never the only carrier (§8.1.3), so this is contained — but
**there is currently no accessible success or info text colour**, and the moment
someone writes one it will fail.

**To resolve properly:** darken `brand.bold.default` to `teal/700` in Figma; add
`green/600`+`green/700` and `blue/600`+`blue/700`; add `color.border.focus.default`.

**Blast radius:** the primary CTA on every screen, the destructive CTA, every
input outline, every focus ring, all success and info states.

---

### ⚠️ G-24 — Primary hover is lighter than primary rest

**Requested:** A visible hover on the primary button.

**Blocked by:** a consequence of the G-01 interim. Resting moves to `teal/700`;
`background.brand.bold.hovered` is `teal/600`, one step *lighter*. So hover either
inverts, or — once the contrast pass fixes both to clear 4.5:1 — collapses to the
same colour and disappears. Finlink's teal ramp stops at 700, so there is no darker
step to hover into. The contract's own §6.3 reproduces this bug.

**Applied instead:** `filter: brightness(0.9)` on `.btn.primary:hover`, marked
`EXCEPTION (G-24)` in `components.css`. A dim, not a colour — inventing a teal here
would fork the ramp.

**To resolve properly:** add `teal/800`, or re-author the bold brand ramp so
`default`/`hovered`/`pressed` descend from an already-accessible resting step.

**Blast radius:** every primary button; the same shape of problem waits on danger.

---

### ⚠️ G-17 — No density axis

**Requested:** Keep the *Dichte → Kompakt* switch.

**Blocked by:** Finlink Core has no density mode and no compact control geometry.
`sizing.10` (40px) and `sizing.12` (48px) are the only control heights; there is
nothing for a 32px field, and no compact padding or gap set.

**Applied instead:** a `:root[data-density="compact"]` set in `tokens.ext.css`.
The default density lands entirely on real Finlink scales (`sizing.10`, spacing,
`radius.base`); only the 32px compact height is off-scale, and it still clears the
24px WCAG 2.5.8 target. The compact field also drops a typography role
(body-lg-default → body-md-medium) so the text scales with the box.

The role swap is the one place a role is selected by a custom property rather than
a class: CSS cannot swap a class from a variable, so the four members are
indirected through `--ds-field-font-*`. It is still one role per node.

**To resolve properly:** add a Density axis to the Semantics collection, or ship
`input.compact.*` paths as the outgoing system did.

**Blast radius:** every field, card and section gap under compact.

---

### ⚠️ G-18 — No responsive typography

**Requested:** Keep the mobile type ramp — the two largest headings step down and
the body role steps up below 640px.

**Blocked by:** the 14 roles are fixed-size. The contract has no viewport axis.

**Applied instead:** a `@media (max-width: 640px)` block in the role-adoption
section of `components.css` that **re-binds selectors to a different role**. All 14
role definitions stay immutable.

The obvious implementation is wrong and worth recording. Re-pointing the variables —
`--ds-typography-heading-lg-font-size: var(--ds-typography-heading-md-font-size)` —
looks right and steps the heading down **twice**: custom properties substitute
lazily against the final value in the scope, and the same block has already moved
`heading-md` to `heading-sm`. Re-binding sidesteps it and is the better reading of
"apply the role whole" anyway. It also puts the three `body-lg` roles to work,
which the contract otherwise leaves unused.

**To resolve properly:** add a Desktop/Mobile axis to the typography collection, or
sanction role re-binding as the pattern.

**Blast radius:** the page title, every card title, and all body copy below 640px.

---

### ⚠️ G-25 — Warning has one level; this form needs two

**Requested:** Two warning tones — a standing caution (`.note`) and a
stop-before-you-do-this (`.note.warn`).

**Blocked by:** Finlink aliases only yellow for warning. Orange exists as a
primitive but is **orphaned** — §4.1 marks it "no semantic alias", and G-08 says an
orphan should either get a role or be deprecated.

**Applied instead:** `warning-strong` in `tokens.ext.css`, consuming
`orange/100` and `orange/500`. This is one of the two resolutions the contract
itself proposes for an orphan, so it is a proposal rather than an invention. Both
tones keep `text.neutral.bold` on a subtle fill and a headline that says the same
thing in words, per §8.1.3 — the tone is never the only signal.

**To resolve properly:** author `color.background.warning-strong.*` and
`color.border.warning-strong.*` against the orange ramp, or accept a single warning
level and collapse the two notes.

**Blast radius:** the two callout tones.

---

### ⚠️ G-15 — No elevation tokens

**Requested:** Depth for the tooltip, the modal and the mobile nav panel.

**Blocked by:** no shadow tokens exist. §9.2 offers a single hardcoded two-layer
shadow as the interim.

**Applied instead:** the four-step elevation scale carried over from
BETA-Foundations, in `tokens.ext.css` — geometry plus a per-appearance colour,
composed with pure `var()` so the shadow follows the theme. This is deliberately
*better* than the contract's interim: real tokens with a theme-following colour
beat one hardcoded value, and downgrading working tokens to a literal would have
been a regression dressed up as compliance.

**To resolve properly:** add `shadow.raised` / `overlay` / `sunken`.

**Blast radius:** tooltip, modal, mobile nav panel.

---

### ⚠️ G-23 — No focus ring geometry

**Requested:** The field's focus halo.

**Blocked by:** G-01 covers the missing focus *colour*. There is also no ring
width and no soft-shadow primitive — the contract's border-width scale is 0/1/2/4
and the ring here is 3px.

**Applied instead:** `--ds-focus-ring-width: 3px` and `--ds-focus-glow` in
`tokens.ext.css`, mixed from `border.brand.bold.default` with `color-mix()` so it
follows any re-theme. The glow **is** the focus state on a field — a halo, not a
second edge; an accent border would read as a second line under the keyboard ring.

Note the contract's generic §8.6 focus rule is deliberately **not** used:
`components.css` already covers 14 focusable selectors, moves the ring to the
wrapper on `.with-unit`, and keeps the tooltip open on keyboard focus. Adding the
generic rule on top would double up.

**To resolve properly:** add `color.border.focus.default`, a focus ring width, and
a focus glow.

---

### ⚠️ G-20 — No overlay / scrim token

**Requested:** The `<dialog>` backdrop.

**Blocked by:** no scrim token in any layer.

**Applied instead:** `--ds-surface-overlay: rgba(0, 0, 0, 0.5)` (0.7 in dark),
carried over. One of the few raw values in `tokens.ext.css`.

**To resolve properly:** add `color.background.overlay`, or an opacity-plus-colour
pair the build can compose.

---

### ⚠️ G-22 — No 14px heading role

**Requested:** The sub-head, applicant title and sub-card head — 14px, heavier
than body, structurally headings.

**Blocked by:** `heading.xs` is 12px. There is no 14px heading; §4.3 even warns
that `heading.xs` and `body.sm` are the same size and to prefer `body.sm` for
anything that is not structurally a heading.

**Applied instead:** `body-md-strong` (14px / 600). Visually right, semantically a
body role doing a heading's job. Extends G-16.

**To resolve properly:** author `typography.heading.xxs` at 14/20, or accept that
14px headings are body-strong.

---

### ⚠️ G-21 — No accessible link colour

**Requested:** A link colour distinguishable from body text.

**Blocked by:** the outgoing system used `#0857C3`, which passes AA. Finlink's
nearest is `text.info.bold` `#4B7BEC` at 3.93:1 on white — large-text only. §9.2's
interim (neutral text plus an underline) removes the colour affordance entirely,
which on a form this dense is a real loss.

**Applied instead:** `text.brand.bold.default`, which the contrast pass moves to
`teal/700` — **5.32:1, passing**. Links are teal rather than blue now. Hover is
`text.brand.bold.hovered`, which post-fix is the same `teal/700`, so **link hover
is currently a no-op** — the same collapse as G-24.

**To resolve properly:** author `color.text.link.*` against a blue with a 600/700
step, and give it a distinct hover.

**Blast radius:** every link and `.link-btn`.

---

### ⚠️ G-02 — Line-height ratios below 1.5, two of them very tight

**Requested:** Body copy and headings that survive the 1.4.12 text-spacing override.

**Blocked by:** all three body roles are authored below 1.5 (1.375 / 1.4286 /
1.3333), and `heading.lg` sits at **1.0769** with `heading.md` at **1.1**. Authoring
below 1.5 is legal; the layout must survive a user forcing it.

**Applied instead:** line-height is emitted as a **unitless ratio**, not px, so
user zoom and text-spacing overrides compose correctly. No text container in
`components.css` has a fixed `height` — the field uses `min-height`, and the
textarea grows.

Two knock-on effects of accepting the contract's scale, both shipped:
`heading.lg`'s line box drops from 32px to 28px, and the field's value line box
from 24px to 22px. Three layout values derived from a role's line box now multiply
`font-size × line-height` rather than reading a px token.

**To resolve properly:** add a 24px line-height step and re-map
`body.lg`→24, `heading.lg`→32, `heading.md`→28, as §9.1 proposes.

---

### ⚠️ G-06 — No tabular-figures token

**Applied instead:** `.ds-numeric` (§6.4), defined in `tokens.css` and adopted by
`.input.num`, `.with-unit .input` and `.ref-id` — every money field and the
reference number. Non-negotiable in a Selbstauskunft.

**To resolve properly:** add `font.fontVariantNumeric.tabular`.

---

### ⚠️ G-09 — Roboto 600 was not being loaded

**Blocked by:** all six `*-strong` roles are weight 600. `index.html` requested
`wght@400;500;700` — so every strong role was being synthesised or snapped.

**Applied instead:** `600` added to the Google Fonts request. **Verify in the
browser that 600 is a real instance and not synthetic** before this is considered
closed.

---

### ⚠️ G-16 — No label, caption, code, link, overline or display roles

**Applied instead:** labels and help text take `body-md-medium` and
`body-sm-default` per §9.2. `font.family.mono` and `font.textdecoration.underline`
remain unused. No type above 30px is needed here.

---

### ⚠️ G-26 — A hover token doing a resting job

**Requested:** An ink one step darker than `text.neutral.bold.default` for the
title of the opening card, which carries the page's first question.

**Blocked by:** `grey.950` exists in the semantic layer only as
`text.neutral.bold.hovered`. There is no resting token at that step — the bold
prominence tops out at `grey.900` for `default`.

**Applied instead:** `text.neutral.bold.hovered`, guarded to the light appearance
(in dark, `grey.950` is the page, not ink). This is an improvement on what it
replaced — the outgoing build reached straight past the semantic layer to the
`--neutral-950` primitive — but a hover token used at rest is still a smell: any
future re-theme that changes what "hovered" means will move a resting title.

Field labels used to be darkened alongside the title. They are
`text.neutral.subtle.default` now, which would have made this a three-step jump
and left the first card's labels visibly unlike every other card's, so only the
title keeps the ink.

**To resolve properly:** add a resting step at `grey.950` — `text.neutral.strongest`,
or a `text.neutral.bold.pressed` that the bold prominence is currently missing
(`background`, `border` and `icon` all have `pressed`; `text` does not).

**Blast radius:** one selector today, but the missing `text.*.pressed` state is
systemic — no text token anywhere has a pressed state.

## Resolved during the migration — no longer gaps

| ID | Outcome |
|---|---|
| **G-11** | Grey ramp named `grey` in `tokens/finlink-core.json`, matching the alias paths. The stale `codeSyntax` spelling never enters the build. |
| **G-12** | The `space` group uses clean keys (`0`, `4`, `8` …), the contract's own proposed fix, applied at source. No generator special-case needed. |
| **G-19** | *Not a gap.* The shipping appearance ("grey") wants page-grey and cards-white, which maps onto Finlink's two neutrals exactly. The vestigial `data-appearance="light"` scheme — which did need a third level — was dropped; it had not been offered as a switch for some time. |
| **G-03** | Avoided, not fixed. `background.neutral.bold.*` is still identical to `subtle.*` and is never referenced; nothing pairs it with `text.neutral.inverse`. |
| **G-07** | Accepted as designed. Spacing is consumed from the public `--ds-spacing-*` alias. |
| **G-13** | Documented. `--_ds-` is private and `--ds-` public, and `build-tokens.py` now **fails the build** if a primitive is named in `components.css`, `index.html` or `app.js`. |
| cyan / `feedback.notification` | Dropped. Unused, and absent from Finlink. |

## Out of scope

Contract §6 (React, TypeScript, `<Text>`, `<Button>`) and §11 (Stylelint, ESLint,
CI) prescribe a stack this repository does not have — V5 is static HTML, CSS and
vanilla JS with no build step beyond `build-tokens.py`. Their intent is carried
instead by the role-adoption section in `components.css`, and by the three checks
`build-tokens.py` runs on every build: stale output, dangling `var()` references,
and private-token leaks.
