// Auto-generated. Per-entity form-enhancements config for "Erfahrungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "vorhaben", {"row": ["art", "pruefstatus"], "cols": "1fr 1fr"}, {"row": ["entscheidung", "ergebnis"], "cols": "1fr 1fr"}, "dokumentierender", "beschreibung", "gueltigkeitsbereich", "voraussetzungen"],
  defaults: {
    'pruefstatus': { kind: 'lookup', key: 'ungeprueft', label: 'Ungeprüft' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
