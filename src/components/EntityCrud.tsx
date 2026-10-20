/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'nutzer'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.nutzer.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.nutzer.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.nutzer.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.nutzer              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   nutzer: vorname, nachname, email, art, rolle, berechtigungsstufe, fachgebiet, aktiv  ·  ← regeln_und_grenzen (list + contextual +) · ← vorhaben (list + contextual +) · ← aufgaben_und_ki_vorschlaege (list + contextual +) · ← aufgaben_und_ki_vorschlaege (list + contextual +) · ← entscheidungen (list + contextual +) · ← ergebnisse_und_folgen (list + contextual +) · ← erfahrungen (list + contextual +) · ← lernerkenntnisse (list + contextual +)
 *   regeln_und_grenzen: titel, beschreibung, regeltyp, geltungsbereich, erforderliche_rolle, verantwortlicher, gueltig_ab, gueltig_bis, …  ·  → nutzer · ← aufgaben_und_ki_vorschlaege (list + contextual +) · ← entscheidungen (list + contextual +)
 *   vorhaben: titel, ziel, fachlicher_kontext, historische_entscheidungen, technische_besonderheiten, ansprechpartner, arbeitszustand, prioritaet, …  ·  → nutzer · ← aufgaben_und_ki_vorschlaege (list + contextual +) · ← entscheidungen (list + contextual +) · ← erfahrungen (list + contextual +)
 *   aufgaben_und_ki_vorschlaege: vorhaben, titel, beschreibung, quelle, vorschlagender, vorschlag_begruendung, zustand, pruefer, …  ·  → vorhaben · → nutzer · → regeln_und_grenzen · ← ergebnisse_und_folgen (list + contextual +)
 *   entscheidungen: vorhaben, frage, alternativen, gesicherte_fakten, offene_annahmen, fehlende_informationen, konsequenzen, geltende_regel, …  ·  → vorhaben · → regeln_und_grenzen · → nutzer · ← ergebnisse_und_folgen (list + contextual +) · ← erfahrungen (list + contextual +)
 *   ergebnisse_und_folgen: entscheidung, aufgabe, erwartetes_ergebnis, tatsaechliches_ergebnis, abweichung, bewertung, messdatum, beobachter  ·  → entscheidungen · → aufgaben_und_ki_vorschlaege · → nutzer · ← erfahrungen (list + contextual +)
 *   erfahrungen: vorhaben, entscheidung, ergebnis, titel, art, beschreibung, gueltigkeitsbereich, voraussetzungen, …  ·  → vorhaben · → entscheidungen · → ergebnisse_und_folgen · → nutzer · ← lernerkenntnisse (list + contextual + + choose existing)
 *   lernerkenntnisse: titel, erkenntnis, erfahrungen, gueltigkeitsbereich, grenzen, empfehlung, pruefer, pruefdatum, …  ·  → erfahrungen · → nutzer
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Nutzer, RegelnUndGrenzen, Vorhaben, AufgabenUndKiVorschlaege, Entscheidungen, ErgebnisseUndFolgen, Erfahrungen, Lernerkenntnisse } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordIds } from '@/services/livingAppsService';
import { enrichRegelnUndGrenzen, enrichVorhaben, enrichAufgabenUndKiVorschlaege, enrichEntscheidungen, enrichErgebnisseUndFolgen, enrichErfahrungen, enrichLernerkenntnisse } from '@/lib/enrich';
import type { EnrichedRegelnUndGrenzen, EnrichedVorhaben, EnrichedAufgabenUndKiVorschlaege, EnrichedEntscheidungen, EnrichedErgebnisseUndFolgen, EnrichedErfahrungen, EnrichedLernerkenntnisse } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { NutzerDialog, type NutzerDialogDefaults } from '@/components/dialogs/NutzerDialog';
import { NutzerDetails } from '@/components/details/NutzerDetails';
import { RegelnUndGrenzenDialog, type RegelnUndGrenzenDialogDefaults } from '@/components/dialogs/RegelnUndGrenzenDialog';
import { RegelnUndGrenzenDetails } from '@/components/details/RegelnUndGrenzenDetails';
import { VorhabenDialog, type VorhabenDialogDefaults } from '@/components/dialogs/VorhabenDialog';
import { VorhabenDetails } from '@/components/details/VorhabenDetails';
import { AufgabenUndKiVorschlaegeDialog, type AufgabenUndKiVorschlaegeDialogDefaults } from '@/components/dialogs/AufgabenUndKiVorschlaegeDialog';
import { AufgabenUndKiVorschlaegeDetails } from '@/components/details/AufgabenUndKiVorschlaegeDetails';
import { EntscheidungenDialog, type EntscheidungenDialogDefaults } from '@/components/dialogs/EntscheidungenDialog';
import { EntscheidungenDetails } from '@/components/details/EntscheidungenDetails';
import { ErgebnisseUndFolgenDialog, type ErgebnisseUndFolgenDialogDefaults } from '@/components/dialogs/ErgebnisseUndFolgenDialog';
import { ErgebnisseUndFolgenDetails } from '@/components/details/ErgebnisseUndFolgenDetails';
import { ErfahrungenDialog, type ErfahrungenDialogDefaults } from '@/components/dialogs/ErfahrungenDialog';
import { ErfahrungenDetails } from '@/components/details/ErfahrungenDetails';
import { LernerkenntnisseDialog, type LernerkenntnisseDialogDefaults } from '@/components/dialogs/LernerkenntnisseDialog';
import { LernerkenntnisseDetails } from '@/components/details/LernerkenntnisseDetails';
import { PickExistingDialog } from '@/components/PickExistingDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'nutzer'; record: Nutzer }
  | { type: 'regelnUndGrenzen'; record: EnrichedRegelnUndGrenzen }
  | { type: 'vorhaben'; record: EnrichedVorhaben }
  | { type: 'aufgabenUndKiVorschlaege'; record: EnrichedAufgabenUndKiVorschlaege }
  | { type: 'entscheidungen'; record: EnrichedEntscheidungen }
  | { type: 'ergebnisseUndFolgen'; record: EnrichedErgebnisseUndFolgen }
  | { type: 'erfahrungen'; record: EnrichedErfahrungen }
  | { type: 'lernerkenntnisse'; record: EnrichedLernerkenntnisse };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  nutzer: EntityCrudApi<Nutzer, NutzerDialogDefaults>;
  regelnUndGrenzen: EntityCrudApi<RegelnUndGrenzen, RegelnUndGrenzenDialogDefaults>;
  vorhaben: EntityCrudApi<Vorhaben, VorhabenDialogDefaults>;
  aufgabenUndKiVorschlaege: EntityCrudApi<AufgabenUndKiVorschlaege, AufgabenUndKiVorschlaegeDialogDefaults>;
  entscheidungen: EntityCrudApi<Entscheidungen, EntscheidungenDialogDefaults>;
  ergebnisseUndFolgen: EntityCrudApi<ErgebnisseUndFolgen, ErgebnisseUndFolgenDialogDefaults>;
  erfahrungen: EntityCrudApi<Erfahrungen, ErfahrungenDialogDefaults>;
  lernerkenntnisse: EntityCrudApi<Lernerkenntnisse, LernerkenntnisseDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { nutzer: Nutzer[]; regelnUndGrenzen: EnrichedRegelnUndGrenzen[]; vorhaben: EnrichedVorhaben[]; aufgabenUndKiVorschlaege: EnrichedAufgabenUndKiVorschlaege[]; entscheidungen: EnrichedEntscheidungen[]; ergebnisseUndFolgen: EnrichedErgebnisseUndFolgen[]; erfahrungen: EnrichedErfahrungen[]; lernerkenntnisse: EnrichedLernerkenntnisse[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [nutzerDialog, setNutzerDialog] = useState<{ defaults?: NutzerDialogDefaults; editing?: Nutzer } | null>(null);
  const [regelnUndGrenzenDialog, setRegelnUndGrenzenDialog] = useState<{ defaults?: RegelnUndGrenzenDialogDefaults; editing?: RegelnUndGrenzen } | null>(null);
  const [vorhabenDialog, setVorhabenDialog] = useState<{ defaults?: VorhabenDialogDefaults; editing?: Vorhaben } | null>(null);
  const [aufgabenUndKiVorschlaegeDialog, setAufgabenUndKiVorschlaegeDialog] = useState<{ defaults?: AufgabenUndKiVorschlaegeDialogDefaults; editing?: AufgabenUndKiVorschlaege } | null>(null);
  const [entscheidungenDialog, setEntscheidungenDialog] = useState<{ defaults?: EntscheidungenDialogDefaults; editing?: Entscheidungen } | null>(null);
  const [ergebnisseUndFolgenDialog, setErgebnisseUndFolgenDialog] = useState<{ defaults?: ErgebnisseUndFolgenDialogDefaults; editing?: ErgebnisseUndFolgen } | null>(null);
  const [erfahrungenDialog, setErfahrungenDialog] = useState<{ defaults?: ErfahrungenDialogDefaults; editing?: Erfahrungen } | null>(null);
  const [lernerkenntnisseDialog, setLernerkenntnisseDialog] = useState<{ defaults?: LernerkenntnisseDialogDefaults; editing?: Lernerkenntnisse } | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug lernerkenntnisse.erfahrungen → erfahrungen: hält die Hub-record_id.
  const [pickErfahrungenLernerkenntnisse, setPickErfahrungenLernerkenntnisse] = useState<string | null>(null);
  const enrichedRegelnUndGrenzen = useMemo(() => enrichRegelnUndGrenzen(data.regelnUndGrenzen, { nutzerMap: data.nutzerMap }), [data.regelnUndGrenzen, data.nutzerMap]);
  const enrichedVorhaben = useMemo(() => enrichVorhaben(data.vorhaben, { nutzerMap: data.nutzerMap }), [data.vorhaben, data.nutzerMap]);
  const enrichedAufgabenUndKiVorschlaege = useMemo(() => enrichAufgabenUndKiVorschlaege(data.aufgabenUndKiVorschlaege, { vorhabenMap: data.vorhabenMap, nutzerMap: data.nutzerMap, regelnUndGrenzenMap: data.regelnUndGrenzenMap }), [data.aufgabenUndKiVorschlaege, data.vorhabenMap, data.nutzerMap, data.regelnUndGrenzenMap]);
  const enrichedEntscheidungen = useMemo(() => enrichEntscheidungen(data.entscheidungen, { vorhabenMap: data.vorhabenMap, regelnUndGrenzenMap: data.regelnUndGrenzenMap, nutzerMap: data.nutzerMap }), [data.entscheidungen, data.vorhabenMap, data.regelnUndGrenzenMap, data.nutzerMap]);
  const enrichedErgebnisseUndFolgen = useMemo(() => enrichErgebnisseUndFolgen(data.ergebnisseUndFolgen, { entscheidungenMap: data.entscheidungenMap, aufgabenUndKiVorschlaegeMap: data.aufgabenUndKiVorschlaegeMap, nutzerMap: data.nutzerMap }), [data.ergebnisseUndFolgen, data.entscheidungenMap, data.aufgabenUndKiVorschlaegeMap, data.nutzerMap]);
  const enrichedErfahrungen = useMemo(() => enrichErfahrungen(data.erfahrungen, { vorhabenMap: data.vorhabenMap, entscheidungenMap: data.entscheidungenMap, ergebnisseUndFolgenMap: data.ergebnisseUndFolgenMap, nutzerMap: data.nutzerMap }), [data.erfahrungen, data.vorhabenMap, data.entscheidungenMap, data.ergebnisseUndFolgenMap, data.nutzerMap]);
  const enrichedLernerkenntnisse = useMemo(() => enrichLernerkenntnisse(data.lernerkenntnisse, { erfahrungenMap: data.erfahrungenMap, nutzerMap: data.nutzerMap }), [data.lernerkenntnisse, data.erfahrungenMap, data.nutzerMap]);

  function detailNutzer(record: Nutzer, push = false) {
    const item: OverlayItem = { type: 'nutzer', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitNutzer(fields: Nutzer['fields']) {
    const editing = nutzerDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setNutzer(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateNutzerEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('nutzer')} — ${t('crud_updated')}`, async () => {
        data.setNutzer(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateNutzerEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createNutzerEntry(fields);
      undoToast(`${appLabel('nutzer')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailRegelnUndGrenzen(record: RegelnUndGrenzen, push = false) {
    const rec = enrichedRegelnUndGrenzen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'regelnUndGrenzen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitRegelnUndGrenzen(fields: RegelnUndGrenzen['fields']) {
    const editing = regelnUndGrenzenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setRegelnUndGrenzen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateRegelnUndGrenzenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('regeln_und_grenzen')} — ${t('crud_updated')}`, async () => {
        data.setRegelnUndGrenzen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateRegelnUndGrenzenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createRegelnUndGrenzenEntry(fields);
      undoToast(`${appLabel('regeln_und_grenzen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailVorhaben(record: Vorhaben, push = false) {
    const rec = enrichedVorhaben.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'vorhaben', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitVorhaben(fields: Vorhaben['fields']) {
    const editing = vorhabenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setVorhaben(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateVorhabenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('vorhaben')} — ${t('crud_updated')}`, async () => {
        data.setVorhaben(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateVorhabenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createVorhabenEntry(fields);
      undoToast(`${appLabel('vorhaben')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailAufgabenUndKiVorschlaege(record: AufgabenUndKiVorschlaege, push = false) {
    const rec = enrichedAufgabenUndKiVorschlaege.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'aufgabenUndKiVorschlaege', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAufgabenUndKiVorschlaege(fields: AufgabenUndKiVorschlaege['fields']) {
    const editing = aufgabenUndKiVorschlaegeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAufgabenUndKiVorschlaege(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAufgabenUndKiVorschlaegeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('aufgaben_und_ki_vorschlaege')} — ${t('crud_updated')}`, async () => {
        data.setAufgabenUndKiVorschlaege(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAufgabenUndKiVorschlaegeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAufgabenUndKiVorschlaegeEntry(fields);
      undoToast(`${appLabel('aufgaben_und_ki_vorschlaege')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailEntscheidungen(record: Entscheidungen, push = false) {
    const rec = enrichedEntscheidungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'entscheidungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEntscheidungen(fields: Entscheidungen['fields']) {
    const editing = entscheidungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEntscheidungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEntscheidungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('entscheidungen')} — ${t('crud_updated')}`, async () => {
        data.setEntscheidungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEntscheidungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createEntscheidungenEntry(fields);
      undoToast(`${appLabel('entscheidungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailErgebnisseUndFolgen(record: ErgebnisseUndFolgen, push = false) {
    const rec = enrichedErgebnisseUndFolgen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'ergebnisseUndFolgen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitErgebnisseUndFolgen(fields: ErgebnisseUndFolgen['fields']) {
    const editing = ergebnisseUndFolgenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setErgebnisseUndFolgen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateErgebnisseUndFolgenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('ergebnisse_und_folgen')} — ${t('crud_updated')}`, async () => {
        data.setErgebnisseUndFolgen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateErgebnisseUndFolgenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createErgebnisseUndFolgenEntry(fields);
      undoToast(`${appLabel('ergebnisse_und_folgen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailErfahrungen(record: Erfahrungen, push = false) {
    const rec = enrichedErfahrungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'erfahrungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitErfahrungen(fields: Erfahrungen['fields']) {
    const editing = erfahrungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setErfahrungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateErfahrungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('erfahrungen')} — ${t('crud_updated')}`, async () => {
        data.setErfahrungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateErfahrungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createErfahrungenEntry(fields);
      undoToast(`${appLabel('erfahrungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Lernerkenntnisse to the Erfahrungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkErfahrungenLernerkenntnisse(sourceId: string) {
    const hub = pickErfahrungenLernerkenntnisse;
    const src = data.lernerkenntnisse.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.erfahrungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.ERFAHRUNGEN, id));
    data.setLernerkenntnisse(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, erfahrungen: next } } : r)));
    try {
      await LivingAppsService.updateLernerkenntnisseEntry(sourceId, { erfahrungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('lernerkenntnisse')} — ${t('pick_linked')}`, async () => {
      data.setLernerkenntnisse(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateLernerkenntnisseEntry(sourceId, { erfahrungen: src.fields.erfahrungen }); } catch { data.fetchAll(); }
    });
  }

  function detailLernerkenntnisse(record: Lernerkenntnisse, push = false) {
    const rec = enrichedLernerkenntnisse.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'lernerkenntnisse', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitLernerkenntnisse(fields: Lernerkenntnisse['fields']) {
    const editing = lernerkenntnisseDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setLernerkenntnisse(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateLernerkenntnisseEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('lernerkenntnisse')} — ${t('crud_updated')}`, async () => {
        data.setLernerkenntnisse(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateLernerkenntnisseEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createLernerkenntnisseEntry(fields);
      undoToast(`${appLabel('lernerkenntnisse')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <NutzerDialog
        open={nutzerDialog !== null}
        onClose={() => setNutzerDialog(null)}
        onSubmit={submitNutzer}
        defaultValues={nutzerDialog?.defaults}
        recordId={nutzerDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Nutzer']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Nutzer']}
      />
      <RegelnUndGrenzenDialog
        open={regelnUndGrenzenDialog !== null}
        onClose={() => setRegelnUndGrenzenDialog(null)}
        onSubmit={submitRegelnUndGrenzen}
        defaultValues={regelnUndGrenzenDialog?.defaults}
        recordId={regelnUndGrenzenDialog?.editing?.record_id}
        nutzerList={data.nutzer}
        enablePhotoScan={AI_PHOTO_SCAN['RegelnUndGrenzen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['RegelnUndGrenzen']}
      />
      <VorhabenDialog
        open={vorhabenDialog !== null}
        onClose={() => setVorhabenDialog(null)}
        onSubmit={submitVorhaben}
        defaultValues={vorhabenDialog?.defaults}
        recordId={vorhabenDialog?.editing?.record_id}
        nutzerList={data.nutzer}
        enablePhotoScan={AI_PHOTO_SCAN['Vorhaben']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Vorhaben']}
      />
      <AufgabenUndKiVorschlaegeDialog
        open={aufgabenUndKiVorschlaegeDialog !== null}
        onClose={() => setAufgabenUndKiVorschlaegeDialog(null)}
        onSubmit={submitAufgabenUndKiVorschlaege}
        defaultValues={aufgabenUndKiVorschlaegeDialog?.defaults}
        recordId={aufgabenUndKiVorschlaegeDialog?.editing?.record_id}
        vorhabenList={data.vorhaben}
        nutzerList={data.nutzer}
        regelnUndGrenzenList={data.regelnUndGrenzen}
        enablePhotoScan={AI_PHOTO_SCAN['AufgabenUndKiVorschlaege']}
        enablePhotoLocation={AI_PHOTO_LOCATION['AufgabenUndKiVorschlaege']}
      />
      <EntscheidungenDialog
        open={entscheidungenDialog !== null}
        onClose={() => setEntscheidungenDialog(null)}
        onSubmit={submitEntscheidungen}
        defaultValues={entscheidungenDialog?.defaults}
        recordId={entscheidungenDialog?.editing?.record_id}
        vorhabenList={data.vorhaben}
        regelnUndGrenzenList={data.regelnUndGrenzen}
        nutzerList={data.nutzer}
        enablePhotoScan={AI_PHOTO_SCAN['Entscheidungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Entscheidungen']}
      />
      <ErgebnisseUndFolgenDialog
        open={ergebnisseUndFolgenDialog !== null}
        onClose={() => setErgebnisseUndFolgenDialog(null)}
        onSubmit={submitErgebnisseUndFolgen}
        defaultValues={ergebnisseUndFolgenDialog?.defaults}
        recordId={ergebnisseUndFolgenDialog?.editing?.record_id}
        entscheidungenList={data.entscheidungen}
        aufgabenUndKiVorschlaegeList={data.aufgabenUndKiVorschlaege}
        nutzerList={data.nutzer}
        enablePhotoScan={AI_PHOTO_SCAN['ErgebnisseUndFolgen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['ErgebnisseUndFolgen']}
      />
      <ErfahrungenDialog
        open={erfahrungenDialog !== null}
        onClose={() => setErfahrungenDialog(null)}
        onSubmit={submitErfahrungen}
        defaultValues={erfahrungenDialog?.defaults}
        recordId={erfahrungenDialog?.editing?.record_id}
        vorhabenList={data.vorhaben}
        entscheidungenList={data.entscheidungen}
        ergebnisseUndFolgenList={data.ergebnisseUndFolgen}
        nutzerList={data.nutzer}
        enablePhotoScan={AI_PHOTO_SCAN['Erfahrungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Erfahrungen']}
      />
      <LernerkenntnisseDialog
        open={lernerkenntnisseDialog !== null}
        onClose={() => setLernerkenntnisseDialog(null)}
        onSubmit={submitLernerkenntnisse}
        defaultValues={lernerkenntnisseDialog?.defaults}
        recordId={lernerkenntnisseDialog?.editing?.record_id}
        erfahrungenList={data.erfahrungen}
        nutzerList={data.nutzer}
        enablePhotoScan={AI_PHOTO_SCAN['Lernerkenntnisse']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Lernerkenntnisse']}
      />
      <PickExistingDialog
        open={pickErfahrungenLernerkenntnisse !== null}
        onClose={() => setPickErfahrungenLernerkenntnisse(null)}
        title={t('pick_title', { title: appLabel('lernerkenntnisse') })}
        items={data.lernerkenntnisse
          .filter(r => !extractRecordIds(r.fields.erfahrungen).includes(pickErfahrungenLernerkenntnisse ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('lernerkenntnisse')), hint: r.fields.pruefdatum ? String(r.fields.pruefdatum) : undefined }))}
        onPick={linkErfahrungenLernerkenntnisse}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'nutzer') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('nutzer')} subtitle={undefined} />
                <NutzerDetails
                  record={top.record}
                  regelnUndGrenzenList={data.regelnUndGrenzen}
                  onOpenRegelnUndGrenzen={(r) => detailRegelnUndGrenzen(r, true)}
                  onAddRegelnUndGrenzen={perms.canWrite('regeln_und_grenzen') ? () => setRegelnUndGrenzenDialog({ defaults: { verantwortlicher: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  onAddVorhaben={perms.canWrite('vorhaben') ? () => setVorhabenDialog({ defaults: { verantwortlicher: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  aufgabenUndKiVorschlaegeVorschlagenderList={data.aufgabenUndKiVorschlaege}
                  onOpenAufgabenUndKiVorschlaegeVorschlagender={(r) => detailAufgabenUndKiVorschlaege(r, true)}
                  onAddAufgabenUndKiVorschlaegeVorschlagender={perms.canWrite('aufgaben_und_ki_vorschlaege') ? () => setAufgabenUndKiVorschlaegeDialog({ defaults: { vorschlagender: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  aufgabenUndKiVorschlaegePrueferList={data.aufgabenUndKiVorschlaege}
                  onOpenAufgabenUndKiVorschlaegePruefer={(r) => detailAufgabenUndKiVorschlaege(r, true)}
                  onAddAufgabenUndKiVorschlaegePruefer={perms.canWrite('aufgaben_und_ki_vorschlaege') ? () => setAufgabenUndKiVorschlaegeDialog({ defaults: { pruefer: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { zustaendiger: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  ergebnisseUndFolgenList={data.ergebnisseUndFolgen}
                  onOpenErgebnisseUndFolgen={(r) => detailErgebnisseUndFolgen(r, true)}
                  onAddErgebnisseUndFolgen={perms.canWrite('ergebnisse_und_folgen') ? () => setErgebnisseUndFolgenDialog({ defaults: { beobachter: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { dokumentierender: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                  lernerkenntnisseList={data.lernerkenntnisse}
                  onOpenLernerkenntnisse={(r) => detailLernerkenntnisse(r, true)}
                  onAddLernerkenntnisse={perms.canWrite('lernerkenntnisse') ? () => setLernerkenntnisseDialog({ defaults: { pruefer: createRecordUrl(APP_IDS.NUTZER, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'regelnUndGrenzen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('regeln_und_grenzen')} subtitle={top.record.fields.gueltig_ab ? formatDate(top.record.fields.gueltig_ab) : undefined} />
                <RegelnUndGrenzenDetails
                  record={top.record}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  aufgabenUndKiVorschlaegeList={data.aufgabenUndKiVorschlaege}
                  onOpenAufgabenUndKiVorschlaege={(r) => detailAufgabenUndKiVorschlaege(r, true)}
                  onAddAufgabenUndKiVorschlaege={perms.canWrite('aufgaben_und_ki_vorschlaege') ? () => setAufgabenUndKiVorschlaegeDialog({ defaults: { geltende_regel: createRecordUrl(APP_IDS.REGELN_UND_GRENZEN, top.record.record_id) } }) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { geltende_regel: createRecordUrl(APP_IDS.REGELN_UND_GRENZEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'vorhaben') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('vorhaben')} subtitle={top.record.fields.startdatum ? formatDate(top.record.fields.startdatum) : undefined} />
                <VorhabenDetails
                  record={top.record}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  aufgabenUndKiVorschlaegeList={data.aufgabenUndKiVorschlaege}
                  onOpenAufgabenUndKiVorschlaege={(r) => detailAufgabenUndKiVorschlaege(r, true)}
                  onAddAufgabenUndKiVorschlaege={perms.canWrite('aufgaben_und_ki_vorschlaege') ? () => setAufgabenUndKiVorschlaegeDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'aufgabenUndKiVorschlaege') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('aufgaben_und_ki_vorschlaege')} subtitle={top.record.fields.freigabedatum ? formatDate(top.record.fields.freigabedatum) : undefined} />
                <AufgabenUndKiVorschlaegeDetails
                  record={top.record}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  regelnUndGrenzenList={data.regelnUndGrenzen}
                  onOpenRegelnUndGrenzen={(r) => detailRegelnUndGrenzen(r, true)}
                  ergebnisseUndFolgenList={data.ergebnisseUndFolgen}
                  onOpenErgebnisseUndFolgen={(r) => detailErgebnisseUndFolgen(r, true)}
                  onAddErgebnisseUndFolgen={perms.canWrite('ergebnisse_und_folgen') ? () => setErgebnisseUndFolgenDialog({ defaults: { aufgabe: createRecordUrl(APP_IDS.AUFGABEN_UND_KI_VORSCHLAEGE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'entscheidungen') {
            return (
              <>
                <RecordHeader title={appLabel('entscheidungen')} subtitle={top.record.fields.frist ? formatDate(top.record.fields.frist) : undefined} />
                <EntscheidungenDetails
                  record={top.record}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  regelnUndGrenzenList={data.regelnUndGrenzen}
                  onOpenRegelnUndGrenzen={(r) => detailRegelnUndGrenzen(r, true)}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  ergebnisseUndFolgenList={data.ergebnisseUndFolgen}
                  onOpenErgebnisseUndFolgen={(r) => detailErgebnisseUndFolgen(r, true)}
                  onAddErgebnisseUndFolgen={perms.canWrite('ergebnisse_und_folgen') ? () => setErgebnisseUndFolgenDialog({ defaults: { entscheidung: createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, top.record.record_id) } }) : undefined}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { entscheidung: createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'ergebnisseUndFolgen') {
            return (
              <>
                <RecordHeader title={appLabel('ergebnisse_und_folgen')} subtitle={top.record.fields.messdatum ? formatDate(top.record.fields.messdatum) : undefined} />
                <ErgebnisseUndFolgenDetails
                  record={top.record}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  aufgabenUndKiVorschlaegeList={data.aufgabenUndKiVorschlaege}
                  onOpenAufgabenUndKiVorschlaege={(r) => detailAufgabenUndKiVorschlaege(r, true)}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { ergebnis: createRecordUrl(APP_IDS.ERGEBNISSE_UND_FOLGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'erfahrungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('erfahrungen')} subtitle={undefined} />
                <ErfahrungenDetails
                  record={top.record}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  ergebnisseUndFolgenList={data.ergebnisseUndFolgen}
                  onOpenErgebnisseUndFolgen={(r) => detailErgebnisseUndFolgen(r, true)}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                  lernerkenntnisseList={data.lernerkenntnisse}
                  onOpenLernerkenntnisse={(r) => detailLernerkenntnisse(r, true)}
                  onAddLernerkenntnisse={perms.canWrite('lernerkenntnisse') ? () => setLernerkenntnisseDialog({ defaults: { erfahrungen: [createRecordUrl(APP_IDS.ERFAHRUNGEN, top.record.record_id)] } }) : undefined}
                  onPickLernerkenntnisse={perms.canWrite('lernerkenntnisse') ? () => setPickErfahrungenLernerkenntnisse(top.record.record_id) : undefined}
                />
              </>
            );
          }
          if (top.type === 'lernerkenntnisse') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('lernerkenntnisse')} subtitle={top.record.fields.pruefdatum ? formatDate(top.record.fields.pruefdatum) : undefined} />
                <LernerkenntnisseDetails
                  record={top.record}
                  erfahrungenList={data.erfahrungen}
                  nutzerList={data.nutzer}
                  onOpenNutzer={(r) => detailNutzer(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'nutzer') return perms.canWrite('nutzer');
          if (top.type === 'regelnUndGrenzen') return perms.canWrite('regeln_und_grenzen');
          if (top.type === 'vorhaben') return perms.canWrite('vorhaben');
          if (top.type === 'aufgabenUndKiVorschlaege') return perms.canWrite('aufgaben_und_ki_vorschlaege');
          if (top.type === 'entscheidungen') return perms.canWrite('entscheidungen');
          if (top.type === 'ergebnisseUndFolgen') return perms.canWrite('ergebnisse_und_folgen');
          if (top.type === 'erfahrungen') return perms.canWrite('erfahrungen');
          if (top.type === 'lernerkenntnisse') return perms.canWrite('lernerkenntnisse');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'nutzer') setNutzerDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'regelnUndGrenzen') setRegelnUndGrenzenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'vorhaben') setVorhabenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'aufgabenUndKiVorschlaege') setAufgabenUndKiVorschlaegeDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'entscheidungen') setEntscheidungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'ergebnisseUndFolgen') setErgebnisseUndFolgenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'erfahrungen') setErfahrungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'lernerkenntnisse') setLernerkenntnisseDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    nutzer: {
      openCreate: (defaults?: NutzerDialogDefaults) => (perms.canWrite('nutzer') ? setNutzerDialog({ defaults }) : refuse()),
      openEdit: (record: Nutzer) => (perms.canWrite('nutzer') ? setNutzerDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Nutzer) => detailNutzer(record, false),
      canWrite: perms.canWrite('nutzer'),
    },
    regelnUndGrenzen: {
      openCreate: (defaults?: RegelnUndGrenzenDialogDefaults) => (perms.canWrite('regeln_und_grenzen') ? setRegelnUndGrenzenDialog({ defaults }) : refuse()),
      openEdit: (record: RegelnUndGrenzen) => (perms.canWrite('regeln_und_grenzen') ? setRegelnUndGrenzenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: RegelnUndGrenzen) => detailRegelnUndGrenzen(record, false),
      canWrite: perms.canWrite('regeln_und_grenzen'),
    },
    vorhaben: {
      openCreate: (defaults?: VorhabenDialogDefaults) => (perms.canWrite('vorhaben') ? setVorhabenDialog({ defaults }) : refuse()),
      openEdit: (record: Vorhaben) => (perms.canWrite('vorhaben') ? setVorhabenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Vorhaben) => detailVorhaben(record, false),
      canWrite: perms.canWrite('vorhaben'),
    },
    aufgabenUndKiVorschlaege: {
      openCreate: (defaults?: AufgabenUndKiVorschlaegeDialogDefaults) => (perms.canWrite('aufgaben_und_ki_vorschlaege') ? setAufgabenUndKiVorschlaegeDialog({ defaults }) : refuse()),
      openEdit: (record: AufgabenUndKiVorschlaege) => (perms.canWrite('aufgaben_und_ki_vorschlaege') ? setAufgabenUndKiVorschlaegeDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: AufgabenUndKiVorschlaege) => detailAufgabenUndKiVorschlaege(record, false),
      canWrite: perms.canWrite('aufgaben_und_ki_vorschlaege'),
    },
    entscheidungen: {
      openCreate: (defaults?: EntscheidungenDialogDefaults) => (perms.canWrite('entscheidungen') ? setEntscheidungenDialog({ defaults }) : refuse()),
      openEdit: (record: Entscheidungen) => (perms.canWrite('entscheidungen') ? setEntscheidungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Entscheidungen) => detailEntscheidungen(record, false),
      canWrite: perms.canWrite('entscheidungen'),
    },
    ergebnisseUndFolgen: {
      openCreate: (defaults?: ErgebnisseUndFolgenDialogDefaults) => (perms.canWrite('ergebnisse_und_folgen') ? setErgebnisseUndFolgenDialog({ defaults }) : refuse()),
      openEdit: (record: ErgebnisseUndFolgen) => (perms.canWrite('ergebnisse_und_folgen') ? setErgebnisseUndFolgenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: ErgebnisseUndFolgen) => detailErgebnisseUndFolgen(record, false),
      canWrite: perms.canWrite('ergebnisse_und_folgen'),
    },
    erfahrungen: {
      openCreate: (defaults?: ErfahrungenDialogDefaults) => (perms.canWrite('erfahrungen') ? setErfahrungenDialog({ defaults }) : refuse()),
      openEdit: (record: Erfahrungen) => (perms.canWrite('erfahrungen') ? setErfahrungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Erfahrungen) => detailErfahrungen(record, false),
      canWrite: perms.canWrite('erfahrungen'),
    },
    lernerkenntnisse: {
      openCreate: (defaults?: LernerkenntnisseDialogDefaults) => (perms.canWrite('lernerkenntnisse') ? setLernerkenntnisseDialog({ defaults }) : refuse()),
      openEdit: (record: Lernerkenntnisse) => (perms.canWrite('lernerkenntnisse') ? setLernerkenntnisseDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Lernerkenntnisse) => detailLernerkenntnisse(record, false),
      canWrite: perms.canWrite('lernerkenntnisse'),
    },
    enriched: { nutzer: data.nutzer, regelnUndGrenzen: enrichedRegelnUndGrenzen, vorhaben: enrichedVorhaben, aufgabenUndKiVorschlaege: enrichedAufgabenUndKiVorschlaege, entscheidungen: enrichedEntscheidungen, ergebnisseUndFolgen: enrichedErgebnisseUndFolgen, erfahrungen: enrichedErfahrungen, lernerkenntnisse: enrichedLernerkenntnisse },
  };
}
