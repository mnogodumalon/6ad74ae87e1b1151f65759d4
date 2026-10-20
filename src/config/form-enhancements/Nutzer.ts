// Auto-generated. Per-entity form-enhancements config for "Nutzer".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["vorname", "nachname"]}, "art", {"row": ["rolle", "berechtigungsstufe"], "cols": "1fr 1fr"}, "email", "fachgebiet", "aktiv"],
  defaults: {
    'aktiv': { kind: 'literal', value: true },
    'art': { kind: 'lookup', key: 'mensch', label: 'Mensch' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
