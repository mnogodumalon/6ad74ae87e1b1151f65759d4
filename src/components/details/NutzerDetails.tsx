import type { Nutzer, RegelnUndGrenzen, Vorhaben, AufgabenUndKiVorschlaege, Entscheidungen, ErgebnisseUndFolgen, Erfahrungen, Lernerkenntnisse } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface NutzerDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Nutzer;
  /** 1:N „Regeln und Grenzen" (verantwortlicher): VOLLE Liste — der Block filtert auf diesen Record. */
  regelnUndGrenzenList: RegelnUndGrenzen[];
  /** Zeilen-Klick → overlay.push auf das RegelnUndGrenzen-Detail (nie der Edit-Dialog). */
  onOpenRegelnUndGrenzen: (record: RegelnUndGrenzen) => void;
  /** Kontextuelles „+": öffnet den RegelnUndGrenzen-Dialog mit diesem Record vorgesetzt. */
  onAddRegelnUndGrenzen?: () => void;
  /** 1:N „Vorhaben" (verantwortlicher): VOLLE Liste — der Block filtert auf diesen Record. */
  vorhabenList: Vorhaben[];
  /** Zeilen-Klick → overlay.push auf das Vorhaben-Detail (nie der Edit-Dialog). */
  onOpenVorhaben: (record: Vorhaben) => void;
  /** Kontextuelles „+": öffnet den Vorhaben-Dialog mit diesem Record vorgesetzt. */
  onAddVorhaben?: () => void;
  /** 1:N „Aufgaben und KI-Vorschläge" (vorschlagender): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenUndKiVorschlaegeVorschlagenderList: AufgabenUndKiVorschlaege[];
  /** Zeilen-Klick → overlay.push auf das AufgabenUndKiVorschlaege-Detail (nie der Edit-Dialog). */
  onOpenAufgabenUndKiVorschlaegeVorschlagender: (record: AufgabenUndKiVorschlaege) => void;
  /** Kontextuelles „+": öffnet den AufgabenUndKiVorschlaege-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabenUndKiVorschlaegeVorschlagender?: () => void;
  /** 1:N „Aufgaben und KI-Vorschläge" (pruefer): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenUndKiVorschlaegePrueferList: AufgabenUndKiVorschlaege[];
  /** Zeilen-Klick → overlay.push auf das AufgabenUndKiVorschlaege-Detail (nie der Edit-Dialog). */
  onOpenAufgabenUndKiVorschlaegePruefer: (record: AufgabenUndKiVorschlaege) => void;
  /** Kontextuelles „+": öffnet den AufgabenUndKiVorschlaege-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabenUndKiVorschlaegePruefer?: () => void;
  /** 1:N „Entscheidungen" (zustaendiger): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
  /** 1:N „Ergebnisse und Folgen" (beobachter): VOLLE Liste — der Block filtert auf diesen Record. */
  ergebnisseUndFolgenList: ErgebnisseUndFolgen[];
  /** Zeilen-Klick → overlay.push auf das ErgebnisseUndFolgen-Detail (nie der Edit-Dialog). */
  onOpenErgebnisseUndFolgen: (record: ErgebnisseUndFolgen) => void;
  /** Kontextuelles „+": öffnet den ErgebnisseUndFolgen-Dialog mit diesem Record vorgesetzt. */
  onAddErgebnisseUndFolgen?: () => void;
  /** 1:N „Erfahrungen" (dokumentierender): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** 1:N „Lernerkenntnisse" (pruefer): VOLLE Liste — der Block filtert auf diesen Record. */
  lernerkenntnisseList: Lernerkenntnisse[];
  /** Zeilen-Klick → overlay.push auf das Lernerkenntnisse-Detail (nie der Edit-Dialog). */
  onOpenLernerkenntnisse: (record: Lernerkenntnisse) => void;
  /** Kontextuelles „+": öffnet den Lernerkenntnisse-Dialog mit diesem Record vorgesetzt. */
  onAddLernerkenntnisse?: () => void;
}

