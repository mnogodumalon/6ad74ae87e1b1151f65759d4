// Auto-generated. Per-entity form-enhancements config for "Entscheidungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["vorhaben", "frage", {"row": ["zustaendiger", "entscheidungsstatus"], "cols": "1fr 1fr"}, "alternativen", {"row": ["frist", "beschlussdatum"], "cols": "1fr 1fr"}, "geltende_regel", "gesicherte_fakten", "offene_annahmen", "fehlende_informationen", "konsequenzen", "gewaehlte_option", "begruendung", "umsetzungsplan"],
  defaults: {
    'entscheidungsstatus': { kind: 'lookup', key: 'in_vorbereitung', label: 'In Vorbereitung' },
    'frist': { kind: 'todayOffset', days: 14 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
