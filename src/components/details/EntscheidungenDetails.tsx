import type { Entscheidungen, Vorhaben, RegelnUndGrenzen, Nutzer, ErgebnisseUndFolgen, Erfahrungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface EntscheidungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Entscheidungen;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „RegelnUndGrenzen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  regelnUndGrenzenList: RegelnUndGrenzen[];
  /** Klick auf die RegelnUndGrenzen-Relation → overlay.push auf dessen Detail. */
  onOpenRegelnUndGrenzen?: (record: RegelnUndGrenzen) => void;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** 1:N „Ergebnisse und Folgen" (entscheidung): VOLLE Liste — der Block filtert auf diesen Record. */
  ergebnisseUndFolgenList: ErgebnisseUndFolgen[];
  /** Zeilen-Klick → overlay.push auf das ErgebnisseUndFolgen-Detail (nie der Edit-Dialog). */
  onOpenErgebnisseUndFolgen: (record: ErgebnisseUndFolgen) => void;
  /** Kontextuelles „+": öffnet den ErgebnisseUndFolgen-Dialog mit diesem Record vorgesetzt. */
  onAddErgebnisseUndFolgen?: () => void;
  /** 1:N „Erfahrungen" (entscheidung): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
}

export function EntscheidungenDetails({
  record,
  vorhabenList,
  onOpenVorhaben,
  regelnUndGrenzenList,
  onOpenRegelnUndGrenzen,
  nutzerList,
  onOpenNutzer,
  ergebnisseUndFolgenList,
  onOpenErgebnisseUndFolgen,
  onAddErgebnisseUndFolgen,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
}: EntscheidungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const geltende_regelTarget = regelnUndGrenzenList.find(r => r.record_id === extractRecordId(record.fields.geltende_regel));
  const zustaendigerTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.zustaendiger));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('entscheidungen', 'frage')} value={record.fields.frage} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'alternativen')} value={record.fields.alternativen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'gesicherte_fakten')} value={record.fields.gesicherte_fakten} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'offene_annahmen')} value={record.fields.offene_annahmen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'fehlende_informationen')} value={record.fields.fehlende_informationen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'konsequenzen')} value={record.fields.konsequenzen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'frist')} value={record.fields.frist} format="date" />
        <RecordField label={fieldLabel('entscheidungen', 'gewaehlte_option')} value={record.fields.gewaehlte_option} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'begruendung')} value={record.fields.begruendung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'umsetzungsplan')} value={record.fields.umsetzungsplan} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'beschlussdatum')} value={record.fields.beschlussdatum} format="date" />
        <RecordField label={fieldLabel('entscheidungen', 'entscheidungsstatus')} value={record.fields.entscheidungsstatus} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('entscheidungen', 'vorhaben')}
          name={vorhabenTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('entscheidungen', 'geltende_regel')}
          name={geltende_regelTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={geltende_regelTarget && onOpenRegelnUndGrenzen ? () => onOpenRegelnUndGrenzen!(geltende_regelTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('entscheidungen', 'zustaendiger')}
          name={zustaendigerTarget?.fields.vorname ?? '—'}
          meta={[zustaendigerTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={zustaendigerTarget && onOpenNutzer ? () => onOpenNutzer!(zustaendigerTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('ergebnisse_und_folgen')}
        items={ergebnisseUndFolgenList.filter(r => extractRecordId(r.fields.entscheidung) === record.record_id)}
        map={r => ({ name: appLabel('ergebnisse_und_folgen'), meta: r.fields.messdatum })}
        onOpen={onOpenErgebnisseUndFolgen}
        onAdd={onAddErgebnisseUndFolgen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => extractRecordId(r.fields.entscheidung) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: undefined })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ENTSCHEIDUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('entscheidungen')} />
    </>
  );
}
