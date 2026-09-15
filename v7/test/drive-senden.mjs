/* Drives the send flow — Formular -> Zusammenfassung -> Gesendet — in a real
   browser and asserts on actual DOM state: the read-back generated from the form,
   the consent gate, the confirmation dialog, the reference ID, and the lock that
   makes the form unreachable afterwards.

   Same setup as drive.mjs, and a FRESH page each run: the last check sends the
   form, which locks it for good — a second run against the same tab would start
   from a locked form.

     python3 -m http.server 8777                 # from the repository root
     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
       --headless --disable-gpu --remote-debugging-port=9222 \
       --user-data-dir=/tmp/v5-profile http://localhost:8777/v5/index.html &
     node v5/test/drive-senden.mjs */
const base = 'http://127.0.0.1:9222';

const targets = await (await fetch(`${base}/json/list`)).json();
const page = targets.find((t) => t.type === 'page' && t.url.includes('v5/index.html'));
if (!page) { console.error('page target not found', targets.map((t) => t.url)); process.exit(1); }

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

/* Fills every field the form is asking for, so the way to the summary is open.
   Deliberately mechanical — what each answer means is drive.mjs's subject; here it
   only matters that the form is complete and that a few known values can be
   recognised again in the read-back. */
await evaluate(`
  window.fill = () => {
    const asked = el => !el.closest('.reveal:not(.open), [data-inactive], [hidden]');
    // The purpose drives the whole cascade, so it is answered first and the
    // conditionals it opens are filled afterwards.
    const zweck = document.querySelector('#zweck');
    zweck.value = 'kauf';
    zweck.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelector('#gefunden input[value="Ja"]').click();

    document.querySelectorAll('.field[data-required]').forEach(group => {
      if (!asked(group)) return;
      const radio = group.querySelector('input[type="radio"]');
      if (radio && !group.querySelector('input[type="radio"]:checked')) radio.click();
    });
    document.querySelectorAll('#main select[required]').forEach(select => {
      if (!asked(select) || select.value) return;
      const option = [...select.options].find(o => o.value !== '' && o.textContent !== 'Bitte wählen');
      if (option) { select.value = option.value || option.textContent; }
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    // The selects above can have opened further conditionals, so the text fields
    // are filled after them, and the required selects are swept once more.
    document.querySelectorAll('#main select[required]').forEach(select => {
      if (!asked(select) || select.value) return;
      const option = [...select.options].find(o => o.value !== '' && o.textContent !== 'Bitte wählen');
      if (option) { select.value = option.value || option.textContent; }
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('#main .input[required]').forEach(input => {
      if (!asked(input) || input.value.trim()) return;
      input.value = input.placeholder && input.placeholder.includes('.')
        ? '01.01.1990' : 'Testwert';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    // Two known values to find again in the read-back.
    const name = document.querySelector('#a1-vorname');
    name.value = 'Erika';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    const last = document.querySelector('#a1-nachname');
    last.value = 'Mustermann';
    last.dispatchEvent(new Event('input', { bubbles: true }));
    const amount = document.querySelector('#darlehensbetrag');
    amount.value = '250000';
    amount.dispatchEvent(new Event('input', { bubbles: true }));
    amount.dispatchEvent(new Event('blur', { bubbles: true }));
  };

  /* Back to an empty form. Needed because two things fill it here — the filler
     above and the prototype's own Beispieldaten button — and each set of checks
     has to see its own data rather than the other's. Rows that an answer added
     (a child, a Kredit) stay, emptied: re-answering never removes them, and an
     empty optional row is invisible to the read-back anyway. */
  window.reset = () => {
    document.querySelectorAll('#main .input, #main .select').forEach(control => {
      control.value = '';
    });
    /* Back to the markup's own answers, not to nothing: "Alleine" ships checked,
       and re-clicking it fires a change the form reads as "remove person 2" — which
       opens the delete dialog and makes the page inert, so every later focus check
       would fail for a reason that has nothing to do with what it tests. */
    document.querySelectorAll('#main input[type=radio]')
      .forEach(r => { r.checked = r.defaultChecked; });
    ['#mail-kunde', '#mail-makler'].forEach(sel => { document.querySelector(sel).value = ''; });
    const consent = document.querySelector('#consent-broker');
    if (consent.checked) consent.click();
    document.querySelectorAll('.field.invalid').forEach(f => f.classList.remove('invalid'));
  };
  'ready'
`);

