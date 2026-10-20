import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { IconAlertTriangle, IconPlus, IconFlag, IconLink } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { Button } from '@/components/ui/button';
import { KanbanWidget, type KanbanCard, type KanbanColumn, type KanbanTone } from '@/components/widgets/KanbanWidget';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { LOOKUP_OPTIONS, lookupOption } from '@/types/app';
import type { LookupValue } from '@/types/app';
import { formatDate, lookupKey } from '@/lib/formatters';
import { useClock, gruss, undoToast } from '@/lib/polish';
import { tx, appLabel, dateFnsLocale } from '@/i18n';

// Workflow-Reihenfolgen (nur Schlüssel — Labels kommen aus dem Schema)
const NEXT_ENTSCHEIDUNG: Record<string, string> = { in_vorbereitung: 'entscheidungsreif', entscheidungsreif: 'entschieden', entschieden: 'umgesetzt' };
const NEXT_VORSCHLAG: Record<string, string> = { vorgeschlagen: 'geprueft', geprueft: 'freigegeben' };
const NEXT_ERFAHRUNG: Record<string, string> = { ungeprueft: 'in_pruefung', in_pruefung: 'geprueft' };
const NEXT_ERKENNTNIS: Record<string, string> = { entwurf: 'geprueft', geprueft: 'gueltig' };
const NEXT_VORHABEN: Record<string, string> = { idee: 'planung', planung: 'in_arbeit', in_arbeit: 'in_pruefung', in_pruefung: 'umgesetzt', umgesetzt: 'abgeschlossen' };

type StepCfg = {
  set: (fn: (p: any[]) => any[]) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  update: (id: string, f: any) => Promise<unknown>; // eslint-disable-line @typescript-eslint/no-explicit-any
  id: string;
  app: string;
  field: string;
  prev: LookupValue | undefined;
  next: string;
  name: string;
};

