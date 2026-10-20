/**
 * Vorhaben anlegen — 3-Schritt-Wizard + Prüfen.
 * Steps: 1) Titel, Ziel und Kontext → 2) Verantwortlichen wählen → 3) Priorität, Termine, nächster Schritt → 4) Prüfen & anlegen.
 * Reads: nutzer. Writes: vorhaben (arbeitszustand wird vom Plan auf „idee“ gesetzt).
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
      titel: 1, ziel: 1, fachlicher_kontext: 1, historische_entscheidungen: 1,
      technische_besonderheiten: 1, ansprechpartner: 1,
      verantwortlicher: 2,
      prioritaet: 3, startdatum: 3, zieldatum: 3, naechster_schritt: 3,
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
        description: tx('Ein neues Vorhaben so festhalten, dass es dauerhaft verständlich bleibt.'),
        needs: [tx('Titel und Ziel'), tx('Fachlicher Kontext'), tx('Wer verantwortlich ist')],
      }}
    >
      <WizardStep label={tx('Worum geht es?')} description={tx('Titel, Ziel und fachlichen Kontext beschreiben.')}>
        <div className="space-y-4">
          <Bound form={f} name="titel" />
          <Bound form={f} name="ziel" rows={3} />
          <Bound form={f} name="fachlicher_kontext" rows={4} />
          <Bound form={f} name="historische_entscheidungen" rows={3} />
          <Bound form={f} name="technische_besonderheiten" rows={3} />
          <Bound form={f} name="ansprechpartner" rows={2} />
          <StepNav
            hideBack
            onNext={() => flow.validateStep(1)}
            nextStepLabel={tx('Verantwortlicher')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Verantwortlicher')} description={tx('Wer kümmert sich um dieses Vorhaben?')}>
        <EntitySelectStep
          {...flow.picks.verantwortlicher.select}
          {...flow.pick('verantwortlicher')}
          avatar="initials"
          searchPlaceholder={tx('Name suchen …')}
        />
      </WizardStep>
      <WizardStep label={tx('Planung')} description={tx('Priorität, Termine und den nächsten Schritt festhalten.')}>
        <div className="space-y-4">
          <Bound form={f} name="prioritaet" allowClear />
          <Bound form={f} name="startdatum" />
          <Bound form={f} name="zieldatum" />
          <Bound form={f} name="naechster_schritt" rows={3} />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'arbeitszustand', label: tx('Arbeitszustand'), value: tx('Idee') }]}
            whatHappensNext={tx('Das Vorhaben startet als Idee und kann danach durch Entscheidungen vorangebracht werden.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Entscheidung vorbereiten'), href: '#/intents/entscheidung-vorbereiten' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Als Nächstes kannst du die erste Entscheidung für dieses Vorhaben vorbereiten.')}
        />
      )}
    </IntentWizardShell>
  );
}
