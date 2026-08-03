/* Drives the V4 prototype in a real browser over the DevTools protocol and
   asserts on actual DOM state — the conditional cascade, the applicant-2 clone's
   id/label/name rewriting, the repeatable groups, validation, currency parsing
   and the mode toggles.

   Run it with two terminals' worth of setup:

     python3 -m http.server 8777                 # from the repository root
     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
       --headless --disable-gpu --remote-debugging-port=9222 \
       --user-data-dir=/tmp/v4-profile http://localhost:8777/v4/index.html &
     node v4/test/drive.mjs

   No dependencies: Node's built-in fetch and WebSocket do the whole job. */
const base = 'http://127.0.0.1:9222';

const targets = await (await fetch(`${base}/json/list`)).json();
const page = targets.find((t) => t.type === 'page' && t.url.includes('v4/index.html'));
if (!page) { console.error('page target not found', targets.map(t => t.url)); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params) => new Promise((res) => {
  const n = ++id;
  pending.set(n, res);
  ws.send(JSON.stringify({ id: n, method, params }));
});

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
}

const results = [];
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`);
};

/* Taking out person 2 or a child that has entries opens a confirmation dialog, and
   the row only goes once it is answered — so the checks below cannot click the ×
   and read the result on the next line. window.answer does the whole gesture the
   way a user does: press ×, press the button in the dialog, then let the close
   event and the handler waiting on it run. A blank row never asks, so the dialog
   branch is skipped and the call still settles. */
await evaluate(`
  window.answer = async (selector, button = 'delete') => {
    document.querySelector(selector).click();
    const dialog = document.querySelector('#confirm-dialog');
    const asked = dialog.open;
    if (asked) {
      dialog.querySelector(button === 'delete' ? '#confirm-ok' : '[value="cancel"]').click();
    }
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return asked;
  };`);

// --- start cascade -----------------------------------------------------------
check('default: Immobilie section open',
  await evaluate(`document.querySelector('.object-section[data-for="immobilie"]').classList.contains('open')`), true);
check('default: Immobilie nav shown',
  await evaluate(`document.querySelector('.nav a[data-navfor="immobilie"]').classList.contains('show')`), true);

check('Kauf + "Nein" gefunden -> no object section, art/nutzung hidden', await evaluate(`
  (() => {
    const nein = document.querySelector('#gefunden input[value="Nein"]');
    nein.checked = true; nein.dispatchEvent(new Event('change', {bubbles:true}));
    return {
      open: document.querySelectorAll('.object-section.open').length,
      art: document.querySelector('#c-immobilienart').classList.contains('open'),
      nav: document.querySelectorAll('.nav a.object-nav.show').length,
      // nothing is known about the object yet, so the card that would hold it goes too
      cardHidden: document.querySelector('#objekt').hidden,
    };
  })()`), { open: 0, art: false, nav: 0, cardHidden: true });

check('Anschlussfinanzierung -> only that section + nav', await evaluate(`
  (() => {
    const z = document.querySelector('#zweck');
    z.value = 'anschluss'; z.dispatchEvent(new Event('change'));
    return {
      open: [...document.querySelectorAll('.object-section.open')].map(s => s.dataset.for),
      // the heading entry is an .object-nav without a data-navfor, so it is named by
      // its target: it comes and goes with the card, whichever object is in it
      nav: [...document.querySelectorAll('.nav a.object-nav.show')]
        .map(a => a.dataset.navfor || a.getAttribute('href').slice(1)),
      // the card holding all five object sub-sections shows with them
      cardShown: !document.querySelector('#objekt').hidden,
      gefundenVisible: document.querySelector('#c-gefunden').classList.contains('open'),
    };
  })()`), { open: ['anschluss'], nav: ['objekt', 'anschluss'], cardShown: true,
            gefundenVisible: false });

// back to the default purchase path
await evaluate(`(() => {
  const z = document.querySelector('#zweck'); z.value='kauf'; z.dispatchEvent(new Event('change'));
  const ja = document.querySelector('#gefunden input[value="Ja"]');
  ja.checked = true; ja.dispatchEvent(new Event('change', {bubbles:true}));
})()`);

// --- conditional reveals -----------------------------------------------------
check('radio group opens its own nested reveal (Kinder)', await evaluate(`
  (() => {
    const ja = document.querySelector('#kinder-toggle input[value="Ja"]');
    ja.checked = true; ja.dispatchEvent(new Event('change', {bubbles:true}));
    const before = document.querySelector('#kinder-toggle > .reveal').classList.contains('open');
    const nein = document.querySelector('#kinder-toggle input[value="Nein"]');
    nein.checked = true; nein.dispatchEvent(new Event('change', {bubbles:true}));
    return { opened: before, closedAgain: !document.querySelector('#kinder-toggle > .reveal').classList.contains('open') };
  })()`), { opened: true, closedAgain: true });

check('data-controls reveal (Wohnungen)', await evaluate(`
  (() => {
    const ja = document.querySelector('input[name="wohnungen-bekannt"][value="Ja"]');
    ja.checked = true; ja.dispatchEvent(new Event('change', {bubbles:true}));
    return document.querySelector('#c-wohnungen').classList.contains('open');
  })()`), true);

check('select-driven reveal (Erbbaurecht = Ja)', await evaluate(`
  (() => {
    const s = document.querySelector('#i-erbbau');
    s.value = 'Ja'; s.dispatchEvent(new Event('change'));
    return document.querySelector('#c-erbbau').classList.contains('open');
  })()`), true);

check('select-driven reveal inside a field (Familienstand = verheiratet)', await evaluate(`
  (() => {
    const s = document.querySelector('#a1-familienstand');
    s.value = 'verheiratet'; s.dispatchEvent(new Event('change'));
    return s.closest('.field').querySelector(':scope > .reveal').classList.contains('open');
  })()`), true);

// --- applicant 2 -------------------------------------------------------------
check('add applicant 2: panels, unique ids, wired labels', await evaluate(`
  (() => {
    document.querySelector('#add-applicant').click();
    const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
    const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
    const labels = [...document.querySelectorAll('.applicant[data-applicant="2"] label[for]')];
    const broken = labels.filter(l => !document.getElementById(l.htmlFor));
    const aria = [...document.querySelectorAll('.applicant[data-applicant="2"] [aria-describedby],.applicant[data-applicant="2"] [aria-labelledby]')];
    const brokenAria = aria.flatMap(el =>
      (el.getAttribute('aria-describedby') || '').split(/\\s+/).concat(
      (el.getAttribute('aria-labelledby') || '').split(/\\s+/)))
      .filter(Boolean).filter(t => !document.getElementById(t));
    return {
      panels: document.querySelectorAll('.applicant[data-applicant="2"]').length,
      duplicateIds: dupes,
      brokenLabelFor: broken.map(l => l.htmlFor),
      brokenAriaRefs: brokenAria,
      addBtnHidden: document.querySelector('#add-applicant').hidden,
      darlehensnehmer: document.querySelector('#darlehensnehmer input:checked').value,
    };
  })()`), { panels: 4, duplicateIds: [], brokenLabelFor: [], brokenAriaRefs: [], addBtnHidden: true, darlehensnehmer: '2' });

check('applicant 2 radios are independent of applicant 1', await evaluate(`
  (() => {
    const a1 = document.querySelector('.applicant[data-applicant="1"] input[name^="b1-befristet"]');
    const a2 = document.querySelector('.applicant[data-applicant="2"] input[name^="b1-befristet"]');
    return { sameName: a1.name === a2.name, a1: a1.name, a2: a2.name };
  })()`), { sameName: false, a1: 'b1-befristet', a2: 'b1-befristet-a2-beruf' });

check('applicant 2 conditional works on its own copy', await evaluate(`
  (() => {
    const panel = document.querySelector('.applicant[data-applicant="2"][data-applicant] ');
    const p2 = [...document.querySelectorAll('.applicant[data-applicant="2"]')].find(p => p.querySelector('input[name^="b1-befristet"]'));
    const ja = p2.querySelector('input[name^="b1-befristet"][value="Ja"]');
    ja.checked = true; ja.dispatchEvent(new Event('change', {bubbles:true}));
    const p1 = document.querySelector('.applicant[data-applicant="1"] .field[data-show-when] > .reveal');
    return {
      copyOpened: ja.closest('.field').querySelector(':scope > .reveal').classList.contains('open'),
      originalUntouched: !p1.classList.contains('open'),
    };
  })()`), { copyOpened: true, originalUntouched: true });

// every token in the copy, not just the first: Anrede is a radio group now and carries
// no autocomplete at all (honorific-prefix only applies to text controls), so asserting
// on the first one would silently follow whatever field happens to lead the panel
check('applicant 2 autocomplete moved to its own section', await evaluate(`
  (() => {
    const tokens = [...document.querySelectorAll('.applicant[data-applicant="2"] [autocomplete]')]
      .map((el) => el.getAttribute('autocomplete'));
    return {
      count: tokens.length,
      allScoped: tokens.every((t) => t.startsWith('section-antragsteller2 ')),
      first: tokens[0],
    };
  })()`), { count: 9, allScoped: true, first: 'section-antragsteller2 given-name' });

check('name echo updates the panel title and nav group', await evaluate(`
  (() => {
    const v = document.querySelector('.applicant[data-applicant="1"] [data-role="vorname"]');
    v.value = 'Anna'; v.dispatchEvent(new Event('input', {bubbles:true}));
    const n = document.querySelector('.applicant[data-applicant="1"] [data-role="nachname"]');
    n.value = 'Meier'; n.dispatchEvent(new Event('input', {bubbles:true}));
    return {
      title: document.querySelector('.applicant[data-applicant="1"] .applicant-title').textContent,
      nav: document.querySelector('#person-group-title').textContent,
    };
  })()`), { title: 'Antragsteller 1 – Anna Meier', nav: 'Antragsteller · Anna' });

/* Person 2 has entries by now (the checks above filled and ticked things in the
   copy), so the × must ask, back out intact if the answer is Abbrechen, and only
   then take all four panels with it. */
check('remove applicant 2 asks first, and Abbrechen keeps everything', await evaluate(`
  (async () => {
    const asked = await window.answer('.applicant[data-applicant="2"] .icon-btn', 'cancel');
    return {
      asked,
      panels: document.querySelectorAll('.applicant[data-applicant="2"]').length,
      dialogClosed: !document.querySelector('#confirm-dialog').open,
      darlehensnehmer: document.querySelector('#darlehensnehmer input:checked').value,
    };
  })()`), { asked: true, panels: 4, dialogClosed: true, darlehensnehmer: '2' });

check('remove applicant 2 restores single-column', await evaluate(`
  (async () => {
    await window.answer('.applicant[data-applicant="2"] .icon-btn');
    return {
      panels: document.querySelectorAll('.applicant[data-applicant="2"]').length,
      two: document.querySelectorAll('.applicants.two').length,
      addBtnHidden: document.querySelector('#add-applicant').hidden,
    };
  })()`), { panels: 0, two: 0, addBtnHidden: false });

/* The radio is the second way to delete person 2, so it asks the same question —
   and a refused delete has to leave the radio on "Zusammen", not on the answer
   the form did not actually take. */
check('answering "Alleine" again asks, and Abbrechen puts the radio back', await evaluate(`
  (async () => {
    document.querySelector('#add-applicant').click();
    const name = document.querySelector('.applicant[data-applicant="2"] [data-role="vorname"]');
    name.value = 'Bea'; name.dispatchEvent(new Event('input', { bubbles: true }));

    const allein = document.querySelector('#darlehensnehmer input[value="1"]');
    allein.checked = true;
    allein.dispatchEvent(new Event('change', { bubbles: true }));
    const asked = document.querySelector('#confirm-dialog').open;
    document.querySelector('#confirm-dialog [value="cancel"]').click();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const afterCancel = {
      checked: document.querySelector('#darlehensnehmer input:checked').value,
      panels: document.querySelectorAll('.applicant[data-applicant="2"]').length,
    };

    allein.checked = true;
    allein.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelector('#confirm-ok').click();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return { asked, afterCancel, afterDelete: {
      checked: document.querySelector('#darlehensnehmer input:checked').value,
      panels: document.querySelectorAll('.applicant[data-applicant="2"]').length,
    } };
  })()`), { asked: true, afterCancel: { checked: '2', panels: 4 },
            afterDelete: { checked: '1', panels: 0 } });

check('the dialog is modal and labelled, and confirming is the destructive button', await evaluate(`
  (async () => {
    document.querySelector('#add-applicant').click();
    const name = document.querySelector('.applicant[data-applicant="2"] [data-role="vorname"]');
    name.value = 'Bea'; name.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('.applicant[data-applicant="2"] .icon-btn').click();

    const dialog = document.querySelector('#confirm-dialog');
    const ok = document.querySelector('#confirm-ok');
    // resolve --color-action-danger through the cascade rather than hardcoding the
    // hex, so the a11y layer stays free to move it without breaking this check
    const probe = document.createElement('span');
    probe.style.background = 'var(--color-action-danger)';
    document.body.appendChild(probe);
    const token = getComputedStyle(probe).backgroundColor;
    probe.remove();

    const out = {
      // showModal, not show — the page behind it has to be unreachable
      modal: dialog.matches(':modal'),
      labelled: dialog.getAttribute('aria-labelledby') === 'confirm-title',
      title: document.querySelector('#confirm-title').textContent,
      warnsAboutData: /Alle eingegebenen Informationen/
        .test(document.querySelector('#confirm-text').textContent),
      // red marks the consequence, and the safe answer holds the focus so Enter
      // cannot delete
      okIsDanger: getComputedStyle(ok).backgroundColor === token,
      cancelIsNotDanger: getComputedStyle(dialog.querySelector('[value="cancel"]')).backgroundColor !== token,
      focusStartsOnCancel: document.activeElement.value === 'cancel',
    };
    ok.click();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    out.gone = document.querySelectorAll('.applicant[data-applicant="2"]').length;
    return out;
  })()`), { modal: true, labelled: true, title: 'Antragsteller 2 löschen?', warnsAboutData: true,
            okIsDanger: true, cancelIsNotDanger: true, focusStartsOnCancel: true, gone: 0 });

check('Esc backs out of the dialog without deleting', await evaluate(`
  (async () => {
    document.querySelector('#add-applicant').click();
    const name = document.querySelector('.applicant[data-applicant="2"] [data-role="vorname"]');
    name.value = 'Bea'; name.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('.applicant[data-applicant="2"] .icon-btn').click();

    // Esc on a <dialog> is the browser's own cancel path, so close() stands in for
    // it here: it is what the key ends up calling, with returnValue left untouched
    document.querySelector('#confirm-dialog').close();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return document.querySelectorAll('.applicant[data-applicant="2"]').length;
  })()`), 4);

// the check above deliberately leaves person 2 standing; everything below it starts
// from one applicant again
await evaluate(`window.answer('.applicant[data-applicant="2"] .icon-btn')`);

// --- repeatables -------------------------------------------------------------
check('Stellplatz: one by default, add/renumber/remove', await evaluate(`
  (() => {
    const initial = document.querySelectorAll('#stellplaetze .subcard').length;
    document.querySelector('#add-stellplatz').click();
    document.querySelector('#add-stellplatz').click();
    const titles = [...document.querySelectorAll('#stellplaetze .sp-title')].map(t => t.textContent);
    document.querySelectorAll('#stellplaetze .subcard')[0].querySelector('[data-remove]').click();
    const after = [...document.querySelectorAll('#stellplaetze .sp-title')].map(t => t.textContent);
    return { initial, titles, after };
  })()`), { initial: 1, titles: ['Stellplatz 1', 'Stellplatz 2', 'Stellplatz 3'], after: ['Stellplatz 1', 'Stellplatz 2'] });

check('Stellplatz copies get independent radio groups and working reveal', await evaluate(`
  (() => {
    const cards = [...document.querySelectorAll('#stellplaetze .subcard')];
    const names = cards.map(c => c.querySelector('input[type=radio]').name);
    const ja = cards[0].querySelector('input[value="Ja"]');
    ja.checked = true; ja.dispatchEvent(new Event('change', {bubbles:true}));
    return {
      uniqueNames: new Set(names).size === names.length && names.every(Boolean),
      firstOpened: cards[0].querySelector('.reveal').classList.contains('open'),
      secondClosed: !cards[1].querySelector('.reveal').classList.contains('open'),
    };
  })()`), { uniqueNames: true, firstOpened: true, secondClosed: true });

check('Kind rows: Ja brings the first row, button then offers a further one', await evaluate(`
  (() => {
    const list = document.querySelector('.kinder-list');
    const add = document.querySelector('.kinder-add');
    // the reveal check above already answered Ja once, so start from an empty list
    [...list.children].forEach((row) => row.querySelector('[data-remove]').click());
    const emptyLabel = add.textContent.trim();
    const buttonAboveList = add.nextElementSibling === list;

    const ja = document.querySelector('#kinder-toggle input[value="Ja"]');
    ja.checked = true; ja.dispatchEvent(new Event('change', {bubbles:true}));
    const afterJa = list.children.length;
    const afterJaLabel = add.textContent.trim();

    add.click();
    const rows = [...document.querySelectorAll('.child-row')];
    const unlabelled = rows.flatMap(r => [...r.querySelectorAll('label[for]')]).filter(l => !document.getElementById(l.htmlFor));
    const groups = rows.map(r => r.querySelector('[role=group]').getAttribute('aria-labelledby'));
    // resolve the label refs while the rows are still attached
    const groupsLabelled = groups.every(g => !!(g && document.getElementById(g)));
    rows[0].querySelector('[data-remove]').click();
    return {
      emptyLabel,
      buttonAboveList,
      afterJa,
      afterJaLabel,
      added: rows.length,
      unlabelled: unlabelled.length,
      groupsLabelled,
      afterRemove: document.querySelectorAll('.child-row').length,
    };
  })()`), {
    emptyLabel: '+ Kind hinzufügen',
    buttonAboveList: true,
    afterJa: 1,
    afterJaLabel: '+ Weiteres Kind hinzufügen',
    added: 2,
    unlabelled: 0,
    groupsLabelled: true,
    afterRemove: 1,
  });

/* A row with a name in it asks before it goes; the one added by a mis-click and
   never filled in should not need a second click to undo, so it goes quietly. */
check('Kind rows: a filled row confirms before deleting, a blank one does not ask',
  await evaluate(`
  (async () => {
    const list = document.querySelector('.kinder-list');
    const filled = list.children[0];
    const name = filled.querySelector('input[type=text]');
    name.value = 'Mia'; name.dispatchEvent(new Event('input', { bubbles: true }));

    filled.querySelector('[data-remove]').click();
    const dialog = document.querySelector('#confirm-dialog');
    const out = {
      askedForFilled: dialog.open,
      title: document.querySelector('#confirm-title').textContent,
      text: document.querySelector('#confirm-text').textContent,
    };
    dialog.querySelector('[value="cancel"]').click();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    out.keptOnCancel = list.children.length;

    document.querySelector('.kinder-add').click();
    const blank = list.children[list.children.length - 1];
    blank.querySelector('[data-remove]').click();
    out.askedForBlank = dialog.open;
    out.blankRemoved = !list.contains(blank);

    await window.answer('.kinder-list > .child-row [data-remove]');
    out.afterConfirm = list.children.length;
    return out;
  })()`), {
    askedForFilled: true,
    title: 'Kind löschen?',
    text: 'Alle eingegebenen Informationen zu diesem Kind werden gelöscht. '
      + 'Das kann nicht rückgängig gemacht werden.',
    keptOnCancel: 1,
    askedForBlank: false,
    blankRemoved: true,
    afterConfirm: 0,
  });

// --- amount list (Finanzen · Vermögen) ---------------------------------------
check('Vermögen: mandatory position is pre-picked with its amount live, the rest inert',
  await evaluate(`
  (() => {
    const rows = [...document.querySelectorAll('#vermoegen .amount-row')];
    return {
      positions: rows.length,
      picked: rows.filter(r => r.querySelector('input[type=checkbox]').checked)
                  .map(r => r.querySelector('.choice span').textContent.trim().replace(' *', '')),
      // exactly one amount field is being asked for, and it is the mandatory one
      live: rows.filter(r => !('inactive' in r.querySelector('.amount-cell').dataset))
                .map(r => r.querySelector('.input').id),
      // checkboxes, not radios: several positions have to be able to apply at once
      type: new Set(rows.map(r => r.querySelector('.choice input').type)).size === 1
            && rows[0].querySelector('.choice input').type,
    };
  })()`), { positions: 6, picked: ['Sparguthaben'], live: ['v-spar-betrag'], type: 'checkbox' });

check('Vermögen: the mandatory position cannot be given up', await evaluate(`
  (() => {
    const box = document.querySelector('#v-spar');
    box.click();
    return { stillChecked: box.checked,
             amountStillLive: !('inactive' in document.querySelector('#v-spar-betrag').closest('.amount-cell').dataset) };
  })()`), { stillChecked: true, amountStillLive: true });

check('Vermögen: picking a position makes its amount mandatory', await evaluate(`
  (() => {
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const card = document.querySelector('#vermoegen');
    const input = document.querySelector('#v-wert-betrag');
    const cell = input.closest('.amount-cell');
    const fill = (el) => getComputedStyle(el).backgroundColor;
    const value = () => card.querySelector('.count-value').textContent;
    return (async () => {
      await frame();
      const before = value();
      // an unpicked amount is recessed, but it is laid out and it takes the pointer —
      // clicking it is one of the two ways to pick the position
      const idle = getComputedStyle(input);
      const hit = input.getBoundingClientRect().width > 0
        && idle.visibility === 'visible' && idle.pointerEvents !== 'none';
      const recessed = fill(input) !== fill(document.querySelector('#v-spar-betrag'));
      document.querySelector('#v-wert').click();
      await frame();
      return {
        before,
        after: value(),
        cellActive: !('inactive' in cell.dataset),
        hit,
        recessed,
        // picked: the same plain fill as the position that was live all along
        litUp: fill(input) === fill(document.querySelector('#v-spar-betrag')),
      };
    })();
  })()`), { before: '0/1', after: '0/2', cellActive: true, hit: true, recessed: true, litUp: true });

check('Vermögen: giving a position up clears its amount and stops counting it',
  await evaluate(`
  (() => {
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const card = document.querySelector('#vermoegen');
    const input = document.querySelector('#v-wert-betrag');
    const fill = (el) => getComputedStyle(el).backgroundColor;
    return (async () => {
      input.value = '25000'; input.dispatchEvent(new Event('blur'));
      const formatted = input.value;
      document.querySelector('#v-wert').click();
      await frame();
      return {
        formatted,
        clearedAfterGivingUp: input.value,
        counted: card.querySelector('.count-value').textContent,
        // the field stays put and stays reachable; only the fill says it is idle
        stillInPlace: input.getBoundingClientRect().width > 0,
        recessed: fill(input) !== fill(document.querySelector('#v-spar-betrag')),
      };
    })();
  })()`), { formatted: '25.000,00', clearedAfterGivingUp: '', counted: '0/1',
            stillInPlace: true, recessed: true });

check('Vermögen: reaching into the amount picks the position — pointer or typing, not tabbing',
  await evaluate(`
  (() => {
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const card = document.querySelector('#vermoegen');
    const counted = () => card.querySelector('.count-value').textContent;
    const pointer = document.querySelector('#v-bsv-betrag');
    const typed = document.querySelector('#v-ek-betrag');
    return (async () => {
      pointer.closest('.amount-cell')
        .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await frame();
      const byPointer = document.querySelector('#v-bsv').checked;

      typed.focus();
      await frame();
      const byFocusAlone = document.querySelector('#v-ek').checked;
      typed.value = '5000';
      typed.dispatchEvent(new Event('input', { bubbles: true }));
      await frame();
      const out = {
        byPointer,
        byFocusAlone,
        byTyping: document.querySelector('#v-ek').checked,
        // the characters that picked the row must survive the sync that follows them
        keptWhatWasTyped: typed.value,
        counted: counted(),
      };

      // leave the card as it was found, or every later total shifts by two
      document.querySelector('#v-bsv').click();
      document.querySelector('#v-ek').click();
      await frame();
      out.restored = counted();
      return out;
    })();
  })()`), { byPointer: true, byFocusAlone: false, byTyping: true,
            keptWhatWasTyped: '5000', counted: '1/3', restored: '0/1' });

check('an amount picked by clicking its field is provisional until it holds a figure',
  await evaluate(`
  (() => {
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const counted = () => document.querySelector('#vermoegen .count-value').textContent;
    const state = (id) => {
      const input = document.querySelector(id);
      const cell = input.closest('.amount-cell');
      const error = cell.querySelector('.error-text');
      return {
        picked: input.closest('.amount-row').querySelector('.choice input').checked,
        invalid: cell.classList.contains('invalid'),
        ariaInvalid: input.getAttribute('aria-invalid'),
        errorShown: error ? getComputedStyle(error).display !== 'none' : false,
      };
    };
    const clickInto = (id) => {
      const input = document.querySelector(id);
      input.closest('.amount-cell')
        .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      input.focus();
      return input;
    };
    return (async () => {
      const out = {};

      // clicked into and left empty: the pick is taken back, and nothing is flagged —
      // the form is not asking for a figure nobody claimed
      clickInto('#v-lv-betrag');
      document.querySelector('#v-ek-betrag').focus();
      await frame();
      out.leftEmpty = state('#v-lv-betrag');
      out.leftEmptyCount = counted();

      // merely tabbing through an unpicked amount leaves no red field behind either
      const tabbed = document.querySelector('#v-ek-betrag');
      tabbed.blur();
      await frame();
      out.tabbedThrough = state('#v-ek-betrag');

      // a figure settles the row: from here on it is picked like any other, so
      // emptying it again reports the missing amount instead of dropping the position
      const typed = clickInto('#v-bsv-betrag');
      typed.value = '3000'; typed.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#v-spar-betrag').focus();
      await frame();
      out.settled = state('#v-bsv-betrag');
      typed.focus(); typed.value = ''; typed.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#v-spar-betrag').focus();
      await frame();
      out.emptiedAgain = state('#v-bsv-betrag');

      // ticking the box is the stronger signal, so an empty amount under it complains
      document.querySelector('#v-sonst').click();
      const chip = document.querySelector('#v-sonst-betrag');
      chip.focus(); chip.blur();
      await frame();
      out.tickedByChip = state('#v-sonst-betrag');

      // ...as does the position that is mandatory whether anyone ticks it or not
      const locked = document.querySelector('#v-spar-betrag');
      locked.focus(); locked.blur();
      await frame();
      out.mandatory = state('#v-spar-betrag');
      locked.value = '';

      document.querySelector('#v-bsv').click();
      document.querySelector('#v-sonst').click();
      await frame();
      out.restored = counted();
      return out;
    })();
  })()`), {
    leftEmpty: { picked: false, invalid: false, ariaInvalid: 'false', errorShown: false },
    leftEmptyCount: '0/1',
    tabbedThrough: { picked: false, invalid: false, ariaInvalid: 'false', errorShown: false },
    settled: { picked: true, invalid: false, ariaInvalid: 'false', errorShown: false },
    emptiedAgain: { picked: true, invalid: true, ariaInvalid: 'true', errorShown: true },
    tickedByChip: { picked: true, invalid: true, ariaInvalid: 'true', errorShown: true },
    mandatory: { picked: true, invalid: true, ariaInvalid: 'true', errorShown: true },
    restored: '0/1',
  });

/* The sidebar is the contract for the card structure: a top-level entry per
   collapsible step, and every .sub entry under it must resolve to a .subsection that
   actually lives inside that step's card. */
check('the sidebar mirrors the cards: five steps plus the reference, subs nested inside them',
  await evaluate(`
  (() => {
    const links = [...document.querySelectorAll('.nav a[href^="#"]')];
    const tree = [];
    links.forEach((a) => {
      const entry = { text: a.textContent.trim(), target: a.getAttribute('href').slice(1) };
      if (a.classList.contains('sub')) tree[tree.length - 1].subs.push(entry);
      else tree.push({ ...entry, subs: [] });
    });
    return {
      // by target, not by label: the Antragsteller entry picks up person 1's first
      // name once one is typed, and by now the checks above have typed one
      steps: tree.map(t => t.target),
      subs: Object.fromEntries(tree.filter(t => t.subs.length)
        .map(t => [t.target, t.subs.map(s => s.text)])),
      nested: tree.every(t => t.subs.every(s => {
        const sub = document.getElementById(s.target);
        return sub && sub.classList.contains('subsection')
          && sub.closest('.card:not(.subsection)').id === t.target;
      })),
      // no step's entry may point at anything but a top-level card
      stepsAreCards: tree.every(t => {
        const el = document.getElementById(t.target);
        return el.classList.contains('card') && !el.classList.contains('subsection');
      }),
      broken: links.filter(a => !document.getElementById(a.getAttribute('href').slice(1))).length,
      // nothing in the sidebar is an unclickable heading any more: every step is a
      // link, so a label above its sub-entries would only duplicate it
      headings: document.querySelectorAll('.nav .group').length,
      // one heading level per nesting level: h1 page > h2 step > h3 sub-section
      levels: [...new Set([...document.querySelectorAll('main .card > .card-head')]
        .map(h => h.tagName + (h.parentElement.classList.contains('subsection') ? ':sub' : ':step')))],
    };
  })()`), {
    steps: ['start', 'antragsteller', 'kinder', 'finanzen', 'objekt', 'details', 'states'],
    subs: {
      antragsteller: ['Persönliche Details', 'Berufliche Situation', 'Einkommen',
                      'Ausgaben'],
      finanzen: ['Vermögen', 'Immobilien', 'Verbindlichkeiten'],
      objekt: ['Immobilie', 'Neubau', 'Anschlussfinanzierung', 'Modernisierung',
               'Kapitalbeschaffung'],
    },
    nested: true, stepsAreCards: true, broken: 0, headings: 0,
    levels: ['H2:step', 'H3:sub'],
  });

// --- amount list (Einkommen · weitere Einkommensarten) -----------------------
check('Einkommen: the salary keeps its own section, the rest is an amount list',
  await evaluate(`
  (() => {
    const panel = document.querySelector('#einkommen .applicant[data-applicant="1"]');
    const group = panel.querySelector('[role="group"]');
    return {
      // the one mandatory figure is a plain field, outside the list
      mandatory: [...panel.querySelectorAll('.grid .input[required], .grid .select[required]')]
                   .map(el => el.id),
      // firstChild, not textContent: the generated ⓘ and its bubble live in there too
      subhead: panel.querySelector('.subhead').firstChild.textContent.trim(),
      // the subhead above the list is what names the group
      labelledByTheSubhead: group.getAttribute('aria-labelledby') === panel.querySelector('.subhead').id,
      // ...which is also where the icon-mode ⓘ ends up, there being no label inside
      iconOnTheSubhead: !!panel.querySelector('.subhead .info-wrap[data-generated]'),
      positions: [...group.querySelectorAll('.amount-row .choice > span')].map(s => s.textContent.trim()),
      nonePicked: [...group.querySelectorAll('.amount-row .choice input')].every(i => !i.checked),
      allInert: [...group.querySelectorAll('.amount-cell')].every(c => 'inactive' in c.dataset),
    };
  })()`), {
    mandatory: ['e1-netto'],
    subhead: 'Weitere Einkommensarten',
    labelledByTheSubhead: true,
    iconOnTheSubhead: true,
    positions: ['Zusätzliches Einkommen', 'Mieteinnahmen', 'Kindergeld',
                'Renteneinkommen', 'Sonstige Einkünfte'],
    nonePicked: true,
    allInert: true,
  });

check('Einkommen: picking an income type asks for its figure, and only then',
  await evaluate(`
  (() => {
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const card = document.querySelector('#einkommen');
    const counted = () => card.querySelector('.count-value').textContent;
    const input = document.querySelector('#e1-rente-betrag');
    return (async () => {
      await frame();
      const before = counted();
      // clicking straight into the figure is enough to pick the type
      input.closest('.amount-cell').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      input.value = '1450'; input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('blur'));
      await frame();
      const out = {
        before,
        picked: document.querySelector('#e1-rente').checked,
        formatted: input.value,
        after: counted(),
      };
      document.querySelector('#e1-rente').click();
      await frame();
      out.givenUp = { value: input.value, counted: counted() };
      return out;
    })();
  })()`), { before: '0/1', picked: true, formatted: '1.450,00', after: '1/2',
            givenUp: { value: '', counted: '0/1' } });

check('Einkommen: applicant 2 gets its own list, picked from scratch', await evaluate(`
  (() => {
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return (async () => {
      document.querySelector('#e1-miete').click();
      await frame();
      document.querySelector('#add-applicant').click();
      await frame();
      const two = document.querySelector('#einkommen .applicant[data-applicant="2"]');
      const suffixed = [...two.querySelectorAll('.amount-row .choice input')].map(i => i.id);
      const out = {
        suffixed,
        // applicant 1's pick must not come along for the ride
        startsBlank: [...two.querySelectorAll('.amount-row .choice input')].every(i => !i.checked),
        clonedListIsLive: (() => {
          const box = two.querySelector('.amount-row .choice input');
          two.querySelector('.amount-cell')
             .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          return box.checked;
        })(),
        applicant1Untouched: document.querySelector('#e1-miete').checked,
      };
      // the pick above counts as an entry, so this one goes through the dialog
      await window.answer('#einkommen .applicant[data-applicant="2"] .icon-btn');
      document.querySelector('#e1-miete').click();
      await frame();
      out.restored = document.querySelector('#einkommen .count-value').textContent;
      return out;
    })();
  })()`), {
    suffixed: ['e1-zusatz-a2-einkommen', 'e1-miete-a2-einkommen', 'e1-kindergeld-a2-einkommen',
               'e1-rente-a2-einkommen', 'e1-sonstige-a2-einkommen'],
    startsBlank: true, clonedListIsLive: true, applicant1Untouched: true, restored: '0/1',
  });

// --- validation + currency + save state -------------------------------------
check('blur on empty required field marks it invalid with a message', await evaluate(`
  (() => {
    const el = document.querySelector('#a1-vorname');
    el.value = ''; el.dispatchEvent(new Event('blur'));
    const field = el.closest('.field');
    const msgId = (el.getAttribute('aria-describedby') || '').split(/\\s+/).pop();
    return {
      invalidClass: field.classList.contains('invalid'),
      ariaInvalid: el.getAttribute('aria-invalid'),
      messageVisible: !!document.getElementById(msgId)?.textContent,
    };
  })()`), { invalidClass: true, ariaInvalid: 'true', messageVisible: true });

check('filling it clears the error', await evaluate(`
  (() => {
    const el = document.querySelector('#a1-vorname');
    el.value = 'Anna'; el.dispatchEvent(new Event('blur'));
    return { invalid: el.closest('.field').classList.contains('invalid'), aria: el.getAttribute('aria-invalid') };
  })()`), { invalid: false, aria: 'false' });

check('reference section is exempt from live validation', await evaluate(`
  (() => {
    const el = document.querySelector('#s-5');
    el.dispatchEvent(new Event('blur'));
    return document.querySelector('#err-s-5').textContent;
  })()`), 'Bitte geben Sie eine gültige E-Mail-Adresse ein');

check('German currency formatting on blur', await evaluate(`
  (() => {
    const out = [];
    const el = document.querySelector('#e1-netto');
    for (const v of ['3450', '3450.5', '1.234,56', '2500,4']) {
      el.value = v; el.dispatchEvent(new Event('blur')); out.push(el.value);
    }
    return out;
  })()`), ['3.450,00', '3.450,50', '1.234,56', '2.500,40']);

check('save state announces politely', await evaluate(`
  (() => {
    const el = document.querySelector('#save-state');
    return { role: el.getAttribute('role'), live: el.getAttribute('aria-live') };
  })()`), { role: 'status', live: 'polite' });

check('submit counts every field the form is asking for, including collapsed cards', await evaluate(`
  (() => {
    document.querySelectorAll('.input[required], .select[required]').forEach(c => { c.value = ''; });
    document.querySelectorAll('input[type=radio]').forEach(r => { r.checked = false; });
    document.querySelector('#submit').click();

    const asked = el => !el.closest('.reveal:not(.open), [data-inactive]');
    const controls = [...document.querySelectorAll('.input[required], .select[required]')];
    const groups = [...document.querySelectorAll('.field[data-required]')]
      .filter(g => g.querySelector('input[type=radio]'));
    const expected = controls.filter(asked).length + groups.filter(asked).length;
    const inDom = controls.length + groups.length;

    return {
      matchesExpected: document.querySelector('#save-text').textContent
        === \`Noch \${expected} Pflichtfelder offen\`,
      // strictly fewer than everything in the DOM, proving closed conditionals are
      // excluded while collapsed cards are not
      excludesClosedConditionals: expected < inDom,
      // a required choice group is reported too, not just inputs
      groupFlagged: groups.filter(asked).every(g => g.classList.contains('invalid')),
      focusedVisible: document.activeElement.offsetParent !== null,
      focusedCardOpen: document.activeElement.closest('.card').dataset.open,
    };
  })()`), { matchesExpected: true, excludesClosedConditionals: true, groupFlagged: true,
            focusedVisible: true, focusedCardOpen: 'true' });

// --- collapsible cards + Pflichtfeld counter --------------------------------
check('on load only Start is expanded, and collapsed bodies have no height', await evaluate(`
  (() => {
    const cards = [...document.querySelectorAll('.card')];
    const open = cards.filter(c => c.dataset.open === 'true').map(c => c.id);
    const ariaMismatch = cards.filter(c =>
      c.querySelector('.card-toggle').getAttribute('aria-expanded') !== c.dataset.open);
    const collapsedHeights = cards.filter(c => c.dataset.open !== 'true')
      .map(c => c.querySelector('.card-body').getBoundingClientRect().height);
    return {
      open,
      ariaMismatch: ariaMismatch.length,
      allCollapsedAreZeroHeight: collapsedHeights.every(h => h === 0),
    };
  })()`), { open: ['start'], ariaMismatch: 0, allCollapsedAreZeroHeight: true });

check('clicking the header toggles the card and its aria-expanded', await evaluate(`
  (() => {
    const card = document.querySelector('#pd');
    const toggle = card.querySelector('.card-toggle');
    toggle.click();
    const opened = { open: card.dataset.open, aria: toggle.getAttribute('aria-expanded') };
    toggle.click();
    return { opened, closed: { open: card.dataset.open, aria: toggle.getAttribute('aria-expanded') } };
  })()`), { opened: { open: 'true', aria: 'true' }, closed: { open: 'false', aria: 'false' } });

/* The point of the five-step structure: a step is the only thing anyone has to open.
   Its sub-sections come with it, and closing it takes them back down, so reopening
   never leaves a row of shut sub-headers to click through. Their own toggle is there
   for one thing only — folding a part that is done back out of the way, without that
   folding the step around it. */
check('a step opens and closes its sub-sections with it', await evaluate(`
  (() => {
    const card = document.querySelector('#antragsteller');
    const subs = [...card.querySelectorAll('.subsection')];
    const state = () => subs.map(s => s.dataset.open + '/' +
      s.querySelector(':scope > .card-head > .card-toggle').getAttribute('aria-expanded'));
    const toggle = card.querySelector(':scope > .card-head > .card-toggle');
    const out = { count: subs.length, closed: state() };
    toggle.click();
    out.opened = state();
    toggle.click();
    out.closedAgain = state();
    return out;
  })()`), {
    count: 4,
    closed: Array(4).fill('false/false'),
    opened: Array(4).fill('true/true'),
    closedAgain: Array(4).fill('false/false'),
  });

check('a sub-section can be folded away on its own, and reopening the step brings it back',
  await evaluate(`
  (() => {
    const card = document.querySelector('#antragsteller');
    const step = card.querySelector(':scope > .card-head > .card-toggle');
    const sub = document.querySelector('#einkommen');
    step.click();                                        // step + all sub-sections open
    sub.querySelector(':scope > .card-head > .card-toggle').click();
    const folded = { sub: sub.dataset.open, step: card.dataset.open,
                     others: document.querySelector('#ausgaben').dataset.open };
    step.click(); step.click();                          // shut the step and open it again
    const out = { folded, backAfterReopen: sub.dataset.open };
    step.click();
    return out;
  })()`), { folded: { sub: 'false', step: 'true', others: 'true' }, backAfterReopen: 'true' });

/* A sub-entry in the sidebar points at something two levels down, so it has to open
   the step as well or it would scroll to a card that is still shut. */
check('a nav sub-entry opens the step around it, not just the sub-section', await evaluate(`
  (() => {
    const card = document.querySelector('#finanzen');
    const sub = document.querySelector('#vermoegen');
    return (() => {
      const before = { step: card.dataset.open, sub: sub.dataset.open };
      document.querySelector('.nav a[href="#vermoegen"]').click();
      const after = { step: card.dataset.open, sub: sub.dataset.open,
                      visible: sub.querySelector('.input').offsetParent !== null };
      card.querySelector(':scope > .card-head > .card-toggle').click();
      return { before, after };
    })();
  })()`), { before: { step: 'false', sub: 'false' },
            after: { step: 'true', sub: 'true', visible: true } });

const fillStart = `
  (() => {
    const set = (id, v) => { const el = document.querySelector(id); el.value = v;
      el.dispatchEvent(new Event('change', {bubbles:true})); };
    set('#zweck', 'kauf');
    const ja = document.querySelector('#gefunden input[value="Ja"]');
    ja.checked = true; ja.dispatchEvent(new Event('change', {bubbles:true}));
    set('#immobilienart', ''); set('#nutzung', '');
    const allein = document.querySelector('#darlehensnehmer input[value="1"]');
    allein.checked = true; allein.dispatchEvent(new Event('change', {bubbles:true}));
    set('#darlehensbetrag', '0,00');
  })()`;

// the counter is recomputed on the next animation frame, so this has to wait one out
// like the check below it — reading synchronously returns whatever the previous state
// left behind, which passes or fails depending on what ran before it
check('Start counts its 4 required controls plus its 2 required choice groups', await evaluate(`
  (() => {
    ${fillStart};
    const card = document.querySelector('#start');
    return new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => done({
      text: card.querySelector('.count-value').textContent,
      label: card.querySelector('.count-label').textContent,
      sr: card.querySelector('[data-count-sr]').textContent,
    }))));
  })()`), { text: '4/6', label: 'Pflichtfelder',
            sr: '4 von 6 Pflichtfeldern ausgefüllt' });

check('filling a required field advances the counter and the meter', await evaluate(`
  (() => {
    ${fillStart};
    const card = document.querySelector('#start');
    const before = card.querySelector('.count-value').textContent;
    const sel = document.querySelector('#immobilienart');
    sel.value = 'Einfamilienhaus'; sel.dispatchEvent(new Event('change', {bubbles:true}));
    return new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => done({
      before,
      after: card.querySelector('.count-value').textContent,
      fill: card.querySelector('.count-fill').style.width,
    }))));
  })()`), { before: '4/6', after: '5/6', fill: '83.3333%' });

check('completing a card shows the checkmark state, not colour alone', await evaluate(`
  (() => {
    const card = document.querySelector('#start');
    const sel = document.querySelector('#nutzung');
    document.querySelector('#immobilienart').value = 'Einfamilienhaus';
    sel.value = 'Selbst nutzen'; sel.dispatchEvent(new Event('change', {bubbles:true}));
    return new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => done({
      complete: card.dataset.complete,
      value: card.querySelector('.count-value').textContent,
      label: card.querySelector('.count-label').textContent,
      sr: card.querySelector('[data-count-sr]').textContent,
    }))));
  })()`), { complete: 'true', value: '\u2713', label: 'Vollständig',
            sr: 'Alle 6 Pflichtfelder ausgefüllt' });

check('the static reference card carries no counter', await evaluate(`
  document.querySelector('#states .card-count').hidden`), true);

check('a scaffold card counts only while its finance type is the active one', await evaluate(`
  (() => {
    const card = document.querySelector('#anschluss');
    const hiddenWhileInactive = card.querySelector('.card-count').hidden;
    const z = document.querySelector('#zweck');
    z.value = 'anschluss'; z.dispatchEvent(new Event('change'));
    return new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => {
      const active = card.querySelector('.count-value').textContent;
      z.value = 'kauf'; z.dispatchEvent(new Event('change'));
      const ja = document.querySelector('#gefunden input[value="Ja"]');
      ja.checked = true; ja.dispatchEvent(new Event('change', {bubbles:true}));
      requestAnimationFrame(() => done({ hiddenWhileInactive, active }));
    })));
  })()`), { hiddenWhileInactive: true, active: '0/3' });

check('fields inside a closed conditional are not counted yet', await evaluate(`
  (() => {
    const card = document.querySelector('#immobilie');
    const reveal = document.querySelector('#c-erbbau');
    const sel = document.querySelector('#i-erbbau');
    sel.value = 'Nein'; sel.dispatchEvent(new Event('change', {bubbles:true}));
    return new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => {
      const closed = card.querySelector('.count-value').textContent;
      sel.value = 'Ja'; sel.dispatchEvent(new Event('change', {bubbles:true}));
      requestAnimationFrame(() => requestAnimationFrame(() => done({
        // the three Erbbau fields become mandatory only once the branch is open
        grew: Number(card.querySelector('.count-value').textContent.split('/')[1])
            - Number(closed.split('/')[1]),
      })));
    })));
  })()`), { grew: 3 });

check('adding applicant 2 doubles that card total', await evaluate(`
  (() => {
    // counter updates are queued to a frame, so every read has to wait for one
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const card = document.querySelector('#pd');
    const value = () => card.querySelector('.count-value').textContent;
    return (async () => {
      const fam = document.querySelector('#a1-familienstand');
      fam.value = ''; fam.dispatchEvent(new Event('change', {bubbles:true}));
      await frame();
      const before = value();
      document.querySelector('#add-applicant').click();
      await frame();
      const after = value();
      document.querySelector('.applicant[data-applicant="2"] .icon-btn').click();
      await frame();
      return { before, after, restored: value() };
    })();
  })()`), { before: '0/11', after: '0/22', restored: '0/11' });

check('a nav link opens the card it points at', await evaluate(`
  (() => {
    const card = document.querySelector('#beruf');
    const wasOpen = card.dataset.open;
    document.querySelector('.nav a[href="#beruf"]').click();
    return { wasOpen, nowOpen: card.dataset.open };
  })()`), { wasOpen: 'false', nowOpen: 'true' });

check('submit opens the collapsed card holding the first missing field', await evaluate(`
  (() => {
    document.querySelectorAll('.card').forEach(c => {
      c.dataset.open = 'false';
      c.querySelector('.card-toggle').setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.input[required], .select[required]').forEach(c => { c.value = ''; });
    document.querySelector('#submit').click();
    const card = document.activeElement.closest('.card');
    return {
      focusedCardOpen: card && card.dataset.open,
      focusedIsRequired: document.activeElement.required === true,
      focusedVisible: document.activeElement.offsetParent !== null,
    };
  })()`), { focusedCardOpen: 'true', focusedIsRequired: true, focusedVisible: true });

// --- toggles ----------------------------------------------------------------
check('toggles write only to <html> and shrink the field height', await evaluate(`
  (() => {
    const h = (el) => getComputedStyle(el).height;
    const input = document.querySelector('#a1-vorname');
    const before = h(input);
    document.querySelector('[data-density="compact"]').click();
    const after = h(input);
    const btn = document.querySelector('[data-appearance="dark"]');
    // while the root is light, a button that merely CARRIES data-appearance="dark"
    // must not pick up the dark palette itself
    const unpressedDarkBtnBg = getComputedStyle(btn).backgroundColor;
    btn.click();
    const state = {
      root: document.documentElement.getAttribute('data-appearance'),
      pressed: btn.getAttribute('aria-pressed'),
      otherPressed: document.querySelector('[data-appearance="light"]').getAttribute('aria-pressed'),
      // the fill lives on the header/body blocks, not on .card itself
      cardBgDark: getComputedStyle(document.querySelector('.card-toggle')).backgroundColor,
      pageBgDark: getComputedStyle(document.body).backgroundColor,
    };
    document.querySelector('[data-appearance="light"]').click();
    const cardBgLight = getComputedStyle(document.querySelector('.card-toggle')).backgroundColor;
    const pageBgLight = getComputedStyle(document.body).backgroundColor;
    // the grey scheme trades the two levels: grey page, white cards, and the fields
    // stay white with the cards — their border.default outline is the boundary
    document.querySelector('[data-appearance="grey"]').click();
    const grey = {
      rootGrey: document.documentElement.getAttribute('data-appearance'),
      pageBgGrey: getComputedStyle(document.body).backgroundColor,
      cardBgGrey: getComputedStyle(document.querySelector('.card-toggle')).backgroundColor,
      inputBgGrey: getComputedStyle(document.querySelector('#a1-vorname')).backgroundColor,
    };
    document.querySelector('[data-appearance="light"]').click();
    document.querySelector('[data-density="comfortable"]').click();
    return { before, after, unpressedDarkBtnBg, pageBgLight, cardBgLight, ...grey, ...state };
  })()`), // 40px / 32px are the export's own input.default.height and input.compact.height
          { before: '40px', after: '32px', unpressedDarkBtnBg: 'rgb(255, 255, 255)',
            // light: white page, neutral.100 cards (--surface-card). dark keeps the
            // conventional order: neutral.950 page, neutral.800 cards above it.
            pageBgLight: 'rgb(255, 255, 255)', cardBgLight: 'rgb(245, 247, 248)',
            rootGrey: 'grey', pageBgGrey: 'rgb(245, 247, 248)',
            cardBgGrey: 'rgb(255, 255, 255)', inputBgGrey: 'rgb(255, 255, 255)',
            root: 'dark', pressed: 'true', otherPressed: 'false',
            cardBgDark: 'rgb(55, 71, 79)', pageBgDark: 'rgb(22, 23, 25)' });

check('the three helper-text modes: inline, icon, hidden', await evaluate(`
  (() => {
    const help = document.querySelector('.field > .help');
    const icon = help.parentElement.querySelector('.info-wrap[data-generated]');
    const read = () => ({
      help: getComputedStyle(help).display,
      // clipped rather than display:none, so aria-describedby still reaches it
      clipped: getComputedStyle(help).clipPath !== 'none',
      icon: getComputedStyle(icon).display,
    });
    const out = {};
    out.on = read();
    document.querySelector('[data-help="icon"]').click(); out.icon = read();
    document.querySelector('[data-help="off"]').click(); out.off = read();
    document.querySelector('[data-help="on"]').click(); out.back = read();
    out.iconDescribesTheSameText =
      icon.querySelector('.info-bubble').textContent === help.textContent.trim();
    out.bubbleHiddenFromAT = icon.querySelector('.info-bubble').getAttribute('aria-hidden');
    out.buttonHasName = !!icon.querySelector('.info-btn').getAttribute('aria-label');
    return out;
  })()`), {
    on:   { help: 'block', clipped: false, icon: 'none' },
    icon: { help: 'block', clipped: true,  icon: 'inline-flex' },
    off:  { help: 'none',  clipped: false, icon: 'none' },
    back: { help: 'block', clipped: false, icon: 'none' },
    iconDescribesTheSameText: true, bubbleHiddenFromAT: 'true', buttonHasName: true });

check('the sidebar clears the sticky action bar and scrolls to its own end', await evaluate(`
  (() => {
    const nav = document.querySelector('.nav');
    const bar = document.querySelector('.actionbar');
    const overlapsBar = nav.getBoundingClientRect().bottom > bar.getBoundingClientRect().top + 1;
    const overflows = nav.scrollHeight > nav.clientHeight;
    nav.scrollTop = nav.scrollHeight;
    const last = nav.lastElementChild.getBoundingClientRect();
    return {
      overlapsBar,
      // whether it overflows depends on the window, but if it does its end must be reachable
      lastItemReachable: !overflows || last.bottom <= nav.getBoundingClientRect().bottom + 1,
      scrollable: !overflows || nav.scrollTop > 0,
    };
  })()`), { overlapsBar: false, lastItemReachable: true, scrollable: true });

/* The desktop shell is width-dependent, so this one emulates a wide viewport rather
   than trusting whatever size the browser was launched at. 1920 is past the cap, so
   it pins both halves of the rule at once: the sidebar stays one gutter from the
   left edge, and the form column stops at --layout-content-max with the rest of the
   screen left empty. */
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1000, deviceScaleFactor: 1, mobile: false });
check('desktop: sidebar at the left edge, form column capped, action bar aligned', await evaluate(`
  (() => {
    const box = (s) => document.querySelector(s).getBoundingClientRect();
    const nav = box('.nav'), content = box('.content'), submit = box('#submit');
    return {
      navLeft: Math.round(nav.left),                       // --layout-gutter, not centred
      contentWidth: Math.round(content.width),             // --layout-content-max
      emptyToTheRight: window.innerWidth - Math.round(content.right) > 0,
      barTracksTheForm: Math.round(submit.right) === Math.round(content.right),
    };
  })()`), { navLeft: 32, contentWidth: 1180, emptyToTheRight: true, barTracksTheForm: true });
await send('Emulation.clearDeviceMetricsOverride');

console.log(results.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
ws.close();
process.exit(failed ? 1 : 0);
