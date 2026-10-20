// Auto-generated. Per-entity form-enhancements config for "Ergebnisse und Folgen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["entscheidung", "aufgabe", "bewertung", {"row": ["messdatum", "beobachter"], "cols": "1fr 1fr"}, "tatsaechliches_ergebnis", "erwartetes_ergebnis", "abweichung"],
  defaults: {
    'messdatum': { kind: 'today' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