function liste(xs: string[], max = 2): string {
  const shown = xs.slice(0, max).map(x => (x.length > 32 ? x.slice(0, 31) + '…' : x));
  return shown.join(', ') + (xs.length > max ? ` +${xs.length - max}` : '');
}

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    vorhaben, aufgabenUndKiVorschlaege, entscheidungen, ergebnisseUndFolgen, erfahrungen, lernerkenntnisse,
    setVorhaben, setAufgabenUndKiVorschlaege, setEntscheidungen, setErfahrungen, setLernerkenntnisse,
    fetchAll,
  } = data;
  const clock = useClock();
  const todayKey = format(clock, 'yyyy-MM-dd');
  const [filter, setFilter] = useState<'kein_schritt' | 'ohne_ergebnis' | null>(null);

  // Ein gemeinsamer Schreibpfad: optimistisch, Hintergrund-PATCH, Undo mit Gegenschreibung
  const step = (c: StepCfg) => {
    const apply = (v: LookupValue | undefined) =>
      c.set(p => p.map(r => (r.record_id === c.id ? { ...r, fields: { ...r.fields, [c.field]: v } } : r)));
    const opt = lookupOption(c.app, c.field, c.next);
    apply(opt);
    c.update(c.id, { [c.field]: c.next })
      .then(() =>
        undoToast(tx`${c.name} — ${opt.label}`, () => {
          apply(c.prev);
          c.update(c.id, { [c.field]: c.prev?.key ?? '' }).catch(() => fetchAll());
        }),
      )
      .catch(() => fetchAll());
  };

  const advanceEntscheidung = (r: (typeof entscheidungen)[number]) => {
    const next = NEXT_ENTSCHEIDUNG[lookupKey(r.fields.entscheidungsstatus) ?? ''];
    if (!next) return;
    step({ set: setEntscheidungen, update: LivingAppsService.updateEntscheidungenEntry, id: r.record_id, app: 'entscheidungen', field: 'entscheidungsstatus', prev: r.fields.entscheidungsstatus, next, name: r.fields.frage ?? appLabel('entscheidungen') });
  };
  const advanceVorschlag = (r: (typeof aufgabenUndKiVorschlaege)[number]) => {
    const next = NEXT_VORSCHLAG[lookupKey(r.fields.zustand) ?? ''];
    if (!next) return;
    step({ set: setAufgabenUndKiVorschlaege, update: LivingAppsService.updateAufgabenUndKiVorschlaegeEntry, id: r.record_id, app: 'aufgaben_und_ki_vorschlaege', field: 'zustand', prev: r.fields.zustand, next, name: r.fields.titel ?? appLabel('aufgaben_und_ki_vorschlaege') });
  };
  const advanceErfahrung = (r: (typeof erfahrungen)[number]) => {
    const next = NEXT_ERFAHRUNG[lookupKey(r.fields.pruefstatus) ?? 'ungeprueft'];
    if (!next) return;
    step({ set: setErfahrungen, update: LivingAppsService.updateErfahrungenEntry, id: r.record_id, app: 'erfahrungen', field: 'pruefstatus', prev: r.fields.pruefstatus, next, name: r.fields.titel ?? appLabel('erfahrungen') });
  };
  const advanceErkenntnis = (r: (typeof lernerkenntnisse)[number]) => {
    const next = NEXT_ERKENNTNIS[lookupKey(r.fields.status) ?? 'entwurf'];
    if (!next) return;
    step({ set: setLernerkenntnisse, update: LivingAppsService.updateLernerkenntnisseEntry, id: r.record_id, app: 'lernerkenntnisse', field: 'status', prev: r.fields.status, next, name: r.fields.titel ?? appLabel('lernerkenntnisse') });
  };
  const advanceVorhaben = (r: (typeof vorhaben)[number], to?: string) => {
    const next = to ?? NEXT_VORHABEN[lookupKey(r.fields.arbeitszustand) ?? ''];
    if (!next) return;
    step({ set: setVorhaben, update: LivingAppsService.updateVorhabenEntry, id: r.record_id, app: 'vorhaben', field: 'arbeitszustand', prev: r.fields.arbeitszustand, next, name: r.fields.titel ?? appLabel('vorhaben') });
  };

  const nextLabel = (app: string, field: string, map: Record<string, string>, cur: string | undefined) => {
    const n = map[cur ?? ''];
    return n ? tx`Weiter: ${lookupOption(app, field, n).label}` : undefined;
  };

  const crud = useEntityCrud(data, {
    footer: top => {
      switch (top.type) {
        case 'vorhaben': {
          const label = nextLabel('vorhaben', 'arbeitszustand', NEXT_VORHABEN, lookupKey(top.record.fields.arbeitszustand));
          return label ? { label, onClick: () => advanceVorhaben(top.record) } : undefined;
        }
        case 'entscheidungen': {
          const label = nextLabel('entscheidungen', 'entscheidungsstatus', NEXT_ENTSCHEIDUNG, lookupKey(top.record.fields.entscheidungsstatus));
          return label ? { label, onClick: () => advanceEntscheidung(top.record) } : undefined;
        }
        case 'aufgabenUndKiVorschlaege': {
          const label = nextLabel('aufgaben_und_ki_vorschlaege', 'zustand', NEXT_VORSCHLAG, lookupKey(top.record.fields.zustand));
          return label ? { label, onClick: () => advanceVorschlag(top.record) } : undefined;
        }
        case 'erfahrungen': {
          const label = nextLabel('erfahrungen', 'pruefstatus', NEXT_ERFAHRUNG, lookupKey(top.record.fields.pruefstatus) ?? 'ungeprueft');
          return label ? { label, onClick: () => advanceErfahrung(top.record) } : undefined;
        }
        case 'lernerkenntnisse': {
          const label = nextLabel('lernerkenntnisse', 'status', NEXT_ERKENNTNIS, lookupKey(top.record.fields.status) ?? 'entwurf');
          return label ? { label, onClick: () => advanceErkenntnis(top.record) } : undefined;
        }
        default:
          return undefined;
      }
    },
  });
  const eVorhaben = crud.enriched.vorhaben;
  const eEntscheidungen = crud.enriched.entscheidungen;
  const eVorschlaege = crud.enriched.aufgabenUndKiVorschlaege;
  const eErfahrungen = crud.enriched.erfahrungen;
  const eErkenntnisse = crud.enriched.lernerkenntnisse;

  // ---- Ableitungen -------------------------------------------------------
  const frist = (r: { fields: { frist?: string } }) => (r.fields.frist ?? '').slice(0, 10);

  const withResult = useMemo(() => {
    const s = new Set<string>();
    ergebnisseUndFolgen.forEach(e => { const id = extractRecordId(e.fields.entscheidung); if (id) s.add(id); });
    return s;
  }, [ergebnisseUndFolgen]);

  const offeneEntscheidungen = eEntscheidungen.filter(r => {
    const k = lookupKey(r.fields.entscheidungsstatus);
    return k === 'in_vorbereitung' || k === 'entscheidungsreif' || !k;
  });
  const ueberfaellig = offeneEntscheidungen.filter(r => frist(r) && frist(r) < todayKey)
    .sort((a, b) => frist(a).localeCompare(frist(b)));
  const ohneErgebnis = eEntscheidungen.filter(r => {
    const k = lookupKey(r.fields.entscheidungsstatus);
    return (k === 'entschieden' || k === 'umgesetzt') && !withResult.has(r.record_id);
  });
  const aktiveVorhaben = eVorhaben.filter(r => !['abgeschlossen', 'pausiert', 'idee'].includes(lookupKey(r.fields.arbeitszustand) ?? ''));
  const ohneSchritt = aktiveVorhaben.filter(r => !(r.fields.naechster_schritt ?? '').trim());

  const entscheidungsListe = (filter === 'ohne_ergebnis' ? ohneErgebnis : [...offeneEntscheidungen, ...ohneErgebnis])
    .slice()
    .sort((a, b) => (frist(a) || '9999').localeCompare(frist(b) || '9999'));

  const vorschlaege = eVorschlaege.filter(r => ['vorgeschlagen', 'geprueft'].includes(lookupKey(r.fields.zustand) ?? ''))
    .sort((a, b) => (lookupKey(a.fields.quelle) === 'ki_vorschlag' ? 0 : 1) - (lookupKey(b.fields.quelle) === 'ki_vorschlag' ? 0 : 1));
  const ungeprueft = eErfahrungen.filter(r => ['ungeprueft', 'in_pruefung'].includes(lookupKey(r.fields.pruefstatus) ?? 'ungeprueft'));
  const entwuerfe = eErkenntnisse.filter(r => (lookupKey(r.fields.status) ?? 'entwurf') === 'entwurf');

  // ---- Kanban ------------------------------------------------------------
  const columns: KanbanColumn[] = (LOOKUP_OPTIONS['vorhaben']?.['arbeitszustand'] ?? []).map(o => ({ key: o.key, label: o.label }));
  const toneFor = (p: string | undefined): KanbanTone => (p === 'kritisch' ? 'destructive' : p === 'hoch' ? 'warning' : 'default');
  const cards: KanbanCard[] = eVorhaben
    .filter(r => filter !== 'kein_schritt' || ohneSchritt.some(o => o.record_id === r.record_id))
    .map(r => ({
      id: `vorhaben:${r.record_id}`,
      column: lookupKey(r.fields.arbeitszustand) ?? columns[0]?.key ?? '',
      title: r.fields.titel ?? appLabel('vorhaben'),
      subtitle: (
        <span className="block space-y-0.5">
          <span className="block line-clamp-2">
            {(r.fields.naechster_schritt ?? '').trim()
              ? <><IconFlag size={12} className="mr-1 inline shrink-0" />{r.fields.naechster_schritt}</>
              : <span className="text-amber-600">{tx('Kein nächster Schritt')}</span>}
          </span>
          {(r.fields.uebergabehinweise ?? '').trim() && (
            <span className="block line-clamp-1 text-muted-foreground"><IconLink size={12} className="mr-1 inline shrink-0" />{r.fields.uebergabehinweise}</span>
          )}
          {r.verantwortlicherName && <span className="block truncate text-muted-foreground">{r.verantwortlicherName}</span>}
        </span>
      ),
      tone: toneFor(lookupKey(r.fields.prioritaet)),
    }));

  const moveCard = (cardId: string, newColumn: string) => {
    const rid = cardId.split(':')[1];
    const rec = vorhaben.find(v => v.record_id === rid);
    if (!rec) return;
    advanceVorhaben(rec, newColumn);
  };

  // ---- Kopf --------------------------------------------------------------
  const total = vorhaben.length + entscheidungen.length + aufgabenUndKiVorschlaege.length;
  let context: string;
  if (ueberfaellig.length > 0) {
    context = tx`Frist verpasst bei: ${liste(ueberfaellig.map(r => r.fields.frage ?? ''))}.`;
  } else if (vorschlaege.length > 0) {
    context = tx`Zur Prüfung warten: ${liste(vorschlaege.map(r => r.fields.titel ?? ''))}.`;
  } else if (ohneErgebnis.length > 0) {
    context = tx`Noch ohne Ergebnis: ${liste(ohneErgebnis.map(r => r.fields.frage ?? ''))}.`;
  } else if (ohneSchritt.length > 0) {
    context = tx`Kein nächster Schritt bei: ${liste(ohneSchritt.map(r => r.fields.titel ?? ''))}.`;
  } else if (aktiveVorhaben.length > 0) {
    context = tx`Läuft: ${liste(aktiveVorhaben.map(r => r.fields.titel ?? ''))} — nichts Dringendes offen.`;
  } else {
    context = tx`Lege dein erstes Vorhaben an, damit Kontext und Arbeitszustand erhalten bleiben.`;
  }

  const openEntscheidung = (id: string) => {
    const r = entscheidungen.find(x => x.record_id === id);
    if (r) crud.entscheidungen.openDetail(r);
  };

  if (total === 0 && erfahrungen.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">{gruss(clock)}</h1>
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
          <IconFlag size={48} className="text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">{context}</p>
          {crud.vorhaben.canWrite && (
            <Button onClick={() => crud.vorhaben.openCreate({ arbeitszustand: 'idee' })}>
              <IconPlus size={16} className="mr-1 shrink-0" />{tx('Erstes Vorhaben anlegen')}
            </Button>
          )}
        </div>
        {crud.surfaces}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
        </div>
        {crud.vorhaben.canWrite && (
          <Button onClick={() => crud.vorhaben.openCreate({ arbeitszustand: 'idee' })}>
            <IconPlus size={16} className="mr-1 shrink-0" />{tx('Neues Vorhaben')}
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={
          ueberfaellig.length > 0 && (
            <HeroBanner
              icon={<IconAlertTriangle size={18} />}
              action={{ label: tx('Weiter bearbeiten'), onClick: () => advanceEntscheidung(ueberfaellig[0]) }}
            >
              <b>{liste(ueberfaellig.map(r => r.fields.frage ?? ''))}</b>{' '}
              {tx`— Frist war ${formatDate(ueberfaellig[0].fields.frist)}, noch keine Entscheidung.`}
            </HeroBanner>
          )
        }
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Entschieden ohne Ergebnis')}
              value={ohneErgebnis.length}
              tone={ohneErgebnis.length > 0 ? 'warning' : 'default'}
              onClick={() => setFilter(f => (f === 'ohne_ergebnis' ? null : 'ohne_ergebnis'))}
              active={filter === 'ohne_ergebnis'}
            />
            <StatStripItem
              title={tx('Aktive Vorhaben ohne nächsten Schritt')}
              value={`${ohneSchritt.length} / ${aktiveVorhaben.length}`}
              tone={ohneSchritt.length > 0 ? 'warning' : 'default'}
              onClick={() => setFilter(f => (f === 'kein_schritt' ? null : 'kein_schritt'))}
              active={filter === 'kein_schritt'}
            />
          </StatStrip>
        }
        primary={
          <KanbanWidget
            cards={cards}
            columns={columns}
            defaultCollapsed={['abgeschlossen', 'pausiert']}
            onCardClick={card => {
              const r = vorhaben.find(v => v.record_id === card.id.split(':')[1]);
              if (r) crud.vorhaben.openDetail(r);
            }}
            onCardMove={moveCard}
            onAddCard={crud.vorhaben.canWrite ? column => crud.vorhaben.openCreate({ arbeitszustand: column }) : undefined}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Entscheidungen & Fristen')}
              items={entscheidungsListe.map(r => {
                const k = lookupKey(r.fields.entscheidungsstatus);
                const noResult = (k === 'entschieden' || k === 'umgesetzt') && !withResult.has(r.record_id);
                const f = frist(r);
                return {
                  id: r.record_id,
                  title: r.fields.frage ?? appLabel('entscheidungen'),
                  secondLine: (
                    <>
                      {noResult
                        ? <span className="font-medium text-amber-600">{tx('Ohne Ergebnis')}</span>
                        : <span className="text-muted-foreground">{r.fields.entscheidungsstatus?.label}</span>}
                      {f && (
                        <span className="text-muted-foreground">
                          {' · '}{format(new Date(f), 'dd. MMM', { locale: dateFnsLocale() })}
                        </span>
                      )}
                      {r.vorhabenName && <span className="text-muted-foreground">{' · '}{r.vorhabenName}</span>}
                    </>
                  ),
                  action: noResult
                    ? { label: tx('Ergebnis erfassen'), onClick: () => crud.ergebnisseUndFolgen.openCreate({ entscheidung: r.record_id }) }
                    : NEXT_ENTSCHEIDUNG[k ?? '']
                      ? { label: tx('Weiter'), onClick: () => advanceEntscheidung(r) }
                      : undefined,
                };
              })}
              onItemClick={openEntscheidung}
              empty={{ text: tx('Keine offenen Entscheidungen.') }}
            />
            <WorkList
              title={tx('KI-Vorschläge zur Prüfung')}
              items={vorschlaege.map(r => ({
                id: r.record_id,
                title: r.fields.titel ?? appLabel('aufgaben_und_ki_vorschlaege'),
                secondLine: (
                  <>
                    <span className="font-medium text-primary">{r.fields.zustand?.label}</span>
                    <span className="text-muted-foreground">
                      {' · '}{r.fields.quelle?.label}{r.vorhabenName ? ` · ${r.vorhabenName}` : ''}
                    </span>
                  </>
                ),
                action: { label: lookupKey(r.fields.zustand) === 'geprueft' ? tx('Freigeben') : tx('Geprüft'), onClick: () => advanceVorschlag(r) },
              }))}
              onItemClick={id => { const r = aufgabenUndKiVorschlaege.find(x => x.record_id === id); if (r) crud.aufgabenUndKiVorschlaege.openDetail(r); }}
              empty={{ text: tx('Nichts zu prüfen — alle Vorschläge sind bearbeitet.') }}
            />
            <WorkList
              title={tx('Ungeprüfte Erfahrungen')}
              items={ungeprueft.map(r => ({
                id: r.record_id,
                title: r.fields.titel ?? appLabel('erfahrungen'),
                secondLine: (
                  <>
                    <span className="font-medium text-amber-600">{r.fields.pruefstatus?.label ?? tx('Ungeprüft')}</span>
                    <span className="text-muted-foreground">{r.vorhabenName ? ` · ${r.vorhabenName}` : ''}</span>
                  </>
                ),
                action: { label: lookupKey(r.fields.pruefstatus) === 'in_pruefung' ? tx('Geprüft') : tx('Prüfen'), onClick: () => advanceErfahrung(r) },
              }))}
              onItemClick={id => { const r = erfahrungen.find(x => x.record_id === id); if (r) crud.erfahrungen.openDetail(r); }}
              empty={{
                text: tx('Alle Erfahrungen sind geprüft.'),
                action: crud.erfahrungen.canWrite ? { label: tx('Erfahrung dokumentieren'), onClick: () => crud.erfahrungen.openCreate({ pruefstatus: 'ungeprueft' }) } : undefined,
              }}
            />
            <WorkList
              title={tx('Lernerkenntnisse im Entwurf')}
              items={entwuerfe.map(r => ({
                id: r.record_id,
                title: r.fields.titel ?? appLabel('lernerkenntnisse'),
                secondLine: <span className="text-muted-foreground">{r.prueferName || tx('Ohne Prüfer')}</span>,
                action: { label: tx('Geprüft'), onClick: () => advanceErkenntnis(r) },
              }))}
              onItemClick={id => { const r = lernerkenntnisse.find(x => x.record_id === id); if (r) crud.lernerkenntnisse.openDetail(r); }}
              empty={{ text: tx('Keine Entwürfe offen.') }}
            />
          </>
        }
      />
      {crud.surfaces}
    </div>
  );
}
