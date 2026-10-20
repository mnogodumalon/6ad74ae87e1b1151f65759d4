// Auto-generated. Per-entity form-enhancements config for "Vorhaben".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", {"row": ["arbeitszustand", "prioritaet"], "cols": "1fr 1fr"}, "verantwortlicher", {"row": ["startdatum", "zieldatum"], "cols": "1fr 1fr"}, "ziel", "fachlicher_kontext", "historische_entscheidungen", "technische_besonderheiten", "ansprechpartner", "naechster_schritt", "uebergabehinweise"],
  defaults: {
    'arbeitszustand': { kind: 'lookup', key: 'idee', label: 'Idee' },
    'prioritaet': { kind: 'lookup', key: 'mittel', label: 'Mittel' },
    'startdatum': { kind: 'today' },
  },
  computed: {
    '_vorhaben_dauer_tage': { kind: 'dateDiff', from: 'startdatum', to: 'zieldatum', unit: 'days' },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
