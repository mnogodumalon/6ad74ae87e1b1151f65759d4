/**
 * Entscheidung beschließen — 4-Schritt-Wizard.
 * Steps: 1) Entscheidungsreife Entscheidung wählen → 2) Vorbereitung ansehen → 3) Option, Begründung, Umsetzungsplan erfassen → 4) Beschließen.
 * Reads: entscheidungen (Vorbereitung als Lesefelder). Writes: entscheidungen (update: gewaehlte_option, begruendung, umsetzungsplan, beschlussdatum, entscheidungsstatus).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldDate, fieldLookup, todayIso } from '@/lib/journey';
import { useEntscheidungBeschliessenFlow } from '@/lib/journey/flows/EntscheidungBeschliessen';
import { formatDate } from '@/lib/formatters';
import { tx } from '@/i18n';

export default function EntscheidungBeschliessenPage() {
  const [step, setStep] = useState(1);
  const flow = useEntscheidungBeschliessenFlow({
    steps: { entscheidungen: 1, gewaehlte_option: 3, begruendung: 3, umsetzungsplan: 3 },
    items: {
      entscheidungen: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'frage'),
        subtitle: [ctx.ref('vorhaben'), fieldDate(r, 'frist') ? tx`Frist ${formatDate(fieldDate(r, 'frist') ?? '')}` : '']
          .filter(Boolean)
          .join(' · '),
      }),
    },
  });

  const rec = flow.targets.entscheidungen.record;
  const sections: { label: string; value: string }[] = rec
    ? [
        { label: tx('Zu entscheidende Frage'), value: fieldText(rec, 'frage') },
        { label: tx('Alternativen'), value: fieldText(rec, 'alternativen') },
        { label: tx('Gesicherte Fakten'), value: fieldText(rec, 'gesicherte_fakten') },
        { label: tx('Offene Annahmen'), value: fieldText(rec, 'offene_annahmen') },
        { label: tx('Fehlende Informationen'), value: fieldText(rec, 'fehlende_informationen') },
        { label: tx('Konsequenzen der Optionen'), value: fieldText(rec, 'konsequenzen') },
      ].filter(s => s.value)
    : [];
  const frist = rec ? fieldDate(rec, 'frist') : null;
  const regel = rec ? flow.picks.entscheidungen.refLabel(rec, 'geltende_regel') : undefined;
  const zustaendiger = rec ? flow.picks.entscheidungen.refLabel(rec, 'zustaendiger') : undefined;
  const status = rec ? fieldLookup(rec, 'entscheidungsstatus') : null;

  return (
    <IntentWizardShell
      title={tx('Entscheidung beschließen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine vorbereitete Entscheidung mit Option, Begründung und Plan festhalten.'),
        needs: [tx('Eine entscheidungsreife Entscheidung'), tx('Die gewählte Option samt Begründung')],
      }}
    >
      <WizardStep label={tx('Entscheidung')} description={tx('Welche vorbereitete Entscheidung soll beschlossen werden?')}>
        <EntitySelectStep
          {...flow.picks.entscheidungen.select}
          {...flow.pick('entscheidungen')}
          searchPlaceholder={tx('Frage suchen …')}
        />
      </WizardStep>

      <WizardStep
        label={tx('Vorbereitung')}
        heading={tx('Vorbereitung ansehen')}
        description={tx('Das ist die Grundlage für deinen Beschluss.')}
        needs={['entscheidungen']}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            {status && <span>{tx('Status')}: <b className="text-foreground">{status.label}</b></span>}
            {zustaendiger && <span>{tx('Zuständig')}: <b className="text-foreground">{zustaendiger}</b></span>}
            {regel && <span>{tx('Geltende Regel')}: <b className="text-foreground">{regel}</b></span>}
            {frist && <span>{tx('Frist')}: <b className="text-foreground">{formatDate(frist)}</b></span>}
          </div>
          {sections.map(s => (
            <div key={s.label} data-field={s.label} className="rounded-2xl bg-secondary p-4 overflow-hidden">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm">{s.value}</p>
            </div>
          ))}
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => !!rec}
            nextStepLabel={tx('Beschluss erfassen')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Beschluss')}
        heading={tx('Beschluss erfassen')}
        description={tx('Welche Option wird gewählt, warum, und was wird umgesetzt?')}
        needs={['entscheidungen']}
      >
        <div className="space-y-4">
          <Bound form={flow.forms.entscheidungen} name="gewaehlte_option" rows={3} />
          <Bound form={flow.forms.entscheidungen} name="begruendung" rows={4} />
          <Bound form={flow.forms.entscheidungen} name="umsetzungsplan" rows={4} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Beschließen')} description={tx('Alles richtig? Dann ist die Entscheidung beschlossen.')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'beschlussdatum', label: tx('Beschlussdatum'), value: formatDate(todayIso()) },
              { key: 'entscheidungsstatus', label: tx('Neuer Status'), value: tx('Entschieden') },
            ]}
            confirmLabel={tx('Jetzt beschließen')}
            whatHappensNext={tx('Die Entscheidung gilt ab sofort als entschieden und trägt das heutige Beschlussdatum.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          actions={{ copy: false, print: false }}
          next={[
            { label: tx('Weitere Entscheidung beschließen'), onClick: () => { flow.reset(); setStep(1); } },
            { label: tx('Neue Entscheidung vorbereiten'), href: '#/intents/entscheidung-vorbereiten' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Die Umsetzung kann jetzt beginnen.')}
        />
      )}
    </IntentWizardShell>
  );
}
