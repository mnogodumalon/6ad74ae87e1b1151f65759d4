import type { AufgabenUndKiVorschlaege, Vorhaben, Nutzer, RegelnUndGrenzen, ErgebnisseUndFolgen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface AufgabenUndKiVorschlaegeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: AufgabenUndKiVorschlaege;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** N:1-Ziel „RegelnUndGrenzen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  regelnUndGrenzenList: RegelnUndGrenzen[];
  /** Klick auf die RegelnUndGrenzen-Relation → overlay.push auf dessen Detail. */
  onOpenRegelnUndGrenzen?: (record: RegelnUndGrenzen) => void;
  /** 1:N „Ergebnisse und Folgen" (aufgabe): VOLLE Liste — der Block filtert auf diesen Record. */
  ergebnisseUndFolgenList: ErgebnisseUndFolgen[];
  /** Zeilen-Klick → overlay.push auf das ErgebnisseUndFolgen-Detail (nie der Edit-Dialog). */
  onOpenErgebnisseUndFolgen: (record: ErgebnisseUndFolgen) => void;
  /** Kontextuelles „+": öffnet den ErgebnisseUndFolgen-Dialog mit diesem Record vorgesetzt. */
  onAddErgebnisseUndFolgen?: () => void;
}

export function AufgabenUndKiVorschlaegeDetails({
  record,
  vorhabenList,
  onOpenVorhaben,
  nutzerList,
  onOpenNutzer,
  regelnUndGrenzenList,
  onOpenRegelnUndGrenzen,
  ergebnisseUndFolgenList,
  onOpenErgebnisseUndFolgen,
  onAddErgebnisseUndFolgen,
}: AufgabenUndKiVorschlaegeDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const vorschlagenderTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.vorschlagender));
  const prueferTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.pruefer));
  const geltende_regelTarget = regelnUndGrenzenList.find(r => r.record_id === extractRecordId(record.fields.geltende_regel));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('aufgaben_und_ki_vorschlaege', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('aufgaben_und_ki_vorschlaege', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('aufgaben_und_ki_vorschlaege', 'quelle')} value={record.fields.quelle} format="pill" />
        <RecordField label={fieldLabel('aufgaben_und_ki_vorschlaege', 'vorschlag_begruendung')} value={record.fields.vorschlag_begruendung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('aufgaben_und_ki_vorschlaege', 'zustand')} value={record.fields.zustand} format="pill" />
        <RecordField label={fieldLabel('aufgaben_und_ki_vorschlaege', 'freigabedatum')} value={record.fields.freigabedatum} format="datetime" />
        <RecordField label={fieldLabel('aufgaben_und_ki_vorschlaege', 'ausgefuehrte_aktion')} value={record.fields.ausgefuehrte_aktion} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('aufgaben_und_ki_vorschlaege', 'ausfuehrungsdatum')} value={record.fields.ausfuehrungsdatum} format="datetime" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('aufgaben_und_ki_vorschlaege', 'vorhaben')}
          name={vorhabenTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgaben_und_ki_vorschlaege', 'vorschlagender')}
          name={vorschlagenderTarget?.fields.vorname ?? '—'}
          meta={[vorschlagenderTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={vorschlagenderTarget && onOpenNutzer ? () => onOpenNutzer!(vorschlagenderTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgaben_und_ki_vorschlaege', 'pruefer')}
          name={prueferTarget?.fields.vorname ?? '—'}
          meta={[prueferTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={prueferTarget && onOpenNutzer ? () => onOpenNutzer!(prueferTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgaben_und_ki_vorschlaege', 'geltende_regel')}
          name={geltende_regelTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={geltende_regelTarget && onOpenRegelnUndGrenzen ? () => onOpenRegelnUndGrenzen!(geltende_regelTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('ergebnisse_und_folgen')}
        items={ergebnisseUndFolgenList.filter(r => extractRecordId(r.fields.aufgabe) === record.record_id)}
        map={r => ({ name: appLabel('ergebnisse_und_folgen'), meta: r.fields.messdatum })}
        onOpen={onOpenErgebnisseUndFolgen}
        onAdd={onAddErgebnisseUndFolgen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.AUFGABEN_UND_KI_VORSCHLAEGE} recordId={record.record_id} readOnly={!perms.canWrite('aufgaben_und_ki_vorschlaege')} />
    </>
  );
}
