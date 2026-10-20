/**
 * Freigegebene Aktion abschließen — 3-Schritt-Wizard.
 * Steps: 1) Freigegebene Aufgabe wählen → 2) Ausgeführte Aktion beschreiben → 3) Prüfen & als ausgeführt abschließen.
 * Reads: aufgaben_und_ki_vorschlaege. Writes: aufgaben_und_ki_vorschlaege (update: ausgefuehrte_aktion, ausfuehrungsdatum, zustand).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText } from '@/lib/journey';
import { useAktionAusfuehrenFlow } from '@/lib/journey/flows/AktionAusfuehren';
import { tx } from '@/i18n';

export default function AktionAusfuehrenPage() {
  const [step, setStep] = useState(1);
  const flow = useAktionAusfuehrenFlow({
    steps: { aufgaben_und_ki_vorschlaege: 1, ausgefuehrte_aktion: 2 },
    items: {
      aufgaben_und_ki_vorschlaege: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: ctx.ref('vorhaben') ?? ctx.ref('pruefer'),
      }),
    },
  });
  const form = flow.forms.aufgaben_und_ki_vorschlaege;

  return (
    <IntentWizardShell
      title={tx('Freigegebene Aktion abschließen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine freigegebene Aufgabe als ausgeführt markieren.'),
        needs: [tx('Die freigegebene Aufgabe'), tx('Was tatsächlich ausgeführt wurde')],
      }}
    >
      <WizardStep label={tx('Aufgabe')} description={tx('Wähle die freigegebene Aufgabe, die du ausgeführt hast.')}>
        <EntitySelectStep
          {...flow.picks.aufgaben_und_ki_vorschlaege.select}
          {...flow.pick('aufgaben_und_ki_vorschlaege')}
          searchPlaceholder={tx('Titel der Aufgabe …')}
        />
      </WizardStep>
      <WizardStep
        label={tx('Aktion')}
        description={tx('Beschreibe, was tatsächlich ausgeführt wurde.')}
        needs={['aufgaben_und_ki_vorschlaege']}
      >
        <div className="space-y-4">
          <Bound form={form} name="ausgefuehrte_aktion" rows={5} hint={tx('Was genau wurde getan – auch Abweichungen vom Vorschlag.')} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'zustand', label: tx('Neuer Zustand'), value: tx('Ausgeführt') }]}
            whatHappensNext={tx('Die Aufgabe gilt als ausgeführt, das Ausführungsdatum wird auf jetzt gesetzt.')}
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
        />
      )}
    </IntentWizardShell>
  );
}
