/**
 * useKiVorschlagErfassenFlow — the plumbing of the flow « KI-Vorschlag erfassen », generated from the plan.
 *
 * Writes `aufgaben_und_ki_vorschlaege`: asks `vorhaben`, `titel`, `beschreibung`, `quelle`, `vorschlagender`, `vorschlag_begruendung`, `geltende_regel`; sets `zustand` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 5)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useKiVorschlagErfassenFlow({
 *     steps: { vorhaben: 1, vorschlagender: 2, geltende_regel: 3, titel: 4, beschreibung: 4, quelle: 4, vorschlag_begruendung: 4 },
 *     items: { vorhaben: r => ({ id: r.id, title: fieldText(r, 'titel') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} />
 *     <EntitySelectStep {...flow.picks.vorschlagender.select} {...flow.pick('vorschlagender')} />
 *     <EntitySelectStep {...flow.picks.geltende_regel.select} {...flow.pick('geltende_regel')} />
 *     <Bound form={flow.forms.aufgaben_und_ki_vorschlaege} name="titel" />
 *     <Bound form={flow.forms.aufgaben_und_ki_vorschlaege} name="beschreibung" />
 *     <Bound form={flow.forms.aufgaben_und_ki_vorschlaege} name="quelle" />
 *     <Bound form={flow.forms.aufgaben_und_ki_vorschlaege} name="vorschlag_begruendung" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
export type KiVorschlagErfassenFieldKey = 'beschreibung' | 'geltende_regel' | 'quelle' | 'titel' | 'vorhaben' | 'vorschlag_begruendung' | 'vorschlagender';

export interface KiVorschlagErfassenForms {
  aufgaben_und_ki_vorschlaege: StepForm<'aufgaben_und_ki_vorschlaege'>;
}

// Alias so the option generics stay readable.
type Key = KiVorschlagErfassenFieldKey;

export interface KiVorschlagErfassenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    vorhaben?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    vorschlagender?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    geltende_regel?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"beschreibung": 4, "geltende_regel": 3, "quelle": 4, "titel": 4, "vorhaben": 1, "vorschlag_begruendung": 4, "vorschlagender": 2};
export const KIVORSCHLAGERFASSEN_REVIEW_STEP = 5;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useKiVorschlagErfassenFlow(options: KiVorschlagErfassenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const aufgaben_und_ki_vorschlaege = useStepForm('aufgaben_und_ki_vorschlaege', {
    fields: ["vorhaben", "titel", "beschreibung", "quelle", "vorschlagender", "vorschlag_begruendung", "geltende_regel"],
    steps: only(steps, ["vorhaben", "titel", "beschreibung", "quelle", "vorschlagender", "vorschlag_begruendung", "geltende_regel"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["vorhaben", "titel", "beschreibung", "quelle", "vorschlagender", "vorschlag_begruendung", "geltende_regel"]),
    messages: only(options.messages as Record<string, string> | undefined, ["vorhaben", "titel", "beschreibung", "quelle", "vorschlagender", "vorschlag_begruendung", "geltende_regel"]),
  });
  const forms: KiVorschlagErfassenForms = { aufgaben_und_ki_vorschlaege };
  const formList: StepForm[] = [aufgaben_und_ki_vorschlaege];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    vorhaben: useRecordSearch(servicePort, 'vorhaben', withPickPolicy('vorhaben', {
      searchFields: ["titel"] as never,
      filter: "r.v_arbeitszustand not in ['abgeschlossen', 'pausiert']",
      where: (r: JourneyRecord) => !["abgeschlossen", "pausiert"].includes(fieldLookup(r, "arbeitszustand")?.key ?? ''),
      toItem: options.items?.vorhaben as never,
    })),
    vorschlagender: useRecordSearch(servicePort, 'nutzer', withPickPolicy('vorschlagender', {
      searchFields: ["vorname", "nachname"] as never,
      toItem: options.items?.vorschlagender as never,
    })),
    geltende_regel: useRecordSearch(servicePort, 'regeln_und_grenzen', withPickPolicy('geltende_regel', {
      searchFields: ["titel", "geltungsbereich"] as never,
      filter: "r.v_status == 'gueltig'",
      where: (r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) === "gueltig",
      toItem: options.items?.geltende_regel as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:ki-vorschlag-erfassen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:ki-vorschlag-erfassen:write:${entity}.${field}`,
  });
  const picks = {
    vorhaben: { ...searches.vorhaben, select: { ...searches.vorhaben.select, create: false as boolean, hint: hintFor('vorhaben', 'vorhaben', {"conditions": [{"field": "arbeitszustand", "op": "not_in", "value": ["abgeschlossen", "pausiert"]}], "mode": "all"} as PickWhere | null) } },
    vorschlagender: { ...searches.vorschlagender, select: { ...searches.vorschlagender.select, create: false as boolean, hint: hintFor('vorschlagender', 'nutzer', null as PickWhere | null) } },
    geltende_regel: { ...searches.geltende_regel, select: { ...searches.geltende_regel.select, create: false as boolean, hint: hintFor('geltende_regel', 'regeln_und_grenzen', {"conditions": [{"field": "status", "op": "eq", "value": "gueltig"}], "mode": "all"} as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'aufgaben_und_ki_vorschlaege', entity: 'aufgaben_und_ki_vorschlaege', form: aufgaben_und_ki_vorschlaege, primary: true,
      values: (): FormValues => ({
        zustand: policyFixedValue('aufgaben_und_ki_vorschlaege', 'zustand') ?? "vorgeschlagen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('aufgaben_und_ki_vorschlaege', 'zustand', policyFixedValue('aufgaben_und_ki_vorschlaege', 'zustand') ?? "vorgeschlagen")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'ki-vorschlag-erfassen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: KiVorschlagErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id)),
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: KiVorschlagErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'ki-vorschlag-erfassen' as const,
    draftKey: 'ki-vorschlag-erfassen' as const,
    entity: 'aufgaben_und_ki_vorschlaege' as const,
    form: aufgaben_und_ki_vorschlaege,
    forms, formList, picks, submit, steps,    reviewStep: KIVORSCHLAGERFASSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type KiVorschlagErfassenFlow = ReturnType<typeof useKiVorschlagErfassenFlow>;
