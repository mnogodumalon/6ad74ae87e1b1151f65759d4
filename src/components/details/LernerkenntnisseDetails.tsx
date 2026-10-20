import type { Lernerkenntnisse, Erfahrungen, Nutzer } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface LernerkenntnisseDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Lernerkenntnisse;
  /** N:1-Ziel „Erfahrungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  erfahrungenList: Erfahrungen[];
  /** Reserviert — Erfahrungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenErfahrungen?: (record: Erfahrungen) => void;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
}

export function LernerkenntnisseDetails({
  record,
  erfahrungenList,
  nutzerList,
  onOpenNutzer,
}: LernerkenntnisseDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const prueferTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.pruefer));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('lernerkenntnisse', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('lernerkenntnisse', 'erkenntnis')} value={record.fields.erkenntnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('lernerkenntnisse', 'erfahrungen')} value={Array.isArray(record.fields.erfahrungen) ? record.fields.erfahrungen.map((u: unknown) => erfahrungenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('lernerkenntnisse', 'gueltigkeitsbereich')} value={record.fields.gueltigkeitsbereich} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('lernerkenntnisse', 'grenzen')} value={record.fields.grenzen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('lernerkenntnisse', 'empfehlung')} value={record.fields.empfehlung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('lernerkenntnisse', 'pruefdatum')} value={record.fields.pruefdatum} format="date" />
        <RecordField label={fieldLabel('lernerkenntnisse', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('lernerkenntnisse', 'wiederverwendungshinweis')} value={record.fields.wiederverwendungshinweis} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('lernerkenntnisse', 'pruefer')}
          name={prueferTarget?.fields.vorname ?? '—'}
          meta={[prueferTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={prueferTarget && onOpenNutzer ? () => onOpenNutzer!(prueferTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.LERNERKENNTNISSE} recordId={record.record_id} readOnly={!perms.canWrite('lernerkenntnisse')} />
    </>
  );
}
