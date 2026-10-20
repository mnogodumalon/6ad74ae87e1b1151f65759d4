/**
 * Vorhaben anlegen — 6-Schritt-Wizard.
 * Steps: 1) Titel, Ziel & Kontext → 2) Historie, Besonderheiten & Ansprechpartner → 3) Verantwortlichen wählen
 *        → 4) Priorität & Termine → 5) Nächster Schritt → 6) Prüfen & anlegen.
 * Reads: nutzer (Auswahl des Verantwortlichen). Writes: vorhaben (arbeitszustand fest `idee`).
 * Composes: IntentWizardShell, Bound, EntitySelectStep, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useVorhabenAnlegenFlow } from '@/lib/journey/flows/VorhabenAnlegen';
import { tx } from '@/i18n';

export default function VorhabenAnlegenPage() {
  const [step, setStep] = useState(1);
  const flow = useVorhabenAnlegenFlow({
    steps: {
      titel: 1, ziel: 1, fachlicher_kontext: 1,
      historische_entscheidungen: 2, technische_besonderheiten: 2, ansprechpartner: 2,
      verantwortlicher: 3,
      prioritaet: 4, startdatum: 4, zieldatum: 4,
      naechster_schritt: 5,
    },
    items: {
      verantwortlicher: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldLookup(r, 'rolle')?.label,
      }),
    },
  });
  const f = flow.forms.vorhaben;

  return (
    <IntentWizardShell
      title={tx('Vorhaben anlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Lege ein Vorhaben so an, dass es auch später für alle verständlich bleibt.'),
        needs: [tx('Titel, Ziel und fachlicher Kontext'), tx('Wer das Vorhaben verantwortet')],
      }}
    >
      <WizardStep label={tx('Kontext')} description={tx('Worum geht es, was soll erreicht werden und warum?')}>
        <div className="space-y-4">
          <Bound form={f} name="titel" />
          <Bound form={f} name="ziel" rows={3} />
          <Bound form={f} name="fachlicher_kontext" rows={4} />
          <StepNav onNext={() => flow.validateStep(1)} nextStepLabel={tx('Hintergrund')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Hintergrund')} description={tx('Was sollten andere über Vorgeschichte und Technik wissen?')}>
        <div className="space-y-4">
          <Bound form={f} name="historische_entscheidungen" rows={4} />
          <Bound form={f} name="technische_besonderheiten" rows={4} />
          <Bound form={f} name="ansprechpartner" rows={3} />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Verantwortlicher')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Verantwortlicher')} description={tx('Wer kümmert sich um dieses Vorhaben?')}>
        <EntitySelectStep
          {...flow.picks.verantwortlicher.select}
          {...flow.pick('verantwortlicher')}
          searchPlaceholder={tx('Name suchen …')}
          avatar="initials"
        />
      </WizardStep>

      <WizardStep label={tx('Priorität & Termine')} description={tx('Wie wichtig ist es und wann soll es laufen?')} needs={['verantwortlicher']}>
        <div className="space-y-4">
          <Bound form={f} name="prioritaet" allowClear />
          <Bound form={f} name="startdatum" />
          <Bound form={f} name="zieldatum" />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Nächster Schritt')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Nächster Schritt')} description={tx('Womit geht es als Erstes weiter?')}>
        <div className="space-y-4">
          <Bound form={f} name="naechster_schritt" rows={3} />
          <StepNav onBack={() => setStep(4)} onNext={() => flow.validateStep(5)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'arbeitszustand', label: tx('Arbeitszustand'), value: tx('Idee') }]}
            whatHappensNext={tx('Das Vorhaben startet als Idee und ist sofort für das Team sichtbar.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          whatHappensNext={tx('Als Nächstes kannst du eine Entscheidung vorbereiten oder einen KI-Vorschlag erfassen.')}
          next={[
            { label: tx('Entscheidung vorbereiten'), href: '#/intents/entscheidung-vorbereiten' },
            { label: tx('KI-Vorschlag erfassen'), href: '#/intents/ki-vorschlag-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
