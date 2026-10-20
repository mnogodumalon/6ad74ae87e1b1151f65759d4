/**
 * Entscheidung vorbereiten — 4-Schritt-Wizard mit Prüfen.
 * Steps: 1) Vorhaben wählen → 2) Frage und Alternativen → 3) Fakten, Annahmen, Lücken, Konsequenzen
 *        → 4) Geltende Regel, Zuständiger, Frist → Prüfen & anlegen.
 * Reads: vorhaben, regeln_und_grenzen, nutzer. Writes: entscheidungen (via useEntscheidungVorbereitenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, Field, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useEntscheidungVorbereitenFlow } from '@/lib/journey/flows/EntscheidungVorbereiten';
import { tx } from '@/i18n';

export default function EntscheidungVorbereitenPage() {
  const [step, setStep] = useState(1);
  const flow = useEntscheidungVorbereitenFlow({
    steps: {
      vorhaben: 1,
      frage: 2, alternativen: 2,
      gesicherte_fakten: 3, offene_annahmen: 3, fehlende_informationen: 3, konsequenzen: 3,
      geltende_regel: 4, zustaendiger: 4, frist: 4,
    },
    items: {
      vorhaben: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        status: fieldLookup(r, 'arbeitszustand') ?? undefined,
      }),
      geltende_regel: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: fieldLookup(r, 'regeltyp')?.label ?? '',
      }),
      zustaendiger: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldText(r, 'fachgebiet'),
      }),
    },
  });
  const f = flow.forms.entscheidungen;

  return (
    <IntentWizardShell
      title={tx('Entscheidung vorbereiten')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Entscheidung so aufbereiten, dass sie getroffen werden kann.'),
        needs: [tx('Das zugehörige Vorhaben'), tx('Die zu entscheidende Frage'), tx('Wer entscheidet')],
      }}
    >
      <WizardStep label={tx('Vorhaben')} description={tx('Zu welchem Vorhaben gehört die Entscheidung?')}>
        <EntitySelectStep
          {...flow.picks.vorhaben.select}
          {...flow.pick('vorhaben')}
          searchPlaceholder={tx('Vorhaben suchen …')}
        />
      </WizardStep>

      <WizardStep
        label={tx('Frage')}
        description={tx('Was soll entschieden werden und welche Möglichkeiten gibt es?')}
        needs={['vorhaben']}
      >
        <div className="space-y-4">
          <Bound form={f} name="frage" rows={3} />
          <Bound form={f} name="alternativen" rows={4} hint={tx('Eine Alternative pro Zeile')} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Faktenlage')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Faktenlage')}
        description={tx('Was ist gesichert, was nur angenommen, was fehlt noch — und was folgt aus den Optionen?')}
        needs={['vorhaben']}
      >
        <div className="space-y-4">
          <Bound form={f} name="gesicherte_fakten" rows={3} />
          <Bound form={f} name="offene_annahmen" rows={3} />
          <Bound form={f} name="fehlende_informationen" rows={3} />
          <Bound form={f} name="konsequenzen" rows={3} />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Regel und Zuständiger')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Zuständigkeit')}
        description={tx('Welche Regel gilt, wer entscheidet und bis wann?')}
        needs={['vorhaben']}
      >
        <div className="space-y-6">
          <Field form={f} name="geltende_regel">
            <EntitySelectStep
              {...flow.picks.geltende_regel.select}
              {...flow.pick('geltende_regel')}
              searchPlaceholder={tx('Regel suchen …')}
            />
          </Field>
          <Field form={f} name="zustaendiger">
            <EntitySelectStep
              {...flow.picks.zustaendiger.select}
              {...flow.pick('zustaendiger')}
              avatar="initials"
              searchPlaceholder={tx('Person suchen …')}
            />
          </Field>
          <Bound form={f} name="frist" />
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
            items={[{ key: 'entscheidungsstatus', label: tx('Status'), value: tx('In Vorbereitung') }]}
            whatHappensNext={tx('Die Entscheidung steht danach zur Entscheidung bereit.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Entscheidung treffen'), href: '#/intents/entscheidung-treffen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Sobald alles geklärt ist, kannst du die Entscheidung treffen.')}
        />
      )}
    </IntentWizardShell>
  );
}
