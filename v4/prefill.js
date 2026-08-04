/* ============================================================================
   Beispieldaten für den Prototyp — "Beispieldaten einfügen" in der Sidebar.

   Kein Teil des Produkts, und deshalb eine eigene Datei: der Knopf tippt das
   Formular von außen aus, wie ein Mensch es täte — Werte setzen, input/change/blur
   auslösen — und weiß nichts über die Interna von app.js. Die Kaskaden, die
   Währungsformatierung, die Zähler und die Pflichtfeldprüfung reagieren dabei
   genau so, wie sie es bei Handeingabe tun. Nichts hier ist Voraussetzung für die
   Strecke; die Datei kann ersatzlos entfernt werden.

   Gefüllt wird nur, was leer ist und wonach das Formular gerade fragt. Ein Feld,
   das in einem geschlossenen Zweig liegt oder dessen Position nicht angehakt ist,
   bleibt leer — sonst stünden im Antrag Angaben, die niemand erfragt hat.
   ========================================================================== */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const form = $('#main');
  const status = $('#prefill-status');

  /* Dieselbe Regel wie isAsked() in app.js, plus [hidden] für die
     Objektkarte, die mit dem Finanzierungszweck kommt und geht. Bewusst
     nachgebaut statt importiert: die Datei soll nichts aus app.js brauchen. */
  const asked = (el) => !el.closest('.reveal:not(.open), [data-inactive], [hidden]');

  /* Ein Feld mit "0,00" ist nicht ausgefüllt, sondern zeigt seinen Nullwert —
     der Darlehensbetrag startet so. */
  const isEmpty = (input) => {
    const value = input.value.trim();
    return !value || value === '0,00';
  };

  /* Die Beschriftung ohne Sternchen und ohne das Info-Icon, dessen Sprechblase
     den ganzen Hilfetext enthält. Ein Betragsfeld in einer Positionsliste hat
     keine eigene Beschriftung — dort steht sie im aria-label. */
  function labelOf(field, control) {
    const node = field && field.querySelector(':scope > label, :scope > .group-label');
    if (node) {
      const copy = node.cloneNode(true);
      $$('.info-wrap, .req', copy).forEach((el) => el.remove());
      return copy.textContent.replace(/\s+/g, ' ').trim();
    }
    return ((control && control.getAttribute('aria-label')) || '').trim();
  }

  const chipText = (radio) =>
    (radio.nextElementSibling ? radio.nextElementSibling.textContent : '').trim();

  /* Ein Fall, der sich erzählen lässt: Erika Mustermann kauft allein eine
     Eigentumswohnung in Köln, 320.000 € Darlehen, 80.000 € Eigenkapital.
     Reihenfolge zählt — die erste passende Zeile gewinnt, deshalb steht
     "Straße des Arbeitgebers" vor "Straße". */
  const VALUES = [
    [/^Gewünschter Darlehensbetrag/,        '320.000,00'],
    [/^Beraterin/,                          'Sabine Berger'],

    [/^Vorname/,                            'Erika'],
    [/^Nachname/,                           'Mustermann'],
    [/^Straße des Arbeitgebers/,            'Industriestraße'],
    [/^Straße/,                             'Musterstraße'],
    [/^Hausnr|^Nr\./,                       '12'],
    [/^PLZ/,                                '50667'],
    [/^Ort/,                                'Köln'],
    [/^Wohnhaft seit/,                      '01.08.2015'],
    [/^Geburtsdatum/,                       '14.03.1988'],
    [/^Geburtsort/,                         'Bonn'],
    [/^Steuer-ID/,                          '12 345 678 901'],

    [/ausgeübter Beruf|^Ausgeübter Beruf/,  'Projektleiterin'],
    [/^Name des Arbeitgebers/,              'Muster Technik GmbH'],
    [/^Name des Unternehmens/,              'Mustermann Consulting'],
    [/^Hochschule/,                         'Universität zu Köln'],
    [/seit$|^Beschäftigt seit|^Selbstständig seit/, '03.2018'],
    [/^Befristet bis|^Voraussichtliches Ende/, '12.2028'],

    [/Nettoeinkommen/,                      '4.200,00'],
    [/Kaltmiete/,                           '980,00'],
    [/Lebenshaltungskosten/,                '1.150,00'],
    [/^Sparguthaben/,                       '45.000,00'],
    [/^Eingesetztes Eigenkapital/,          '80.000,00'],
    [/^Gewünschte monatliche Rate/,         '1.250,00'],

    [/^Baujahr/,                            '1998'],
    [/^Grundstücksfläche/,                  '210'],
    [/^Wohnfläche/,                         '86'],
    [/^Zimmer/,                             '3'],
    [/^Geschosse/,                          '4'],
    [/^Anzahl Wohnungen/,                   '12'],
    [/^Endenergiebedarf/,                   '95'],
    [/Erbbauzins/,                          '1.200,00'],
    [/^Geplante Fertigstellung/,            '06.2027'],

    [/^Aktueller Darlehensgeber/,           'Sparkasse KölnBonn'],
    [/^Aktuelle Restschuld/,                '145.000,00'],
    [/^Ende der Zinsbindung|^Ende des Erbbaurechtsvertrags/, '31.12.2031'],
    [/^Modernisierungssumme/,               '60.000,00'],
    [/Kapitalbetrag/,                       '50.000,00'],
    [/^Verwendungszweck/,                   'Ablösung Privatkredit'],
  ];

  /* Zwei Stellen im Formular fragen mit denselben Worten nach etwas anderem und
     brauchen deshalb ihren eigenen Katalog, der vor dem allgemeinen greift: eine
     Kinderzeile ("Name", "Geburtsdatum") und das Finanzierungsobjekt, dessen
     Adresse nicht die Wohnadresse der Antragstellerin ist — sie wohnt zur Miete
     und kauft woanders. */
  const CHILD_VALUES = [
    [/^Name/,         'Lena Mustermann'],
    [/^Geburtsdatum/, '12.06.2019'],
  ];

  const OBJECT_VALUES = [
    [/^Straße/,  'Lindenallee'],
    [/^Nr\.|^Hausnr/, '7'],
    [/^PLZ/,     '50937'],
    [/^Ort/,     'Köln'],
  ];

  /* Welche Antwort eine Auswahlgruppe bekommt. Ohne Eintrag hier wird "Nein"
     gewählt, wo es das gibt: eine Beispielbefüllung soll nicht ungefragt jeden
     Zweig aufklappen, den das Formular anzubieten hat. */
  const CHOICES = [
    [/Immobilie gefunden/,          'Ja'],
    [/Finanzierung beantragt/,      'Alleine'],
    [/^Anrede/,                     'Frau'],
    [/Kinder im Haushalt/,          'Ja'],
    [/zur Miete/,                   'Ja'],
    [/künftig entfallen/,           'Ja'],
    [/Parkplätze/,                  'Ja'],
    [/Massivbauweise/,              'Ja'],
    [/Gesamtanzahl der Wohnungen/,  'Ja'],
  ];

  /* Bevorzugte Einträge in Auswahllisten, über den Text erkannt statt über die
     Position: so bleibt die Beispielbefüllung richtig, wenn eine Liste
     umsortiert oder ergänzt wird. Eine Pflichtliste ohne Treffer nimmt ihren
     ersten echten Eintrag; eine freiwillige bleibt leer, damit sie keinen
     Folgezweig aufmacht, den niemand erfragt hat. */
  const OPTIONS = [
    'Kauf einer bestehenden Immobilie', 'Eigentumswohnung', 'Selbst nutzen',
    'deutsch', 'ledig', 'Angestellt', 'IT', '12',
    'Erstes Obergeschoss', 'Effizienzhaus-Standard 55', '10 Jahre', 'Stellplatz',
  ];

  /* Was ein Pflichtfeld bekommt, das in keinem Katalog steht: die Einheit neben
     dem Feld und der Platzhalter sagen, welche Form die Angabe hat. */
  function fallback(input, field) {
    const unit = field && field.querySelector(':scope > .with-unit > .unit');
    if (unit && unit.textContent.trim() === '€') return '1.000,00';
    const placeholder = input.placeholder || '';
    if (placeholder.includes('tt.mm.jjjj')) return '01.06.2020';
    if (placeholder.includes('mm.jjjj')) return '06.2020';
    if (placeholder.includes('jjjj')) return '2000';
    if (input.inputMode === 'numeric' || input.inputMode === 'decimal') return '1';
    return 'Musterangabe';
  }

  /* Tippen heißt: Wert setzen und dieselben Ereignisse auslösen, die eine Hand
     auslöst. blur steigt nicht auf — das ist Absicht und entspricht dem echten
     Ereignis; app.js hört es in der Capture-Phase, die Währungsformatierung
     direkt am Feld. */
  function type(control, value) {
    control.value = value;
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new Event('change', { bubbles: true }));
    control.dispatchEvent(new Event('blur'));
  }

  function fillChoices() {
    let filled = 0;
    $$('.choices', form).forEach((choices) => {
      const radios = $$('input[type="radio"]', choices);
      const field = choices.closest('.field');
      if (!radios.length || !field || field.closest('#states')) return;
      if (!asked(field) || radios.some((radio) => radio.checked)) return;

      const label = labelOf(field, null);
      const wanted = (CHOICES.find(([pattern]) => pattern.test(label)) || [])[1];
      const pick = radios.find((radio) => chipText(radio) === wanted)
        || radios.find((radio) => chipText(radio) === 'Nein')
        || radios[0];
      pick.click();
      filled++;
    });
    return filled;
  }

  function fillSelects() {
    let filled = 0;
    $$('.select', form).forEach((select) => {
      if (select.closest('#states') || select.disabled || select.value) return;
      if (!asked(select)) return;

      const options = Array.from(select.options)
        .filter((option) => option.value !== '' && !/Bitte wählen/.test(option.textContent));
      if (!options.length) return;

      const preferred = options.find((option) => OPTIONS.includes(option.textContent.trim()));
      if (!preferred && !select.required) return;

      select.value = (preferred || options[0]).value;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      filled++;
    });
    return filled;
  }

  function fillInputs() {
    let filled = 0;
    $$('.input', form).forEach((input) => {
      if (input.closest('#states') || input.disabled || !isEmpty(input)) return;
      if (!asked(input)) return;

      const field = input.closest('.field');
      const label = labelOf(field, input);
      // Der Katalog der Stelle zuerst, der allgemeine danach.
      const tables = [
        input.closest('.child-row') ? CHILD_VALUES : null,
        input.closest('#objekt') ? OBJECT_VALUES : null,
        VALUES,
      ].filter(Boolean);
      const match = tables.reduce((found, table) =>
        found || table.find(([pattern]) => pattern.test(label)), null);

      // Ein freiwilliges Feld ohne Katalogeintrag bleibt leer: geraten würde es
      // im Antrag stehen, ohne dass es dort etwas zu sagen hätte.
      if (!match && !input.required) return;

      type(input, match ? match[1] : fallback(input, field));
      filled++;
    });
    return filled;
  }

  /* Auch die zwei Adressen des Versandschritts, damit die Strecke bis zur
     Referenz-ID in drei Klicks durchläuft. Das Einwilligungshäkchen bleibt
     bewusst leer — es ist die Entscheidung, um die es auf der Seite geht. */
  function fillSendStep() {
    [['#mail-kunde', 'erika.mustermann@example.com'],
      ['#mail-makler', 'makler@finlink.de']].forEach(([selector, value]) => {
      const input = $(selector);
      if (input && !input.value.trim()) type(input, value);
    });
  }

  /* Eine Antwort öffnet den nächsten Zweig, also wird in Durchgängen gefüllt,
     bis ein Durchgang nichts mehr findet. Die Obergrenze ist eine Notbremse:
     die tiefste Kette im Formular ist drei Ebenen tief. */
  function prefill() {
    for (let pass = 0; pass < 6; pass++) {
      if (!(fillChoices() + fillSelects() + fillInputs())) break;
    }
    fillSendStep();
    status.textContent = 'Beispieldaten eingefügt. Jetzt „Weiter zu Zusammenfassung“.';
  }

  $('#prefill').addEventListener('click', prefill);
})();
