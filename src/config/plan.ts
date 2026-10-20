// The orchestrator's plan, as far as the running app needs it
// (docs/orchestrator/SPEC.md). Generated — do not edit; regenerated on every
// build and update from the stored plan. Without a plan every map is empty.
//
//   SYSTEM_ASSIGNED entity → fields a tool fills when a record is CREATED — the
//                   value does not exist before; dialogs hide these on create and
//                   the form-polish sets no default on them. A scheduled or
//                   update-triggered tool owns its field but is NOT in here.
//   PLAN_SENTENCES  slug → the plan in the owner's words (flows' field page)
//
// The runtime write guard (FLOW_WRITES/OWNERSHIP, planGuard.ts) left on
// 23.09.2026: a flow page composes against its generated hook, whose submit
// plan IS the Schreibliste — there is no way to spell a write outside it.

export const SYSTEM_ASSIGNED: Record<string, string[]> = {
  "aufgaben_und_ki_vorschlaege": [
    "zustand"
  ]
};

export const PLAN_SENTENCES: Record<string, string[]> = {
  "vorhaben-anlegen": [
    "Legt an: vorhaben",
    "Automatisch: arbeitszustand (fester Wert „idee“)"
  ],
  "ki-vorschlag-pruefen": [
    "Ändert: aufgaben_und_ki_vorschlaege",
    "Automatisch: freigabedatum (aktueller Zeitpunkt, automatisch)"
  ],
  "aufgabe-ausfuehrung-festhalten": [
    "Ändert: aufgaben_und_ki_vorschlaege",
    "Automatisch: ausfuehrungsdatum (aktueller Zeitpunkt, automatisch)"
  ],
  "entscheidung-vorbereiten": [
    "Legt an: entscheidungen",
    "Automatisch: entscheidungsstatus (fester Wert „in_vorbereitung“)"
  ],
  "entscheidung-treffen": [
    "Ändert: entscheidungen",
    "Automatisch: beschlussdatum (heutiges Datum, automatisch), entscheidungsstatus (fester Wert „entschieden“)"
  ],
  "ergebnis-festhalten": [
    "Legt an: ergebnisse_und_folgen",
    "Ändert: entscheidungen",
    "Automatisch: messdatum (heutiges Datum, automatisch), entscheidungsstatus (fester Wert „umgesetzt“)"
  ]
};

export const PLAN_SUMMARY = "Das Arbeitsgedächtnis ist eine gemeinsame Arbeitsumgebung für Menschen und KI-Assistenten. Vorhaben bleiben mit Ziel, Kontext und Arbeitszustand dauerhaft verständlich. KI-Vorschläge werden geprüft und freigegeben, bevor etwas ausgeführt wird. Entscheidungen zeigen Frage, Alternativen, Fakten, Annahmen und geltende Regeln und werden mit ihren Ergebnissen verknüpft. Erfahrungen werden dokumentiert, geprüft und als Lernerkenntnisse für spätere Vorhaben nutzbar gemacht.";

/** slug → the lists a flow writes (the plan's Schreibliste). The nav leaves a
 *  flow out for a user who may not write one of them (lib/permissions.ts). */
export const FLOW_ENTITIES: Record<string, string[]> = {
  "vorhaben-anlegen": [
    "vorhaben"
  ],
  "ki-vorschlag-pruefen": [
    "aufgaben_und_ki_vorschlaege"
  ],
  "aufgabe-ausfuehrung-festhalten": [
    "aufgaben_und_ki_vorschlaege"
  ],
  "entscheidung-vorbereiten": [
    "entscheidungen"
  ],
  "entscheidung-treffen": [
    "entscheidungen"
  ],
  "ergebnis-festhalten": [
    "entscheidungen",
    "ergebnisse_und_folgen"
  ]
};
