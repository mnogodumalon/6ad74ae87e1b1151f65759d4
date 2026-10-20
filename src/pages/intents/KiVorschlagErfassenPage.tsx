/**
 * KI-Vorschlag erfassen — 4-Schritt-Wizard + Prüfen.
 * Steps: 1) Vorhaben wählen → 2) Titel, Beschreibung und Begründung erfassen → 3) Vorschlagenden wählen
 *        → 4) Geltende Regel wählen → 5) Prüfen & anlegen.
 * Reads: vorhaben, nutzer, regeln_und_grenzen. Writes: aufgaben_und_ki_vorschlaege (zustand fix „vorgeschlagen“).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useKiVorschlagErfassenFlow } from '@/lib/journey/flows/KiVorschlagErfassen';
import { tx } from '@/i18n';

export default function KiVorschlagErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useKiVorschlagErfassenFlow({
    steps: { vorhaben: 1, titel: 2, beschreibung: 2, quelle: 2, vorschlag_begruendung: 2, vorschlagender: 3, geltende_regel: 4 },
    items: {
      vorhaben: v => ({
        id: v.id,
        title: fieldText(v, 'titel'),
        subtitle: fieldLookup(v, 'arbeitszustand')?.label,
      }),
      vorschlagender: n => ({
        id: n.id,
        title: `${fieldText(n, 'vorname')} ${fieldText(n, 'nachname')}`.trim(),
        subtitle: fieldLookup(n, 'art')?.label,
      }),
      geltende_regel: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: fieldLookup(r, 'regeltyp')?.label,
      }),
    },
  });
  const form = flow.forms.aufgaben_und_ki_vorschlaege;

  return (
    <IntentWizardShell
      title={tx('KI-Vorschlag erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Halte einen Vorschlag samt Begründung fest, bevor etwas ausgeführt wird.'),
        needs: [tx('Das betroffene Vorhaben'), tx('Titel und Begründung des Vorschlags')],
      }}
    >
      <WizardStep label={tx('Vorhaben')} heading={tx('Vorhaben wählen')} description={tx('Zu welchem Vorhaben gehört der Vorschlag?')}>
        <EntitySelectStep
          {...flow.picks.vorhaben.select}
          {...flow.pick('vorhaben')}
          searchPlaceholder={tx('Vorhaben suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Vorschlag')} heading={tx('Vorschlag beschreiben')} description={tx('Was wird vorgeschlagen und warum?')} needs={['vorhaben']}>
        <div className="space-y-4">
          <Bound form={form} name="titel" />
          <Bound form={form} name="beschreibung" rows={3} />
          <Bound form={form} name="quelle" />
          <Bound form={form} name="vorschlag_begruendung" rows={4} />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Vorschlagender')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Vorschlagender')} heading={tx('Vorschlagenden wählen')} description={tx('Wer hat den Vorschlag gemacht? Du kannst den Schritt überspringen.')}>
        <div className="space-y-4">
          <EntitySelectStep
            {...flow.picks.vorschlagender.select}
            {...flow.pick('vorschlagender')}
            searchPlaceholder={tx('Person oder KI suchen …')}
          />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Geltende Regel')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Regel')} heading={tx('Geltende Regel wählen')} description={tx('Welche Regel oder Grenze gilt für diesen Vorschlag? Optional.')}>
        <div className="space-y-4">
          <EntitySelectStep
            {...flow.picks.geltende_regel.select}
            {...flow.pick('geltende_regel')}
            searchPlaceholder={tx('Regel suchen …')}
          />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'zustand', label: tx('Zustand'), value: tx('Vorgeschlagen') }]}
            whatHappensNext={tx('Der Vorschlag wartet danach auf eine Prüfung — ausgeführt wird noch nichts.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          whatHappensNext={tx('Als Nächstes kann der Vorschlag geprüft und freigegeben werden.')}
          next={[
            { label: tx('Vorschlag prüfen'), href: '#/intents/vorschlag-pruefen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
