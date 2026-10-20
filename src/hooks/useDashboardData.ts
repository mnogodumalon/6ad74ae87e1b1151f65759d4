import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Nutzer, RegelnUndGrenzen, Vorhaben, AufgabenUndKiVorschlaege, Entscheidungen, ErgebnisseUndFolgen, Erfahrungen, Lernerkenntnisse } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { t } from '@/i18n';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
/** Entities this hook can load — the same keys the journey layer uses. */
export type DashboardEntity = 'nutzer' | 'regeln_und_grenzen' | 'vorhaben' | 'aufgaben_und_ki_vorschlaege' | 'entscheidungen' | 'ergebnisse_und_folgen' | 'erfahrungen' | 'lernerkenntnisse';

export interface DashboardDataOptions {
  /** Entities this page does NOT need (picked through useRecordSearch instead).
   *  Every flow page mounts this hook on its own route, so without `omit` a
   *  page that searches 3.000 guests server-side would still pull all 3.000
   *  through the side door. */
  omit?: DashboardEntity[];
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  // A string key, not the array: an inline `omit={['gaeste']}` is a new array
  // on every render and would restart the fetch forever.
  const omitKey = (options.omit ?? []).slice().sort().join('|');
  const [nutzer, setNutzer] = useState<Nutzer[]>([]);
  const [regelnUndGrenzen, setRegelnUndGrenzen] = useState<RegelnUndGrenzen[]>([]);
  const [vorhaben, setVorhaben] = useState<Vorhaben[]>([]);
  const [aufgabenUndKiVorschlaege, setAufgabenUndKiVorschlaege] = useState<AufgabenUndKiVorschlaege[]>([]);
  const [entscheidungen, setEntscheidungen] = useState<Entscheidungen[]>([]);
  const [ergebnisseUndFolgen, setErgebnisseUndFolgen] = useState<ErgebnisseUndFolgen[]>([]);
  const [erfahrungen, setErfahrungen] = useState<Erfahrungen[]>([]);
  const [lernerkenntnisse, setLernerkenntnisse] = useState<Lernerkenntnisse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  /** Lists the signed-in user may not read (403 on the platform). They load as
   *  empty and the rest of the page loads normally — one forbidden list used to
   *  empty the whole dashboard (05.10.2026). Hide a block whose list is here. */
  const [forbidden, setForbidden] = useState<DashboardEntity[]>([]);

  // Every list on its own: a 403 is „not yours“, any other failure is an error.
  const settle = useCallback((settled: PromiseSettledResult<unknown>[]) => {
    const denied: DashboardEntity[] = [];
    let failure: unknown = null;
    // null = this list failed for another reason: its current data stays
    const pick = <T,>(i: number, key: DashboardEntity): T[] | null => {
      const s = settled[i];
      if (s.status === 'fulfilled') return s.value as T[];
      if ((s.reason as { status?: number } | null)?.status === 403) { denied.push(key); return []; }
      failure = failure ?? s.reason;
      return null;
    };
    { const rows = pick<Nutzer>(0, 'nutzer'); if (rows) setNutzer(rows); }
    { const rows = pick<RegelnUndGrenzen>(1, 'regeln_und_grenzen'); if (rows) setRegelnUndGrenzen(rows); }
    { const rows = pick<Vorhaben>(2, 'vorhaben'); if (rows) setVorhaben(rows); }
    { const rows = pick<AufgabenUndKiVorschlaege>(3, 'aufgaben_und_ki_vorschlaege'); if (rows) setAufgabenUndKiVorschlaege(rows); }
    { const rows = pick<Entscheidungen>(4, 'entscheidungen'); if (rows) setEntscheidungen(rows); }
    { const rows = pick<ErgebnisseUndFolgen>(5, 'ergebnisse_und_folgen'); if (rows) setErgebnisseUndFolgen(rows); }
    { const rows = pick<Erfahrungen>(6, 'erfahrungen'); if (rows) setErfahrungen(rows); }
    { const rows = pick<Lernerkenntnisse>(7, 'lernerkenntnisse'); if (rows) setLernerkenntnisse(rows); }
    setForbidden(prev => (prev.join('|') === denied.join('|') ? prev : denied));
    return failure;
  }, []);