export function NutzerDetails({
  record,
  regelnUndGrenzenList,
  onOpenRegelnUndGrenzen,
  onAddRegelnUndGrenzen,
  vorhabenList,
  onOpenVorhaben,
  onAddVorhaben,
  aufgabenUndKiVorschlaegeVorschlagenderList,
  onOpenAufgabenUndKiVorschlaegeVorschlagender,
  onAddAufgabenUndKiVorschlaegeVorschlagender,
  aufgabenUndKiVorschlaegePrueferList,
  onOpenAufgabenUndKiVorschlaegePruefer,
  onAddAufgabenUndKiVorschlaegePruefer,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
  ergebnisseUndFolgenList,
  onOpenErgebnisseUndFolgen,
  onAddErgebnisseUndFolgen,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  lernerkenntnisseList,
  onOpenLernerkenntnisse,
  onAddLernerkenntnisse,
}: NutzerDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('nutzer', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('nutzer', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('nutzer', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('nutzer', 'art')} value={record.fields.art} format="pill" />
        <RecordField label={fieldLabel('nutzer', 'rolle')} value={record.fields.rolle} format="pill" />
        <RecordField label={fieldLabel('nutzer', 'berechtigungsstufe')} value={record.fields.berechtigungsstufe} format="pill" />
        <RecordField label={fieldLabel('nutzer', 'fachgebiet')} value={record.fields.fachgebiet} format="text" />
        <RecordField label={fieldLabel('nutzer', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('regeln_und_grenzen')}
        items={regelnUndGrenzenList.filter(r => extractRecordId(r.fields.verantwortlicher) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('regeln_und_grenzen'), meta: r.fields.gueltig_ab })}
        onOpen={onOpenRegelnUndGrenzen}
        onAdd={onAddRegelnUndGrenzen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('vorhaben')}
        items={vorhabenList.filter(r => extractRecordId(r.fields.verantwortlicher) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('vorhaben'), meta: r.fields.startdatum })}
        onOpen={onOpenVorhaben}
        onAdd={onAddVorhaben}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgaben_und_ki_vorschlaege')} · ${fieldLabel('aufgaben_und_ki_vorschlaege', 'vorschlagender')}`}
        items={aufgabenUndKiVorschlaegeVorschlagenderList.filter(r => extractRecordId(r.fields.vorschlagender) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben_und_ki_vorschlaege'), meta: r.fields.freigabedatum })}
        onOpen={onOpenAufgabenUndKiVorschlaegeVorschlagender}
        onAdd={onAddAufgabenUndKiVorschlaegeVorschlagender}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgaben_und_ki_vorschlaege')} · ${fieldLabel('aufgaben_und_ki_vorschlaege', 'pruefer')}`}
        items={aufgabenUndKiVorschlaegePrueferList.filter(r => extractRecordId(r.fields.pruefer) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben_und_ki_vorschlaege'), meta: r.fields.freigabedatum })}
        onOpen={onOpenAufgabenUndKiVorschlaegePruefer}
        onAdd={onAddAufgabenUndKiVorschlaegePruefer}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.zustaendiger) === record.record_id)}
        map={r => ({ name: appLabel('entscheidungen'), meta: r.fields.frist })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('ergebnisse_und_folgen')}
        items={ergebnisseUndFolgenList.filter(r => extractRecordId(r.fields.beobachter) === record.record_id)}
        map={r => ({ name: appLabel('ergebnisse_und_folgen'), meta: r.fields.messdatum })}
        onOpen={onOpenErgebnisseUndFolgen}
        onAdd={onAddErgebnisseUndFolgen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => extractRecordId(r.fields.dokumentierender) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: undefined })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('lernerkenntnisse')}
        items={lernerkenntnisseList.filter(r => extractRecordId(r.fields.pruefer) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('lernerkenntnisse'), meta: r.fields.pruefdatum })}
        onOpen={onOpenLernerkenntnisse}
        onAdd={onAddLernerkenntnisse}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.NUTZER} recordId={record.record_id} readOnly={!perms.canWrite('nutzer')} />
    </>
  );
}
