// Auto-generated. Per-entity form-enhancements config for "Regeln und Grenzen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", {"row": ["regeltyp", "status"], "cols": "1fr 1fr"}, {"row": ["gueltig_ab", "gueltig_bis"], "cols": "1fr 1fr"}, {"row": ["erforderliche_rolle", "verantwortlicher"], "cols": "1fr 1fr"}, "beschreibung", "geltungsbereich"],
  defaults: {
    'gueltig_ab': { kind: 'today' },
    'status': { kind: 'lookup', key: 'entwurf', label: 'Entwurf' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
