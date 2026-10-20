import type { Vorhaben, Nutzer, AufgabenUndKiVorschlaege, Entscheidungen, Erfahrungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface VorhabenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Vorhaben;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** 1:N „Aufgaben und KI-Vorschläge" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenUndKiVorschlaegeList: AufgabenUndKiVorschlaege[];
  /** Zeilen-Klick → overlay.push auf das AufgabenUndKiVorschlaege-Detail (nie der Edit-Dialog). */
  onOpenAufgabenUndKiVorschlaege: (record: AufgabenUndKiVorschlaege) => void;
  /** Kontextuelles „+": öffnet den AufgabenUndKiVorschlaege-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabenUndKiVorschlaege?: () => void;
  /** 1:N „Entscheidungen" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
  /** 1:N „Erfahrungen" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
}

export function VorhabenDetails({
  record,
  nutzerList,
  onOpenNutzer,
  aufgabenUndKiVorschlaegeList,
  onOpenAufgabenUndKiVorschlaege,
  onAddAufgabenUndKiVorschlaege,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
}: VorhabenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const verantwortlicherTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.verantwortlicher));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('vorhaben', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('vorhaben', 'ziel')} value={record.fields.ziel} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorhaben', 'fachlicher_kontext')} value={record.fields.fachlicher_kontext} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorhaben', 'historische_entscheidungen')} value={record.fields.historische_entscheidungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorhaben', 'technische_besonderheiten')} value={record.fields.technische_besonderheiten} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorhaben', 'ansprechpartner')} value={record.fields.ansprechpartner} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorhaben', 'arbeitszustand')} value={record.fields.arbeitszustand} format="pill" />
        <RecordField label={fieldLabel('vorhaben', 'prioritaet')} value={record.fields.prioritaet} format="pill" />
        <RecordField label={fieldLabel('vorhaben', 'startdatum')} value={record.fields.startdatum} format="date" />
        <RecordField label={fieldLabel('vorhaben', 'zieldatum')} value={record.fields.zieldatum} format="date" />
        <RecordField label={fieldLabel('vorhaben', 'naechster_schritt')} value={record.fields.naechster_schritt} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorhaben', 'uebergabehinweise')} value={record.fields.uebergabehinweise} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('vorhaben', 'verantwortlicher')}
          name={verantwortlicherTarget?.fields.vorname ?? '—'}
          meta={[verantwortlicherTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={verantwortlicherTarget && onOpenNutzer ? () => onOpenNutzer!(verantwortlicherTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('aufgaben_und_ki_vorschlaege')}
        items={aufgabenUndKiVorschlaegeList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben_und_ki_vorschlaege'), meta: r.fields.freigabedatum })}
        onOpen={onOpenAufgabenUndKiVorschlaege}
        onAdd={onAddAufgabenUndKiVorschlaege}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: appLabel('entscheidungen'), meta: r.fields.frist })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: undefined })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.VORHABEN} recordId={record.record_id} readOnly={!perms.canWrite('vorhaben')} />
    </>
  );
}
