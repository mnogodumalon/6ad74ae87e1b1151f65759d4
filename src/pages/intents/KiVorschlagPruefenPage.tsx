/**
 * KI-Vorschlag prüfen und freigeben — 3-Schritt-Wizard (+ Prüfen).
 * Steps: 1) Offenen Vorschlag auswählen → 2) Geltende Regel wählen und Vorschlag lesen → 3) Prüfer festhalten → 4) Prüfen & freigeben.
 * Reads: aufgaben_und_ki_vorschlaege, regeln_und_grenzen, nutzer. Writes: aufgaben_und_ki_vorschlaege (pruefer, geltende_regel, freigabedatum) via useKiVorschlagPruefenFlow.
 * Composes: IntentWizardShell, EntitySelectStep, StepNav, SummaryStep, SuccessStep, StatusBadge.
 */
import { useState } from 'react';
import { format } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useKiVorschlagPruefenFlow } from '@/lib/journey/flows/KiVorschlagPruefen';
import { tx } from '@/i18n';

export default function KiVorschlagPruefenPage() {
  const [step, setStep] = useState(1);
  const flow = useKiVorschlagPruefenFlow({
    steps: { aufgaben_und_ki_vorschlaege: 1, geltende_regel: 2, pruefer: 3 },
    items: {
      aufgaben_und_ki_vorschlaege: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: ctx.ref('vorhaben'),
        status: fieldLookup(r, 'zustand') ?? undefined,
      }),
      geltende_regel: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: fieldLookup(r, 'regeltyp')?.label,
      }),
      pruefer: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldLookup(r, 'rolle')?.label,
      }),
    },
  });

  const vorschlag = flow.targets.aufgaben_und_ki_vorschlaege?.record;
  const vorhabenName = vorschlag
    ? flow.picks.aufgaben_und_ki_vorschlaege.refLabel(vorschlag, 'vorhaben')
    : undefined;

  return (
    <IntentWizardShell
      title={tx('KI-Vorschlag prüfen und freigeben')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Einen Vorschlag lesen, mit der geltenden Regel abgleichen und freigeben.'),
        needs: [tx('Ein offener Vorschlag'), tx('Die geltende Regel'), tx('Name des Prüfers')],
      }}
    >
      <WizardStep label={tx('Vorschlag')} description={tx('Welchen Vorschlag möchtest du prüfen?')}>
        <EntitySelectStep
          {...flow.picks.aufgaben_und_ki_vorschlaege.select}
          {...flow.pick('aufgaben_und_ki_vorschlaege')}
          searchPlaceholder={tx('Titel suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Regel')} description={tx('Lies den Vorschlag und wähle die Regel, die dafür gilt.')}>
        {vorschlag ? (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 space-y-2 overflow-hidden">
              <p className="text-xs text-muted-foreground">{vorhabenName ?? ''}</p>
              <h3 className="text-base font-semibold break-words">{fieldText(vorschlag, 'titel')}</h3>
              {fieldLookup(vorschlag, 'quelle') && (
                <p className="text-xs text-muted-foreground">
                  {tx('Quelle')}: {fieldLookup(vorschlag, 'quelle')?.label}
                  {' · '}
                  {tx('Zustand')}: {fieldLookup(vorschlag, 'zustand')?.label}
                </p>
              )}
              <p className="text-sm whitespace-pre-wrap break-words">
                {fieldText(vorschlag, 'vorschlag_begruendung') || tx('Keine Begründung hinterlegt.')}
              </p>
            </div>
            <EntitySelectStep
              {...flow.picks.geltende_regel.select}
              {...flow.pick('geltende_regel')}
              searchPlaceholder={tx('Regel suchen …')}
            />
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => flow.validateStep(2)}
              nextStepLabel={tx('Prüfer')}
            />
          </div>
        ) : (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        )}
      </WizardStep>

      <WizardStep label={tx('Prüfer')} description={tx('Wer prüft und gibt diesen Vorschlag frei?')}>
        {vorschlag ? (
          <div className="space-y-4">
            <EntitySelectStep
              {...flow.picks.pruefer.select}
              {...flow.pick('pruefer')}
              searchPlaceholder={tx('Name suchen …')}
            />
            <StepNav
              onBack={() => setStep(2)}
              onNext={() => flow.validateStep(3)}
              nextStepLabel={tx('Prüfen')}
            />
          </div>
        ) : (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        )}
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'freigabedatum', label: tx('Freigabedatum'), value: format(new Date(), 'dd.MM.yyyy HH:mm') }]}
            whatHappensNext={tx('Prüfer und Regel werden am Vorschlag festgehalten, das Freigabedatum setzt das System.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          whatHappensNext={tx('Der Vorschlag kann jetzt ausgeführt werden.')}
          next={[
            { label: tx('Ausführung festhalten'), href: '#/intents/aufgabe-ausfuehrung-festhalten' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
