import type { AufgabenUndKiVorschlaege, Entscheidungen, Erfahrungen, ErgebnisseUndFolgen, Lernerkenntnisse, RegelnUndGrenzen, Vorhaben } from './app';

export type EnrichedRegelnUndGrenzen = RegelnUndGrenzen & {
  verantwortlicherName: string;
};

export type EnrichedVorhaben = Vorhaben & {
  verantwortlicherName: string;
};

export type EnrichedAufgabenUndKiVorschlaege = AufgabenUndKiVorschlaege & {
  vorhabenName: string;
  vorschlagenderName: string;
  prueferName: string;
  geltende_regelName: string;
};

export type EnrichedEntscheidungen = Entscheidungen & {
  vorhabenName: string;
  geltende_regelName: string;
  zustaendigerName: string;
};

export type EnrichedErgebnisseUndFolgen = ErgebnisseUndFolgen & {
  entscheidungName: string;
  aufgabeName: string;
  beobachterName: string;
};

export type EnrichedErfahrungen = Erfahrungen & {
  vorhabenName: string;
  entscheidungName: string;
  ergebnisName: string;
  dokumentierenderName: string;
};

export type EnrichedLernerkenntnisse = Lernerkenntnisse & {
  erfahrungenName: string;
  prueferName: string;
};
