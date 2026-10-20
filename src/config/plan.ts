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

export const SYSTEM_ASSIGNED: Record<string, string[]> = {};

export const PLAN_SENTENCES: Record<string, string[]> = {
  "vorhaben-anlegen": [
    "Legt an: vorhaben",
    "Automatisch: arbeitszustand (fester Wert „idee“)"
  ],
  "ki-vorschlag-erfassen": [
    "Legt an: aufgaben_und_ki_vorschlaege",
    "Automatisch: zustand (fester Wert „vorgeschlagen“)"
  ],
  "vorschlag-pruefen": [
    "Ändert: aufgaben_und_ki_vorschlaege",
    "Automatisch: freigabedatum (aktueller Zeitpunkt, automatisch)"
  ],
  "aktion-ausfuehren": [
    "Ändert: aufgaben_und_ki_vorschlaege",
    "Automatisch: ausfuehrungsdatum (aktueller Zeitpunkt, automatisch), zustand (fester Wert „ausgefuehrt“)"
  ],
  "entscheidung-vorbereiten": [
    "Legt an: entscheidungen",
    "Automatisch: entscheidungsstatus (fester Wert „in_vorbereitung“)"
  ],
  "entscheidung-beschliessen": [
    "Ändert: entscheidungen",
    "Automatisch: beschlussdatum (heutiges Datum, automatisch), entscheidungsstatus (fester Wert „entschieden“)"
  ]
};

export const PLAN_SUMMARY = "Die Anwendung ist ein gemeinsames Arbeitsgedächtnis für Menschen und KI. Vorhaben behalten ihren fachlichen Kontext und ihren Arbeitszustand. KI-Vorschläge werden geprüft, bevor sie ausgeführt werden. Entscheidungen werden mit Frage, Alternativen, Fakten, Annahmen und Regeln vorbereitet und mit ihren tatsächlichen Ergebnissen verbunden. Erfahrungen werden dokumentiert, geprüft und zu wiederverwendbaren Lernerkenntnissen verdichtet.";

/** slug → the lists a flow writes (the plan's Schreibliste). The nav leaves a
 *  flow out for a user who may not write one of them (lib/permissions.ts). */
export const FLOW_ENTITIES: Record<string, string[]> = {
  "vorhaben-anlegen": [
    "vorhaben"
  ],
  "ki-vorschlag-erfassen": [
    "aufgaben_und_ki_vorschlaege"
  ],
  "vorschlag-pruefen": [
    "aufgaben_und_ki_vorschlaege"
  ],
  "aktion-ausfuehren": [
    "aufgaben_und_ki_vorschlaege"
  ],
  "entscheidung-vorbereiten": [
    "entscheidungen"
  ],
  "entscheidung-beschliessen": [
    "entscheidungen"
  ]
};
