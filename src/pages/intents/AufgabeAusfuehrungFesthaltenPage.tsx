/**
 * Ausführung festhalten — 3-Schritt-Wizard.
 * Steps: 1) Freigegebene Aufgabe wählen → 2) Ausgeführte Aktion beschreiben → 3) Als ausgeführt speichern.
 * Reads: aufgaben_und_ki_vorschlaege. Writes: aufgaben_und_ki_vorschlaege (update: ausgefuehrte_aktion, ausfuehrungsdatum).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldDate } from '@/lib/journey';
import { useAufgabeAusfuehrungFesthaltenFlow } from '@/lib/journey/flows/AufgabeAusfuehrungFesthalten';
import { tx } from '@/i18n';

export default function AufgabeAusfuehrungFesthaltenPage() {
  const [step, setStep] = useState(1);
  const flow = useAufgabeAusfuehrungFesthaltenFlow({
    steps: { aufgaben_und_ki_vorschlaege: 1, ausgefuehrte_aktion: 2 },
    items: {
      aufgaben_und_ki_vorschlaege: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: [ctx.ref('vorhaben'), fieldDate(r, 'freigabedatum')].filter(Boolean).join(' · ') || undefined,
      }),
    },
  });

  return (
    <IntentWizardShell
      title={tx('Ausführung festhalten')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine freigegebene Aufgabe als ausgeführt markieren und die Aktion dokumentieren.'),
        needs: [tx('Eine freigegebene Aufgabe'), tx('Beschreibung der tatsächlich ausgeführten Aktion')],
      }}
    >
      <WizardStep label={tx('Aufgabe')} description={tx('Welche freigegebene Aufgabe wurde ausgeführt?')}>
        <EntitySelectStep
          {...flow.picks.aufgaben_und_ki_vorschlaege.select}
          {...flow.pick('aufgaben_und_ki_vorschlaege')}
          searchPlaceholder={tx('Titel der Aufgabe …')}
        />
      </WizardStep>
      <WizardStep
        label={tx('Aktion')}
        description={tx('Beschreibe, was tatsächlich getan wurde.')}
        needs={['aufgaben_und_ki_vorschlaege']}
      >
        <div className="space-y-4">
          <Bound
            form={flow.forms.aufgaben_und_ki_vorschlaege}
            name="ausgefuehrte_aktion"
            rows={5}
            hint={tx('Was wurde konkret ausgeführt — auch Abweichungen vom Vorschlag.')}
          />
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
            items={[{ key: 'ausfuehrungsdatum', label: tx('Ausführungsdatum'), value: tx('Jetzt (beim Speichern)') }]}
            whatHappensNext={tx('Die Aufgabe wird mit Datum und Uhrzeit als ausgeführt festgehalten.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Ergebnis festhalten'), href: '#/intents/ergebnis-festhalten' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Halte als Nächstes fest, was die Ausführung bewirkt hat.')}
        />
      )}
    </IntentWizardShell>
  );
}