// --- der Weg zur Zusammenfassung --------------------------------------------

check('the form button names the step it leads to', await evaluate(`
  document.querySelector('#submit').textContent.trim()`), 'Weiter zu Zusammenfassung');

/* The prefill button has to leave the form actually complete, or it is worth
   nothing — the point of it is to reach the summary in one click. It runs on the
   pristine page, before anything here has typed into the form, so what is measured
   is the button's work alone. */
check('Beispieldaten einfügen leaves no mandatory field open', await evaluate(`
  (() => {
    document.querySelector('#prefill').click();

    const asked = el => !el.closest('.reveal:not(.open), [data-inactive], [hidden]');
    const controls = [...document.querySelectorAll('#main .input[required], #main .select[required]')]
      .filter(c => asked(c) && !c.value.trim());
    const groups = [...document.querySelectorAll('#main .field[data-required]')]
      .filter(g => asked(g) && g.querySelector('input[type=radio]')
        && !g.querySelector('input[type=radio]:checked'));
    return {
      openControls: controls.length,
      openGroups: groups.length,
      // die zwei Adressen des Versandschritts kommen mit, das Häkchen nicht
      mailsFilled: !!document.querySelector('#mail-kunde').value
        && !!document.querySelector('#mail-makler').value,
      consentUntouched: document.querySelector('#consent-broker').checked === false,
      says: document.querySelector('#prefill-status').textContent.startsWith('Beispieldaten'),
    };
  })()`), { openControls: 0, openGroups: 0, mailsFilled: true,
            consentUntouched: true, says: true });

check('the demo case is one coherent story, and the object is not the home address', await evaluate(`
  (() => {
    document.querySelector('#submit').click();
    const pairs = new Map([...document.querySelectorAll('#review .review-list > dt')]
      .map(dt => [dt.textContent, dt.nextElementSibling.textContent]));
    const out = {
      name: pairs.get('Vorname') + ' ' + pairs.get('Nachname'),
      betrag: pairs.get('Gewünschter Darlehensbetrag'),
      // dieselbe Beschriftung an zwei Stellen, zwei verschiedene Antworten
      strassen: [...document.querySelectorAll('#review dt')]
        .filter(dt => dt.textContent === 'Straße')
        .map(dt => dt.nextElementSibling.textContent),
      kind: pairs.get('Name'),
      // nichts Erratenes in einem freiwilligen Feld
      noFiller: ![...document.querySelectorAll('#review dd')]
        .some(dd => dd.textContent === 'Musterangabe'),
    };
    document.querySelector('#back-to-form').click();
    return out;
  })()`), { name: 'Erika Mustermann', betrag: '320.000,00 €',
            strassen: ['Musterstraße', 'Lindenallee'], kind: 'Lena Mustermann',
            noFiller: true });

/* From here on the checks own the data, so the demo case goes and the filler's
   own — deliberately minimal — answers take over. */
await evaluate('window.reset(); window.fill(); "filled"');

check('an incomplete form does not reach the summary', await evaluate(`
  (() => {
    const zweck = document.querySelector('#zweck');
    const kept = zweck.value;
    zweck.value = '';
    document.querySelector('#submit').click();
    const out = {
      view: document.documentElement.dataset.view,
      summaryHidden: document.querySelector('#summary-view').hidden,
      says: document.querySelector('#save-text').textContent.includes('offen'),
    };
    zweck.value = kept;
    zweck.dispatchEvent(new Event('change', { bubbles: true }));
    window.fill();
    return out;
  })()`), { view: 'form', summaryHidden: true, says: true });