  const fetchAll = useCallback(async () => {
    setError(null);
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    try {
      const failure = settle(await Promise.allSettled([
        omit.has('nutzer') ? Promise.resolve([] as Nutzer[]) : LivingAppsService.getNutzer(),
        omit.has('regeln_und_grenzen') ? Promise.resolve([] as RegelnUndGrenzen[]) : LivingAppsService.getRegelnUndGrenzen(),
        omit.has('vorhaben') ? Promise.resolve([] as Vorhaben[]) : LivingAppsService.getVorhaben(),
        omit.has('aufgaben_und_ki_vorschlaege') ? Promise.resolve([] as AufgabenUndKiVorschlaege[]) : LivingAppsService.getAufgabenUndKiVorschlaege(),
        omit.has('entscheidungen') ? Promise.resolve([] as Entscheidungen[]) : LivingAppsService.getEntscheidungen(),
        omit.has('ergebnisse_und_folgen') ? Promise.resolve([] as ErgebnisseUndFolgen[]) : LivingAppsService.getErgebnisseUndFolgen(),
        omit.has('erfahrungen') ? Promise.resolve([] as Erfahrungen[]) : LivingAppsService.getErfahrungen(),
        omit.has('lernerkenntnisse') ? Promise.resolve([] as Lernerkenntnisse[]) : LivingAppsService.getLernerkenntnisse(),
      ]));
      if (failure) throw failure;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('data_load_failed')));
    } finally {
      setLoading(false);
    }
  }, [omitKey, settle]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    async function silentRefresh() {
      try {
        // a failed list keeps its stale data out of the way: settle() only
        // replaces what loaded or was refused
        settle(await Promise.allSettled([
          omit.has('nutzer') ? Promise.resolve([] as Nutzer[]) : LivingAppsService.getNutzer(),
          omit.has('regeln_und_grenzen') ? Promise.resolve([] as RegelnUndGrenzen[]) : LivingAppsService.getRegelnUndGrenzen(),
          omit.has('vorhaben') ? Promise.resolve([] as Vorhaben[]) : LivingAppsService.getVorhaben(),
          omit.has('aufgaben_und_ki_vorschlaege') ? Promise.resolve([] as AufgabenUndKiVorschlaege[]) : LivingAppsService.getAufgabenUndKiVorschlaege(),
          omit.has('entscheidungen') ? Promise.resolve([] as Entscheidungen[]) : LivingAppsService.getEntscheidungen(),
          omit.has('ergebnisse_und_folgen') ? Promise.resolve([] as ErgebnisseUndFolgen[]) : LivingAppsService.getErgebnisseUndFolgen(),
          omit.has('erfahrungen') ? Promise.resolve([] as Erfahrungen[]) : LivingAppsService.getErfahrungen(),
          omit.has('lernerkenntnisse') ? Promise.resolve([] as Lernerkenntnisse[]) : LivingAppsService.getLernerkenntnisse(),
        ]));
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    // assistant:data-changed comes from the assistant (<la-klar-assistant>)
    // after every mutation. The element additionally fires the legacy
    // dashboard-refresh event for OLD deployed bundles — do NOT subscribe to
    // both here, or every mutation fetches twice.
    window.addEventListener('assistant:data-changed', handleRefresh);
    return () => window.removeEventListener('assistant:data-changed', handleRefresh);
  }, [omitKey, settle]);

  const nutzerMap = useMemo(() => {
    const m = new Map<string, Nutzer>();
    nutzer.forEach(r => m.set(r.record_id, r));
    return m;
  }, [nutzer]);

  const regelnUndGrenzenMap = useMemo(() => {
    const m = new Map<string, RegelnUndGrenzen>();
    regelnUndGrenzen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [regelnUndGrenzen]);

  const vorhabenMap = useMemo(() => {
    const m = new Map<string, Vorhaben>();
    vorhaben.forEach(r => m.set(r.record_id, r));
    return m;
  }, [vorhaben]);

  const aufgabenUndKiVorschlaegeMap = useMemo(() => {
    const m = new Map<string, AufgabenUndKiVorschlaege>();
    aufgabenUndKiVorschlaege.forEach(r => m.set(r.record_id, r));
    return m;
  }, [aufgabenUndKiVorschlaege]);

  const entscheidungenMap = useMemo(() => {
    const m = new Map<string, Entscheidungen>();
    entscheidungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [entscheidungen]);

  const ergebnisseUndFolgenMap = useMemo(() => {
    const m = new Map<string, ErgebnisseUndFolgen>();
    ergebnisseUndFolgen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [ergebnisseUndFolgen]);

  const erfahrungenMap = useMemo(() => {
    const m = new Map<string, Erfahrungen>();
    erfahrungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [erfahrungen]);

  return { nutzer, setNutzer, regelnUndGrenzen, setRegelnUndGrenzen, vorhaben, setVorhaben, aufgabenUndKiVorschlaege, setAufgabenUndKiVorschlaege, entscheidungen, setEntscheidungen, ergebnisseUndFolgen, setErgebnisseUndFolgen, erfahrungen, setErfahrungen, lernerkenntnisse, setLernerkenntnisse, loading, error, fetchAll, forbidden, nutzerMap, regelnUndGrenzenMap, vorhabenMap, aufgabenUndKiVorschlaegeMap, entscheidungenMap, ergebnisseUndFolgenMap, erfahrungenMap };
}

/** The hook's return — the `data` prop of DashboardOverview in the Ready-Wrapper form. */
export type DashboardData = ReturnType<typeof useDashboardData>;