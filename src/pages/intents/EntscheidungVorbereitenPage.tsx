/**
 * Entscheidung vorbereiten — 7-Schritt-Wizard.
 * Steps: 1) Vorhaben wählen → 2) Frage und Alternativen → 3) Fakten, Annahmen, fehlende Infos →
 *        4) Konsequenzen → 5) Regel und Zuständigen wählen → 6) Frist setzen → 7) Prüfen & anlegen.
 * Reads: vorhaben, regeln_und_grenzen, nutzer. Writes: entscheidungen (Status in_vorbereitung, vom Plan gesetzt).
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
import { useEntscheidungVorbereitenFlow } from '@/lib/journey/flows/EntscheidungVorbereiten';
import { tx } from '@/i18n';

export default function EntscheidungVorbereitenPage() {
  const [step, setStep] = useState(1);
  const flow = useEntscheidungVorbereitenFlow({
    steps: {
      vorhaben: 1,
      frage: 2, alternativen: 2,
      gesicherte_fakten: 3, offene_annahmen: 3, fehlende_informationen: 3,
      konsequenzen: 4,
      geltende_regel: 5, zustaendiger: 5,
      frist: 6,
    },
    items: {
      vorhaben: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: fieldText(r, 'ziel') }),
      geltende_regel: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: [fieldLookup(r, 'regeltyp')?.label, fieldLookup(r, 'erforderliche_rolle')?.label].filter(Boolean).join(' · '),
      }),
      zustaendiger: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldLookup(r, 'rolle')?.label ?? '',
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
        description: tx('Frage, Alternativen und Grundlagen festhalten, damit entschieden werden kann.'),
        needs: [tx('Das betroffene Vorhaben'), tx('Die zu entscheidende Frage'), tx('Eine zuständige Person')],
      }}
    >
      <WizardStep label={tx('Vorhaben')} description={tx('Für welches Vorhaben muss etwas entschieden werden?')}>
        <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} searchPlaceholder={tx('Vorhaben suchen …')} />
      </WizardStep>

      <WizardStep label={tx('Frage & Alternativen')} description={tx('Was ist zu entscheiden und welche Möglichkeiten gibt es?')} needs={['vorhaben']}>
        <div className="space-y-4">
          <Bound form={f} name="frage" rows={3} />
          <Bound form={f} name="alternativen" rows={4} hint={tx('Eine Alternative pro Zeile')} />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Fakten')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Fakten & Annahmen')} description={tx('Was ist gesichert, was nur angenommen und was fehlt noch?')}>
        <div className="space-y-4">
          <Bound form={f} name="gesicherte_fakten" rows={3} />
          <Bound form={f} name="offene_annahmen" rows={3} />
          <Bound form={f} name="fehlende_informationen" rows={3} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Konsequenzen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Konsequenzen')} description={tx('Was passiert, wenn du dich für die jeweilige Option entscheidest?')}>
        <div className="space-y-4">
          <Bound form={f} name="konsequenzen" rows={5} />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Regel und Zuständiger')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Regel & Zuständiger')} description={tx('Welche Regel gilt und wer entscheidet?')}>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{tx('Geltende Regel')}</h3>
            <EntitySelectStep {...flow.picks.geltende_regel.select} {...flow.pick('geltende_regel')} searchPlaceholder={tx('Regel suchen …')} />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{tx('Zuständige Person')}</h3>
            <EntitySelectStep {...flow.picks.zustaendiger.select} {...flow.pick('zustaendiger')} searchPlaceholder={tx('Name suchen …')} />
          </div>
          <StepNav onBack={() => setStep(4)} onNext={() => flow.validateStep(5)} nextStepLabel={tx('Frist')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Frist')} description={tx('Bis wann soll die Entscheidung fallen?')}>
        <div className="space-y-4">
          <Bound form={f} name="frist" />
          <StepNav onBack={() => setStep(5)} onNext={() => flow.validateStep(6)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'entscheidungsstatus', label: tx('Status'), value: tx('In Vorbereitung') }]}
            whatHappensNext={tx('Die Entscheidung steht danach zum Beschließen bereit.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Entscheidung beschließen'), href: '#/intents/entscheidung-beschliessen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Sobald alles geklärt ist, kannst du die Entscheidung beschließen.')}
        />
      )}
    </IntentWizardShell>
  );
}
