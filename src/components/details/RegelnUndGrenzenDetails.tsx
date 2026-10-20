import type { RegelnUndGrenzen, Nutzer, AufgabenUndKiVorschlaege, Entscheidungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface RegelnUndGrenzenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: RegelnUndGrenzen;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** 1:N „Aufgaben und KI-Vorschläge" (geltende_regel): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenUndKiVorschlaegeList: AufgabenUndKiVorschlaege[];
  /** Zeilen-Klick → overlay.push auf das AufgabenUndKiVorschlaege-Detail (nie der Edit-Dialog). */
  onOpenAufgabenUndKiVorschlaege: (record: AufgabenUndKiVorschlaege) => void;
  /** Kontextuelles „+": öffnet den AufgabenUndKiVorschlaege-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabenUndKiVorschlaege?: () => void;
  /** 1:N „Entscheidungen" (geltende_regel): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
}

export function RegelnUndGrenzenDetails({
  record,
  nutzerList,
  onOpenNutzer,
  aufgabenUndKiVorschlaegeList,
  onOpenAufgabenUndKiVorschlaege,
  onAddAufgabenUndKiVorschlaege,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
}: RegelnUndGrenzenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const verantwortlicherTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.verantwortlicher));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('regeln_und_grenzen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('regeln_und_grenzen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('regeln_und_grenzen', 'regeltyp')} value={record.fields.regeltyp} format="pill" />
        <RecordField label={fieldLabel('regeln_und_grenzen', 'geltungsbereich')} value={record.fields.geltungsbereich} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('regeln_und_grenzen', 'erforderliche_rolle')} value={record.fields.erforderliche_rolle} format="pill" />
        <RecordField label={fieldLabel('regeln_und_grenzen', 'gueltig_ab')} value={record.fields.gueltig_ab} format="date" />
        <RecordField label={fieldLabel('regeln_und_grenzen', 'gueltig_bis')} value={record.fields.gueltig_bis} format="date" />
        <RecordField label={fieldLabel('regeln_und_grenzen', 'status')} value={record.fields.status} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('regeln_und_grenzen', 'verantwortlicher')}
          name={verantwortlicherTarget?.fields.vorname ?? '—'}
          meta={[verantwortlicherTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={verantwortlicherTarget && onOpenNutzer ? () => onOpenNutzer!(verantwortlicherTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('aufgaben_und_ki_vorschlaege')}
        items={aufgabenUndKiVorschlaegeList.filter(r => extractRecordId(r.fields.geltende_regel) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben_und_ki_vorschlaege'), meta: r.fields.freigabedatum })}
        onOpen={onOpenAufgabenUndKiVorschlaege}
        onAdd={onAddAufgabenUndKiVorschlaege}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.geltende_regel) === record.record_id)}
        map={r => ({ name: appLabel('entscheidungen'), meta: r.fields.frist })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.REGELN_UND_GRENZEN} recordId={record.record_id} readOnly={!perms.canWrite('regeln_und_grenzen')} />
    </>
  );
}
