import type { Erfahrungen, Vorhaben, Entscheidungen, ErgebnisseUndFolgen, Nutzer, Lernerkenntnisse } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface ErfahrungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Erfahrungen;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „Entscheidungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  entscheidungenList: Entscheidungen[];
  /** Klick auf die Entscheidungen-Relation → overlay.push auf dessen Detail. */
  onOpenEntscheidungen?: (record: Entscheidungen) => void;
  /** N:1-Ziel „ErgebnisseUndFolgen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  ergebnisseUndFolgenList: ErgebnisseUndFolgen[];
  /** Klick auf die ErgebnisseUndFolgen-Relation → overlay.push auf dessen Detail. */
  onOpenErgebnisseUndFolgen?: (record: ErgebnisseUndFolgen) => void;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** 1:N „Lernerkenntnisse" (erfahrungen): VOLLE Liste — der Block filtert auf diesen Record. */
  lernerkenntnisseList: Lernerkenntnisse[];
  /** Zeilen-Klick → overlay.push auf das Lernerkenntnisse-Detail (nie der Edit-Dialog). */
  onOpenLernerkenntnisse: (record: Lernerkenntnisse) => void;
  /** Kontextuelles „+": öffnet den Lernerkenntnisse-Dialog mit diesem Record vorgesetzt. */
  onAddLernerkenntnisse?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Lernerkenntnisse-Datensatz. */
  onPickLernerkenntnisse?: () => void;
}

export function ErfahrungenDetails({
  record,
  vorhabenList,
  onOpenVorhaben,
  entscheidungenList,
  onOpenEntscheidungen,
  ergebnisseUndFolgenList,
  onOpenErgebnisseUndFolgen,
  nutzerList,
  onOpenNutzer,
  lernerkenntnisseList,
  onOpenLernerkenntnisse,
  onAddLernerkenntnisse,
  onPickLernerkenntnisse,
}: ErfahrungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const entscheidungTarget = entscheidungenList.find(r => r.record_id === extractRecordId(record.fields.entscheidung));
  const ergebnisTarget = ergebnisseUndFolgenList.find(r => r.record_id === extractRecordId(record.fields.ergebnis));
  const dokumentierenderTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.dokumentierender));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('erfahrungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'art')} value={record.fields.art} format="pill" />
        <RecordField label={fieldLabel('erfahrungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'gueltigkeitsbereich')} value={record.fields.gueltigkeitsbereich} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'voraussetzungen')} value={record.fields.voraussetzungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'pruefstatus')} value={record.fields.pruefstatus} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('erfahrungen', 'vorhaben')}
          name={vorhabenTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('erfahrungen', 'entscheidung')}
          name={entscheidungTarget?.fields.frage ?? '—'}
          meta={undefined}
          onClick={entscheidungTarget && onOpenEntscheidungen ? () => onOpenEntscheidungen!(entscheidungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('erfahrungen', 'ergebnis')}
          name={ergebnisTarget?.fields.erwartetes_ergebnis ?? '—'}
          meta={undefined}
          onClick={ergebnisTarget && onOpenErgebnisseUndFolgen ? () => onOpenErgebnisseUndFolgen!(ergebnisTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('erfahrungen', 'dokumentierender')}
          name={dokumentierenderTarget?.fields.vorname ?? '—'}
          meta={[dokumentierenderTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={dokumentierenderTarget && onOpenNutzer ? () => onOpenNutzer!(dokumentierenderTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('lernerkenntnisse')}
        items={lernerkenntnisseList.filter(r => Array.isArray(r.fields.erfahrungen) && r.fields.erfahrungen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('lernerkenntnisse'), meta: r.fields.pruefdatum })}
        onOpen={onOpenLernerkenntnisse}
        onAdd={onAddLernerkenntnisse}
        onPick={onPickLernerkenntnisse}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ERFAHRUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('erfahrungen')} />
    </>
  );
}
