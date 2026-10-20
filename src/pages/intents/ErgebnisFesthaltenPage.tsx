/**
 * Ergebnis und Folgen festhalten — 4-Schritt-Wizard.
 * Steps: 1) Entscheidung (und Aufgabe) wählen → 2) Erwartetes und tatsächliches Ergebnis → 3) Abweichung, Bewertung, Beobachter → 4) Prüfen & als umgesetzt markieren.
 * Reads: entscheidungen, aufgaben_und_ki_vorschlaege, nutzer. Writes: ergebnisse_und_folgen (create), entscheidungen (update entscheidungsstatus = umgesetzt).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, todayIso } from '@/lib/journey';
import { useErgebnisFesthaltenFlow } from '@/lib/journey/flows/ErgebnisFesthalten';
import { formatDate } from '@/lib/formatters';
import { tx } from '@/i18n';

export default function ErgebnisFesthaltenPage() {
  const [step, setStep] = useState(1);
  const flow = useErgebnisFesthaltenFlow({
    steps: {
      entscheidungen: 1, entscheidung: 1, aufgabe: 1,
      erwartetes_ergebnis: 2, tatsaechliches_ergebnis: 2,
      abweichung: 3, bewertung: 3, beobachter: 3,
    },
    items: {
      entscheidungen: r => ({ id: r.id, title: fieldText(r, 'frage'), subtitle: fieldText(r, 'gewaehlte_option') }),
      entscheidung: r => ({ id: r.id, title: fieldText(r, 'frage'), subtitle: fieldText(r, 'gewaehlte_option') }),
      aufgabe: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: fieldText(r, 'beschreibung') }),
      beobachter: r => ({ id: r.id, title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(), subtitle: fieldText(r, 'fachgebiet') }),
    },
  });

  const ergebnis = flow.forms.ergebnisse_und_folgen;
  const entscheidungPick = flow.pick('entscheidungen');
  const entscheidungLink = flow.pick('entscheidung');
  const entscheidungId = entscheidungPick.selectedId as string | undefined;
  const entscheidung = entscheidungId ? flow.picks.entscheidungen.recordOf(entscheidungId) : undefined;

  // The decision that is marked as umgesetzt is also the one the result belongs to.
  const pickEntscheidung = (id: string) => {
    entscheidungPick.onSelect(id);
    entscheidungLink.onSelect(id);
    const plan = fieldText(flow.picks.entscheidungen.recordOf(id) ?? { id, fields: {}, createdAt: null }, 'umsetzungsplan');
    if (plan && !ergebnis.get('erwartetes_ergebnis')) ergebnis.set('erwartetes_ergebnis', plan);
  };

  return (
    <IntentWizardShell
      title={tx('Ergebnis und Folgen festhalten')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Halte fest, was aus einer Entscheidung geworden ist.'),
        needs: [tx('Die umgesetzte Entscheidung'), tx('Das tatsächliche Ergebnis')],
      }}
    >
      <WizardStep label={tx('Entscheidung')} description={tx('Welche Entscheidung wurde umgesetzt? Optional: zu welcher Aufgabe gehört das Ergebnis?')}>
        <div className="space-y-6">
          <EntitySelectStep
            {...flow.picks.entscheidungen.select}
            selectedId={entscheidungId}
            onSelect={pickEntscheidung}
            searchPlaceholder={tx('Frage der Entscheidung suchen …')}
          />
          {entscheidungId && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{tx('Aufgabe (optional)')}</h3>
              <EntitySelectStep
                {...flow.picks.aufgabe.select}
                {...flow.pick('aufgabe')}
                searchPlaceholder={tx('Aufgabe suchen …')}
              />
            </div>
          )}
          <StepNav onNext={() => flow.validateStep(1)} nextStepLabel={tx('Ergebnis')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Ergebnis')} description={tx('Was war erwartet — und was ist tatsächlich passiert?')} needs={['entscheidung']}>
        <div className="space-y-4">
          {entscheidung && (
            <div className="rounded-2xl border bg-secondary/40 p-4 text-sm space-y-1 overflow-hidden">
              <p className="font-medium break-words">{fieldText(entscheidung, 'frage')}</p>
              {fieldText(entscheidung, 'gewaehlte_option') && (
                <p className="text-muted-foreground break-words">{tx('Gewählt')}: {fieldText(entscheidung, 'gewaehlte_option')}</p>
              )}
              {fieldText(entscheidung, 'umsetzungsplan') && (
                <p className="text-muted-foreground break-words">{tx('Umsetzung')}: {fieldText(entscheidung, 'umsetzungsplan')}</p>
              )}
            </div>
          )}
          <Bound form={ergebnis} name="erwartetes_ergebnis" rows={3} />
          <Bound form={ergebnis} name="tatsaechliches_ergebnis" rows={3} />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Bewertung')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Bewertung')} description={tx('Wie weicht das Ergebnis ab und wie bewertest du es?')}>
        <div className="space-y-4">
          <Bound form={ergebnis} name="abweichung" rows={3} />
          <Bound form={ergebnis} name="bewertung" />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{tx('Wer hat das Ergebnis beobachtet? (optional)')}</h3>
            <EntitySelectStep
              {...flow.picks.beobachter.select}
              {...flow.pick('beobachter')}
              avatar="initials"
              searchPlaceholder={tx('Name suchen …')}
            />
          </div>
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'messdatum', label: tx('Messdatum'), value: formatDate(todayIso()) },
              { key: 'entscheidungsstatus', label: tx('Status der Entscheidung'), value: tx('Umgesetzt') },
            ]}
            whatHappensNext={tx('Das Ergebnis wird gespeichert und die Entscheidung als umgesetzt markiert.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          whatHappensNext={tx('Aus dem Ergebnis kannst du nun Erfahrungen ableiten.')}
          next={[
            { label: tx('Weiteres Ergebnis festhalten'), onClick: () => { flow.reset(); setStep(1); } },
            { label: tx('Entscheidung vorbereiten'), href: '#/intents/entscheidung-vorbereiten' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
