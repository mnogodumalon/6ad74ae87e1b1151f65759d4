// Auto-generated. Per-entity form-enhancements config for "Aufgaben und KI-Vorschläge".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "vorhaben", {"row": ["quelle", "zustand"], "cols": "1fr 1fr"}, {"row": ["vorschlagender", "pruefer"], "cols": "1fr 1fr"}, "geltende_regel", {"row": ["freigabedatum", "ausfuehrungsdatum"], "cols": "1fr 1fr"}, "beschreibung", "vorschlag_begruendung", "ausgefuehrte_aktion"],
  defaults: {
    'zustand': { kind: 'lookup', key: 'vorgeschlagen', label: 'Vorgeschlagen' },
    'quelle': { kind: 'lookup', key: 'mensch', label: 'Mensch' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
