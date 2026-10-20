/**
 * EntscheidungenDialog — pre-generated create/edit dialog for Entscheidungen.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * vorhabenList (full hook array — resolves the Vorhaben applookup),
 * regelnUndGrenzenList (full hook array — resolves the RegelnUndGrenzen applookup),
 * nutzerList (full hook array — resolves the Nutzer applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * EntscheidungenDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Entscheidungen['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<EntscheidungenDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Entscheidungen, Vorhaben, RegelnUndGrenzen, Nutzer, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Entscheidungen';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/Combobox';
import { VorhabenDialog } from '@/components/dialogs/VorhabenDialog';
import { RegelnUndGrenzenDialog } from '@/components/dialogs/RegelnUndGrenzenDialog';
import { NutzerDialog } from '@/components/dialogs/NutzerDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for EntscheidungenDialog.defaultValues — see file header. */
export type EntscheidungenDialogDefaults = Omit<Entscheidungen['fields'], 'entscheidungsstatus'> & {
    entscheidungsstatus?: LookupValue | string;
  };

interface EntscheidungenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Entscheidungen['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: EntscheidungenDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  vorhabenList: Vorhaben[];
  regelnUndGrenzenList: RegelnUndGrenzen[];
  nutzerList: Nutzer[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  entscheidungsstatus: LOOKUP_OPTIONS['entscheidungen']?.['entscheidungsstatus'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  vorhaben: APP_IDS.VORHABEN,
  geltende_regel: APP_IDS.REGELN_UND_GRENZEN,
  zustaendiger: APP_IDS.NUTZER,
};
function normalizeDefaults(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [k, opts] of Object.entries(NORMALIZE_LOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string') out[k] = opts.find(o => o.key === v) ?? { key: v, label: v };
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' ? opts.find(o => o.key === x) ?? { key: x, label: x } : x));
  }
  for (const [k, appId] of Object.entries(NORMALIZE_APPLOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string' && v !== '' && !v.startsWith('http')) out[k] = createRecordUrl(appId, v);
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' && x !== '' && !x.startsWith('http') ? createRecordUrl(appId, x) : x));
  }
  return out;
}

export function EntscheidungenDialog({ open, onClose, onSubmit, defaultValues, recordId, vorhabenList, regelnUndGrenzenList, nutzerList, enablePhotoScan = true, enablePhotoLocation = true }: EntscheidungenDialogProps) {
  const [fields, setFields] = useState<Partial<Entscheidungen['fields']>>({});
  const [saving, setSaving] = useState(false);
  const normalizedDefaults = useMemo<Record<string, unknown> | undefined>(
    () => (defaultValues ? normalizeDefaults(defaultValues as Record<string, unknown>) : undefined),
    [defaultValues],
  );
  // Dirty-tracking: in edit-mode the Speichern button is disabled until the
  // user actually changes something. JSON.stringify is good enough for our
  // fields (plain values + LookupValue objects + string arrays).
  const isDirty = useMemo(() => {
    if (!normalizedDefaults) return true;  // create-mode: always allow submit
    try {
      return JSON.stringify(fields) !== JSON.stringify(normalizedDefaults);
    } catch {
      return true;
    }
  }, [fields, normalizedDefaults]);
  // Inline-Create state for "Vorhaben" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraVorhaben` list, and select it in
  // the originating Combobox via the captured `createVorhabenField`.
  const [createVorhabenOpen, setCreateVorhabenOpen] = useState(false);
  const [createVorhabenInitial, setCreateVorhabenInitial] = useState('');
  const [createVorhabenField, setCreateVorhabenField] = useState<string>('');
  const [extraVorhaben, setExtraVorhaben] = useState< Vorhaben[]>([]);
  const vorhabenListAll = useMemo(
    () => [...vorhabenList, ...extraVorhaben],
    [vorhabenList, extraVorhaben],
  );
  function openCreateVorhaben(fieldKey: string, q: string) {
    setCreateVorhabenField(fieldKey);
    setCreateVorhabenInitial(q);
    setCreateVorhabenOpen(true);
  }
  // Inline-Create state for "RegelnUndGrenzen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraRegelnUndGrenzen` list, and select it in
  // the originating Combobox via the captured `createRegelnUndGrenzenField`.
  const [createRegelnUndGrenzenOpen, setCreateRegelnUndGrenzenOpen] = useState(false);
  const [createRegelnUndGrenzenInitial, setCreateRegelnUndGrenzenInitial] = useState('');
  const [createRegelnUndGrenzenField, setCreateRegelnUndGrenzenField] = useState<string>('');
  const [extraRegelnUndGrenzen, setExtraRegelnUndGrenzen] = useState< RegelnUndGrenzen[]>([]);
  const regelnUndGrenzenListAll = useMemo(
    () => [...regelnUndGrenzenList, ...extraRegelnUndGrenzen],
    [regelnUndGrenzenList, extraRegelnUndGrenzen],
  );
  function openCreateRegelnUndGrenzen(fieldKey: string, q: string) {
    setCreateRegelnUndGrenzenField(fieldKey);
    setCreateRegelnUndGrenzenInitial(q);
    setCreateRegelnUndGrenzenOpen(true);
  }
  // Inline-Create state for "Nutzer" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraNutzer` list, and select it in
  // the originating Combobox via the captured `createNutzerField`.
  const [createNutzerOpen, setCreateNutzerOpen] = useState(false);
  const [createNutzerInitial, setCreateNutzerInitial] = useState('');
  const [createNutzerField, setCreateNutzerField] = useState<string>('');
  const [extraNutzer, setExtraNutzer] = useState< Nutzer[]>([]);
  const nutzerListAll = useMemo(
    () => [...nutzerList, ...extraNutzer],
    [nutzerList, extraNutzer],
  );
  function openCreateNutzer(fieldKey: string, q: string) {
    setCreateNutzerField(fieldKey);
    setCreateNutzerInitial(q);
    setCreateNutzerOpen(true);
  }
  // Fields the plan assigns to a tool (empty without a plan).
  const SYSTEM_ASSIGNED: string[] = [];
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['vorhaben', 'frage', 'alternativen', 'zustaendiger', 'entscheidungsstatus'] as const;
  const missingRequired = REQUIRED_FIELDS.filter(k => {
    const v = (fields as Record<string, unknown>)[k];
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiText, setAiText] = useState('');

  // Computed-field plumbing. Pure no-op when formEnhancements.computed is {}.
  // The number renderer uses computedValues only as a fallback when the user
  // hasn't typed anything — clearing the input always restores the computation.
  // computedContext exposes applookup list props so { kind: 'applookup', ... }
  // operands can resolve to numeric fields on the target record.
  const computedContext = useMemo<ComputedContext>(() => ({
    lookupLists: {
      'vorhaben': vorhabenList,
      'geltende_regel': regelnUndGrenzenList,
      'zustaendiger': nutzerList,
    },
  }), [vorhabenList, regelnUndGrenzenList, nutzerList, ]);
  const computedValues = useMemo<Record<string, number | null>>(() => {
    let out: Record<string, number | null> = {};
    const entries = Object.entries(formEnhancements.computed);
    for (let i = 0; i < 5; i++) {
      const merged: Record<string, unknown> = { ...(fields as Record<string, unknown>) };
      for (const [k, v] of Object.entries(out)) {
        if (v === null) continue;
        const cur = merged[k];
        if (cur === undefined || cur === null || cur === '') merged[k] = v;
      }
      const next: Record<string, number | null> = {};
      let changed = false;
      for (const [key, spec] of entries) {
        const v = evalComputed(spec, merged, computedContext);
        next[key] = v;
        if (v !== out[key]) changed = true;
      }
      out = next;
      if (!changed) break;
    }
    return out;
  }, [fields, computedContext]);

  useEffect(() => {
    if (open) {
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Entscheidungen['fields']>);
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
      setSubmitError(null);
    }
  }, [open, normalizedDefaults]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  // Submit errors surface IN the dialog (it is modal — a banner in the page
  // body would be hidden behind it). A consumer onSubmit that THROWS (the
  // documented "throw to prevent closing" validation pattern) lands here:
  // the dialog stays open, nothing is saved, the message is visible.
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      // Fill empty number slots from computed values; user-typed values always win.
      // CRITICAL: only backend-mapped keys may be backfilled. Virtual computeds
      // (sub-agent invents `_netto`, `_bestellung_gesamtbetrag` etc. for the
      // "Berechnungen" display) have no backend counterpart — writing them
      // triggers a 422 from the Living-Apps API ("field does not exist").
      const merged = { ...fields };
      for (const [key, val] of Object.entries(computedValues)) {
        if (val === null) continue;
        if (!backendFieldSet.has(key)) continue;
        const cur = (merged as Record<string, unknown>)[key];
        if (cur === undefined || cur === null || cur === '') {
          (merged as Record<string, unknown>)[key] = val;
        }
      }
      const clean = cleanFieldsForApi(merged, 'entscheidungen');
      await onSubmit(clean as Entscheidungen['fields']);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : t('submit_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAiExtract(file?: File) {
    if (!file && !aiText.trim()) return;
    setScanning(true);
    setScanSuccess(false);
    try {
      let uri: string | undefined;
      let gps: { latitude: number; longitude: number } | null = null;
      let geoAddr = '';
      const parts: string[] = [];
      if (file) {
        const [dataUri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
        uri = dataUri;
        if (file.type.startsWith('image/')) setPreview(uri);
        gps = enablePhotoLocation ? meta?.gps ?? null : null;
        if (gps) {
          geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
          parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
          if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
        }
        if (meta?.dateTime) {
          parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
        }
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="vorhaben" entity="Vorhaben">\n${JSON.stringify(vorhabenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="geltende_regel" entity="Regeln und Grenzen">\n${JSON.stringify(regelnUndGrenzenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="zustaendiger" entity="Nutzer">\n${JSON.stringify(nutzerList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "vorhaben": string | null, // Display name from Vorhaben (see <available-records>)\n  "frage": string | null, // Zu entscheidende Frage\n  "alternativen": string | null, // Alternativen\n  "gesicherte_fakten": string | null, // Gesicherte Fakten\n  "offene_annahmen": string | null, // Offene Annahmen\n  "fehlende_informationen": string | null, // Fehlende Informationen\n  "konsequenzen": string | null, // Konsequenzen der Optionen\n  "geltende_regel": string | null, // Display name from Regeln und Grenzen (see <available-records>)\n  "zustaendiger": string | null, // Display name from Nutzer (see <available-records>)\n  "frist": string | null, // YYYY-MM-DD\n  "gewaehlte_option": string | null, // Gewählte Option\n  "begruendung": string | null, // Begründung\n  "umsetzungsplan": string | null, // Was wird umgesetzt\n  "beschlussdatum": string | null, // YYYY-MM-DD\n  "entscheidungsstatus": LookupValue | null, // Entscheidungsstatus (select one key: "in_vorbereitung" | "entscheidungsreif" | "entschieden" | "umgesetzt" | "verworfen") mapping: in_vorbereitung=In Vorbereitung, entscheidungsreif=Entscheidungsreif, entschieden=Entschieden, umgesetzt=Umgesetzt, verworfen=Verworfen\n}`;
      const raw = await extractFromInput<Record<string, unknown>>(schema, {
        dataUri: uri,
        userText: aiText.trim() || undefined,
        photoContext,
        intent: DIALOG_INTENT,
      });
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["vorhaben", "geltende_regel", "zustaendiger"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const vorhabenName = raw['vorhaben'] as string | null;
        if (vorhabenName) {
          const vorhabenMatch = vorhabenList.find(r => matchName(vorhabenName!, [String(r.fields.titel ?? '')]));
          if (vorhabenMatch) merged['vorhaben'] = createRecordUrl(APP_IDS.VORHABEN, vorhabenMatch.record_id);
        }
        const geltende_regelName = raw['geltende_regel'] as string | null;
        if (geltende_regelName) {
          const geltende_regelMatch = regelnUndGrenzenList.find(r => matchName(geltende_regelName!, [String(r.fields.titel ?? '')]));
          if (geltende_regelMatch) merged['geltende_regel'] = createRecordUrl(APP_IDS.REGELN_UND_GRENZEN, geltende_regelMatch.record_id);
        }
        const zustaendigerName = raw['zustaendiger'] as string | null;
        if (zustaendigerName) {
          const zustaendigerMatch = nutzerList.find(r => matchName(zustaendigerName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (zustaendigerMatch) merged['zustaendiger'] = createRecordUrl(APP_IDS.NUTZER, zustaendigerMatch.record_id);
        }
        return merged as Partial<Entscheidungen['fields']>;
      });
      setAiText('');
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error(`${t('scan_error')}:`, err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleAiExtract(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleAiExtract(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues
    ? t('edit_entity', { entity: appLabel('entscheidungen') })
    : t('new_entity', { entity: appLabel('entscheidungen') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'vorhaben': (
      <div key="vorhaben" className="space-y-1.5">
        <Label htmlFor="vorhaben">{fieldLabel('entscheidungen', 'vorhaben')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="vorhaben"
          placeholder="Zu welchem Vorhaben?"
          items={vorhabenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          value={extractRecordId(fields.vorhaben)}
          onChange={id => setFields(f => ({ ...f, vorhaben: id ? createRecordUrl(APP_IDS.VORHABEN, id) : undefined }))}
          onCreateNew={(q) => openCreateVorhaben("vorhaben", q)}
          createLabel={t('create_in', { entity: appLabel('vorhaben') })}
        />
        {showErrors && !fields.vorhaben && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'vorhaben')}</p>
        )}
      </div>
    ),
    'frage': (
      <div key="frage" className="space-y-1.5">
        <Label htmlFor="frage">{fieldLabel('entscheidungen', 'frage')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="frage"
          placeholder="Was ist zu entscheiden?"
          value={fields.frage ?? ''}
          onChange={e => setFields(f => ({ ...f, frage: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.frage && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'frage')}</p>
        )}
      </div>
    ),
    'alternativen': (
      <div key="alternativen" className="space-y-1.5">
        <Label htmlFor="alternativen">{fieldLabel('entscheidungen', 'alternativen')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="alternativen"
          placeholder="Eine Alternative pro Zeile"
          value={fields.alternativen ?? ''}
          onChange={e => setFields(f => ({ ...f, alternativen: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.alternativen && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'alternativen')}</p>
        )}
      </div>
    ),
    'gesicherte_fakten': (
      <div key="gesicherte_fakten" className="space-y-1.5">
        <Label htmlFor="gesicherte_fakten">{fieldLabel('entscheidungen', 'gesicherte_fakten')}</Label>
        <Textarea
          id="gesicherte_fakten"
          placeholder="Ein Fakt pro Zeile"
          value={fields.gesicherte_fakten ?? ''}
          onChange={e => setFields(f => ({ ...f, gesicherte_fakten: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'offene_annahmen': (
      <div key="offene_annahmen" className="space-y-1.5">
        <Label htmlFor="offene_annahmen">{fieldLabel('entscheidungen', 'offene_annahmen')}</Label>
        <Textarea
          id="offene_annahmen"
          placeholder="Eine Annahme pro Zeile"
          value={fields.offene_annahmen ?? ''}
          onChange={e => setFields(f => ({ ...f, offene_annahmen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'fehlende_informationen': (
      <div key="fehlende_informationen" className="space-y-1.5">
        <Label htmlFor="fehlende_informationen">{fieldLabel('entscheidungen', 'fehlende_informationen')}</Label>
        <Textarea
          id="fehlende_informationen"
          placeholder="Was fehlt noch?"
          value={fields.fehlende_informationen ?? ''}
          onChange={e => setFields(f => ({ ...f, fehlende_informationen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'konsequenzen': (
      <div key="konsequenzen" className="space-y-1.5">
        <Label htmlFor="konsequenzen">{fieldLabel('entscheidungen', 'konsequenzen')}</Label>
        <Textarea
          id="konsequenzen"
          placeholder="Folgen je Option"
          value={fields.konsequenzen ?? ''}
          onChange={e => setFields(f => ({ ...f, konsequenzen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'geltende_regel': (
      <div key="geltende_regel" className="space-y-1.5">
        <Label htmlFor="geltende_regel">{fieldLabel('entscheidungen', 'geltende_regel')}</Label>
        <Combobox
          id="geltende_regel"
          placeholder="Welche Regel gilt?"
          items={regelnUndGrenzenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          value={extractRecordId(fields.geltende_regel)}
          onChange={id => setFields(f => ({ ...f, geltende_regel: id ? createRecordUrl(APP_IDS.REGELN_UND_GRENZEN, id) : undefined }))}
          onCreateNew={(q) => openCreateRegelnUndGrenzen("geltende_regel", q)}
          createLabel={t('create_in', { entity: appLabel('regeln_und_grenzen') })}
        />
      </div>
    ),
    'zustaendiger': (
      <div key="zustaendiger" className="space-y-1.5">
        <Label htmlFor="zustaendiger">{fieldLabel('entscheidungen', 'zustaendiger')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="zustaendiger"
          placeholder="Wer entscheidet?"
          items={nutzerListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.vorname ?? r.record_id),
          }))}
          value={extractRecordId(fields.zustaendiger)}
          onChange={id => setFields(f => ({ ...f, zustaendiger: id ? createRecordUrl(APP_IDS.NUTZER, id) : undefined }))}
          onCreateNew={(q) => openCreateNutzer("zustaendiger", q)}
          createLabel={t('create_in', { entity: appLabel('nutzer') })}
        />
        {showErrors && !fields.zustaendiger && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'zustaendiger')}</p>
        )}
      </div>
    ),
    'frist': (
      <div key="frist" className="space-y-1.5">
        <Label htmlFor="frist">{fieldLabel('entscheidungen', 'frist')}</Label>
        <DatePicker
          id="frist"
          placeholder="Bis wann entscheiden?"
          mode="date"
          value={fields.frist ?? null}
          onChange={v => setFields(f => ({ ...f, frist: v ?? undefined }))}
        />
      </div>
    ),
    'gewaehlte_option': (
      <div key="gewaehlte_option" className="space-y-1.5">
        <Label htmlFor="gewaehlte_option">{fieldLabel('entscheidungen', 'gewaehlte_option')}</Label>
        <Textarea
          id="gewaehlte_option"
          placeholder="Welche Option gewinnt?"
          value={fields.gewaehlte_option ?? ''}
          onChange={e => setFields(f => ({ ...f, gewaehlte_option: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'begruendung': (
      <div key="begruendung" className="space-y-1.5">
        <Label htmlFor="begruendung">{fieldLabel('entscheidungen', 'begruendung')}</Label>
        <Textarea
          id="begruendung"
          placeholder="Warum diese Option?"
          value={fields.begruendung ?? ''}
          onChange={e => setFields(f => ({ ...f, begruendung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'umsetzungsplan': (
      <div key="umsetzungsplan" className="space-y-1.5">
        <Label htmlFor="umsetzungsplan">{fieldLabel('entscheidungen', 'umsetzungsplan')}</Label>
        <Textarea
          id="umsetzungsplan"
          placeholder="Ein Schritt pro Zeile"
          value={fields.umsetzungsplan ?? ''}
          onChange={e => setFields(f => ({ ...f, umsetzungsplan: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'beschlussdatum': (
      <div key="beschlussdatum" className="space-y-1.5">
        <Label htmlFor="beschlussdatum">{fieldLabel('entscheidungen', 'beschlussdatum')}</Label>
        <DatePicker
          id="beschlussdatum"
          placeholder="Wann wurde entschieden?"
          mode="date"
          value={fields.beschlussdatum ?? null}
          onChange={v => setFields(f => ({ ...f, beschlussdatum: v ?? undefined }))}
        />
      </div>
    ),
    'entscheidungsstatus': (
      <div key="entscheidungsstatus" className="space-y-1.5">
        <Label htmlFor="entscheidungsstatus">{fieldLabel('entscheidungen', 'entscheidungsstatus')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.entscheidungsstatus) === 'in_vorbereitung'}
            onClick={() => setFields(f => ({ ...f, entscheidungsstatus: (lookupKey(f.entscheidungsstatus) === 'in_vorbereitung' ? undefined : 'in_vorbereitung') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.entscheidungsstatus) === 'in_vorbereitung'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'entscheidungsstatus', 'in_vorbereitung') ?? 'In Vorbereitung'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.entscheidungsstatus) === 'entscheidungsreif'}
            onClick={() => setFields(f => ({ ...f, entscheidungsstatus: (lookupKey(f.entscheidungsstatus) === 'entscheidungsreif' ? undefined : 'entscheidungsreif') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.entscheidungsstatus) === 'entscheidungsreif'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'entscheidungsstatus', 'entscheidungsreif') ?? 'Entscheidungsreif'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.entscheidungsstatus) === 'entschieden'}
            onClick={() => setFields(f => ({ ...f, entscheidungsstatus: (lookupKey(f.entscheidungsstatus) === 'entschieden' ? undefined : 'entschieden') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.entscheidungsstatus) === 'entschieden'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'entscheidungsstatus', 'entschieden') ?? 'Entschieden'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.entscheidungsstatus) === 'umgesetzt'}
            onClick={() => setFields(f => ({ ...f, entscheidungsstatus: (lookupKey(f.entscheidungsstatus) === 'umgesetzt' ? undefined : 'umgesetzt') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.entscheidungsstatus) === 'umgesetzt'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'entscheidungsstatus', 'umgesetzt') ?? 'Umgesetzt'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.entscheidungsstatus) === 'verworfen'}
            onClick={() => setFields(f => ({ ...f, entscheidungsstatus: (lookupKey(f.entscheidungsstatus) === 'verworfen' ? undefined : 'verworfen') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.entscheidungsstatus) === 'verworfen'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'entscheidungsstatus', 'verworfen') ?? 'Verworfen'}
          </button>
        </div>
        {showErrors && !fields.entscheidungsstatus && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'entscheidungsstatus')}</p>
        )}
      </div>
    ),
  };
  const orderedFields = applyFieldOrder(Object.keys(fieldBlocks), formEnhancements.fieldOrder);
  const orderedFieldsKey = orderedFields.map((it) => typeof it === 'string' ? it : it.row.join('+')).join(',');

  // Render-Modell für Computed-Felder:
  //
  //   • BACKEND-FELDER mit computed-Eintrag (z.B. gesamtpreis bei einer
  //     Katzenpension) bleiben als normales Eingabe-Feld stehen. Der Number-
  //     Input nutzt den computed-Wert als Vorschlag, der User kann jederzeit
  //     überschreiben (clearing → restore computed).
  //   • VIRTUELLE computed-Keys (Eintrag in formEnhancements.computed, ABER
  //     kein passendes Backend-Feld in orderedFields) erscheinen NICHT als
  //     Input, sondern unten als kompakte 'Berechnungen'-Übersicht oder als
  //     Inline-Hint unter dem letzten beitragenden Input.
  const FIELD_LABELS: Record<string, string> = {"vorhaben": "Vorhaben", "frage": "Zu entscheidende Frage", "alternativen": "Alternativen", "gesicherte_fakten": "Gesicherte Fakten", "offene_annahmen": "Offene Annahmen", "fehlende_informationen": "Fehlende Informationen", "konsequenzen": "Konsequenzen der Optionen", "geltende_regel": "Geltende Regel", "zustaendiger": "Zuständiger", "frist": "Frist", "gewaehlte_option": "Gewählte Option", "begruendung": "Begründung", "umsetzungsplan": "Was wird umgesetzt", "beschlussdatum": "Beschlussdatum", "entscheidungsstatus": "Entscheidungsstatus"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"vorhaben": {"titel": "Titel", "ziel": "Ziel", "fachlicher_kontext": "Fachlicher Kontext", "historische_entscheidungen": "Historische Entscheidungen und frühere Fehler", "technische_besonderheiten": "Technische Besonderheiten", "ansprechpartner": "Ansprechpartner", "arbeitszustand": "Arbeitszustand", "prioritaet": "Priorität", "verantwortlicher": "Verantwortlicher", "startdatum": "Startdatum", "zieldatum": "Zieldatum", "naechster_schritt": "Nächster Schritt", "uebergabehinweise": "Übergabehinweise"}, "geltende_regel": {"titel": "Titel", "beschreibung": "Beschreibung", "regeltyp": "Regeltyp", "geltungsbereich": "Geltungsbereich", "erforderliche_rolle": "Erforderliche Rolle", "verantwortlicher": "Verantwortlicher", "gueltig_ab": "Gültig ab", "gueltig_bis": "Gültig bis", "status": "Status"}, "zustaendiger": {"vorname": "Vorname", "nachname": "Nachname", "email": "E-Mail", "art": "Art", "rolle": "Rolle", "berechtigungsstufe": "Berechtigungsstufe", "fachgebiet": "Fachgebiet", "aktiv": "Aktiv"}};
  const inputFields = useMemo(() => flattenFieldOrder(orderedFields), [orderedFieldsKey]);
  const backendFieldSet = useMemo(() => new Set(inputFields), [inputFields.join(',')]);
  const virtualComputed = useMemo(
    () => Object.fromEntries(
      Object.entries(formEnhancements.computed).filter(([k]) => !backendFieldSet.has(k)),
    ),
    [backendFieldSet],
  );
  const virtualFormEnhancements = useMemo(
    () => ({ ...formEnhancements, computed: virtualComputed }),
    [virtualComputed],
  );
  const computedLayout = useMemo(
    () => classifyComputed(virtualFormEnhancements, inputFields, computedDeps),
    [virtualFormEnhancements, inputFields.join(',')],
  );
  // Applookup-Referenzen: pro ownKey (Lookup-Feld im Form) die Liste der
  // lookupKeys, die in irgendeiner computed-Formel referenziert werden.
  // MODUS-1: aus dem Spec-Tree extrahiert. MODUS-2: aus dem Build-Time-
  // Export computedApplookupRefs (parse-formulas hat Regex-Pairs gesammelt).
  // Pro (ownKey, lookupKey)-Paar nur einmal; pro ownKey können aber mehrere
  // lookupKeys gleichzeitig auftauchen (z.B. einzelpreis UND karten10_preis
  // beim Yoga-Kurs), und alle werden separat als Inline-Hint gerendert.
  const applookupRefs = useMemo(
    () => mergeApplookupRefs(
      extractApplookupRefs(formEnhancements.computed),
      computedApplookupRefs,
    ),
    [],
  );
  function summaryLabel(k: string): string {
    if (FIELD_LABELS[k]) return FIELD_LABELS[k];
    // Leading underscore(s) als Virtual-Marker abstreifen; Unterstriche zu
    // Leerzeichen, jedes Wort kapitalisieren. Umlaute kommen vom Sub-Agent
    // direkt im Key (z. B. `_buchung_dauer_nächte`) — JS/TS/Vite unterstützen
    // Unicode-Identifier nativ, daher keine ASCII-Transliteration nötig.
    return k.replace(/^_+/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  function formatSummaryValue(k: string, v: unknown): string {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);
    // Backend-Feld mit €-Label ODER virtueller Computed-Key, dessen Name nach Geld aussieht.
    const looksLikeCurrency = CURRENCY_KEYS.has(k) || /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k);
    if (looksLikeCurrency) {
      return n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0 max-sm:[&>button]:size-10 max-sm:[&>button]:grid max-sm:[&>button]:place-items-center max-sm:[&>button]:rounded-full max-sm:[&>button]:border max-sm:[&>button]:border-input max-sm:[&>button]:bg-background max-sm:[&>button]:opacity-100 max-sm:[&>button>svg]:size-5">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center gap-3 space-y-0">
          <DialogTitle className="flex-1 truncate text-left">{DIALOG_INTENT}</DialogTitle>
          {enablePhotoScan && (
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              aria-expanded={aiOpen}
              aria-controls="ai-fill-panel"
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 max-sm:py-2.5 max-sm:px-4 text-xs font-semibold transition-all mr-7 max-sm:mr-12 shadow-sm ${
                aiOpen
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 hover:border-primary/50'
              }`}
            >
              <IconSparkles className={`h-3.5 w-3.5 ${aiOpen ? '' : 'text-primary'}`} />
              <span className="hidden sm:inline">{t('smart_fill')}</span>
              <IconChevronDown className={`h-3 w-3 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </DialogHeader>
        {enablePhotoScan && aiOpen && (
          <div id="ai-fill-panel" className="border-b bg-muted/20 px-6 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">{t('scan_header_sub')}</p>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  {t('useinfo_label')}
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? t('useinfo_loading') : `(${t('useinfo_more')})`}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">{t('profile_preamble')}</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">{t('useinfo_error')}</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_analyzing')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_analyzing_sub')}</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('scan_success')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_success_sub')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_upload')}</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1" />{t('scan_camera_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1" />{t('scan_file_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1" />{t('scan_doc_btn')}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder={t('scan_text_placeholder')}
                value={aiText}
                onChange={e => {
                  setAiText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(Math.max(el.scrollHeight, 56), 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiText.trim() && !scanning) {
                    e.preventDefault();
                    handleAiExtract();
                  }
                }}
                disabled={scanning}
                rows={2}
                className="pr-12 resize-none text-sm overflow-y-auto"
              />
              <button
                type="button"
                className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                disabled={scanning}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setAiText(prev => prev ? prev + '\n' + text : text);
                  } catch {}
                }}
                title={t('paste')}
              >
                <IconClipboard className="h-4 w-4" />
              </button>
            </div>
            {aiText.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                disabled={scanning}
                onClick={() => handleAiExtract()}
              >
                <IconSparkles className="h-3.5 w-3.5 mr-1.5" />{t('scan_text_analyze')}
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 min-w-0 max-sm:[&_input]:h-11">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-w-0">
            {(() => {
              const renderField = (k: string) => {
                const inlineHints = computedLayout.anchors[k] ?? [];
                const refs = applookupRefs[k] ?? [];
                // A field the plan gives to a TOOL. On CREATE it is not shown
                // at all — the value does not exist yet and typing one only
                // gets overwritten. On EDIT it stays a normal input with a
                // note: when a tool could not compose its value (a missing
                // ingredient), this is the only place to repair the record.
                if (SYSTEM_ASSIGNED.includes(k) && !recordId) {
                  return (
                    <div key={k} className="space-y-1.5 min-w-0">
                      <Label>{fieldLabel('entscheidungen', k)}</Label>
                      <p className="text-sm text-muted-foreground">{t('assigned_by_system')}</p>
                    </div>
                  );
                }
                return (
                  <div key={k} className="space-y-1.5 min-w-0">
                    {fieldBlocks[k]}
                    {SYSTEM_ASSIGNED.includes(k) && (
                      <p className="text-xs text-muted-foreground">{t('assigned_by_system')}</p>
                    )}
                    {refs.map(({ lookupKey }) => {
                      // Show the live numeric value the formula will pull from
                      // the selected lookup target (e.g. "Monatspreis: 34,90 €"
                      // under the Tarif combobox). Hidden while no lookup is
                      // selected or the target field is non-numeric.
                      const v = resolveApplookupRef(k, lookupKey, fields as Record<string, unknown>, computedContext);
                      if (v === null) return null;
                      const lbl = APPLOOKUP_LABELS[k]?.[lookupKey] ?? lookupKey;
                      const text = formatSummaryValue(lookupKey, v);
                      return (
                        <div key={`alh-${k}-${lookupKey}`} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{lbl}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                    {inlineHints.map((cKey) => {
                      const v = computedValues[cKey];
                      const text = formatSummaryValue(cKey, v);
                      if (text === '—') return null;
                      return (
                        <div key={cKey} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{summaryLabel(cKey)}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return orderedFields.map((item, idx) => {
                if (typeof item === 'string') return renderField(item);
                const cols = item.cols ?? `repeat(${item.row.length}, minmax(0, 1fr))`;
                return (
                  <div key={`row-${idx}`} className="grid gap-3" style={{ gridTemplateColumns: cols }}>
                    {item.row.map(renderField)}
                  </div>
                );
              });
            })()}
            {(computedLayout.aggregates.length > 0 || computedLayout.finalTotal) && (
              <div className="mt-6 pt-4 border-t border-border space-y-1.5">
                {computedLayout.aggregates.length > 0 && (
                  <dl className="space-y-1.5 pb-2">
                    {computedLayout.aggregates.map((k) => {
                      const userVal = (fields as Record<string, unknown>)[k];
                      const computed = computedValues[k];
                      const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                      return (
                        <div key={k} className="flex justify-between items-baseline gap-3">
                          <dt className="text-sm text-muted-foreground truncate">{summaryLabel(k)}</dt>
                          <dd className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSummaryValue(k, v)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {computedLayout.finalTotal && (() => {
                  const k = computedLayout.finalTotal;
                  const userVal = (fields as Record<string, unknown>)[k];
                  const computed = computedValues[k];
                  const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                  // Innere Border nur wenn aggregates existieren — sonst hätten wir
                  // zwei direkt aufeinanderfolgende Striche (Outer + Inner) mit nur
                  // einer Aggregat-Zeile dazwischen → zu viel visuelles Rauschen.
                  const sep = computedLayout.aggregates.length > 0 ? 'pt-3 border-t border-border' : 'pt-1';
                  return (
                    <div className={`flex justify-between items-baseline gap-3 ${sep}`}>
                      <span className="text-base font-semibold text-foreground">{summaryLabel(k)}</span>
                      <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground">{formatSummaryValue(k, v)}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {showErrors && missingRequired.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                {t('missing_required')}
              </p>
            )}
            {recordId && (
              <div className="pt-2 border-t border-border">
                <AttachmentsSection appId={APP_IDS.ENTSCHEIDUNGEN} recordId={recordId} />
              </div>
            )}
          </div>
          {submitError && (
            <div className="flex items-start gap-2 border-t border-destructive/20 bg-destructive/10 px-6 py-2.5 text-sm text-destructive" role="alert">
              <IconAlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{submitError}</span>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-6 py-3 gap-2 max-sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="max-sm:h-12 max-sm:flex-1 max-sm:text-base">{t('cancel')}</Button>
            <Button
              type="submit"
              className="max-sm:h-12 max-sm:flex-1 max-sm:text-base"
              disabled={saving || !isDirty || (showErrors && missingRequired.length > 0)}
            >
              {saving ? t('saving') : defaultValues ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {createVorhabenOpen && (
      <VorhabenDialog
        open={createVorhabenOpen}
        onClose={() => setCreateVorhabenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createVorhabenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Vorhaben;
            setExtraVorhaben(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.VORHABEN, result.id);
            setFields(prev => ({ ...prev, [createVorhabenField]: url } as any));
          }
          setCreateVorhabenOpen(false);
        }}
        defaultValues={createVorhabenInitial
          ? ({ titel: createVorhabenInitial } as any)
          : undefined}
        nutzerList={nutzerList}
      />
    )}
    {createRegelnUndGrenzenOpen && (
      <RegelnUndGrenzenDialog
        open={createRegelnUndGrenzenOpen}
        onClose={() => setCreateRegelnUndGrenzenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createRegelnUndGrenzenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as RegelnUndGrenzen;
            setExtraRegelnUndGrenzen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.REGELN_UND_GRENZEN, result.id);
            setFields(prev => ({ ...prev, [createRegelnUndGrenzenField]: url } as any));
          }
          setCreateRegelnUndGrenzenOpen(false);
        }}
        defaultValues={createRegelnUndGrenzenInitial
          ? ({ titel: createRegelnUndGrenzenInitial } as any)
          : undefined}
        nutzerList={nutzerList}
      />
    )}
    {createNutzerOpen && (
      <NutzerDialog
        open={createNutzerOpen}
        onClose={() => setCreateNutzerOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createNutzerEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Nutzer;
            setExtraNutzer(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.NUTZER, result.id);
            setFields(prev => ({ ...prev, [createNutzerField]: url } as any));
          }
          setCreateNutzerOpen(false);
        }}
        defaultValues={createNutzerInitial
          ? ({ vorname: createNutzerInitial } as any)
          : undefined}
      />
    )}
    </>
  );
}