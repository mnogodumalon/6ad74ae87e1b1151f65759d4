/**
 * Entscheidung treffen — 3-Schritt-Wizard.
 * Steps: 1) Entscheidungsreife Entscheidung wählen → 2) Option, Begründung und Umsetzungsplan eingeben → 3) Beschluss speichern.
 * Reads: entscheidungen (frage, alternativen, konsequenzen, offene_annahmen, fehlende_informationen, frist).
 * Writes: entscheidungen (update: gewaehlte_option, begruendung, umsetzungsplan, beschlussdatum, entscheidungsstatus).
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
import { useEntscheidungTreffenFlow } from '@/lib/journey/flows/EntscheidungTreffen';
import { tx } from '@/i18n';

export default function EntscheidungTreffenPage() {
  const [step, setStep] = useState(1);
  const flow = useEntscheidungTreffenFlow({
    steps: { entscheidungen: 1, gewaehlte_option: 2, begruendung: 2, umsetzungsplan: 2 },
    items: {
      entscheidungen: r => ({
        id: r.id,
        title: fieldText(r, 'frage'),
        subtitle: fieldDate(r, 'frist') ? tx`Frist: ${fieldDate(r, 'frist') ?? ''}` : undefined,
      }),
    },
  });

  const pickedId = flow.pick('entscheidungen').selectedId;
  const picked = pickedId ? flow.picks.entscheidungen.recordOf(pickedId) : undefined;
  const context: { label: string; value: string }[] = picked
    ? [
        { label: tx('Frage'), value: fieldText(picked, 'frage') },
        { label: tx('Alternativen'), value: fieldText(picked, 'alternativen') },
        { label: tx('Konsequenzen der Optionen'), value: fieldText(picked, 'konsequenzen') },
        { label: tx('Offene Annahmen'), value: fieldText(picked, 'offene_annahmen') },
        { label: tx('Fehlende Informationen'), value: fieldText(picked, 'fehlende_informationen') },
      ].filter(c => c.value)
    : [];

  return (
    <IntentWizardShell
      title={tx('Entscheidung treffen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Gewählte Option, Begründung und Umsetzungsplan festhalten.'),
        needs: [tx('Eine entscheidungsreife Entscheidung'), tx('Die gewählte Option samt Begründung')],
      }}
    >
      <WizardStep label={tx('Entscheidung')} description={tx('Welche Entscheidung triffst du jetzt?')}>
        <EntitySelectStep
          {...flow.picks.entscheidungen.select}
          {...flow.pick('entscheidungen')}
          searchPlaceholder={tx('Frage suchen …')}
        />
      </WizardStep>
      <WizardStep
        label={tx('Beschluss')}
        description={tx('Halte fest, wofür du dich entscheidest und wie es umgesetzt wird.')}
        needs={['entscheidungen']}
      >
        <div className="space-y-4">
          {context.length > 0 && (
            <div className="space-y-2 overflow-hidden rounded-2xl bg-secondary p-4 text-sm">
              {context.map(c => (
                <div key={c.label} className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">{c.label}</div>
                  <div className="whitespace-pre-line break-words">{c.value}</div>
                </div>
              ))}
            </div>
          )}
          <Bound form={flow.forms.entscheidungen} name="gewaehlte_option" rows={3} />
          <Bound form={flow.forms.entscheidungen} name="begruendung" rows={4} />
          <Bound form={flow.forms.entscheidungen} name="umsetzungsplan" rows={4} />
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
            items={[{ key: 'entscheidungsstatus', label: tx('Neuer Status'), value: tx('Entschieden') }]}
            whatHappensNext={tx('Das Beschlussdatum wird auf heute gesetzt und die Entscheidung gilt als entschieden.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          whatHappensNext={tx('Halte später fest, was die Entscheidung bewirkt hat.')}
          next={[
            { label: tx('Ergebnis festhalten'), href: '#/intents/ergebnis-festhalten' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
