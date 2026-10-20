import type { EnrichedAufgabenUndKiVorschlaege, EnrichedEntscheidungen, EnrichedErfahrungen, EnrichedErgebnisseUndFolgen, EnrichedLernerkenntnisse, EnrichedRegelnUndGrenzen, EnrichedVorhaben } from '@/types/enriched';
import type { AufgabenUndKiVorschlaege, Entscheidungen, Erfahrungen, ErgebnisseUndFolgen, Lernerkenntnisse, Nutzer, RegelnUndGrenzen, Vorhaben } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface RegelnUndGrenzenMaps {
  nutzerMap: Map<string, Nutzer>;
}

export function enrichRegelnUndGrenzen(
  regelnUndGrenzen: RegelnUndGrenzen[],
  maps: RegelnUndGrenzenMaps
): EnrichedRegelnUndGrenzen[] {
  return regelnUndGrenzen.map(r => ({
    ...r,
    verantwortlicherName: resolveDisplay(r.fields.verantwortlicher, maps.nutzerMap, 'vorname', 'nachname'),
  }));
}

interface VorhabenMaps {
  nutzerMap: Map<string, Nutzer>;
}

export function enrichVorhaben(
  vorhaben: Vorhaben[],
  maps: VorhabenMaps
): EnrichedVorhaben[] {
  return vorhaben.map(r => ({
    ...r,
    verantwortlicherName: resolveDisplay(r.fields.verantwortlicher, maps.nutzerMap, 'vorname', 'nachname'),
  }));
}

interface AufgabenUndKiVorschlaegeMaps {
  vorhabenMap: Map<string, Vorhaben>;
  nutzerMap: Map<string, Nutzer>;
  regelnUndGrenzenMap: Map<string, RegelnUndGrenzen>;
}

export function enrichAufgabenUndKiVorschlaege(
  aufgabenUndKiVorschlaege: AufgabenUndKiVorschlaege[],
  maps: AufgabenUndKiVorschlaegeMaps
): EnrichedAufgabenUndKiVorschlaege[] {
  return aufgabenUndKiVorschlaege.map(r => ({
    ...r,
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'titel'),
    vorschlagenderName: resolveDisplay(r.fields.vorschlagender, maps.nutzerMap, 'vorname', 'nachname'),
    prueferName: resolveDisplay(r.fields.pruefer, maps.nutzerMap, 'vorname', 'nachname'),
    geltende_regelName: resolveDisplay(r.fields.geltende_regel, maps.regelnUndGrenzenMap, 'titel'),
  }));
}

interface EntscheidungenMaps {
  vorhabenMap: Map<string, Vorhaben>;
  regelnUndGrenzenMap: Map<string, RegelnUndGrenzen>;
  nutzerMap: Map<string, Nutzer>;
}

export function enrichEntscheidungen(
  entscheidungen: Entscheidungen[],
  maps: EntscheidungenMaps
): EnrichedEntscheidungen[] {
  return entscheidungen.map(r => ({
    ...r,
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'titel'),
    geltende_regelName: resolveDisplay(r.fields.geltende_regel, maps.regelnUndGrenzenMap, 'titel'),
    zustaendigerName: resolveDisplay(r.fields.zustaendiger, maps.nutzerMap, 'vorname', 'nachname'),
  }));
}

interface ErgebnisseUndFolgenMaps {
  entscheidungenMap: Map<string, Entscheidungen>;
  aufgabenUndKiVorschlaegeMap: Map<string, AufgabenUndKiVorschlaege>;
  nutzerMap: Map<string, Nutzer>;
}

export function enrichErgebnisseUndFolgen(
  ergebnisseUndFolgen: ErgebnisseUndFolgen[],
  maps: ErgebnisseUndFolgenMaps
): EnrichedErgebnisseUndFolgen[] {
  return ergebnisseUndFolgen.map(r => ({
    ...r,
    entscheidungName: resolveDisplay(r.fields.entscheidung, maps.entscheidungenMap, 'frage'),
    aufgabeName: resolveDisplay(r.fields.aufgabe, maps.aufgabenUndKiVorschlaegeMap, 'titel'),
    beobachterName: resolveDisplay(r.fields.beobachter, maps.nutzerMap, 'vorname', 'nachname'),
  }));
}

interface ErfahrungenMaps {
  vorhabenMap: Map<string, Vorhaben>;
  entscheidungenMap: Map<string, Entscheidungen>;
  ergebnisseUndFolgenMap: Map<string, ErgebnisseUndFolgen>;
  nutzerMap: Map<string, Nutzer>;
}

export function enrichErfahrungen(
  erfahrungen: Erfahrungen[],
  maps: ErfahrungenMaps
): EnrichedErfahrungen[] {
  return erfahrungen.map(r => ({
    ...r,
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'titel'),
    entscheidungName: resolveDisplay(r.fields.entscheidung, maps.entscheidungenMap, 'frage'),
    ergebnisName: resolveDisplay(r.fields.ergebnis, maps.ergebnisseUndFolgenMap, 'erwartetes_ergebnis'),
    dokumentierenderName: resolveDisplay(r.fields.dokumentierender, maps.nutzerMap, 'vorname', 'nachname'),
  }));
}

interface LernerkenntnisseMaps {
  erfahrungenMap: Map<string, Erfahrungen>;
  nutzerMap: Map<string, Nutzer>;
}

export function enrichLernerkenntnisse(
  lernerkenntnisse: Lernerkenntnisse[],
  maps: LernerkenntnisseMaps
): EnrichedLernerkenntnisse[] {
  return lernerkenntnisse.map(r => ({
    ...r,
    erfahrungenName: resolveDisplay(r.fields.erfahrungen, maps.erfahrungenMap, 'titel'),
    prueferName: resolveDisplay(r.fields.pruefer, maps.nutzerMap, 'vorname', 'nachname'),
  }));
}
