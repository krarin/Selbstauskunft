/* ============================================================================
   V4 behaviour. Declarative: the markup says what depends on what, this file
   just wires it up. Adding a conditional needs no change here.

     data-controls="#id" data-show-when="Ja"   trigger opens the reveal with that id
     data-show-when="Ja"  (no data-controls)   trigger opens its own nested .reveal
     .object-section[data-for]                 mutually exclusive finance-type section
     .nav a.object-nav[data-navfor]            nav entry for the above
   ========================================================================== */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  let uidCounter = 0;
  const uid = (prefix) => `${prefix}-${++uidCounter}`;

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
    scheduleCounters();   // opening or closing a reveal changes what is being asked
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
        const control = field.querySelector(':scope > .input, :scope > .select, ' +
          ':scope > .with-unit > .input, :scope > .select-wrap > .select');
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

    buildHelpIcons(root);
    wireConditionals(root);
    wireAmountRows(root);
    wireRemovers(root);
    wireCurrency(root);
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

  function wireConditionals(root) {
    // radio groups: the trigger is the .field wrapper (it carries the dataset).
    // Only the trigger's own .choices may answer for it — a group nested inside the
    // reveal bubbles its change through here too, and its "Nein" would otherwise
    // shut the very reveal it lives in.
    $$('.field[data-show-when]', root).forEach((field) => {
      if (field.dataset.wired) return;
      field.dataset.wired = '1';
      const reveal = revealFor(field, field);
      const when = field.dataset.showWhen;
      const own = field.querySelector(':scope > .choices') || field;
      field.addEventListener('change', (event) => {
        if (event.target.type !== 'radio' || !own.contains(event.target)) return;
        openReveal(reveal, event.target.value === when);
      });
      // honour a checked-by-default radio
      const checked = own.querySelector('input[type="radio"]:checked');
      if (checked) openReveal(reveal, checked.value === when);
    });

    // selects
    $$('select[data-show-when]', root).forEach((select) => {
      if (select.dataset.wired) return;
      select.dataset.wired = '1';
      const reveal = revealFor(select, select.closest('.field'));
      select.addEventListener('change', () =>
        openReveal(reveal, select.value === select.dataset.showWhen));
      openReveal(reveal, select.value === select.dataset.showWhen);
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

      // A mandatory position is still listed, and still ticked, but cannot be given
      // up. Cancelling the click covers the keyboard too — space fires one as well.
      toggle.addEventListener('click', (event) => {
        if ('locked' in toggle.dataset) event.preventDefault();
      });
      // Ticking the box is a decision in its own right, so it ends any provisional
      // state the row was in — see below.
      toggle.addEventListener('change', () => {
        delete row.dataset.provisional;
        syncAmountRow(row);
        scheduleCounters();
      });

      // Going for the figure is itself a way of picking the position: someone who
      // reaches into the Betrag field has already decided the item applies, so the
      // toggle follows instead of making them tick it first and aim twice.
      //
      // Pointerdown and typing, deliberately not focus: focus would tick every row
      // the keyboard merely passes through on the way down the list, so a tab-through
      // would claim the lot. Both entry points that carry intent are covered — the
      // pointer landing on the field, and the first character typed into it.
      const input = cell.querySelector('.input');
      const pick = () => {
        if (toggle.checked) return;
        toggle.checked = true;
        // Picked on the strength of a click, which is a weaker signal than ticking the
        // box: the row is provisional until it actually holds a figure.
        row.dataset.provisional = '';
        syncAmountRow(row);
        scheduleCounters();
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
        scheduleCounters();
      });

      syncAmountRow(row);
    });
  }

  /* ------------------------------------------------------- confirm deleting */

  const confirmDialog = $('#confirm-dialog');

  /* Removing a person or a child throws away everything typed into them and
     there is no undo, so it asks first. One dialog element, retitled per case —
     the browser owns Esc, the focus trap and the backdrop. */
  function confirmDelete({ title, text, action = 'Löschen' }) {
    return new Promise((resolve) => {
      $('#confirm-title').textContent = title;
      $('#confirm-text').textContent = text;
      $('#confirm-ok').textContent = action;
      confirmDialog.returnValue = '';   // Esc closes without touching it
      confirmDialog.addEventListener('close', function done() {
        confirmDialog.removeEventListener('close', done);
        resolve(confirmDialog.returnValue === 'delete');
      });
      confirmDialog.showModal();
    });
  }

  /* Nothing filled in means nothing to lose, and a row added by a mis-click
     should not need a second click to undo — so a blank one goes silently.
     "Blank" is measured against the state a fresh row or a fresh copy of
     applicant 1 starts in: no text, placeholder option, nothing ticked but the
     locked checkboxes that are ticked by definition. */
  function hasEntries(root) {
    return $$('input, select', root).some((el) => {
      if (el.tagName === 'SELECT') return el.selectedIndex > 0;
      if (el.type === 'checkbox' || el.type === 'radio') {
        return el.checked && !('locked' in el.dataset);
      }
      return el.value.trim() !== '';
    });
  }

  function wireRemovers(root) {
    $$('[data-remove]', root).forEach((button) => {
      if (button.dataset.wired) return;
      button.dataset.wired = '1';
      button.addEventListener('click', async () => {
        const row = button.closest('.child-row, .subcard');
        if (!row) return;

        // data-confirm carries the noun for the prompt; without it there is no prompt
        const noun = button.dataset.confirm;
        if (noun && hasEntries(row) && !await confirmDelete({
          title: `${noun} löschen?`,
          text: `Alle eingegebenen Informationen zu diesem ${noun} werden `
            + 'gelöscht. Das kann nicht rückgängig gemacht werden.',
        })) return;

        const list = row.parentElement;
        row.remove();
        if (list && list.id === 'stellplaetze') renumberStellplaetze();
        if (list && list.classList.contains('kinder-list')) syncKinderAdd();
        touched();
        scheduleCounters();
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
    card.dataset.open = String(open);
    card.querySelector(':scope > .card-head > .card-toggle')
      .setAttribute('aria-expanded', String(open));
    if (!open) delete card.dataset.settled;
    $$('.subsection', card).forEach((sub) => setCardOpen(sub, open));
  }

  function wireCards() {
    $$('.card').forEach((card) => {
      const toggle = card.querySelector(':scope > .card-head > .card-toggle');
      const body = card.querySelector(':scope > .card-body');

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

  let counterQueued = false;
  const scheduleCounters = () => {
    if (counterQueued) return;
    counterQueued = true;
    requestAnimationFrame(() => { counterQueued = false; updateCounters(); });
  };

  function updateCounters() {
    $$('.card').forEach((card) => {
      const counter = card.querySelector(':scope > .card-head .card-count');
      if (!counter) return;
      if (card.id === 'states') { counter.hidden = true; return; }   // static reference

      // A required choice group counts as one item, filled once anything is picked —
      // a radio group cannot carry `required` usefully, so the markup flags it.
      const groups = $$('.field[data-required]', card)
        .filter((g) => isAsked(g) && g.querySelector('input[type="radio"]'));
      const controls = $$('.input[required], .select[required]', card).filter(isAsked);

      const total = controls.length + groups.length;
      const filled = controls.filter((c) => c.value.trim() !== '').length
        + groups.filter((g) => g.querySelector('input[type="radio"]:checked')).length;

      // a card with nothing mandatory says nothing rather than "0/0"
      counter.hidden = total === 0;
      if (!total) {
        delete card.dataset.complete;
        return;
      }

      const done = filled === total;
      card.dataset.complete = String(done);
      counter.querySelector('.count-value').textContent = done ? '\u2713' : `${filled}/${total}`;
      counter.querySelector('.count-label').textContent = done ? 'Vollständig' : 'Pflichtfelder';
      counter.querySelector('[data-count-sr]').textContent = done
        ? `Alle ${total} Pflichtfelder ausgefüllt`
        : `${filled} von ${total} Pflichtfeldern ausgefüllt`;
      counter.querySelector('.count-fill').style.width = `${(filled / total) * 100}%`;
    });
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
    $$('[data-wired]', copy).forEach((el) => { delete el.dataset.wired; });
    $$('.child-row', copy).forEach((el) => el.remove());

    const head = copy.querySelector('.applicant-head');
    head.querySelector('.applicant-title').textContent = 'Antragsteller 2';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'icon-btn';
    remove.setAttribute('aria-label', 'Antragsteller 2 entfernen');
    remove.textContent = '×';
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

  /* The one way out of two applicants, wherever it is asked for: the × in the
     panel head and answering "Alleine" again both land here. Person 2 is spread
     over one panel per card, so all of them are searched for entries before the
     question is skipped as pointless. Resolves false if the user backs out. */
  async function requestRemoveApplicant2() {
    const panels = $$('.applicant[data-applicant="2"]');
    if (panels.some(hasEntries) && !await confirmDelete({
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
    scheduleCounters();
  }

  /* ------------------------------------------------- repeatable sub-groups */

  function addFromTemplate(templateId, list) {
    const node = $(`#${templateId}`).content.firstElementChild.cloneNode(true);
    list.appendChild(node);
    hydrate(node);
    scheduleCounters();
    return node;
  }

  function renumberStellplaetze() {
    $$('#stellplaetze .sp-title').forEach((title, index) => {
      title.textContent = `Stellplatz ${index + 1}`;
    });
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
    links.forEach((link) => link.addEventListener('click', () =>
      revealCard(document.getElementById(link.getAttribute('href').slice(1)))));
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

  /* ------------------------------------------------------------------ init */

  hydrate(document);
  wireCards();
  wireToggles();
  wireNav();
  initEmbed();

  zweck.addEventListener('change', updateStart);
  gefunden.addEventListener('change', updateStart);
  updateStart();

  $$('.applicant[data-applicant="1"]').forEach(wireNameEcho);
  $('#add-applicant').addEventListener('click', () => setApplicants(2));
  /* Going back to "Alleine" deletes person 2 just as the × does, so it asks the
     same question — and if the answer is no the radio returns to where it was,
     because the choice it shows has to match the form underneath it. */
  $$('#darlehensnehmer input[type="radio"]').forEach((radio) =>
    radio.addEventListener('change', async () => {
      if (radio.value === '2') { setApplicants(2); return; }
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
  updateCounters();
    renumberStellplaetze();
  });
  addFromTemplate('tpl-stellplatz', stellplaetze);

  document.addEventListener('input', () => { touched(); scheduleCounters(); });
  document.addEventListener('change', scheduleCounters);
  document.addEventListener('blur', (event) => {
    if (event.target.matches('.input, .select')) validate(event.target);
  }, true);

  $('#submit').addEventListener('click', () => {
    const controls = $$('.input[required], .select[required]').filter(isAsked);
    const groups = $$('.field[data-required]')
      .filter((g) => isAsked(g) && g.querySelector('input[type="radio"]'));

    const invalid = [
      ...controls.filter((c) => !validate(c)).map((c) => ({ node: c, focus: c })),
      ...groups.filter((g) => !validateGroup(g))
        .map((g) => ({ node: g, focus: g.querySelector('input[type="radio"]') })),
    // "the first missing field" has to mean first on the page, not first by kind
    ].sort((a, b) => (a.node.compareDocumentPosition(b.node)
      & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

    if (!invalid.length) {
      saveText.textContent = 'Alle Pflichtfelder vollständig';
      return;
    }
    saveText.textContent = invalid.length === 1
      ? 'Noch 1 Pflichtfeld offen'
      : `Noch ${invalid.length} Pflichtfelder offen`;
    revealCard(invalid[0].node);
    invalid[0].focus.focus();
  });
})();
