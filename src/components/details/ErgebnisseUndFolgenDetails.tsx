import type { ErgebnisseUndFolgen, Entscheidungen, AufgabenUndKiVorschlaege, Nutzer, Erfahrungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface ErgebnisseUndFolgenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: ErgebnisseUndFolgen;
  /** N:1-Ziel „Entscheidungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  entscheidungenList: Entscheidungen[];
  /** Klick auf die Entscheidungen-Relation → overlay.push auf dessen Detail. */
  onOpenEntscheidungen?: (record: Entscheidungen) => void;
  /** N:1-Ziel „AufgabenUndKiVorschlaege": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  aufgabenUndKiVorschlaegeList: AufgabenUndKiVorschlaege[];
  /** Klick auf die AufgabenUndKiVorschlaege-Relation → overlay.push auf dessen Detail. */
  onOpenAufgabenUndKiVorschlaege?: (record: AufgabenUndKiVorschlaege) => void;
  /** N:1-Ziel „Nutzer": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  nutzerList: Nutzer[];
  /** Klick auf die Nutzer-Relation → overlay.push auf dessen Detail. */
  onOpenNutzer?: (record: Nutzer) => void;
  /** 1:N „Erfahrungen" (ergebnis): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
}

export function ErgebnisseUndFolgenDetails({
  record,
  entscheidungenList,
  onOpenEntscheidungen,
  aufgabenUndKiVorschlaegeList,
  onOpenAufgabenUndKiVorschlaege,
  nutzerList,
  onOpenNutzer,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
}: ErgebnisseUndFolgenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const entscheidungTarget = entscheidungenList.find(r => r.record_id === extractRecordId(record.fields.entscheidung));
  const aufgabeTarget = aufgabenUndKiVorschlaegeList.find(r => r.record_id === extractRecordId(record.fields.aufgabe));
  const beobachterTarget = nutzerList.find(r => r.record_id === extractRecordId(record.fields.beobachter));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('ergebnisse_und_folgen', 'erwartetes_ergebnis')} value={record.fields.erwartetes_ergebnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('ergebnisse_und_folgen', 'tatsaechliches_ergebnis')} value={record.fields.tatsaechliches_ergebnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('ergebnisse_und_folgen', 'abweichung')} value={record.fields.abweichung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('ergebnisse_und_folgen', 'bewertung')} value={record.fields.bewertung} format="pill" />
        <RecordField label={fieldLabel('ergebnisse_und_folgen', 'messdatum')} value={record.fields.messdatum} format="date" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('ergebnisse_und_folgen', 'entscheidung')}
          name={entscheidungTarget?.fields.frage ?? '—'}
          meta={undefined}
          onClick={entscheidungTarget && onOpenEntscheidungen ? () => onOpenEntscheidungen!(entscheidungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('ergebnisse_und_folgen', 'aufgabe')}
          name={aufgabeTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={aufgabeTarget && onOpenAufgabenUndKiVorschlaege ? () => onOpenAufgabenUndKiVorschlaege!(aufgabeTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('ergebnisse_und_folgen', 'beobachter')}
          name={beobachterTarget?.fields.vorname ?? '—'}
          meta={[beobachterTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={beobachterTarget && onOpenNutzer ? () => onOpenNutzer!(beobachterTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => extractRecordId(r.fields.ergebnis) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: undefined })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ERGEBNISSE_UND_FOLGEN} recordId={record.record_id} readOnly={!perms.canWrite('ergebnisse_und_folgen')} />
    </>
  );
}