check('a complete form moves to the summary and takes the action bar with it', await evaluate(`
  (() => {
    document.querySelector('#submit').click();
    return {
      view: document.documentElement.dataset.view,
      formHidden: document.querySelector('#main').hidden,
      summaryShown: !document.querySelector('#summary-view').hidden,
      sentHidden: document.querySelector('#sent-view').hidden,
      barsShown: [...document.querySelectorAll('.actionbar')].filter(b => !b.hidden)
        .map(b => b.id),
      focusOnHeading: document.activeElement.id,
      scrolledToTop: window.scrollY === 0,
      navListHidden: getComputedStyle(document.querySelector('#nav-links')).display,
    };
  })()`), { view: 'summary', formHidden: true, summaryShown: true, sentHidden: true,
            barsShown: ['bar-summary'], focusOnHeading: 'h-summary', scrolledToTop: true,
            navListHidden: 'none' });

// --- die Prüfliste -----------------------------------------------------------

check('the read-back is generated per step and carries the answers, not the stored values', await evaluate(`
  (() => {
    const groups = [...document.querySelectorAll('#review .review-group')];
    const titles = groups.map(g => g.querySelector('.review-title').textContent);
    const pairs = new Map([...document.querySelectorAll('#review .review-list > dt')]
      .map(dt => [dt.textContent, dt.nextElementSibling.textContent]));
    return {
      titles,
      // the option's text, not "kauf"
      zweck: pairs.get('Was möchten Sie finanzieren?'),
      // the € box next to the figure is part of the answer
      betrag: pairs.get('Gewünschter Darlehensbetrag'),
      vorname: pairs.get('Vorname'),
      // a radio group reports the chip label, not the input value
      darlehensnehmer: pairs.get('Wie wird die Finanzierung beantragt?'),
      // nothing empty made it in
      noEmptyAnswers: [...document.querySelectorAll('#review dd')]
        .every(dd => dd.textContent.trim() !== ''),
      editButtons: groups.every(g => !!g.querySelector('.link-btn')),
    };
  })()`), {
    titles: ['Finanzbedarf', 'Antragsteller', 'Kinder', 'Finanzen', 'Finanzierungsobjekt',
             'Finanzierungsdetails'],
    zweck: 'Kauf einer bestehenden Immobilie',
    betrag: '250.000,00 €',
    vorname: 'Erika',
    darlehensnehmer: 'Alleine',
    noEmptyAnswers: true,
    editButtons: true,
  });

check('a field in a closed conditional is not in the read-back', await evaluate(`
  (() => {
    const labels = [...document.querySelectorAll('#review dt')].map(dt => dt.textContent);
    return {
      // "Alleine" was answered, so applicant 2 does not exist at all
      noSecondApplicant: !document.querySelector('.applicant[data-applicant="2"]'),
      // Kinder was answered "Nein", so the child row is not asked for
      noChildRow: !labels.includes('Geburtsdatum') || labels.filter(l => l === 'Geburtsdatum').length < 2,
    };
  })()`), { noSecondApplicant: true, noChildRow: true });

check('Bearbeiten returns to the form and opens the step', await evaluate(`
  (() => {
    const group = [...document.querySelectorAll('#review .review-group')]
      .find(g => g.querySelector('.review-title').textContent === 'Finanzen');
    group.querySelector('.link-btn').click();
    const out = {
      view: document.documentElement.dataset.view,
      cardOpen: document.querySelector('#finanzen').dataset.open,
      focusInCard: !!document.activeElement.closest('#finanzen'),
    };
    document.querySelector('#submit').click();   // zurück zur Zusammenfassung
    return out;
  })()`), { view: 'form', cardOpen: 'true', focusInCard: true });

