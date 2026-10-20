/**
 * Vorschlag prüfen — 4-Schritt-Wizard mit Prüfen-Schritt.
 * Steps: 1) Offenen Vorschlag wählen → 2) Vorschlag, Begründung und Regel ansehen → 3) Prüfer wählen
 *        → 4) Freigeben oder ablehnen → 5) Prüfen & speichern.
 * Reads: aufgaben_und_ki_vorschlaege, nutzer. Writes: aufgaben_und_ki_vorschlaege (pruefer, zustand, freigabedatum — Update).
 * Composes: IntentWizardShell, EntitySelectStep, Field, ChoiceGroup, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Field } from '@/components/blocks/Field';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldRef } from '@/lib/journey';
import { useVorschlagPruefenFlow } from '@/lib/journey/flows/VorschlagPruefen';
import { tx } from '@/i18n';

export default function VorschlagPruefenPage() {
  const [step, setStep] = useState(1);
  const flow = useVorschlagPruefenFlow({
    steps: { aufgaben_und_ki_vorschlaege: 1, pruefer: 3, zustand: 4 },
    items: {
      aufgaben_und_ki_vorschlaege: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: ctx.ref('vorhaben'),
        status: fieldLookup(r, 'zustand') ?? undefined,
      }),
      pruefer: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldLookup(r, 'rolle')?.label,
      }),
    },
  });

  const vorschlaege = flow.picks.aufgaben_und_ki_vorschlaege;
  const form = flow.forms.aufgaben_und_ki_vorschlaege;
  const pickedId = form ? flow.pick('aufgaben_und_ki_vorschlaege').selectedId : undefined;
  const record = pickedId ? vorschlaege.recordOf(pickedId) : undefined;

  const zustandChoice = form.choice('zustand');
  const entscheidung = {
    ...zustandChoice,
    options: zustandChoice.options.filter(o => ['freigegeben', 'abgelehnt'].includes(o.key)),
  };

  const checkContext = (): boolean | string => {
    if (!record || !fieldRef(record, 'vorhaben')) {
      return tx('Der Vorschlag braucht ein Vorhaben als Kontext.');
    }
    return true;
  };

  return (
    <IntentWizardShell
      title={tx('Vorschlag prüfen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Einen offenen Vorschlag prüfen und freigeben oder ablehnen.'),
        needs: [tx('Offener Vorschlag'), tx('Name des Prüfers')],
      }}
    >
      <WizardStep label={tx('Vorschlag')} description={tx('Welchen offenen Vorschlag möchtest du prüfen?')}>
        <EntitySelectStep
          {...vorschlaege.select}
          {...flow.pick('aufgaben_und_ki_vorschlaege')}
          searchPlaceholder={tx('Titel des Vorschlags …')}
        />
      </WizardStep>

      <WizardStep
        label={tx('Begründung')}
        description={tx('Lies den Vorschlag, seine Begründung und die geltende Regel.')}
        needs={['aufgaben_und_ki_vorschlaege']}
      >
        {record && (
          <div className="space-y-4">
            <div data-key={record.id} className="rounded-2xl border bg-card p-4 space-y-3 overflow-hidden">
              <div>
                <p className="text-xs text-muted-foreground">{tx('Vorschlag')}</p>
                <p className="font-medium break-words">{fieldText(record, 'titel')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tx('Vorhaben')}</p>
                <p className="break-words">{vorschlaege.refLabel(record, 'vorhaben') ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tx('Begründung')}</p>
                <p className="whitespace-pre-wrap break-words">{fieldText(record, 'vorschlag_begruendung') || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tx('Geltende Regel')}</p>
                <p className="break-words">{vorschlaege.refLabel(record, 'geltende_regel') ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tx('Aktueller Zustand')}</p>
                <p>{fieldLookup(record, 'zustand')?.label ?? '—'}</p>
              </div>
            </div>
            <StepNav
              onBack={() => setStep(1)}
              onNext={checkContext}
              nextStepLabel={tx('Prüfer wählen')}
            />
          </div>
        )}
      </WizardStep>

      <WizardStep label={tx('Prüfer')} description={tx('Wer prüft diesen Vorschlag?')} needs={['aufgaben_und_ki_vorschlaege']}>
        <EntitySelectStep
          {...flow.picks.pruefer.select}
          {...flow.pick('pruefer')}
          avatar="initials"
          searchPlaceholder={tx('Vor- oder Nachname …')}
        />
      </WizardStep>

      <WizardStep label={tx('Entscheidung')} description={tx('Vorschlag freigeben oder ablehnen.')} needs={['pruefer']}>
        <div className="space-y-4">
          <Field form={form} name="zustand">
            <ChoiceGroup {...entscheidung} />
          </Field>
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => flow.validateStep(4)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Prüfer und Zeitpunkt der Entscheidung werden am Vorschlag festgehalten.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Freigegebene Aktion abschließen'), href: '#/intents/aktion-ausfuehren' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
