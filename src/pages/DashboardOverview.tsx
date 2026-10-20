import { useMemo, useState } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { IconAlertTriangle, IconBulb, IconPlus, IconScale, IconSparkles } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import type { Entscheidungen, AufgabenUndKiVorschlaege, Erfahrungen } from '@/types/app';
import { LOOKUP_OPTIONS, lookupOption } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate, lookupKey } from '@/lib/formatters';
import { gruss, namen, undoToast, useClock } from '@/lib/polish';
import { tx, appLabel } from '@/i18n';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList, type WorkListItem } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { Button } from '@/components/ui/button';
import { KanbanWidget, type KanbanCard, type KanbanColumn, type KanbanTone } from '@/components/widgets/KanbanWidget';

const trunc = (s: string | undefined, n = 70) => {
  const v = (s ?? '').trim();
  return v.length > n ? v.slice(0, n - 1) + '…' : v;
};

type Focus = 'entscheidungen' | 'vorschlaege' | 'erfahrungen';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    vorhaben, regelnUndGrenzen, aufgabenUndKiVorschlaege, entscheidungen, erfahrungen, lernerkenntnisse,
    setVorhaben, setEntscheidungen, setAufgabenUndKiVorschlaege, setErfahrungen,
    fetchAll,
  } = data;
  const clock = useClock();
  const today = format(clock, 'yyyy-MM-dd');
  const [focus, setFocus] = useState<Focus>('entscheidungen');

  // ── shared advance helpers (hero, work lists, overlay footer: one write path) ──
  const advanceEntscheidung = (r: Entscheidungen) => {
    const prev = r.fields.entscheidungsstatus;
    if (lookupKey(prev) !== 'in_vorbereitung') return;
    const nx = lookupOption('entscheidungen', 'entscheidungsstatus', 'entscheidungsreif');
    const patch = (v: typeof prev) => setEntscheidungen(l => l.map(x => x.record_id === r.record_id ? { ...x, fields: { ...x.fields, entscheidungsstatus: v } } : x));
    patch(nx);
    LivingAppsService.updateEntscheidungenEntry(r.record_id, { entscheidungsstatus: nx.key }).catch(() => fetchAll());
    const name = trunc(r.fields.frage, 40);
    undoToast(tx`${name} — entscheidungsreif`, () => {
      patch(prev);
      LivingAppsService.updateEntscheidungenEntry(r.record_id, { entscheidungsstatus: prev?.key }).catch(() => fetchAll());
    });
  };

  const advanceVorschlag = (r: AufgabenUndKiVorschlaege) => {
    const prev = r.fields.zustand;
    const cur = lookupKey(prev);
    const key = cur === 'vorgeschlagen' ? 'geprueft' : cur === 'geprueft' ? 'freigegeben' : null;
    if (!key) return;
    const nx = lookupOption('aufgaben_und_ki_vorschlaege', 'zustand', key);
    const patch = (v: typeof prev) => setAufgabenUndKiVorschlaege(l => l.map(x => x.record_id === r.record_id ? { ...x, fields: { ...x.fields, zustand: v } } : x));
    patch(nx);
    LivingAppsService.updateAufgabenUndKiVorschlaegeEntry(r.record_id, { zustand: nx.key }).catch(() => fetchAll());
    const name = trunc(r.fields.titel, 40);
    const state = nx.label;
    undoToast(tx`${name} — ${state}`, () => {
      patch(prev);
      LivingAppsService.updateAufgabenUndKiVorschlaegeEntry(r.record_id, { zustand: prev?.key }).catch(() => fetchAll());
    });
  };

  const advanceErfahrung = (r: Erfahrungen) => {
    const prev = r.fields.pruefstatus;
    const cur = lookupKey(prev);
    const key = cur === 'ungeprueft' ? 'in_pruefung' : cur === 'in_pruefung' ? 'geprueft' : null;
    if (!key) return;
    const nx = lookupOption('erfahrungen', 'pruefstatus', key);
    const patch = (v: typeof prev) => setErfahrungen(l => l.map(x => x.record_id === r.record_id ? { ...x, fields: { ...x.fields, pruefstatus: v } } : x));
    patch(nx);
    LivingAppsService.updateErfahrungenEntry(r.record_id, { pruefstatus: nx.key }).catch(() => fetchAll());
    const name = trunc(r.fields.titel, 40);
    const state = nx.label;
    undoToast(tx`${name} — ${state}`, () => {
      patch(prev);
      LivingAppsService.updateErfahrungenEntry(r.record_id, { pruefstatus: prev?.key }).catch(() => fetchAll());
    });
  };

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'entscheidungen') {
        const k = lookupKey(top.record.fields.entscheidungsstatus);
        if (k === 'in_vorbereitung') return { label: tx('Als entscheidungsreif markieren'), onClick: () => advanceEntscheidung(top.record) };
        if (k === 'entscheidungsreif') return { label: tx('Beschluss erfassen'), onClick: () => crud.entscheidungen.openEdit(top.record) };
      }
      if (top.type === 'aufgabenUndKiVorschlaege') {
        const k = lookupKey(top.record.fields.zustand);
        if (k === 'vorgeschlagen') return { label: tx('Als geprüft markieren'), onClick: () => advanceVorschlag(top.record) };
        if (k === 'geprueft') return { label: tx('Freigeben'), onClick: () => advanceVorschlag(top.record) };
      }
      if (top.type === 'erfahrungen') {
        const k = lookupKey(top.record.fields.pruefstatus);
        if (k === 'ungeprueft') return { label: tx('Prüfung starten'), onClick: () => advanceErfahrung(top.record) };
        if (k === 'in_pruefung') return { label: tx('Als geprüft markieren'), onClick: () => advanceErfahrung(top.record) };
      }
      return undefined;
    },
  });
  const eVorhaben = crud.enriched.vorhaben;
  const eEntscheidungen = crud.enriched.entscheidungen;
  const eVorschlaege = crud.enriched.aufgabenUndKiVorschlaege;
  const eErfahrungen = crud.enriched.erfahrungen;

  // ── derived state ──
  const openEnt = useMemo(() => eEntscheidungen
    .filter(e => ['in_vorbereitung', 'entscheidungsreif'].includes(lookupKey(e.fields.entscheidungsstatus) ?? ''))
    .sort((a, b) => (a.fields.frist ?? '9999').localeCompare(b.fields.frist ?? '9999')), [eEntscheidungen]);
  const overdue = openEnt.filter(e => e.fields.frist && e.fields.frist < today);
  const soon = openEnt.filter(e => e.fields.frist && e.fields.frist >= today && differenceInCalendarDays(parseISO(e.fields.frist), clock) <= 7);
  const openVor = eVorschlaege.filter(v => ['vorgeschlagen', 'geprueft'].includes(lookupKey(v.fields.zustand) ?? ''));
  const unchecked = eErfahrungen.filter(e => ['ungeprueft', 'in_pruefung'].includes(lookupKey(e.fields.pruefstatus) ?? ''));

  const columns: KanbanColumn[] = (LOOKUP_OPTIONS['vorhaben']?.['arbeitszustand'] ?? []).map(o => ({ key: o.key, label: o.label }));
  const openPointsByVorhaben = useMemo(() => {
    const m = new Map<string, number>();
    const bump = (url: string | undefined) => {
      const id = url?.split('/').pop();
      if (id) m.set(id, (m.get(id) ?? 0) + 1);
    };
    openVor.forEach(v => bump(v.fields.vorhaben));
    openEnt.forEach(e => bump(e.fields.vorhaben));
    return m;
  }, [openVor, openEnt]);

  const toneFor = (p?: string): KanbanTone => p === 'kritisch' ? 'destructive' : p === 'hoch' ? 'warning' : p === 'niedrig' ? 'default' : 'primary';
  const cards: KanbanCard[] = eVorhaben.map(v => {
    const open = openPointsByVorhaben.get(v.record_id) ?? 0;
    const bits = [v.verantwortlicherName, v.fields.prioritaet?.label].filter(Boolean).join(' · ');
    return {
      id: `vorhaben:${v.record_id}`,
      column: lookupKey(v.fields.arbeitszustand) ?? columns[0]?.key ?? '',
      title: v.fields.titel ?? '—',
      subtitle: (
        <span className="block min-w-0">
          <span className="block truncate">{bits}</span>
          {open > 0 ? <span className="block truncate font-medium text-amber-700">{open === 1 ? tx('1 offener Punkt') : tx`${open} offene Punkte`}</span> : null}
          {v.fields.naechster_schritt ? <span className="block truncate">{tx('Weiter:')} {trunc(v.fields.naechster_schritt, 50)}</span> : null}
        </span>
      ),
      tone: toneFor(lookupKey(v.fields.prioritaet)),
    };
  });

  const moveCard = (cardId: string, newColumn: string) => {
    const rid = cardId.split(':')[1];
    const rec = vorhaben.find(v => v.record_id === rid);
    if (!rid || !rec) return;
    const prev = rec.fields.arbeitszustand;
    const nx = lookupOption('vorhaben', 'arbeitszustand', newColumn);
    const patch = (v: typeof prev) => setVorhaben(l => l.map(x => x.record_id === rid ? { ...x, fields: { ...x.fields, arbeitszustand: v } } : x));
    patch(nx);
    LivingAppsService.updateVorhabenEntry(rid, { arbeitszustand: newColumn }).catch(() => fetchAll());
    const name = trunc(rec.fields.titel, 40);
    const state = nx.label;
    undoToast(tx`${name} — ${state}`, () => {
      patch(prev);
      LivingAppsService.updateVorhabenEntry(rid, { arbeitszustand: prev?.key }).catch(() => fetchAll());
    });
  };

  // ── work lists ──
  const frist = (e: typeof openEnt[number]) => {
    if (!e.fields.frist) return <span className="text-muted-foreground">{tx('Ohne Frist')}</span>;
    const late = e.fields.frist < today;
    return late
      ? <span className="font-medium text-destructive">{tx('Überfällig')} · {formatDate(e.fields.frist)}</span>
      : <span className="text-muted-foreground">{tx('Frist')} {formatDate(e.fields.frist)}</span>;
  };

  const entItems: WorkListItem[] = openEnt.map(e => {
    const ready = lookupKey(e.fields.entscheidungsstatus) === 'entscheidungsreif';
    return {
      id: `ent:${e.record_id}`,
      title: trunc(e.fields.frage) || '—',
      secondLine: (
        <>
          {frist(e)}
          <span className="text-muted-foreground"> · {e.vorhabenName || tx('Ohne Vorhaben')}</span>
          {e.geltende_regelName ? <span className="text-muted-foreground"> · {tx('Regel:')} {e.geltende_regelName}</span> : null}
          {e.fields.fehlende_informationen ? <span className="text-amber-700"> · {tx('Infos fehlen')}</span> : null}
        </>
      ),
      action: ready
        ? { label: tx('Beschließen'), onClick: () => crud.entscheidungen.openEdit(e) }
        : { label: tx('Entscheidungsreif'), onClick: () => advanceEntscheidung(e) },
    };
  });

  const vorItems: WorkListItem[] = openVor.map(v => {
    const first = lookupKey(v.fields.zustand) === 'vorgeschlagen';
    return {
      id: `vor:${v.record_id}`,
      title: v.fields.titel ?? '—',
      secondLine: (
        <>
          <span className="font-medium text-amber-700">{v.fields.zustand?.label}</span>
          <span className="text-muted-foreground"> · {v.vorhabenName || tx('Ohne Vorhaben')}</span>
          {v.geltende_regelName ? <span className="text-muted-foreground"> · {tx('Regel:')} {v.geltende_regelName}</span> : null}
        </>
      ),
      action: { label: first ? tx('Geprüft') : tx('Freigeben'), onClick: () => advanceVorschlag(v) },
    };
  });

  const erfItems: WorkListItem[] = unchecked.map(e => ({
    id: `erf:${e.record_id}`,
    title: e.fields.titel ?? '—',
    secondLine: (
      <>
        <span className="font-medium text-amber-700">{e.fields.pruefstatus?.label}</span>
        <span className="text-muted-foreground"> · {e.fields.art?.label ?? ''}{e.vorhabenName ? ` · ${e.vorhabenName}` : ''}</span>
      </>
    ),
    action: { label: lookupKey(e.fields.pruefstatus) === 'ungeprueft' ? tx('Prüfen') : tx('Geprüft'), onClick: () => advanceErfahrung(e) },
  }));

  const focusList = focus === 'entscheidungen'
    ? { title: tx('Entscheidungen zur Klärung'), items: entItems, icon: <IconScale size={16} />, empty: tx('Keine offenen Entscheidungen.') }
    : focus === 'vorschlaege'
      ? { title: tx('KI-Vorschläge zur Prüfung'), items: vorItems, icon: <IconSparkles size={16} />, empty: tx('Keine Vorschläge warten auf Prüfung.') }
      : { title: tx('Ungeprüfte Erfahrungen'), items: erfItems, icon: <IconBulb size={16} />, empty: tx('Alle Erfahrungen sind geprüft.') };

  const nextSteps: WorkListItem[] = eVorhaben
    .filter(v => v.fields.naechster_schritt && !['abgeschlossen', 'umgesetzt', 'pausiert'].includes(lookupKey(v.fields.arbeitszustand) ?? ''))
    .sort((a, b) => (a.fields.zieldatum ?? '9999').localeCompare(b.fields.zieldatum ?? '9999'))
    .map(v => ({
      id: `vh:${v.record_id}`,
      title: v.fields.titel ?? '—',
      secondLine: (
        <>
          <span>{trunc(v.fields.naechster_schritt, 60)}</span>
          {v.fields.zieldatum ? <span className="text-muted-foreground"> · {formatDate(v.fields.zieldatum)}</span> : null}
        </>
      ),
    }));

  const knowledge: WorkListItem[] = [
    ...lernerkenntnisse
      .filter(l => ['geprueft', 'gueltig'].includes(lookupKey(l.fields.status) ?? ''))
      .map(l => ({
        id: `lern:${l.record_id}`,
        title: l.fields.titel ?? '—',
        icon: <IconBulb size={14} />,
        secondLine: <span className="text-muted-foreground">{tx('Lernerkenntnis')}{l.fields.gueltigkeitsbereich ? ` · ${trunc(l.fields.gueltigkeitsbereich, 40)}` : ''}</span>,
      })),
    ...regelnUndGrenzen
      .filter(r => lookupKey(r.fields.status) === 'gueltig')
      .map(r => ({
        id: `regel:${r.record_id}`,
        title: r.fields.titel ?? '—',
        icon: <IconScale size={14} />,
        secondLine: <span className="text-muted-foreground">{r.fields.regeltyp?.label ?? tx('Regel')}{r.fields.geltungsbereich ? ` · ${trunc(r.fields.geltungsbereich, 40)}` : ''}</span>,
      })),
  ];

  const openItem = (id: string) => {
    const [kind, rid] = id.split(':');
    if (kind === 'ent') { const r = entscheidungen.find(x => x.record_id === rid); if (r) crud.entscheidungen.openDetail(r); }
    else if (kind === 'vor') { const r = aufgabenUndKiVorschlaege.find(x => x.record_id === rid); if (r) crud.aufgabenUndKiVorschlaege.openDetail(r); }
    else if (kind === 'erf') { const r = erfahrungen.find(x => x.record_id === rid); if (r) crud.erfahrungen.openDetail(r); }
    else if (kind === 'vh') { const r = vorhaben.find(x => x.record_id === rid); if (r) crud.vorhaben.openDetail(r); }
    else if (kind === 'lern') { const r = lernerkenntnisse.find(x => x.record_id === rid); if (r) crud.lernerkenntnisse.openDetail(r); }
    else if (kind === 'regel') { const r = regelnUndGrenzen.find(x => x.record_id === rid); if (r) crud.regelnUndGrenzen.openDetail(r); }
  };

  // ── header context line (names things in every branch) ──
  const shortTitles = (xs: string[]) => namen(xs.map(x => trunc(x, 24)), 2);
  let context: string;
  if (overdue.length > 0) {
    const n = shortTitles(overdue.map(e => e.fields.frage ?? ''));
    context = tx`Frist überschritten bei: ${n}.`;
  } else if (soon.length > 0) {
    const n = shortTitles(soon.map(e => e.fields.frage ?? ''));
    context = tx`Bald fällig: ${n}.`;
  } else if (openVor.length > 0) {
    const n = shortTitles(openVor.map(v => v.fields.titel ?? ''));
    context = tx`KI-Vorschläge warten auf Prüfung: ${n}.`;
  } else if (unchecked.length > 0) {
    const n = shortTitles(unchecked.map(v => v.fields.titel ?? ''));
    context = tx`Noch ungeprüft: ${n}.`;
  } else if (vorhaben.length > 0) {
    const n = shortTitles(vorhaben.map(v => v.fields.titel ?? ''));
    context = tx`Alles geprüft — laufende Vorhaben: ${n}.`;
  } else {
    context = tx('Lege dein erstes Vorhaben an, damit Wissen und Entscheidungen nicht verloren gehen.');
  }

  const firstOverdue = overdue[0];
  const heroAction = firstOverdue
    ? (lookupKey(firstOverdue.fields.entscheidungsstatus) === 'entscheidungsreif'
        ? { label: tx('Beschluss erfassen'), onClick: () => crud.entscheidungen.openEdit(firstOverdue) }
        : { label: tx('Entscheidungsreif melden'), onClick: () => advanceEntscheidung(firstOverdue) })
    : null;

  const empty = vorhaben.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{context}</p>
        </div>
        {crud.vorhaben.canWrite && (
          <Button onClick={() => crud.vorhaben.openCreate({ arbeitszustand: 'idee' })}>
            <IconPlus size={16} className="shrink-0" />
            {tx('Neues Vorhaben')}
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={
          empty ? (
            <HeroBanner
              tone="warning"
              icon={<IconBulb size={48} />}
              action={{ label: tx('Erstes Vorhaben anlegen'), onClick: () => crud.vorhaben.openCreate({ arbeitszustand: 'idee' }) }}
            >
              {tx('Noch kein Vorhaben vorhanden — starte hier dein gemeinsames Arbeitsgedächtnis.')}
            </HeroBanner>
          ) : firstOverdue && heroAction ? (
            <HeroBanner icon={<IconAlertTriangle size={18} />} tone="destructive" action={heroAction}>
              <b>{shortTitles(overdue.map(e => e.fields.frage ?? ''))}</b>{' '}
              {overdue.length === 1
                ? tx`— Frist war ${formatDate(firstOverdue.fields.frist)}.`
                : tx`— überfällig, älteste Frist ${formatDate(firstOverdue.fields.frist)}.`}
            </HeroBanner>
          ) : undefined
        }
        kpis={empty ? undefined : (
          <StatStrip>
            <StatStripItem
              title={tx('KI-Vorschläge offen')}
              value={openVor.length}
              icon={<IconSparkles size={16} className="text-muted-foreground" />}
              tone={openVor.length > 0 ? 'warning' : 'default'}
              onClick={() => setFocus(f => (f === 'vorschlaege' ? 'entscheidungen' : 'vorschlaege'))}
            />
            <StatStripItem
              title={tx('Frist in 7 Tagen')}
              value={soon.length}
              icon={<IconScale size={16} className="text-muted-foreground" />}
              tone={soon.length > 0 ? 'primary' : 'default'}
              onClick={() => setFocus('entscheidungen')}
            />
            <StatStripItem
              title={tx('Ungeprüfte Erfahrungen')}
              value={unchecked.length}
              icon={<IconBulb size={16} className="text-muted-foreground" />}
              tone={unchecked.length > 0 ? 'warning' : 'default'}
              onClick={() => setFocus(f => (f === 'erfahrungen' ? 'entscheidungen' : 'erfahrungen'))}
            />
          </StatStrip>
        )}
        aside={empty ? undefined : (
          <>
            <WorkList
              title={focusList.title}
              icon={focusList.icon}
              items={focusList.items}
              onItemClick={openItem}
              empty={{ text: focusList.empty }}
            />
            <WorkList
              title={tx('Nächste Schritte der Vorhaben')}
              items={nextSteps}
              onItemClick={openItem}
              empty={{
                text: tx('Keine nächsten Schritte hinterlegt.'),
                action: crud.vorhaben.canWrite ? { label: tx('Vorhaben anlegen'), onClick: () => crud.vorhaben.openCreate({ arbeitszustand: 'planung' }) } : undefined,
              }}
            />
            <WorkList
              title={`${appLabel('lernerkenntnisse')} · ${appLabel('regeln_und_grenzen')}`}
              items={knowledge}
              onItemClick={openItem}
              empty={{ text: tx('Noch keine geprüften Lernerkenntnisse oder gültigen Regeln.') }}
            />
          </>
        )}
        primary={
          empty ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              {tx('Hier erscheinen deine Vorhaben nach Arbeitszustand.')}
            </div>
          ) : (
            <KanbanWidget
              cards={cards}
              columns={columns}
              defaultCollapsed={['abgeschlossen', 'pausiert']}
              onCardClick={card => {
                const r = vorhaben.find(v => v.record_id === card.id.split(':')[1]);
                if (r) crud.vorhaben.openDetail(r);
              }}
              onCardMove={moveCard}
              onAddCard={crud.vorhaben.canWrite ? (column => crud.vorhaben.openCreate({ arbeitszustand: column })) : undefined}
            />
          )
        }
      />
      {crud.surfaces}
    </div>
  );
}