check('reopening the summary rebuilds it from the form', await evaluate(`
  (() => {
    const before = document.querySelector('#review').children.length;
    document.querySelector('#back-to-form').click();
    const amount = document.querySelector('#darlehensbetrag');
    amount.value = '300000';
    amount.dispatchEvent(new Event('input', { bubbles: true }));
    amount.dispatchEvent(new Event('blur', { bubbles: true }));
    document.querySelector('#submit').click();
    const pairs = new Map([...document.querySelectorAll('#review .review-list > dt')]
      .map(dt => [dt.textContent, dt.nextElementSibling.textContent]));
    return { sameGroupCount: document.querySelector('#review').children.length === before,
             betrag: pairs.get('Gewünschter Darlehensbetrag') };
  })()`), { sameGroupCount: true, betrag: '300.000,00 €' });

// --- Einwilligung ------------------------------------------------------------

check('the consent sentence and the two e-mail fields are asked for before sending', await evaluate(`
  (() => {
    document.querySelector('#send').click();
    return {
      stillOnSummary: document.documentElement.dataset.view,
      consentInvalid: document.querySelector('#consent-field').classList.contains('invalid'),
      consentDescribed: !!document.querySelector('#consent-broker')
        .getAttribute('aria-describedby'),
      consentMessage: document.querySelector('#consent-field .error-text').textContent
        .startsWith('Ohne diese Bestätigung'),
      mailsInvalid: ['#mail-kunde', '#mail-makler']
        .every(s => document.querySelector(s).closest('.field').classList.contains('invalid')),
      focusOnConsent: document.activeElement.id,
      barSays: document.querySelector('#send-text').textContent.includes('bitte ergänzen'),
    };
  })()`), { stillOnSummary: 'summary', consentInvalid: true, consentDescribed: true,
            consentMessage: true, mailsInvalid: true, focusOnConsent: 'consent-broker',
            barSays: true });

check('ticking the box clears its error at once', await evaluate(`
  (() => {
    document.querySelector('#consent-broker').click();
    return {
      checked: document.querySelector('#consent-broker').checked,
      invalid: document.querySelector('#consent-field').classList.contains('invalid'),
    };
  })()`), { checked: true, invalid: false });

check('a half-typed address is rejected, a whole one accepted', await evaluate(`
  (() => {
    const input = document.querySelector('#mail-kunde');
    const state = () => input.closest('.field').classList.contains('invalid');
    input.value = 'erika@';
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    const half = state();
    input.value = 'erika@example.com';
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    const whole = state();
    const makler = document.querySelector('#mail-makler');
    makler.value = 'makler@finlink.de';
    makler.dispatchEvent(new Event('blur', { bubbles: true }));
    return { half, whole, maklerOk: !makler.closest('.field').classList.contains('invalid') };
  })()`), { half: true, whole: false, maklerOk: true });

check('the customer is named in the consent note once the name is known', await evaluate(`
  document.querySelector('#consent-customer').textContent`), 'Erika Mustermann');

// --- senden ------------------------------------------------------------------

check('sending asks first, and backing out changes nothing', await evaluate(`
  (async () => {
    document.querySelector('#send').click();
    const dialog = document.querySelector('#confirm-dialog');
    const out = {
      asked: dialog.open,
      title: document.querySelector('#confirm-title').textContent,
      // red belongs to deleting; sending is the primary action
      tone: document.querySelector('#confirm-ok').className,
      names: document.querySelector('#confirm-text').textContent
        .includes('makler@finlink.de'),
      warns: document.querySelector('#confirm-text').textContent
        .includes('nicht mehr öffnen'),
      // Enter must not send: the focus starts on the way out
      focusOnCancel: document.activeElement.value,
    };
    dialog.querySelector('[value="cancel"]').click();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    out.viewAfterCancel = document.documentElement.dataset.view;
    out.formStillEditable = !document.querySelector('#darlehensbetrag').disabled;
    return out;
  })()`), { asked: true, title: 'Jetzt an den Berater senden?', tone: 'btn primary',
            names: true, warns: true, focusOnCancel: 'cancel', viewAfterCancel: 'summary',
            formStillEditable: true });

