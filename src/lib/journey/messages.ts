/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - nutzer: vorname (Vorname), nachname (Nachname), art (Art), rolle (Rolle), berechtigungsstufe (Berechtigungsstufe)
 *   - regeln_und_grenzen: titel (Titel), beschreibung (Beschreibung), regeltyp (Regeltyp), status (Status)
 *   - vorhaben: titel (Titel), ziel (Ziel), fachlicher_kontext (Fachlicher Kontext), arbeitszustand (Arbeitszustand), verantwortlicher (Verantwortlicher)
 *   - aufgaben_und_ki_vorschlaege: vorhaben (Vorhaben), titel (Titel), quelle (Quelle), zustand (Zustand)
 *   - entscheidungen: vorhaben (Vorhaben), frage (Zu entscheidende Frage), alternativen (Alternativen), zustaendiger (Zuständiger), entscheidungsstatus (Entscheidungsstatus)
 *   - ergebnisse_und_folgen: entscheidung (Entscheidung), tatsaechliches_ergebnis (Tatsächliches Ergebnis), bewertung (Bewertung)
 *   - erfahrungen: vorhaben (Vorhaben), titel (Titel), art (Art der Erfahrung), beschreibung (Beschreibung), gueltigkeitsbereich (Gültigkeitsbereich), pruefstatus (Prüfstatus)
 *   - lernerkenntnisse: titel (Titel), erkenntnis (Erkenntnis), erfahrungen (Zugrunde liegende Erfahrungen), gueltigkeitsbereich (Gültigkeitsbereich), status (Status)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "nutzer": "vorname" | "nachname" | "email" | "art" | "rolle" | "berechtigungsstufe" | "fachgebiet" | "aktiv";
  "regeln_und_grenzen": "titel" | "beschreibung" | "regeltyp" | "geltungsbereich" | "erforderliche_rolle" | "verantwortlicher" | "gueltig_ab" | "gueltig_bis" | "status";
  "vorhaben": "titel" | "ziel" | "fachlicher_kontext" | "historische_entscheidungen" | "technische_besonderheiten" | "ansprechpartner" | "arbeitszustand" | "prioritaet" | "verantwortlicher" | "startdatum" | "zieldatum" | "naechster_schritt" | "uebergabehinweise";
  "aufgaben_und_ki_vorschlaege": "vorhaben" | "titel" | "beschreibung" | "quelle" | "vorschlagender" | "vorschlag_begruendung" | "zustand" | "pruefer" | "freigabedatum" | "geltende_regel" | "ausgefuehrte_aktion" | "ausfuehrungsdatum";
  "entscheidungen": "vorhaben" | "frage" | "alternativen" | "gesicherte_fakten" | "offene_annahmen" | "fehlende_informationen" | "konsequenzen" | "geltende_regel" | "zustaendiger" | "frist" | "gewaehlte_option" | "begruendung" | "umsetzungsplan" | "beschlussdatum" | "entscheidungsstatus";
  "ergebnisse_und_folgen": "entscheidung" | "aufgabe" | "erwartetes_ergebnis" | "tatsaechliches_ergebnis" | "abweichung" | "bewertung" | "messdatum" | "beobachter";
  "erfahrungen": "vorhaben" | "entscheidung" | "ergebnis" | "titel" | "art" | "beschreibung" | "gueltigkeitsbereich" | "voraussetzungen" | "dokumentierender" | "pruefstatus";
  "lernerkenntnisse": "titel" | "erkenntnis" | "erfahrungen" | "gueltigkeitsbereich" | "grenzen" | "empfehlung" | "pruefer" | "pruefdatum" | "status" | "wiederverwendungshinweis";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}
