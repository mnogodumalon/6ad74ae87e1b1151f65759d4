/**
 * Occupancy semantics — DECIDED BY THE BUILD AGENT, never by a heuristic.
 *
 * The Phase-2 orchestrator writes its decision to `.intents-staging/occupancy.json`
 * (stay pair, booked resource, statuses that do not occupy); the integration
 * step validates it against the app metadata and renders it into the block
 * below. Scaffold updates keep the block. Do not edit outside the markers.
 *
 * Both doors read this and nothing else: `occupancyFor` (internal flows AND
 * public pages) and the owner service (the public grant's occupancy read).
 * No rule for an entity = no availability calendar, no occupancy claim —
 * a plain date field pair is shown instead.
 *
 * Facts from the metadata — candidates, NOT decisions:
 *   - nutzer: lookups art[mensch|ki_assistent], rolle[administrator|projektverantwortlicher|entscheider|pruefer|bearbeiter|beobachter], berechtigungsstufe[freigeben|verwalten|lesen|vorschlagen|bearbeiten]
 *   - regeln_und_grenzen: applookups verantwortlicher→nutzer · lookups regeltyp[regel|grenze|berechtigung|informelle_regel], erforderliche_rolle[administrator|projektverantwortlicher|entscheider|pruefer|bearbeiter], status[entwurf|gueltig|ausser_kraft]
 *   - vorhaben: applookups verantwortlicher→nutzer · lookups arbeitszustand[idee|planung|in_arbeit|in_pruefung|umgesetzt|abgeschlossen|pausiert], prioritaet[niedrig|mittel|hoch|kritisch]
 *   - aufgaben_und_ki_vorschlaege: applookups vorhaben→vorhaben, vorschlagender→nutzer, pruefer→nutzer, geltende_regel→regeln_und_grenzen · lookups quelle[mensch|ki_vorschlag], zustand[vorgeschlagen|geprueft|freigegeben|abgelehnt|ausgefuehrt]
 *   - entscheidungen: applookups vorhaben→vorhaben, geltende_regel→regeln_und_grenzen, zustaendiger→nutzer · lookups entscheidungsstatus[in_vorbereitung|entscheidungsreif|entschieden|umgesetzt|verworfen]
 *   - ergebnisse_und_folgen: applookups entscheidung→entscheidungen, aufgabe→aufgaben_und_ki_vorschlaege, beobachter→nutzer · lookups bewertung[wie_erwartet|besser|schlechter]
 *   - erfahrungen: applookups vorhaben→vorhaben, entscheidung→entscheidungen, ergebnis→ergebnisse_und_folgen, dokumentierender→nutzer · lookups art[loesungsweg|frueherer_fehler|technische_besonderheit|informelle_regel|ansprechpartner|historische_entscheidung], pruefstatus[ungeprueft|in_pruefung|geprueft|abgelehnt]
 *   - lernerkenntnisse: applookups erfahrungen→erfahrungen, pruefer→nutzer · lookups status[entwurf|geprueft|gueltig|veraltet]
 */
import type { EntityKey } from '@/lib/journey/rules';

export interface OccupancyRule {
  /** Arrival / departure fields (the departure day is exclusive). */
  from: string;
  to: string;
  /** applookup field naming the booked RESOURCE (room, vehicle, court).
   *  Omit when the entity itself is the one resource (a single holiday flat). */
  resource?: string;
  /** lookup field + the keys that mean "does NOT occupy" (cancelled, no-show). */
  statusField?: string;
  freeKeys?: string[];
}

export const OCCUPANCY: Partial<Record<EntityKey, OccupancyRule>> = {
  // <custom:occupancy>
  // </custom:occupancy>
};

/**
 * A record of the KEY entity is TAKEN while a record of `entity` points at it
 * through `field` — a slot with a booking, a seat with a ticket. Generated
 * from the plan's blocking `unique` check on that reference (05.10.2026:
 * the salon's public page offered booked slots again). Pickers on both
 * doors leave taken records out (useRecordSearch); a public page reads only
 * `field` of `entity` — never who booked. Generator-owned: no markers.
 */
export interface TakenRule {
  entity: EntityKey;
  field: string;
}

export const TAKEN_BY: Partial<Record<EntityKey, TakenRule>> = {
};