check('confirming sends: reference ID, both addresses named, form locked', await evaluate(`
  (async () => {
    document.querySelector('#send').click();
    const dialog = document.querySelector('#confirm-dialog');
    dialog.querySelector('#confirm-ok').click();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return {
      view: document.documentElement.dataset.view,
      barsShown: [...document.querySelectorAll('.actionbar')].filter(b => !b.hidden)
        .map(b => b.id),
      reference: /^SA-\\d{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/
        .test(document.querySelector('#ref-id').textContent),
      maklerMail: document.querySelector('#sent-mail-makler').textContent,
      kundeMail: document.querySelector('#sent-mail-kunde').textContent,
      name: document.querySelector('#sent-name').textContent,
      formHidden: document.querySelector('#main').hidden,
      summaryHidden: document.querySelector('#summary-view').hidden,
      // hidden is not enough: nothing in either view may still be operable
      lockedControls: [...document.querySelectorAll('#main input, #main select, ' +
        '#summary-view input, #summary-view button')].every(el => el.disabled),
      focusOnHeading: document.activeElement.id,
      noWayBack: !document.querySelector('#sent-view [id^="back"]'),
    };
  })()`), { view: 'sent', barsShown: ['bar-sent'], reference: true,
            maklerMail: 'makler@finlink.de', kundeMail: 'erika@example.com',
            name: 'Erika Mustermann', formHidden: true, summaryHidden: true,
            lockedControls: true, focusOnHeading: 'h-sent', noWayBack: true });

check('the reference ID can be copied, and the copy is reported', await evaluate(`
  (async () => {
    const reference = document.querySelector('#ref-id').textContent;
    document.querySelector('#copy-ref').click();
    await new Promise(r => setTimeout(r, 50));
    const status = document.querySelector('#copy-status');
    return {
      says: status.textContent.includes(reference) || status.textContent.includes('Strg+C'),
      live: status.getAttribute('aria-live'),
      // the line is held free even before the first click, so nothing jumps
      holdsItsLine: status.getBoundingClientRect().height > 0,
    };
  })()`), { says: true, live: 'polite', holdsItsLine: true });

check('the sent screen says plainly that editing is over', await evaluate(`
  (() => {
    const text = document.querySelector('#sent-view').textContent;
    return {
      noAccess: text.includes('keinen Zugriff mehr'),
      noEditing: text.includes('nicht mehr bearbeiten'),
      barSays: document.querySelector('#bar-sent').textContent.includes('nicht mehr möglich'),
      nextSteps: document.querySelectorAll('#wie-weiter .steps > li').length,
    };
  })()`), { noAccess: true, noEditing: true, barSays: true, nextSteps: 3 });

// --- Darstellung -------------------------------------------------------------

check('the send screens hold up in every appearance', await evaluate(`
  (() => {
    const out = {};
    ['light', 'grey', 'dark'].forEach(scheme => {
      document.documentElement.setAttribute('data-appearance', scheme);
      const note = document.querySelector('#wie-weiter .note');
      const styles = getComputedStyle(note);
      out[scheme] = {
        filled: styles.backgroundColor !== 'rgba(0, 0, 0, 0)',
        textDiffersFromFill: styles.color !== styles.backgroundColor,
      };
    });
    document.documentElement.setAttribute('data-appearance', 'light');
    // nothing may overflow the viewport sideways
    out.noSideScroll = document.documentElement.scrollWidth <= window.innerWidth;
    return out;
  })()`), {
    light: { filled: true, textDiffersFromFill: true },
    grey: { filled: true, textDiffersFromFill: true },
    dark: { filled: true, textDiffersFromFill: true },
    noSideScroll: true,
  });

console.log(results.join('\n'));
const passed = results.filter((r) => r.startsWith('PASS')).length;
console.log(`\n${passed}/${results.length} checks passed`);
ws.close();
