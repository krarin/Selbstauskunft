# V6.1 — what differs from V6 (MAVS-1468)

Ticket: [MAVS-1468 — Partner app: Add the Finanzierungsdetails fields from MAVS-1388 that exist in CASE IO](https://finlink.atlassian.net/browse/MAVS-1468), Luis Gamero, 12 Oct 2026. Design and visibility rules: MAVS-1388. V6.1 was branched from V6 on 12 Oct 2026 (commit `36a66b2` plus the Finanzierungsdetails and Objektdaten layout work of 6–9 Oct).

Only `index.html`, `prefill.js`, one condition in `app.js` (see Finanzierungsobjekt, Anschlussfinanzierung) and this file differ from V6. The CSS and the tokens are identical.

## Finanzierungsdetails

### Removed (no CASE IO field, per the ticket comment)

| Field | Purpose(s) in V6 | What happens instead |
|---|---|---|
| Ist die Immobilie aktuell mit einer Finanzierung belastet? (`d-belastet`, `dm-belastet`, `dk-belastet`) | Kauf, Modernisierung, Kapitalbeschaffung | gone; nothing gates a Darlehen list any more |
| Soll die bestehende Grundschuld übernommen werden? (`d-grundschuld-uebernahme`) | Kauf | gone (hung on belastet) |
| Fällt beim Kauf eine Maklergebühr an? (`d-makler`) | Neubau vom Bauträger, Kauf | gone; the amount is always shown, optional |
| Wissen Sie, wie hoch die Maklergebühren für das Grundstück sind? (`db-makler`) | Eigenes Bauvorhaben | gone; the amount is always shown, optional |
| Besitzen Sie das Grundstück bereits? (`db-grund`) | Eigenes Bauvorhaben | gone; one optional "Wie hoch ist der Kaufpreis des Grundstücks?" instead of the ist/war pair |
| Wie hoch war der Kaufpreis des Grundstücks? (`db-grundpreis-alt`) | Eigenes Bauvorhaben | merged into the one field above |
| Ist das Grundstück aktuell mit einer Finanzierung belastet? (`db-belastet`) | Eigenes Bauvorhaben | gone |
| Darlehen list for Modernisierung, Kapitalbeschaffung, Eigenes Bauvorhaben (`#c-dm-darlehen`, `#c-dk-darlehen`, `#c-db-darlehen`) | those three | gone — see "Open for the PO" |
| Wie hoch ist der Gesamtbedarf für die Anschlussfinanzierung? (`dan-bedarf`) | Anschlussfinanzierung | gone |
| Möchten Sie an der Immobilie Modernisierungen durchführen? (`d-modern`) + Wie hoch sind die Modernisierungskosten? (`d-modern-kosten`) | Kauf | gone |
| Möchten Sie Eigenleistung einbringen? (`d-eigenleistung`) + Wie viel Eigenleistung möchten Sie einbringen? (`d-eigenleistung-betrag`) | Kauf, Eigenes Bauvorhaben, Modernisierung | gone; Eigenleistung stays in the Objekt card "Modernisierung" |
| Möchten Sie einen Bausparvertrag einsetzen? (`d-bauspar`) | all | gone |
| Möchten Sie KfW-Fördermittel einbeziehen? (`d-kfw`) | all but Anschluss / Kapital | gone |

### Moved back to Finanzierungsobjekt (the Partner-App cards stay)

| V6 field in Finanzierungsdetails | V6.1 field in Finanzierungsobjekt |
|---|---|
| Wie hoch sind die Modernisierungskosten? (`dm-kosten`) | Modernisierungssumme (`m-kosten`, card "Modernisierung") |
| Wie viel Kapital wollen Sie aufnehmen? (`dk-kapital`) | Gewünschter Kapitalbetrag (`k-betrag`, card "Kapitalbeschaffung") |

### Kept in Finanzierungsdetails (CASE IO field exists)

Wie hoch ist der Kaufpreis? · Wie hoch ist der Kaufpreis des Grundstücks? (now optional) · Wie hoch sind die geschätzten Baukosten? · Maklergebühren %/€ + Betrag (Neubau, Kauf, Bauvorhaben; always visible, optional; for Kauf still hidden while no property is found) · Was ist der aktuelle Wert der Immobilie? · Wann haben Sie die Immobilie erworben? · Wie hoch war der Kaufpreis der Immobilie? · Wofür wird das Kapital verwendet? · Ist ein Tilgungssatzwechsel gewünscht? · Darlehen list for Anschlussfinanzierung (Darlehen 1 pre-added, 8 fields per card) · the shared block Eigenkapital, Rate, Laufzeit, Zinsbindung, Tilgungssatz, Sondertilgung, Notizen with their MAVS-1388 per-purpose rules.

## Finanzierungsobjekt

- The three cards **Anschlussfinanzierung** (Aktueller Darlehensgeber, Aktuelle Restschuld, Ende der Zinsbindung), **Modernisierung** (Modernisierungssumme, Eigenleistung) and **Kapitalbeschaffung** (Gewünschter Kapitalbetrag) are back, as in the Partner App today. Verwendungszweck is not on the Kapital card any more; it is asked in Finanzierungsdetails.
- **Anschlussfinanzierung** additionally shows the Immobilie and Immobilienmerkmale sections exactly as Kauf does (address always asked — the question "Entspricht die Adresse der Immobilie Ihrer Wohnadresse?" is not shown, as for Kauf; Objektdaten, Bauweise, Erbbaurecht, Stellplätze, Merkmale), plus its own card. This is the one `app.js` change: `syncImmobilienart()` opens the address block for `anschluss` like for `kauf`. For Anschlussfinanzierung the lender, remaining debt and end of fixed interest are therefore asked twice (card + Darlehen list) — the ticket accepts this.
- **Modernisierung** and **Kapitalbeschaffung** show only their card; the property sections are not shown for them (ticket read literally — V6 showed them).

## Decisions taken with Karin (12 Oct 2026)

1. Finanzierungsobjekt follows the ticket: cards restored, moved copies removed from Finanzierungsdetails.
2. Darlehen list: only where the ticket names a trigger that exists — Anschlussfinanzierung (always). For Modernisierung, Kapitalbeschaffung and Eigenes Bauvorhaben the only trigger named is "belastet = Ja", which is not added, so no list.
3. Property sections for Modernisierung / Kapitalbeschaffung: hidden.

## Open for the PO

- **Darlehen list for Modernisierung / Kapitalbeschaffung / Eigenes Bauvorhaben** — the ticket comment leaves this open ("show it always and optional, or leave it out"). V6.1 leaves it out. To show it always and optional: copy the `#c-dm-darlehen` / `#c-dk-darlehen` / `#c-db-darlehen` blocks from `v6/index.html` back into the purpose blocks **without** `data-gate` on the button; `wireDarlehenListen()` then pre-adds "Darlehen 1" like for Anschlussfinanzierung.
- **Maklergebühren for Kauf without a found property** — V6.1 keeps the MAVS-1388 rule and hides the row until "Haben Sie bereits eine Immobilie gefunden? = Ja" (`data-needs-object`). If the amount should show regardless, remove that attribute from the `d-makler-wert` field.
- The duplication for Anschlussfinanzierung (card + Darlehen list) and the "Kaufpreis des Grundstücks" that no longer says whether it was paid or is planned are both consequences of the ticket, not design decisions of the prototype.
