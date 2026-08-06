/* ============================================================================
   V4 behaviour. Declarative: the markup says what depends on what, this file
   just wires it up. Adding a conditional needs no change here.

     data-controls="#id" data-show-when="Ja"   trigger opens the reveal with that id
     data-show-when="Ja"  (no data-controls)   trigger opens its own nested .reveal
     data-show-when="A|B"                      any of these answers opens it
     select[data-switch="#id"]                 one block per answer, in that container:
       > .reveal[data-when="A|B"]              a case, open while an answer matches it
     .object-section[data-for]                 mutually exclusive finance-type section
     .nav a.object-nav[data-navfor]            nav entry for the above
   ========================================================================== */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  let uidCounter = 0;
  const uid = (prefix) => `${prefix}-${++uidCounter}`;

  /* The control a .field wraps, in every shape one can take. Named once because
     four places need exactly the same answer: the label link, the help link, the
     review read-back and the value formatting. */
  const CONTROL_SEL = ':scope > .input, :scope > .select, '
    + ':scope > .with-unit > .input, :scope > .select-wrap > .select';

  /* The same trash glyph the repeatable templates carry inline, for the remove buttons
     that are built in script instead — keep the two in step. */
  const TRASH_ICON = '<svg class="ico-trash" viewBox="0 0 20 20" fill="none" '
    + 'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
    + 'stroke-linejoin="round" aria-hidden="true"><path d="M4 6h12M8 6V4.6a1 1 0 0 1 '
    + '1-1h2a1 1 0 0 1 1 1V6M6.4 6l.6 9.4a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9L13.6 6M8.7 '
    + '9v4.6M11.3 9v4.6"/></svg>';

  /* A reveal clips its overflow while its row height animates; once it is fully open the
     clip has to go, or it slices the focus glow off the fields inside — see .reveal.settled.
     The wait is read from the computed transition, so the CSS keeps owning the duration,
     and a reveal that never animates — opened during hydration, or with motion switched
     off — settles on the first tick instead of staying clipped for good. The extra frame
     is what a transitionend would have cost anyway: the transition starts one frame after
     the class lands. */
  const settleTimers = new WeakMap();
  const settleReveal = (el) => {
    clearTimeout(settleTimers.get(el));
    const ms = (parseFloat(getComputedStyle(el).transitionDuration) || 0) * 1000;
    settleTimers.set(el, setTimeout(() => requestAnimationFrame(() => {
      if (el.classList.contains('open')) el.classList.add('settled');
    }), ms));
  };

  const openReveal = (el, open) => {
    if (!el) return;
    el.classList.toggle('open', open);
    if (open) settleReveal(el);
    else {
      // the clip has to be back for the whole closing animation
      clearTimeout(settleTimers.get(el));
      el.classList.remove('settled');
    }
  };

  /* ------------------------------------------------------------- hydration */

  /* Templates and cloned panels ship without ids, because ids have to be
     unique per instance. Everything that needs one gets it here, so a
     screen reader never meets an unlabelled control. */
  function hydrate(root) {
    // give every radio group its own name, or the copies would share a selection
    $$('.choices', root).forEach((choices) => {
      const radios = $$('input[type="radio"]', choices);
      if (radios.length && !radios[0].name) {
        const name = uid('radios');
        radios.forEach((r) => { r.name = name; });
      }
    });

    // label -> control association
    $$('.field', root).forEach((field) => {
      const label = field.querySelector(':scope > label');
      if (label && !label.htmlFor) {
        const control = field.querySelector(CONTROL_SEL);
        if (control) {
          if (!control.id) control.id = uid('ctl');
          label.htmlFor = control.id;
        }
      }

      // role="group" needs an explicit label reference — it has no <legend>
      const groupLabel = field.querySelector(':scope > .group-label');
      if (groupLabel && field.getAttribute('role') === 'group' && !field.getAttribute('aria-labelledby')) {
        if (!groupLabel.id) groupLabel.id = uid('lbl');
        field.setAttribute('aria-labelledby', groupLabel.id);
      }
    });

    linkHelp(root);
    buildHelpIcons(root);
    wireConditionals(root);
    wireAmountRows(root);
    wireRemovers(root);
    wireCurrency(root);
  }

  /* A field's helper text is what its aria-describedby has to point at. The static
     markup writes that link by hand, but a repeatable template cannot: the id it would
     reference has to be unique per copy. So the link is made here instead, once per
     instance, and a field that already declares it is left alone. */
  function linkHelp(root) {
    $$('.field > .help', root).forEach((help) => {
      const field = help.parentElement;
      const control = field.querySelector(CONTROL_SEL);
      if (!control) return;
      if (!help.id) help.id = uid('help');
      const described = (control.getAttribute('aria-describedby') || '')
        .split(/\s+/).filter(Boolean);
      if (described.includes(help.id)) return;
      control.setAttribute('aria-describedby', [...described, help.id].join(' '));
    });
  }

  /* Every helper text also gets an icon + tooltip built next to its label, for the
     "Icon" helper-text mode. The paragraph itself stays put — it is what the field's
     aria-describedby points at — and the bubble is a visual duplicate, so it is
     hidden from the accessibility tree to avoid reading the same text twice. */
  function buildHelpIcons(root) {
    $$('.field > .help', root).forEach((help) => {
      const field = help.parentElement;
      // A group whose label is a section heading standing above it — "Weitere
      // Einkommensarten" over its amount list — has nothing to hang the icon on
      // inside the field, so follow the reference the group already carries.
      const labelledBy = field.getAttribute('aria-labelledby');
      const label = field.querySelector(':scope > label, :scope > .group-label')
        || (labelledBy ? document.getElementById(labelledBy.split(/\s+/)[0]) : null);
      // a clone arrives with the icon already in place
      if (!label || label.querySelector('.info-wrap[data-generated]')) return;

      const text = help.textContent.trim();
      if (!text) return;

      if (!help.id) help.id = uid('help');
      const name = label.textContent.replace('*', '').trim();

      const wrap = document.createElement('span');
      wrap.className = 'info-wrap';
      wrap.dataset.generated = '';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'info-btn';
      button.textContent = 'i';
      button.setAttribute('aria-label', `Erläuterung zu ${name}`);
      button.setAttribute('aria-describedby', help.id);

      const bubble = document.createElement('span');
      bubble.className = 'info-bubble';
      bubble.setAttribute('aria-hidden', 'true');
      bubble.textContent = text;

      wrap.append(button, bubble);
      label.appendChild(wrap);
    });
  }

  /* --------------------------------------------------------- conditionals */

  /* The reveal a trigger owns: an explicit target via data-controls, otherwise
     the nearest .reveal nested inside the trigger's own field. */
  function revealFor(trigger, field) {
    if (trigger.dataset.controls) return $(trigger.dataset.controls);
    return field ? field.querySelector(':scope > .reveal') : null;
  }

  /* One answer opens a reveal, but so does a whole class of them: "Angestellt" and
     "Beamtin / Beamter" both mean there is an employer to ask about, and they want the
     same block of fields. Every "when" list is therefore "|"-separated, which a single
     answer is just the one-item case of. Not a comma, because the answers themselves
     contain punctuation. */
  const matchesAny = (list, value) => list.split('|').includes(value);

  function wireConditionals(root) {
    // radio groups: the trigger is the .field wrapper (it carries the dataset).
    // Only the trigger's own .choices may answer for it — a group nested inside the
    // reveal bubbles its change through here too, and its "Nein" would otherwise
    // shut the very reveal it lives in.
    $$('.field[data-show-when]', root).forEach((field) => {
      if (field.dataset.wired) return;
      field.dataset.wired = '1';
      const reveal = revealFor(field, field);
      const own = field.querySelector(':scope > .choices') || field;
      field.addEventListener('change', (event) => {
        if (event.target.type !== 'radio' || !own.contains(event.target)) return;
        openReveal(reveal, matchesAny(field.dataset.showWhen, event.target.value));
      });
      // honour a checked-by-default radio
      const checked = own.querySelector('input[type="radio"]:checked');
      if (checked) openReveal(reveal, matchesAny(field.dataset.showWhen, checked.value));
    });

    // selects
    $$('select[data-show-when]', root).forEach((select) => {
      if (select.dataset.wired) return;
      select.dataset.wired = '1';
      const reveal = revealFor(select, select.closest('.field'));
      select.addEventListener('change', () =>
        openReveal(reveal, matchesAny(select.dataset.showWhen, select.value)));
      openReveal(reveal, matchesAny(select.dataset.showWhen, select.value));
    });

    wireSwitches(root);
  }

  /* A dropdown where the answer decides not whether a block is asked but which one:
     the employment status brings an employer, a company, a pension or nothing at all.
     Each block is a .reveal[data-when] inside the container data-switch points at, and
     only the matching one is ever open — the same shape as the finance-type sections,
     but declarative, so a further case is a further div rather than a line in here. An
     answer with nothing left to ask ("Hausfrau / Hausmann") simply has no case.

     Closing the others rather than leaving them is the point: a field inside a closed
     reveal is not asked for, so it drops out of the counter and out of the submit
     check the moment the answer moves on — see isAsked. */
  function wireSwitches(root) {
    $$('select[data-switch]', root).forEach((select) => {
      if (select.dataset.wiredSwitch) return;
      select.dataset.wiredSwitch = '1';
      const container = $(select.dataset.switch);
      if (!container) return;
      const cases = $$(':scope > .reveal[data-when]', container);
      const sync = () => cases.forEach((branch) =>
        openReveal(branch, matchesAny(branch.dataset.when, select.value)));
      select.addEventListener('change', sync);
      sync();
    });
  }

  /* ---------------------------------------------------------- amount rows */

  /* A position in an amount list is a checkbox, not a radio: several of them apply at
     once and each is independently given up again, which is exactly what a radio
     group cannot express. It wears the radio ring from .choice because that is the
     mark the design calls for.

     Picking one exposes the figure beside it; giving it up hides the figure AND
     clears it, or an amount nobody claims any more would still be submitted.
     `data-inactive` on the cell is the single hook the counter and the submit check
     read — see isAsked. */
  function syncAmountRow(row) {
    const toggle = row.querySelector(':scope > .choice > input');
    const cell = row.querySelector(':scope > .amount-cell');
    const input = cell.querySelector('.input');

    if (toggle.checked) {
      delete cell.dataset.inactive;
      return;
    }
    cell.dataset.inactive = '';
    input.value = '';
    // an error left showing on a field nobody can see any more
    cell.classList.remove('invalid');
    input.setAttribute('aria-invalid', 'false');
  }

  function wireAmountRows(root) {
    $$('.amount-row', root).forEach((row) => {
      if (row.dataset.wired) return;
      row.dataset.wired = '1';
      const toggle = row.querySelector(':scope > .choice > input');
      const cell = row.querySelector(':scope > .amount-cell');
      const input = cell.querySelector('.input');

      // A mandatory position is still listed, and still ticked, but cannot be given
      // up. Cancelling the click covers the keyboard too — space fires one as well.
      // The click still lands somewhere: the position is picked, so the caret goes
      // where the answer is missing rather than nowhere at all.
      toggle.addEventListener('click', (event) => {
        if (!('locked' in toggle.dataset)) return;
        event.preventDefault();
        input.focus();
      });

      /* Ticking the box is a decision in its own right, so it ends any provisional
         state the row was in — see below. It also hands the caret straight to the
         figure: picking a position is only half an answer, and being dropped into the
         field that holds the other half saves aiming at a 200px target next to the
         one just hit. Nothing is skipped by going there, since the amount is the next
         stop in the tab order anyway. */
      toggle.addEventListener('change', () => {
        delete row.dataset.provisional;
        syncAmountRow(row);
        if (toggle.checked) input.focus();
      });

      // Going for the figure is itself a way of picking the position: someone who
      // reaches into the Betrag field has already decided the item applies, so the
      // toggle follows instead of making them tick it first and aim twice.
      //
      // Pointerdown and typing, deliberately not focus: focus would tick every row
      // the keyboard merely passes through on the way down the list, so a tab-through
      // would claim the lot. Both entry points that carry intent are covered — the
      // pointer landing on the field, and the first character typed into it.
      const pick = () => {
        if (toggle.checked) return;
        toggle.checked = true;
        // Picked on the strength of a click, which is a weaker signal than ticking the
        // box: the row is provisional until it actually holds a figure.
        row.dataset.provisional = '';
        syncAmountRow(row);
      };
      cell.addEventListener('pointerdown', pick);
      input.addEventListener('input', pick);

      /* Leaving a provisional row empty takes the pick back. Clicking into a Betrag
         field and moving on without typing anything is how someone browses the list,
         not how they claim a position — and left ticked it would stand there as a red
         Pflichtfeld the user never asked for. A figure entered settles the row: from
         then on it is picked like any other, so emptying it again reports the missing
         amount instead of quietly dropping the position. */
      input.addEventListener('blur', () => {
        if (!('provisional' in row.dataset)) return;
        if (input.value.trim()) { delete row.dataset.provisional; return; }
        delete row.dataset.provisional;
        toggle.checked = false;
        syncAmountRow(row);
      });

      syncAmountRow(row);
    });
  }

  /* ------------------------------------------------------- confirm deleting */

  const confirmDialog = $('#confirm-dialog');

  /* Anything that cannot be taken back asks first: removing a person or a child
     throws away everything typed into them, and sending closes the form for good.
     One dialog element, retitled per case — the browser owns Esc, the focus trap
     and the backdrop.

     `tone` is the class on the confirming button, and it is a real decision rather
     than decoration: red has to mark destruction, so sending — which produces
     something rather than losing it — takes the primary button instead. */
  function confirmAction({ title, text, action = 'Löschen', tone = 'danger' }) {
    return new Promise((resolve) => {
      $('#confirm-title').textContent = title;
      $('#confirm-text').textContent = text;
      $('#confirm-ok').textContent = action;
      $('#confirm-ok').className = `btn ${tone}`;
      confirmDialog.returnValue = '';   // Esc closes without touching it
      confirmDialog.addEventListener('close', function done() {
        confirmDialog.removeEventListener('close', done);
        resolve(confirmDialog.returnValue === 'ok');
      });
      confirmDialog.showModal();
    });
  }

  function wireRemovers(root) {
    $$('[data-remove]', root).forEach((button) => {
      if (button.dataset.wired) return;
      button.dataset.wired = '1';
      button.addEventListener('click', async () => {
        const row = button.closest('.child-row, .subcard');
        if (!row) return;

        /* Every delete asks, whether the row holds anything or not. A trash glyph sits
           right beside the fields it would throw away and there is no undo, so the
           question is worth one extra click even on a row that looks empty — what looks
           empty from the outside is not the user's own reading of it.

           data-confirm carries the noun for the prompt, data-confirm-article the
           demonstrative it takes: German wants "dieser Immobilie" where it wants
           "diesem Darlehen". */
        const noun = button.dataset.confirm || 'Eintrag';
        const article = button.dataset.confirmArticle || 'diesem';
        if (!await confirmAction({
          title: `${noun} löschen?`,
          text: `Alle eingegebenen Informationen zu ${article} ${noun} werden `
            + 'gelöscht. Das kann nicht rückgängig gemacht werden.',
        })) return;

        const list = row.parentElement;
        row.remove();
        if (list && list.id === 'stellplaetze') renumberStellplaetze();
        if (list && list.id === 'kredite-liste') renumberKredite();
        if (list && list.id === 'immobilien-liste') renumberImmobilien();
        if (list && list.classList.contains('darlehen-liste')) renumberDarlehen(list);
        if (list && list.classList.contains('kinder-list')) syncKinderAdd();
        touched();
      });
    });
  }

  /* ------------------------------------------------------ German currency */

  /* German input is 1.234,56 but people paste 1234.56 too, so a lone dot is
     ambiguous. Read it as a thousands separator only when it is followed by
     exactly three digits (1.234), otherwise as a decimal point (3450.5). */
  function parseAmount(raw) {
    let text = raw.trim().replace(/[\s\u00a0€]/g, '');
    if (text.includes(',')) {
      text = text.replace(/\./g, '').replace(',', '.');
    } else if (/^-?\d{1,3}(\.\d{3})+$/.test(text)) {
      text = text.replace(/\./g, '');
    }
    const value = Number.parseFloat(text.replace(/[^\d.-]/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  function wireCurrency(root) {
    $$('.with-unit', root).forEach((wrap) => {
      const unit = wrap.querySelector('.unit');
      const input = wrap.querySelector('.input');
      if (!input || !unit || unit.textContent.trim() !== '€' || input.dataset.wired) return;
      input.dataset.wired = '1';
      input.addEventListener('blur', () => {
        if (!input.value.trim()) return;
        const value = parseAmount(input.value);
        if (value === null) return;
        input.value = value.toLocaleString('de-DE',
          { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      });
    });
  }

  /* ---------------------------------------------- collapsible cards */

  /* A required control counts towards its card whether or not the card is open, but
     NOT while it sits in a closed conditional or an inactive finance-type section —
     the form is not asking for it yet. Deliberately not an offsetParent test, which
     would also discount every field in a collapsed card. [data-inactive] is the same
     idea for a control switched off in place rather than revealed — an amount whose
     position has not been ticked. */
  const isAsked = (control) => !control.closest('.reveal:not(.open), [data-inactive]');

  /* The form has five collapsible steps. Everything the sidebar lists under one of
     them is a .subsection inside it, and a sub-section is not a step of its own: it
     follows the card it lives in, so expanding a card never leaves a row of shut
     sub-headers to click through. Its own toggle is only there to fold a part that is
     done back out of the way — which is why the state propagates downwards but never
     up. Sub-sections do not nest further, so the recursion is one level deep. */
  function setCardOpen(card, open) {
    const toggle = card.querySelector(':scope > .card-head > .card-toggle');
    // The summary and the confirmation are built from the same card, minus the
    // toggle: they are always open, so there is no state to write and nothing to
    // announce. Guarded here rather than at every call site, since revealCard
    // walks whatever chain of cards it is handed.
    if (!toggle) return;
    card.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    if (!open) delete card.dataset.settled;
    $$('.subsection', card).forEach((sub) => setCardOpen(sub, open));
  }

  function wireCards() {
    $$('.card').forEach((card) => {
      const toggle = card.querySelector(':scope > .card-head > .card-toggle');
      const body = card.querySelector(':scope > .card-body');
      if (!toggle || !body) return;   // .card-static — see setCardOpen

      toggle.addEventListener('click', () =>
        setCardOpen(card, card.dataset.open !== 'true'));

      // overflow clipping is only needed while the height animates. A sub-section's
      // own transitionend bubbles up through here, and it says nothing about whether
      // the card around it has finished growing — only this body's does.
      body.addEventListener('transitionend', (event) => {
        if (event.target !== body) return;
        if (event.propertyName === 'grid-template-rows' && card.dataset.open === 'true') {
          card.dataset.settled = 'true';
        }
      });
      if (card.dataset.open === 'true') card.dataset.settled = 'true';
    });
  }

  /* Opens every card a node lives in — the step AND the sub-section inside it, since
     either can be shut on its own — so focusing the node can never land on something
     hidden. Used by the nav and by the submit check. */
  function revealCard(node) {
    const cards = [];
    for (let card = node && node.closest('.card'); card;
         card = card.parentElement && card.parentElement.closest('.card')) {
      cards.unshift(card);
    }
    cards.forEach((card) => { if (card.dataset.open !== 'true') setCardOpen(card, true); });
    return cards[cards.length - 1] || null;
  }

  /* ------------------------------------------------------ Start-Kaskade */

  const zweck = $('#zweck');
  const gefunden = $('#gefunden');

  const SECTION_FOR = {
    'neubau-bautraeger': 'neubau',
    'bauvorhaben': 'neubau',
    'modernisierung': 'modernisierung',
    'anschluss': 'anschluss',
    'kapitalbeschaffung': 'kapital',
  };

  function updateStart() {
    const purpose = zweck.value;
    const found = (gefunden.querySelector('input:checked') || {}).value;
    // A concrete object exists for new-builds and own projects outright, and for
    // a purchase only once the buyer has actually found the property.
    const objectKnown = purpose === 'neubau-bautraeger' || purpose === 'bauvorhaben' ||
      (purpose === 'kauf' && found === 'Ja');

    openReveal($('#c-gefunden'), purpose === 'kauf');
    openReveal($('#c-immobilienart'), objectKnown);
    openReveal($('#c-nutzung'), objectKnown);

    let key = SECTION_FOR[purpose] || null;
    if (purpose === 'kauf') key = found === 'Ja' ? 'immobilie' : null;

    $$('.object-section').forEach((s) => openReveal(s, s.dataset.for === key));
    /* The five object sub-sections all live in one card now, so with no object known
       the card has nothing left to show and goes away with them — an empty
       "Finanzierungsobjekt" header would otherwise sit there expanding into nothing.
       Its nav entry is an .object-nav without a data-navfor: it stands for whichever
       object applies, so it shows whenever any of them does. */
    $('#objekt').hidden = !key;
    $$('.nav a.object-nav').forEach((a) => a.classList.toggle('show',
      'navfor' in a.dataset ? a.dataset.navfor === key : !!key));
  }

  /* -------------------------------------------------------- Antragsteller */

  let applicantCount = 1;

  function refreshTitles(number) {
    const panel = $(`.applicant[data-applicant="${number}"]`);
    if (!panel) return;
    const value = (role) => {
      const input = panel.querySelector(`[data-role="${role}"]`);
      return input ? input.value.trim() : '';
    };
    const name = `${value('vorname')} ${value('nachname')}`.trim();
    $$(`.applicant[data-applicant="${number}"] .applicant-title`).forEach((el) => {
      el.textContent = `Antragsteller ${number}` + (name ? ` – ${name}` : '');
    });
    // The sidebar entry for the Antragsteller step picks up person 1's first name once
    // it is known, so a form filled for two people is easier to place at a glance.
    if (number === 1) {
      const first = value('vorname');
      $('#person-group-title').textContent =
        first ? `Antragsteller · ${first}` : 'Antragsteller';
    }
  }

  /* Applicant 2 is a copy of applicant 1's markup. Every id and every reference
     to one is suffixed so the copy stays independently labelled, and the
     autocomplete tokens move into their own section so browsers do not offer
     person 1's details for person 2. */
  function cloneApplicant(container) {
    const source = container.querySelector('.applicant[data-applicant="1"]');
    const copy = source.cloneNode(true);
    const suffix = `-a2-${container.dataset.applicants}`;

    copy.dataset.applicant = '2';
    $$('[id]', copy).forEach((el) => { el.id += suffix; });
    $$('label[for]', copy).forEach((el) => { el.htmlFor += suffix; });
    ['aria-describedby', 'aria-labelledby'].forEach((attr) => {
      $$(`[${attr}]`, copy).forEach((el) => {
        el.setAttribute(attr, el.getAttribute(attr)
          .split(/\s+/).map((token) => token + suffix).join(' '));
      });
    });
    $$('input[name]', copy).forEach((el) => { el.name += suffix; });
    $$('[autocomplete]', copy).forEach((el) => {
      el.setAttribute('autocomplete', `section-antragsteller2 ${el.getAttribute('autocomplete')}`);
    });
    // ids inside the copy gained `suffix`, so the selectors that point at them must too
    $$('[data-controls]', copy).forEach((el) => { el.dataset.controls += suffix; });
    $$('[data-switch]', copy).forEach((el) => { el.dataset.switch += suffix; });

    // Applicant 2 starts blank — including which amount positions are picked. A
    // checkbox is cleared by unticking it, not by wiping its value; a locked one
    // is ticked by definition and stays that way.
    $$('input', copy).forEach((el) => {
      if (el.type === 'radio') el.checked = false;
      else if (el.type === 'checkbox') el.checked = 'locked' in el.dataset;
      else el.value = '';
    });
    $$('select', copy).forEach((el) => { el.selectedIndex = 0; });
    $$('.reveal', copy).forEach((el) => el.classList.remove('open', 'settled'));
    $$('[data-wired], [data-wired-switch]', copy).forEach((el) => {
      delete el.dataset.wired;
      delete el.dataset.wiredSwitch;
    });
    $$('.child-row', copy).forEach((el) => el.remove());

    const head = copy.querySelector('.applicant-head');
    head.querySelector('.applicant-title').textContent = 'Antragsteller 2';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'icon-btn';
    remove.setAttribute('aria-label', 'Antragsteller 2 entfernen');
    remove.innerHTML = TRASH_ICON;
    remove.addEventListener('click', requestRemoveApplicant2);
    head.appendChild(remove);

    container.appendChild(copy);
    hydrate(copy);
    wireNameEcho(copy);
  }

  function wireNameEcho(panel) {
    $$('[data-role]', panel).forEach((input) =>
      input.addEventListener('input', () => refreshTitles(Number(panel.dataset.applicant))));
  }

  /* The one way out of two applicants, wherever it is asked for: the trash button
     in the panel head and answering "Alleine" again both land here. It asks every time,
     like every other delete — person 2 is spread over one panel per card, so what the
     click throws away is never all on screen at once. Resolves false if the user
     backs out. */
  async function requestRemoveApplicant2() {
    if (!await confirmAction({
      title: 'Antragsteller 2 löschen?',
      text: 'Alle eingegebenen Informationen zu Antragsteller 2 werden '
        + 'gelöscht. Das kann nicht rückgängig gemacht werden.',
    })) return false;
    setApplicants(1);
    return true;
  }

  function setApplicants(count) {
    applicantCount = count;
    $$('[data-applicants]').forEach((container) => {
      const second = container.querySelector('.applicant[data-applicant="2"]');
      if (count === 2) {
        if (!second) cloneApplicant(container);
        container.classList.add('two');
      } else {
        if (second) second.remove();
        container.classList.remove('two');
      }
    });
    $('#add-applicant').hidden = count === 2;
    const picked = $(`#darlehensnehmer input[value="${count}"]`);
    if (picked) picked.checked = true;
    refreshTitles(1);
    refreshTitles(2);
    touched();
  }

  /* ------------------------------------------------- repeatable sub-groups */

  function addFromTemplate(templateId, list) {
    const node = $(`#${templateId}`).content.firstElementChild.cloneNode(true);
    list.appendChild(node);
    hydrate(node);
    return node;
  }

  function renumberStellplaetze() {
    $$('#stellplaetze .sp-title').forEach((title, index) => {
      title.textContent = `Stellplatz ${index + 1}`;
    });
  }

  /* Answering "Ja" already brings the first Kredit, so the button only ever adds a
     further one and says so — same wording rule as the children list and the loans
     under a property. It reads the list rather than counting clicks, so emptying it
     puts the first-entry wording back. */
  function renumberKredite() {
    $$('#kredite-liste .kredit-title').forEach((title, index) => {
      title.textContent = `Kredit ${index + 1}`;
    });
    $('#add-kredit').textContent = $('#kredite-liste').children.length
      ? '+ weiteren Kredit ergänzen'
      : '+ Kredit erfassen';
  }

  /* The add button is also the answer to "are there any?", so it says which of the two
     it is doing: the first entry, or a further one. Same wording rule as the children
     list, and it reads the list rather than counting clicks, so removing the last entry
     puts the question back. */
  function renumberImmobilien() {
    $$('#immobilien-liste .im-title').forEach((title, index) => {
      title.textContent = `Immobilie ${index + 1}`;
    });
    $('#add-immobilie').textContent = $('#immobilien-liste').children.length
      ? '+ Weitere Immobilie erfassen'
      : '+ Immobilie erfassen';
  }

  /* Loans belong to one property, so the numbering and the button are per list — the
     enclosing .subcard is that property, and its own add button is the only one in it. */
  function renumberDarlehen(list) {
    $$('.dl-title', list).forEach((title, index) => {
      title.textContent = `Darlehen ${index + 1}`;
    });
    list.closest('.subcard').querySelector('.add-darlehen').textContent =
      list.children.length ? '+ Weiteres Darlehen ergänzen' : '+ Darlehen erfassen';
  }

  /* ------------------------------------------------------------ save state */

  let saveTimer;
  const saveText = $('#save-text');

  function touched() {
    saveText.textContent = 'Änderungen werden gespeichert …';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const time = new Date().toLocaleTimeString('de-DE',
        { hour: '2-digit', minute: '2-digit' });
      saveText.textContent = `Als Entwurf gespeichert · ${time}`;
    }, 700);
  }

  /* ------------------------------------------------------------ validation */

  /* Inline, on blur, and never colour-only: the field gets a red border AND a
     message wired up with aria-describedby + aria-invalid. */
  function messageFor(field, control) {
    let message = field.querySelector(':scope > .error-text');
    if (!message) {
      message = document.createElement('p');
      message.className = 'error-text';
      message.id = uid('err');
      field.appendChild(message);
    }
    const described = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (!described.includes(message.id)) {
      control.setAttribute('aria-describedby', [...described, message.id].join(' '));
    }
    return message;
  }

  function validate(control) {
    const field = control.closest('.field');
    if (!field || field.closest('#states')) return true;   // the reference section is static

    const empty = !control.value.trim();
    // Required only counts while the form is actually asking: tabbing through an
    // amount whose position is not ticked must not leave a red Pflichtfeld behind.
    const invalid = control.required && empty && isAsked(control);

    field.classList.toggle('invalid', invalid);
    control.setAttribute('aria-invalid', String(invalid));
    if (invalid) {
      messageFor(field, control).textContent = 'Dieses Feld wird für den Antrag benötigt';
    }
    return !invalid;
  }

  /* A required choice group cannot carry `required`, so it needs its own check —
     without this the counter could read 5/6 while submit reported the form complete. */
  function validateGroup(group) {
    const ok = !!group.querySelector('input[type="radio"]:checked');
    group.classList.toggle('invalid', !ok);
    if (!ok) {
      let message = group.querySelector(':scope > .error-text');
      if (!message) {
        message = document.createElement('p');
        message.className = 'error-text';
        group.appendChild(message);
      }
      message.textContent = 'Bitte wählen Sie eine Option';
    }
    return ok;
  }

  /* ------------------------------------------------------------- nav state */

  function wireNav() {
    const links = $$('.nav a[href^="#"]');

    // A nav link has to open what it points at, or it would scroll to a closed card.
    // For a sub-section entry that means the step around it as well — revealCard walks
    // the whole chain, so both kinds of link are handled by the same line.
    links.forEach((link) => link.addEventListener('click', () => {
      revealCard(document.getElementById(link.getAttribute('href').slice(1)));
      setNavOpen(false);   // a no-op unless the list is the collapsed panel
    }));
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const sections = $$('main section[id]').filter((s) => byId.has(s.id));

    const observer = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((entry) => {
        links.forEach((a) => a.removeAttribute('aria-current'));
        byId.get(entry.target.id).setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach((section) => observer.observe(section));
  }

  /* ------------------------------------------------------- collapsed nav */

  /* Below 900px the section list lives behind the hamburger. Whether it is
     collapsed at all is the stylesheet's business — aria-expanded is the single
     switch, and above the breakpoint the panel is display:contents, so the
     attribute stays true-or-false without ever hiding anything. */

  const navToggle = $('.nav-toggle');

  const setNavOpen = (open) => navToggle.setAttribute('aria-expanded', String(open));

  function wireNavToggle() {
    navToggle.addEventListener('click', () =>
      setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true'));

    // An open panel covers the form, so anything aimed past it means "close" —
    // pointerdown rather than click, so the tap that closes it does not also land
    // on whatever was underneath.
    document.addEventListener('pointerdown', (event) => {
      if (!event.target.closest('.nav')) setNavOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || navToggle.getAttribute('aria-expanded') !== 'true') return;
      setNavOpen(false);
      navToggle.focus();   // Escape must not strand the focus inside a hidden panel
    });
  }

  /* --------------------------------------------------------------- toggles */

  const SETTINGS = ['appearance', 'density', 'help'];

  function wireToggles() {
    $$('.seg').forEach((group) => {
      const buttons = $$('button', group);
      buttons.forEach((button) => button.addEventListener('click', () => {
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        // the dataset key IS the html attribute: data-density -> data-density
        Object.entries(button.dataset).forEach(([key, value]) => {
          document.documentElement.setAttribute(`data-${key}`, value);
        });
        syncPreview();
      }));
    });
  }

  /* ------------------------------------------------------- mobile preview */

  /* The frame is an iframe of this same page rather than a narrowed column,
     because the breakpoints and the export's Mobile type are viewport rules: a
     box that is 390px wide is still on a 1400px viewport and would render the
     desktop values at a squeeze. Settings reach the copy inside by postMessage,
     so switching to dark or compact does not reload it and lose what is typed.
     postMessage rather than reaching into contentDocument: these prototypes are
     opened straight off disk, and a file:// page counts as a foreign origin to
     its own iframe. */

  const settings = () => Object.fromEntries(
    SETTINGS.map((k) => [k, document.documentElement.getAttribute(`data-${k}`)]));

  let frame = null;

  function syncPreview() {
    const on = document.documentElement.getAttribute('data-viewport') === 'mobile';
    if (!on) {
      if (frame) { frame.closest('.phone').remove(); frame = null; }
      return;
    }
    if (!frame) {
      const phone = document.createElement('div');
      phone.className = 'phone';
      frame = document.createElement('iframe');
      frame.title = 'Mobile Vorschau';
      // the settings ride along on the URL too, so the first paint inside the
      // frame is already in the right theme instead of flashing light first
      frame.src = `index.html?${new URLSearchParams({ embed: '1', ...settings() })}`;
      phone.append(frame);
      $('.app').append(phone);
      return;
    }
    frame.contentWindow.postMessage({ v4: settings() }, '*');
  }

  /* The copy inside the frame: take the settings off the URL, and keep taking
     them from the parent for as long as it is open. */
  function initEmbed() {
    const params = new URLSearchParams(location.search);
    if (!params.has('embed')) return;
    document.documentElement.setAttribute('data-embed', '');
    const apply = (values) => SETTINGS.forEach((key) => {
      if (values[key]) document.documentElement.setAttribute(`data-${key}`, values[key]);
    });
    apply(Object.fromEntries(params));
    window.addEventListener('message', (event) => {
      if (event.data && event.data.v4) apply(event.data.v4);
    });
  }

  /* ------------------------------------------------------- Absenden-Strecke */

  /* Three screens in one document — form, summary, sent — because the summary is
     read out of the form itself: a real page change would throw away everything
     typed. Exactly one view and its action bar are visible at a time. data-view on
     <html> is what the stylesheet reads, so the surroundings can react to the step
     (the sidebar's section list has nothing to point at once the form is off
     screen). */
  const VIEWS = {
    form:    { view: $('#main'),         bar: $('#bar-form') },
    summary: { view: $('#summary-view'), bar: $('#bar-summary') },
    sent:    { view: $('#sent-view'),    bar: $('#bar-sent') },
  };

  /* Show, then move the focus, then hide — in that order, and the order is the
     whole point. The button that got us here lives in the bar that is about to be
     hidden, and a browser that loses the focused element moves the focus back to
     the document *after* the current task, which would wipe a focus set before the
     hiding. Focus first and there is nothing left in the hidden view to lose.

     The heading takes it, so the step that just arrived is what gets read out and
     what the next Tab starts from. tabindex="-1" makes it focusable without putting
     it in the tab order; it is a heading and not a control, so it carries no ring
     (see .page-title:focus). */
  function showView(name) {
    const target = VIEWS[name];
    target.view.hidden = false;
    target.bar.hidden = false;

    const heading = target.view.querySelector('.page-title');
    heading.tabIndex = -1;
    heading.focus();

    Object.entries(VIEWS).forEach(([key, { view, bar }]) => {
      if (key === name) return;
      view.hidden = true;
      bar.hidden = true;
    });
    document.documentElement.setAttribute('data-view', name);
    window.scrollTo(0, 0);
  }

  /* Every required field the form is still waiting for, in the order they appear on
     the page — "the first one missing" has to mean first on the page, not first by
     kind. Scoped to the form view: the summary has required fields of its own, and
     they are not part of this count. */
  function formGaps() {
    const form = VIEWS.form.view;
    const controls = $$('.input[required], .select[required]', form).filter(isAsked);
    const groups = $$('.field[data-required]', form)
      .filter((g) => isAsked(g) && g.querySelector('input[type="radio"]'));

    return [
      ...controls.filter((c) => !validate(c)).map((c) => ({ node: c, focus: c })),
      ...groups.filter((g) => !validateGroup(g))
        .map((g) => ({ node: g, focus: g.querySelector('input[type="radio"]') })),
    ].sort((a, b) => (a.node.compareDocumentPosition(b.node)
      & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }

  /* Prüfliste ----------------------------------------------------------------- */

  /* A label without the parts that are there for the eye only: the required
     asterisk and the info icon, whose bubble carries the entire help text and would
     otherwise land in the middle of the read-back. */
  function labelText(node) {
    if (!node) return '';
    const copy = node.cloneNode(true);
    $$('.info-wrap, .req, .sr-only', copy).forEach((el) => el.remove());
    return copy.textContent.replace(/\s+/g, ' ').trim();
  }

  /* What one field says, as a question-and-answer pair — or null if it says
     nothing: not asked for (a closed conditional, an unticked position) or simply
     left empty. An empty field is left out rather than listed as blank; the point
     of the list is what was answered.

     The answer is read the way it is displayed, not the way it is stored: the text
     of the selected option rather than its value, and the unit box next to an
     amount is part of the figure. */
  function reviewEntry(field) {
    if (!isAsked(field)) return null;

    const control = field.querySelector(CONTROL_SEL);
    let value = '';

    if (control && control.matches('select')) {
      value = control.value ? labelText(control.selectedOptions[0]) : '';
    } else if (control) {
      value = control.value.trim();
      const unit = field.querySelector(':scope > .with-unit > .unit');
      if (value && unit) value += ` ${unit.textContent.trim()}`;
    } else {
      // a choice group: only its own chips answer for it, not a group nested in a
      // reveal underneath, which is a field of its own with its own entry
      value = $$(':scope > .choices input:checked', field)
        .map((input) => labelText(input.nextElementSibling)).join(', ');
    }
    if (!value) return null;

    // An amount cell has no label of its own — the position beside it is the label,
    // and the cell carries it as aria-label so a screen reader gets it too.
    const label = labelText(field.querySelector(':scope > label, :scope > .group-label'))
      || ((control && control.getAttribute('aria-label')) || '').trim();
    return label ? { label, value } : null;
  }

  /* Which repetition a field belongs to. Two fields called "Aktuelle Restschuld"
     under one heading are unreadable without it, and with two applicants the same
     goes for every single field. One applicant needs no crumb — there is nothing to
     tell apart. */
  function crumbFor(node) {
    if (node.matches('.applicant')) {
      const panels = node.closest('[data-applicants]');
      if (panels && !panels.classList.contains('two')) return '';
      return labelText(node.querySelector('.applicant-title'));
    }
    if (node.matches('.subcard')) {
      return labelText(node.querySelector(':scope > .subcard-head > span'));
    }
    return labelText(node.querySelector(':scope > .subsection-title')
      || node.querySelector(':scope > .card-head .card-title'));
  }

  /* The crumbs between a field and its step, outermost first: "Immobilie 1 ·
     Darlehen 2". Stops at the step, because that is the group's own heading. */
  function contextFor(field) {
    const crumbs = [];
    for (let node = field.parentElement; node; node = node.parentElement) {
      if (node.matches('.card') && !node.matches('.subsection')) break;
      if (node.matches('.applicant, .subcard, .subsection, .subsection-static')) {
        const crumb = crumbFor(node);
        if (crumb) crumbs.unshift(crumb);
      }
    }
    return crumbs.join(' · ');
  }

  function reviewGroup(card, rowsByContext) {
    const group = document.createElement('section');
    group.className = 'review-group';

    const title = labelText(card.querySelector(':scope > .card-head .card-title'));
    const head = document.createElement('div');
    head.className = 'review-head';

    const heading = document.createElement('h3');
    heading.className = 'review-title';
    heading.textContent = title;

    /* Correcting something is one click from where the mistake is seen, not a
       scroll back through the form: the button returns to the step it belongs to
       and opens it. A button and not a link — it changes the view, it does not go
       to an address. */
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'link-btn';
    edit.textContent = 'Bearbeiten';
    edit.setAttribute('aria-label', `${title} bearbeiten`);
    edit.addEventListener('click', () => editStep(card));

    head.append(heading, edit);
    group.append(head);

    rowsByContext.forEach((rows, context) => {
      if (context) {
        const crumb = document.createElement('p');
        crumb.className = 'review-context';
        crumb.textContent = context;
        group.append(crumb);
      }
      const list = document.createElement('dl');
      list.className = 'review-list';
      rows.forEach(({ label, value }) => {
        const term = document.createElement('dt');
        term.textContent = label;
        const answer = document.createElement('dd');
        answer.textContent = value;
        list.append(term, answer);
      });
      group.append(list);
    });

    return group;
  }

  /* The read-back is generated, never maintained: it walks the form the user just
     filled in, so a field added to the form appears here without a line of work.
     One group per step, and within a step the entries keep document order and are
     bundled by the repetition they sit in. The Feldzustände reference section is
     not part of the form, and a step switched off by the finance type is hidden —
     neither belongs in a summary of the answers. */
  function buildReview() {
    const host = $('#review');
    host.textContent = '';

    $$(':scope > .card', VIEWS.form.view).forEach((card) => {
      if (card.id === 'states' || card.hidden) return;

      const rowsByContext = new Map();
      $$('.field', card).forEach((field) => {
        const entry = reviewEntry(field);
        if (!entry) return;
        const key = contextFor(field);
        if (!rowsByContext.has(key)) rowsByContext.set(key, []);
        rowsByContext.get(key).push(entry);
      });

      if (rowsByContext.size) host.append(reviewGroup(card, rowsByContext));
    });

    if (!host.children.length) {
      const empty = document.createElement('p');
      empty.className = 'review-empty';
      empty.textContent = 'Es sind noch keine Angaben erfasst.';
      host.append(empty);
    }
  }

  function editStep(card) {
    showView('form');
    setCardOpen(card, true);
    card.scrollIntoView({ block: 'start' });
    const first = card.querySelector('.input, .select, .choice input');
    if (first) first.focus({ preventScroll: true });
  }

  /* Einwilligung und Versand -------------------------------------------------- */

  const consent = $('#consent-broker');
  const consentField = $('#consent-field');
  const mailKunde = $('#mail-kunde');
  const mailMakler = $('#mail-makler');
  const sendText = $('#send-text');

  /* Deliberately loose: an @ with a dot behind it. The prototype sends nothing, so
     anything stricter here is a promise it cannot keep — and real addresses are
     stranger at the edges than a tighter pattern believes. */
  const MAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateMail(input) {
    const field = input.closest('.field');
    const value = input.value.trim();
    const invalid = !MAIL_PATTERN.test(value);

    field.classList.toggle('invalid', invalid);
    input.setAttribute('aria-invalid', String(invalid));
    if (invalid) {
      messageFor(field, input).textContent = value
        ? 'Diese E-Mail-Adresse sieht nicht vollständig aus'
        : 'Für den Versand brauchen wir diese E-Mail-Adresse';
    }
    return !invalid;
  }

  /* The consent is a checkbox with no chip, so the error cannot be carried by a
     border the way it is on a choice group — it is a message under the sentence,
     wired to the box with aria-describedby like every other field error. */
  function validateConsent() {
    const ok = consent.checked;
    consentField.classList.toggle('invalid', !ok);
    if (!ok) {
      messageFor(consentField, consent).textContent =
        'Ohne diese Bestätigung dürfen wir die Angaben nicht an den Berater übermitteln';
    }
    return ok;
  }

  /* Who the confirmation email goes to, in words: the applicant's name if it is
     known, otherwise the neutral noun. Used in the sentence on the summary, so it
     has to read as part of it either way. */
  function customerName() {
    const first = ($('#a1-vorname').value || '').trim();
    const last = ($('#a1-nachname').value || '').trim();
    return `${first} ${last}`.trim();
  }

  function openSummary() {
    buildReview();
    $('#consent-customer').textContent = customerName() || 'der Kunde';
    sendText.textContent = 'Noch nicht gesendet — Sie können weiterhin ändern';
    showView('summary');
  }

  /* Format SA-JAHR-XXXXXX. The alphabet leaves out I, O, 0 and 1: the ID is read
     aloud and copied by hand, and those four are what gets confused doing it. In
     the real product the server issues it — here it stands for the fact that there
     is one, and shows what it looks like to write down. */
  const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function referenceId() {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const tail = Array.from(bytes, (n) => REF_ALPHABET[n % REF_ALPHABET.length]).join('');
    return `SA-${new Date().getFullYear()}-${tail}`;
  }

  /* Sent means gone: the form is not merely hidden, every control in it is switched
     off. Hiding alone would leave it a Tab-jump or a #-link away from being edited,
     and "you cannot change it any more" has to be true of the page, not just of the
     way out of it. */
  function lockForm() {
    [VIEWS.form.view, VIEWS.summary.view].forEach((view) =>
      $$('input, select, textarea, button', view)
        .forEach((el) => { el.disabled = true; }));
    VIEWS.form.bar.hidden = true;
    VIEWS.summary.bar.hidden = true;
  }

  async function send() {
    /* All three checks run, not just up to the first failure: someone who has to
       fix something should see everything that is missing at once. */
    const missing = [
      { ok: validateConsent(), focus: consent },
      { ok: validateMail(mailKunde), focus: mailKunde },
      { ok: validateMail(mailMakler), focus: mailMakler },
    ].filter((check) => !check.ok);

    if (missing.length) {
      sendText.textContent = 'Noch nicht gesendet — bitte ergänzen Sie das Markierte';
      missing[0].focus.focus();
      return;
    }

    const customer = customerName() || 'Der Kunde';
    if (!await confirmAction({
      title: 'Jetzt an den Berater senden?',
      text: `Danach können Sie die Selbstauskunft nicht mehr öffnen und nichts mehr `
        + `ändern. ${customer} erhält eine E-Mail zur eigenen Bestätigung, und Ihre `
        + `Referenz-ID senden wir an ${mailMakler.value.trim()}.`,
      action: 'Verbindlich senden',
      tone: 'primary',
    })) {
      sendText.textContent = 'Nicht gesendet — Sie können weiterhin ändern';
      return;
    }

    const reference = referenceId();
    $('#ref-id').textContent = reference;
    $('#sent-name').textContent = customerName() || 'Ihrem Kunden';
    $('#sent-mail-makler').textContent = mailMakler.value.trim();
    $('#sent-mail-kunde').textContent = mailKunde.value.trim();
    $('#copy-status').textContent = '';

    lockForm();
    showView('sent');
  }

  async function copyReference() {
    const reference = $('#ref-id').textContent.trim();
    const status = $('#copy-status');
    try {
      await navigator.clipboard.writeText(reference);
      status.textContent = `Referenz-ID ${reference} in die Zwischenablage kopiert`;
    } catch {
      /* The clipboard needs a permission that a page opened straight off disk often
         does not have. Then the ID is selected instead: Ctrl/Cmd+C is one keystroke
         away, and nothing is reported as done that did not happen. */
      const range = document.createRange();
      range.selectNodeContents($('#ref-id'));
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Bitte mit Strg+C bzw. Cmd+C kopieren — markiert ist sie schon';
    }
  }

  /* ------------------------------------------------------------------ init */

  hydrate(document);
  wireCards();
  wireToggles();
  wireNav();
  wireNavToggle();
  initEmbed();

  zweck.addEventListener('change', updateStart);
  gefunden.addEventListener('change', updateStart);
  updateStart();

  $$('.applicant[data-applicant="1"]').forEach(wireNameEcho);
  $('#add-applicant').addEventListener('click', () => setApplicants(2));
  /* Going back to "Alleine" deletes person 2 just as the trash button does, so it asks the
     same question — and if the answer is no the radio returns to where it was,
     because the choice it shows has to match the form underneath it.

     "Mit einer anderen Person" adds person 2 outright, and then opens the step the new
     panels landed in. The question is in Finanzbedarf but the panels are in
     Antragsteller, which is still collapsed at that point, so without this the answer
     would appear to do nothing. Only this entry point needs it — the
     "+ Antragsteller 2" button sits inside that card, which is therefore already open
     when it is pressed. */
  $$('#darlehensnehmer input[type="radio"]').forEach((radio) =>
    radio.addEventListener('change', async () => {
      if (radio.value === '2') {
        setApplicants(2);
        revealCard($('.applicant[data-applicant="2"]'));
        return;
      }
      if (!await requestRemoveApplicant2()) {
        const two = $('#darlehensnehmer input[value="2"]');
        if (two) two.checked = true;
      }
    }));

  const kinderList = $('.kinder-list');
  const kinderAdd = $('.kinder-add');

  /* Answering Ja already is the first child: it says there is one, so the row to
     fill in appears with the answer instead of behind another click. The button
     stays put above the list and only ever adds further children — it names that,
     and falls back to the first-child wording if every row is taken out again. */
  function syncKinderAdd() {
    kinderAdd.textContent = kinderList.children.length
      ? '+ Weiteres Kind hinzufügen'
      : '+ Kind hinzufügen';
  }

  kinderAdd.addEventListener('click', () => {
    addFromTemplate('tpl-kind', kinderList);
    syncKinderAdd();
  });

  $$('#kinder-toggle input[type="radio"]').forEach((radio) =>
    radio.addEventListener('change', () => {
      if (radio.checked && radio.value === 'Ja' && !kinderList.children.length) {
        addFromTemplate('tpl-kind', kinderList);
      }
      syncKinderAdd();
    }));
  syncKinderAdd();

  const stellplaetze = $('#stellplaetze');
  $('#add-stellplatz').addEventListener('click', () => {
    addFromTemplate('tpl-stellplatz', stellplaetze);
    renumberStellplaetze();
  });
  addFromTemplate('tpl-stellplatz', stellplaetze);

  /* Immobilienvermögen. The properties are added from the card itself, but the loan
     buttons arrive with each property, so those are handled by delegation on the list
     rather than wired one by one. */
  const immobilienListe = $('#immobilien-liste');

  $('#add-immobilie').addEventListener('click', () => {
    addFromTemplate('tpl-immobilie-besitz', immobilienListe);
    renumberImmobilien();
  });

  immobilienListe.addEventListener('click', (event) => {
    const button = event.target.closest('.add-darlehen');
    if (!button) return;
    const list = button.closest('.subcard').querySelector('.darlehen-liste');
    addFromTemplate('tpl-darlehen', list);
    renumberDarlehen(list);
  });

  /* Answering "Ja" is already the statement that there is a loan, so the first card
     comes with it rather than behind a further click on "hinzufügen". Only when the
     list is still empty — reopening the gate must not discard what was typed. */
  const kredite = $('#kredite-liste');
  $('#add-kredit').addEventListener('click', () => {
    addFromTemplate('tpl-kredit', kredite);
    renumberKredite();
  });
  $$('#verbind-toggle > .choices input[type="radio"]').forEach((radio) =>
    radio.addEventListener('change', () => {
      if (radio.checked && radio.value === 'Ja' && !kredite.children.length) {
        addFromTemplate('tpl-kredit', kredite);
      }
      renumberKredite();
    }));
  renumberKredite();

  document.addEventListener('input', touched);
  document.addEventListener('blur', (event) => {
    if (event.target.matches('.input, .select')) validate(event.target);
  }, true);

  /* The way on is also the completeness check: an incomplete form does not move to
     the summary, it says how much is left and puts the caret in the first gap. */
  $('#submit').addEventListener('click', () => {
    const invalid = formGaps();

    if (!invalid.length) {
      saveText.textContent = 'Alle Pflichtfelder vollständig';
      openSummary();
      return;
    }
    saveText.textContent = invalid.length === 1
      ? 'Noch 1 Pflichtfeld offen'
      : `Noch ${invalid.length} Pflichtfelder offen`;
    revealCard(invalid[0].node);
    invalid[0].focus.focus();
  });

  /* Back into the form is always allowed and never asks: nothing has been sent
     yet, and the summary is rebuilt from the form every time it is opened, so no
     answer can go stale between the two. */
  $('#back-to-form').addEventListener('click', () => showView('form'));

  $('#send').addEventListener('click', send);
  $('#copy-ref').addEventListener('click', copyReference);

  // Prototype only: in the real product the case ends on the sent screen.
  $('#restart').addEventListener('click', () => location.reload());

  // Ticking the box is the answer, so the complaint about it missing goes at once.
  consent.addEventListener('change', () => { if (consent.checked) validateConsent(); });
  [mailKunde, mailMakler].forEach((input) =>
    input.addEventListener('blur', () => validateMail(input)));

  // The form is the first view; showView is not used for it, because it would take
  // the focus off the top of the page before anyone has done anything.
  document.documentElement.setAttribute('data-view', 'form');
})();
