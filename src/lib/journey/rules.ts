/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'nutzer' | 'regeln_und_grenzen' | 'vorhaben' | 'aufgaben_und_ki_vorschlaege' | 'entscheidungen' | 'ergebnisse_und_folgen' | 'erfahrungen' | 'lernerkenntnisse';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "nutzer": "vorname" | "nachname" | "email" | "fachgebiet";
  "regeln_und_grenzen": "titel" | "beschreibung" | "geltungsbereich";
  "vorhaben": "titel" | "ziel" | "fachlicher_kontext" | "historische_entscheidungen" | "technische_besonderheiten" | "ansprechpartner" | "naechster_schritt" | "uebergabehinweise";
  "aufgaben_und_ki_vorschlaege": "titel" | "beschreibung" | "vorschlag_begruendung" | "ausgefuehrte_aktion";
  "entscheidungen": "frage" | "alternativen" | "gesicherte_fakten" | "offene_annahmen" | "fehlende_informationen" | "konsequenzen" | "gewaehlte_option" | "begruendung" | "umsetzungsplan";
  "ergebnisse_und_folgen": "erwartetes_ergebnis" | "tatsaechliches_ergebnis" | "abweichung";
  "erfahrungen": "titel" | "beschreibung" | "gueltigkeitsbereich" | "voraussetzungen";
  "lernerkenntnisse": "titel" | "erkenntnis" | "gueltigkeitsbereich" | "grenzen" | "empfehlung" | "wiederverwendungshinweis";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "nutzer": never;
  "regeln_und_grenzen": "verantwortlicher";
  "vorhaben": "verantwortlicher";
  "aufgaben_und_ki_vorschlaege": "vorhaben" | "vorschlagender" | "pruefer" | "geltende_regel";
  "entscheidungen": "vorhaben" | "geltende_regel" | "zustaendiger";
  "ergebnisse_und_folgen": "entscheidung" | "aufgabe" | "beobachter";
  "erfahrungen": "vorhaben" | "entscheidung" | "ergebnis" | "dokumentierender";
  "lernerkenntnisse": "erfahrungen" | "pruefer";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it (`file` is upload-only, never via a journey). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "nutzer": {
    "key": "nutzer",
    "appId": "6ad74ab3e3e862f5a887d004",
    "label": "Nutzer",
    "pascal": "Nutzer",
    "single": "NutzerEntry"
  },
  "regeln_und_grenzen": {
    "key": "regeln_und_grenzen",
    "appId": "6ad74abac619f993646b2266",
    "label": "Regeln und Grenzen",
    "pascal": "RegelnUndGrenzen",
    "single": "RegelnUndGrenzenEntry"
  },
  "vorhaben": {
    "key": "vorhaben",
    "appId": "6ad74abc3ca3ed3613934f11",
    "label": "Vorhaben",
    "pascal": "Vorhaben",
    "single": "VorhabenEntry"
  },
  "aufgaben_und_ki_vorschlaege": {
    "key": "aufgaben_und_ki_vorschlaege",
    "appId": "6ad74abd21583e28b42e08b4",
    "label": "Aufgaben und KI-Vorschläge",
    "pascal": "AufgabenUndKiVorschlaege",
    "single": "AufgabenUndKiVorschlaegeEntry"
  },
  "entscheidungen": {
    "key": "entscheidungen",
    "appId": "6ad74abd2000289a051cb527",
    "label": "Entscheidungen",
    "pascal": "Entscheidungen",
    "single": "EntscheidungenEntry"
  },
  "ergebnisse_und_folgen": {
    "key": "ergebnisse_und_folgen",
    "appId": "6ad74abfab59dce91c85a89f",
    "label": "Ergebnisse und Folgen",
    "pascal": "ErgebnisseUndFolgen",
    "single": "ErgebnisseUndFolgenEntry"
  },
  "erfahrungen": {
    "key": "erfahrungen",
    "appId": "6ad74ac0daf4d5c322fca76d",
    "label": "Erfahrungen",
    "pascal": "Erfahrungen",
    "single": "ErfahrungenEntry"
  },
  "lernerkenntnisse": {
    "key": "lernerkenntnisse",
    "appId": "6ad74ac109e4aab7d2b4d8ed",
    "label": "Lernerkenntnisse",
    "pascal": "Lernerkenntnisse",
    "single": "LernerkenntnisseEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "nutzer": {
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "art": {
      "key": "art",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Art",
      "writable": true,
      "options": [
        "mensch",
        "ki_assistent"
      ]
    },
    "rolle": {
      "key": "rolle",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Rolle",
      "writable": true,
      "options": [
        "administrator",
        "projektverantwortlicher",
        "entscheider",
        "pruefer",
        "bearbeiter",
        "beobachter"
      ]
    },
    "berechtigungsstufe": {
      "key": "berechtigungsstufe",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Berechtigungsstufe",
      "writable": true,
      "options": [
        "freigeben",
        "verwalten",
        "lesen",
        "vorschlagen",
        "bearbeiten"
      ]
    },
    "fachgebiet": {
      "key": "fachgebiet",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Fachgebiet",
      "writable": true,
      "maxLength": 4000
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "regeln_und_grenzen": {
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Beschreibung",
      "writable": true
    },
    "regeltyp": {
      "key": "regeltyp",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Regeltyp",
      "writable": true,
      "options": [
        "regel",
        "grenze",
        "berechtigung",
        "informelle_regel"
      ]
    },
    "geltungsbereich": {
      "key": "geltungsbereich",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Geltungsbereich",
      "writable": true
    },
    "erforderliche_rolle": {
      "key": "erforderliche_rolle",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Erforderliche Rolle",
      "writable": true,
      "options": [
        "administrator",
        "projektverantwortlicher",
        "entscheider",
        "pruefer",
        "bearbeiter"
      ]
    },
    "verantwortlicher": {
      "key": "verantwortlicher",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Verantwortlicher",
      "writable": true,
      "targetAppId": "6ad74ab3e3e862f5a887d004",
      "targetEntity": "nutzer"
    },
    "gueltig_ab": {
      "key": "gueltig_ab",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig ab",
      "writable": true
    },
    "gueltig_bis": {
      "key": "gueltig_bis",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig bis",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "entwurf",
        "gueltig",
        "ausser_kraft"
      ]
    }
  },
  "vorhaben": {
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "ziel": {
      "key": "ziel",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Ziel",
      "writable": true
    },
    "fachlicher_kontext": {
      "key": "fachlicher_kontext",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Fachlicher Kontext",
      "writable": true
    },
    "historische_entscheidungen": {
      "key": "historische_entscheidungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Historische Entscheidungen und frühere Fehler",
      "writable": true
    },
    "technische_besonderheiten": {
      "key": "technische_besonderheiten",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Technische Besonderheiten",
      "writable": true
    },
    "ansprechpartner": {
      "key": "ansprechpartner",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Ansprechpartner",
      "writable": true,
      "autoComplete": "name"
    },
    "arbeitszustand": {
      "key": "arbeitszustand",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Arbeitszustand",
      "writable": true,
      "options": [
        "idee",
        "planung",
        "in_arbeit",
        "in_pruefung",
        "umgesetzt",
        "abgeschlossen",
        "pausiert"
      ]
    },
    "prioritaet": {
      "key": "prioritaet",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Priorität",
      "writable": true,
      "options": [
        "niedrig",
        "mittel",
        "hoch",
        "kritisch"
      ]
    },
    "verantwortlicher": {
      "key": "verantwortlicher",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Verantwortlicher",
      "writable": true,
      "targetAppId": "6ad74ab3e3e862f5a887d004",
      "targetEntity": "nutzer"
    },
    "startdatum": {
      "key": "startdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Startdatum",
      "writable": true
    },
    "zieldatum": {
      "key": "zieldatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Zieldatum",
      "writable": true
    },
    "naechster_schritt": {
      "key": "naechster_schritt",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Nächster Schritt",
      "writable": true
    },
    "uebergabehinweise": {
      "key": "uebergabehinweise",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Übergabehinweise",
      "writable": true
    }
  },
  "aufgaben_und_ki_vorschlaege": {
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6ad74abc3ca3ed3613934f11",
      "targetEntity": "vorhaben"
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "quelle": {
      "key": "quelle",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Quelle",
      "writable": true,
      "options": [
        "mensch",
        "ki_vorschlag"
      ]
    },
    "vorschlagender": {
      "key": "vorschlagender",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Vorschlagender",
      "writable": true,
      "targetAppId": "6ad74ab3e3e862f5a887d004",
      "targetEntity": "nutzer"
    },
    "vorschlag_begruendung": {
      "key": "vorschlag_begruendung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Vorschlag und Begründung",
      "writable": true
    },
    "zustand": {
      "key": "zustand",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Zustand",
      "writable": true,
      "options": [
        "vorgeschlagen",
        "geprueft",
        "freigegeben",
        "abgelehnt",
        "ausgefuehrt"
      ]
    },
    "pruefer": {
      "key": "pruefer",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Prüfer",
      "writable": true,
      "targetAppId": "6ad74ab3e3e862f5a887d004",
      "targetEntity": "nutzer"
    },
    "freigabedatum": {
      "key": "freigabedatum",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Freigabedatum",
      "writable": true
    },
    "geltende_regel": {
      "key": "geltende_regel",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Geltende Regel",
      "writable": true,
      "targetAppId": "6ad74abac619f993646b2266",
      "targetEntity": "regeln_und_grenzen"
    },
    "ausgefuehrte_aktion": {
      "key": "ausgefuehrte_aktion",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Ausgeführte Aktion",
      "writable": true
    },
    "ausfuehrungsdatum": {
      "key": "ausfuehrungsdatum",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Ausführungsdatum",
      "writable": true
    }
  },
  "entscheidungen": {
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6ad74abc3ca3ed3613934f11",
      "targetEntity": "vorhaben"
    },
    "frage": {
      "key": "frage",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Zu entscheidende Frage",
      "writable": true
    },
    "alternativen": {
      "key": "alternativen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Alternativen",
      "writable": true
    },
    "gesicherte_fakten": {
      "key": "gesicherte_fakten",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Gesicherte Fakten",
      "writable": true
    },
    "offene_annahmen": {
      "key": "offene_annahmen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Offene Annahmen",
      "writable": true
    },
    "fehlende_informationen": {
      "key": "fehlende_informationen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Fehlende Informationen",
      "writable": true
    },
    "konsequenzen": {
      "key": "konsequenzen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Konsequenzen der Optionen",
      "writable": true
    },
    "geltende_regel": {
      "key": "geltende_regel",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Geltende Regel",
      "writable": true,
      "targetAppId": "6ad74abac619f993646b2266",
      "targetEntity": "regeln_und_grenzen"
    },
    "zustaendiger": {
      "key": "zustaendiger",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Zuständiger",
      "writable": true,
      "targetAppId": "6ad74ab3e3e862f5a887d004",
      "targetEntity": "nutzer"
    },
    "frist": {
      "key": "frist",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Frist",
      "writable": true
    },
    "gewaehlte_option": {
      "key": "gewaehlte_option",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Gewählte Option",
      "writable": true
    },
    "begruendung": {
      "key": "begruendung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Begründung",
      "writable": true
    },
    "umsetzungsplan": {
      "key": "umsetzungsplan",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Was wird umgesetzt",
      "writable": true
    },
    "beschlussdatum": {
      "key": "beschlussdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Beschlussdatum",
      "writable": true
    },
    "entscheidungsstatus": {
      "key": "entscheidungsstatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Entscheidungsstatus",
      "writable": true,
      "options": [
        "in_vorbereitung",
        "entscheidungsreif",
        "entschieden",
        "umgesetzt",
        "verworfen"
      ]
    }
  },
  "ergebnisse_und_folgen": {
    "entscheidung": {
      "key": "entscheidung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Entscheidung",
      "writable": true,
      "targetAppId": "6ad74abd2000289a051cb527",
      "targetEntity": "entscheidungen"
    },
    "aufgabe": {
      "key": "aufgabe",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Aufgabe",
      "writable": true,
      "targetAppId": "6ad74abd21583e28b42e08b4",
      "targetEntity": "aufgaben_und_ki_vorschlaege"
    },
    "erwartetes_ergebnis": {
      "key": "erwartetes_ergebnis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Erwartetes Ergebnis",
      "writable": true
    },
    "tatsaechliches_ergebnis": {
      "key": "tatsaechliches_ergebnis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Tatsächliches Ergebnis",
      "writable": true
    },
    "abweichung": {
      "key": "abweichung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Abweichung",
      "writable": true
    },
    "bewertung": {
      "key": "bewertung",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Bewertung",
      "writable": true,
      "options": [
        "wie_erwartet",
        "besser",
        "schlechter"
      ]
    },
    "messdatum": {
      "key": "messdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Messdatum",
      "writable": true
    },
    "beobachter": {
      "key": "beobachter",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Beobachter",
      "writable": true,
      "targetAppId": "6ad74ab3e3e862f5a887d004",
      "targetEntity": "nutzer"
    }
  },
  "erfahrungen": {
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6ad74abc3ca3ed3613934f11",
      "targetEntity": "vorhaben"
    },
    "entscheidung": {
      "key": "entscheidung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Entscheidung",
      "writable": true,
      "targetAppId": "6ad74abd2000289a051cb527",
      "targetEntity": "entscheidungen"
    },
    "ergebnis": {
      "key": "ergebnis",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Ergebnis",
      "writable": true,
      "targetAppId": "6ad74abfab59dce91c85a89f",
      "targetEntity": "ergebnisse_und_folgen"
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "art": {
      "key": "art",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Art der Erfahrung",
      "writable": true,
      "options": [
        "loesungsweg",
        "frueherer_fehler",
        "technische_besonderheit",
        "informelle_regel",
        "ansprechpartner",
        "historische_entscheidung"
      ]
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Beschreibung",
      "writable": true
    },
    "gueltigkeitsbereich": {
      "key": "gueltigkeitsbereich",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Gültigkeitsbereich",
      "writable": true
    },
    "voraussetzungen": {
      "key": "voraussetzungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Voraussetzungen",
      "writable": true
    },
    "dokumentierender": {
      "key": "dokumentierender",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Dokumentierender",
      "writable": true,
      "targetAppId": "6ad74ab3e3e862f5a887d004",
      "targetEntity": "nutzer"
    },
    "pruefstatus": {
      "key": "pruefstatus",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Prüfstatus",
      "writable": true,
      "options": [
        "ungeprueft",
        "in_pruefung",
        "geprueft",
        "abgelehnt"
      ]
    }
  },
  "lernerkenntnisse": {
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "erkenntnis": {
      "key": "erkenntnis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Erkenntnis",
      "writable": true
    },
    "erfahrungen": {
      "key": "erfahrungen",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": true,
      "label": "Zugrunde liegende Erfahrungen",
      "writable": true,
      "targetAppId": "6ad74ac0daf4d5c322fca76d",
      "targetEntity": "erfahrungen"
    },
    "gueltigkeitsbereich": {
      "key": "gueltigkeitsbereich",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Gültigkeitsbereich",
      "writable": true
    },
    "grenzen": {
      "key": "grenzen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Grenzen",
      "writable": true
    },
    "empfehlung": {
      "key": "empfehlung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Empfehlung",
      "writable": true
    },
    "pruefer": {
      "key": "pruefer",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Prüfer",
      "writable": true,
      "targetAppId": "6ad74ab3e3e862f5a887d004",
      "targetEntity": "nutzer"
    },
    "pruefdatum": {
      "key": "pruefdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Prüfdatum",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "entwurf",
        "geprueft",
        "gueltig",
        "veraltet"
      ]
    },
    "wiederverwendungshinweis": {
      "key": "wiederverwendungshinweis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Wiederverwendungshinweis",
      "writable": true
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "nutzer": [
    {
      "kind": "choice",
      "field": "art",
      "count": 2
    },
    {
      "kind": "choice",
      "field": "rolle",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "berechtigungsstufe",
      "count": 5
    }
  ],
  "regeln_und_grenzen": [
    {
      "kind": "choice",
      "field": "regeltyp",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "erforderliche_rolle",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 3
    },
    {
      "kind": "record",
      "field": "verantwortlicher",
      "targetEntity": "nutzer"
    }
  ],
  "vorhaben": [
    {
      "kind": "choice",
      "field": "prioritaet",
      "count": 4
    },
    {
      "kind": "record",
      "field": "verantwortlicher",
      "targetEntity": "nutzer"
    }
  ],
  "aufgaben_und_ki_vorschlaege": [
    {
      "kind": "choice",
      "field": "quelle",
      "count": 2
    },
    {
      "kind": "choice",
      "field": "zustand",
      "count": 5
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "vorschlagender",
      "targetEntity": "nutzer"
    },
    {
      "kind": "record",
      "field": "pruefer",
      "targetEntity": "nutzer"
    },
    {
      "kind": "record",
      "field": "geltende_regel",
      "targetEntity": "regeln_und_grenzen"
    }
  ],
  "entscheidungen": [
    {
      "kind": "choice",
      "field": "entscheidungsstatus",
      "count": 5
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "geltende_regel",
      "targetEntity": "regeln_und_grenzen"
    },
    {
      "kind": "record",
      "field": "zustaendiger",
      "targetEntity": "nutzer"
    }
  ],
  "ergebnisse_und_folgen": [
    {
      "kind": "choice",
      "field": "bewertung",
      "count": 3
    },
    {
      "kind": "record",
      "field": "entscheidung",
      "targetEntity": "entscheidungen"
    },
    {
      "kind": "record",
      "field": "aufgabe",
      "targetEntity": "aufgaben_und_ki_vorschlaege"
    },
    {
      "kind": "record",
      "field": "beobachter",
      "targetEntity": "nutzer"
    }
  ],
  "erfahrungen": [
    {
      "kind": "choice",
      "field": "art",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "pruefstatus",
      "count": 4
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "entscheidung",
      "targetEntity": "entscheidungen"
    },
    {
      "kind": "record",
      "field": "ergebnis",
      "targetEntity": "ergebnisse_und_folgen"
    },
    {
      "kind": "record",
      "field": "dokumentierender",
      "targetEntity": "nutzer"
    }
  ],
  "lernerkenntnisse": [
    {
      "kind": "choice",
      "field": "status",
      "count": 4
    },
    {
      "kind": "record",
      "field": "erfahrungen",
      "targetEntity": "erfahrungen"
    },
    {
      "kind": "record",
      "field": "pruefer",
      "targetEntity": "nutzer"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "nutzer": [
    "vorname",
    "nachname"
  ],
  "regeln_und_grenzen": [
    "titel"
  ],
  "vorhaben": [
    "titel"
  ],
  "aufgaben_und_ki_vorschlaege": [
    "titel"
  ],
  "entscheidungen": [
    "frage"
  ],
  "ergebnisse_und_folgen": [
    "erwartetes_ergebnis"
  ],
  "erfahrungen": [
    "titel"
  ],
  "lernerkenntnisse": [
    "titel"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
function displayPart(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
