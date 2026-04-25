import { useMemo, useState } from 'react';
import {
  Plus,
  AlertTriangle,
  Flame,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { WorkflowTabs } from '@/components/layout/WorkflowTabs';

/**
 * Production page — Kanban board (5 lanes) avec batches MULTI-CLIENTS.
 *
 * Modèle métier :
 *  - Triage individualise chaque article (1 tag par pièce).
 *  - Le bin-packing IA regroupe les items en batches PAR PROGRAMME, en
 *    remplissant chaque machine au maximum (Best-Fit Decreasing).
 *  - Une carte = 1 cycle machine = N clients contribuant au même cycle.
 *  - Lors de la finition, les items sont re-séparés par tag → bon client.
 */

type Lane = {
  id: number;
  name: string;
  color: string; // tailwind bg class for the lane accent + dot
  textColor: string;
};

type Contributor = {
  client: string;
  kg: number;
  pieces: number;
  tagPrefix: string; // ex. TRB-2604-041
};

type Batch = {
  lane: number;
  code: string;
  program: string;
  machine: string;
  capacity: number; // kg ou pcs selon la lane
  unit: 'kg' | 'pcs';
  contributors: Contributor[];
  elapsed: string; // HH:MM
  total: string; // HH:MM
  priority?: boolean;
  /** True si proposé par l'IA, pas encore validé par le superviseur */
  suggested?: boolean;
};

const LANES: Lane[] = [
  { id: 0, name: 'Lavage', color: 'bg-brand-800', textColor: 'text-brand-800' },
  { id: 1, name: 'Séchage', color: 'bg-brand-600', textColor: 'text-brand-600' },
  { id: 2, name: 'Calandrage', color: 'bg-terra-600', textColor: 'text-terra-700' },
  { id: 3, name: 'Repassage', color: 'bg-baobab-600', textColor: 'text-baobab-700' },
  { id: 4, name: 'Finition', color: 'bg-ink-500', textColor: 'text-ink-700' },
];

/** Couleur de chaque client dans la barre stackée (cycle de 5 teintes SN) */
const CLIENT_COLORS = [
  'bg-brand-800',
  'bg-brand-500',
  'bg-terra-600',
  'bg-baobab-600',
  'bg-ink-400',
];

const BATCHES: Batch[] = [
  {
    lane: 0,
    code: 'B-0408',
    program: 'Programme 1 · Draps & Taies 60°',
    machine: 'PRIMUS FX600',
    capacity: 60,
    unit: 'kg',
    contributors: [
      { client: 'Pullman Téranga', kg: 22, pieces: 28, tagPrefix: 'PUT-2604-018' },
      { client: 'Radisson Blu', kg: 18, pieces: 24, tagPrefix: 'RAD-2604-014' },
      { client: 'Terrou-Bi', kg: 15, pieces: 20, tagPrefix: 'TRB-2604-041' },
      { client: 'Plaza', kg: 5, pieces: 8, tagPrefix: 'PLZ-2604-009' },
    ],
    elapsed: '00:28',
    total: '01:00',
    priority: true,
  },
  {
    lane: 0,
    code: 'B-0409',
    program: 'Programme 2 · Éponges 60°',
    machine: 'GIRBAU HS6057',
    capacity: 57,
    unit: 'kg',
    contributors: [
      { client: 'King Fahd Palace', kg: 28, pieces: 56, tagPrefix: 'KFP-2604-022' },
      { client: 'Novotel', kg: 14, pieces: 28, tagPrefix: 'NOV-2604-011' },
    ],
    elapsed: '00:12',
    total: '00:50',
  },
  {
    lane: 0,
    code: 'B-0410',
    program: 'Programme 8 · Nappes couleur',
    machine: 'PRIMUS FX350',
    capacity: 35,
    unit: 'kg',
    contributors: [
      { client: 'Onomo', kg: 14, pieces: 22, tagPrefix: 'ONO-2604-007' },
      { client: 'Résidence Mamoune', kg: 12, pieces: 18, tagPrefix: 'RMN-2604-005' },
    ],
    elapsed: '00:08',
    total: '01:10',
    suggested: true,
  },
  {
    lane: 1,
    code: 'B-0406',
    program: 'Séchage standard',
    machine: 'PRIMUS I50-320',
    capacity: 145,
    unit: 'kg',
    contributors: [
      { client: 'Novotel', kg: 22, pieces: 30, tagPrefix: 'NOV-2604-010' },
      { client: 'Pullman Téranga', kg: 18, pieces: 24, tagPrefix: 'PUT-2604-017' },
      { client: 'Radisson Blu', kg: 15, pieces: 20, tagPrefix: 'RAD-2604-013' },
    ],
    elapsed: '00:22',
    total: '00:40',
    priority: true,
  },
  {
    lane: 1,
    code: 'B-0405',
    program: 'Séchage standard',
    machine: 'GIRBAU PB5132',
    capacity: 145,
    unit: 'kg',
    contributors: [
      { client: 'King Fahd', kg: 32, pieces: 48, tagPrefix: 'KFP-2604-021' },
      { client: 'Onomo', kg: 18, pieces: 28, tagPrefix: 'ONO-2604-006' },
    ],
    elapsed: '00:15',
    total: '00:35',
  },
  {
    lane: 2,
    code: 'B-0402',
    program: 'Calandrage standard',
    machine: 'PRIMUS FI280',
    capacity: 45,
    unit: 'pcs',
    contributors: [
      { client: 'Pullman Téranga', kg: 0, pieces: 28, tagPrefix: 'PUT-2604-016' },
      { client: 'Radisson Blu', kg: 0, pieces: 12, tagPrefix: 'RAD-2604-012' },
    ],
    elapsed: '00:14',
    total: '00:30',
  },
  {
    lane: 2,
    code: 'B-0401',
    program: 'Calandrage standard',
    machine: 'PRIMUS FI220',
    capacity: 35,
    unit: 'pcs',
    contributors: [
      { client: 'Terrou-Bi', kg: 0, pieces: 18, tagPrefix: 'TRB-2604-040' },
      { client: 'Plaza', kg: 0, pieces: 10, tagPrefix: 'PLZ-2604-008' },
    ],
    elapsed: '00:08',
    total: '00:25',
  },
  {
    lane: 3,
    code: 'B-0399',
    program: 'Repassage chemises',
    machine: 'GIRBAU MP45',
    capacity: 25,
    unit: 'pcs',
    contributors: [
      { client: 'Terrou-Bi', kg: 0, pieces: 12, tagPrefix: 'TRB-2604-039' },
      { client: 'Novotel', kg: 0, pieces: 8, tagPrefix: 'NOV-2604-009' },
    ],
    elapsed: '00:06',
    total: '00:15',
  },
  {
    lane: 3,
    code: 'B-0398',
    program: 'Repassage pantalons',
    machine: 'Presse manuelle 2',
    capacity: 20,
    unit: 'pcs',
    contributors: [
      { client: 'Onomo', kg: 0, pieces: 14, tagPrefix: 'ONO-2604-005' },
    ],
    elapsed: '00:11',
    total: '00:20',
  },
  {
    lane: 4,
    code: 'B-0395',
    program: 'Pliage + conditionnement',
    machine: 'Poste finition A',
    capacity: 60,
    unit: 'pcs',
    contributors: [
      { client: 'Résidence Mamoune', kg: 0, pieces: 28, tagPrefix: 'RMN-2604-004' },
      { client: 'Plaza', kg: 0, pieces: 12, tagPrefix: 'PLZ-2604-007' },
    ],
    elapsed: '00:03',
    total: '00:10',
  },
  {
    lane: 4,
    code: 'B-0394',
    program: 'Pliage + conditionnement',
    machine: 'Poste finition B',
    capacity: 60,
    unit: 'pcs',
    contributors: [
      { client: 'Pullman Téranga', kg: 0, pieces: 32, tagPrefix: 'PUT-2604-015' },
      { client: 'Radisson Blu', kg: 0, pieces: 18, tagPrefix: 'RAD-2604-011' },
    ],
    elapsed: '00:07',
    total: '00:12',
  },
];

export default function ProductionPage() {
  const [expanded, setExpanded] = useState<string | null>('B-0408');

  const byLane = useMemo(() => {
    const m: Record<number, Batch[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    BATCHES.forEach((b) => m[b.lane].push(b));
    return m;
  }, []);

  // Capacity per lane (sum of currently loaded items vs capacity)
  const laneStats = useMemo(() => {
    return LANES.map((lane) => {
      const items = byLane[lane.id] ?? [];
      const totalLoad = items.reduce(
        (s, b) =>
          s +
          b.contributors.reduce(
            (s2, c) => s2 + (b.unit === 'kg' ? c.kg : c.pieces),
            0,
          ),
        0,
      );
      const totalCap = items.reduce((s, b) => s + b.capacity, 0);
      const utilization = totalCap > 0 ? totalLoad / totalCap : 0;
      return { ...lane, items, totalLoad, totalCap, utilization, unit: items[0]?.unit ?? 'kg' };
    });
  }, [byLane]);

  const totalBatches = BATCHES.length;
  const totalSuggested = BATCHES.filter((b) => b.suggested).length;
  const totalContributors = new Set(
    BATCHES.flatMap((b) => b.contributors.map((c) => c.client)),
  ).size;

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Workflow quotidien</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            Production en cours
          </h1>
          <p className="text-sm text-ink-500 mt-1 capitalize">
            {new Intl.DateTimeFormat('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(new Date())}{' '}
            · {totalBatches} batches · {totalContributors} clients en flux
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <WorkflowTabs />
          <Button size="sm" variant="secondary" className="gap-1.5">
            <Cpu className="w-3.5 h-3.5" strokeWidth={1.75} />
            Recalculer batches
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouveau batch
          </Button>
        </div>
      </div>

      {/* IA suggestion banner */}
      {totalSuggested > 0 && (
        <div className="card-surface bg-brand-50 border-brand-800 p-3.5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-input bg-brand-800 text-paper flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="caps text-brand-800">Optimisation IA · Bin-packing</p>
            <p className="text-sm text-ink-900 mt-0.5">
              <span className="font-semibold">{totalSuggested} batch{totalSuggested > 1 ? 'es' : ''}</span> proposé{totalSuggested > 1 ? 's' : ''} par l'algorithme · économie estimée{' '}
              <span className="font-mono font-semibold text-baobab-700 tnum">−420 L d'eau</span> et{' '}
              <span className="font-mono font-semibold text-baobab-700 tnum">−18 kWh</span>
            </p>
          </div>
          <Button variant="primary" size="sm">
            Tout valider
          </Button>
        </div>
      )}

      {/* Kanban */}
      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 h-full">
          {laneStats.map((lane) => (
            <Lane
              key={lane.id}
              lane={lane}
              batches={lane.items}
              expanded={expanded}
              onToggle={(code) => setExpanded(expanded === code ? null : code)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Lane ───────────────────── */

function Lane({
  lane,
  batches,
  expanded,
  onToggle,
}: {
  lane: Lane & { totalLoad: number; totalCap: number; utilization: number; unit: 'kg' | 'pcs' };
  batches: Batch[];
  expanded: string | null;
  onToggle: (code: string) => void;
}) {
  return (
    <div className="bg-paper-2 border-hairline border-ink-200 rounded-card p-3 flex flex-col min-h-[520px]">
      {/* Lane header */}
      <div className="flex items-center gap-2 px-1 pb-2.5 border-b border-hairline border-ink-200">
        <span className={cn('w-1 h-4 rounded-full', lane.color)} />
        <p className="text-sm font-semibold text-ink-900">{lane.name}</p>
        <span className="ml-auto font-mono text-micro font-semibold text-ink-500 tnum px-2 py-0.5 bg-paper rounded-pill border-hairline border-ink-200">
          {batches.length}
        </span>
      </div>

      {/* Capacity bar */}
      <div className="mt-2.5 px-1">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-micro font-medium text-ink-500 uppercase tracking-caps">
            Charge cumulée
          </span>
          <span className="font-mono text-tiny font-semibold text-ink-900 tnum">
            {lane.totalLoad}
            <span className="text-ink-500"> / {lane.totalCap} {lane.unit}</span>
          </span>
        </div>
        <div className="h-1 bg-ink-100 rounded-pill overflow-hidden">
          <div
            className={cn('h-full rounded-pill', lane.color)}
            style={{ width: `${Math.min(100, lane.utilization * 100)}%` }}
          />
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto pt-3 flex flex-col gap-2">
        {batches.length === 0 && (
          <div className="text-center py-8 text-tiny text-ink-400">—</div>
        )}
        {batches.map((b) => (
          <BatchCard
            key={b.code}
            batch={b}
            laneColor={lane.color}
            expanded={expanded === b.code}
            onToggle={() => onToggle(b.code)}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────── BatchCard (multi-client) ───────────────────── */

function BatchCard({
  batch,
  laneColor,
  expanded,
  onToggle,
}: {
  batch: Batch;
  laneColor: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const elapsed = minutes(batch.elapsed);
  const total = minutes(batch.total);
  const cyclePct = total > 0 ? Math.min(1, elapsed / total) : 0;

  const totalLoad = batch.contributors.reduce(
    (s, c) => s + (batch.unit === 'kg' ? c.kg : c.pieces),
    0,
  );
  const fillPct = batch.capacity > 0 ? Math.min(1, totalLoad / batch.capacity) : 0;
  const fillTint =
    fillPct >= 0.85 ? 'text-baobab-700' : fillPct >= 0.6 ? 'text-warn-700' : 'text-ink-500';

  return (
    <div
      className={cn(
        'bg-paper border-hairline border-ink-200 rounded-[10px] overflow-hidden transition-shadow',
        batch.suggested && 'border-brand-800 ring-1 ring-brand-100',
        expanded && 'shadow-card',
      )}
    >
      {/* Card top — clickable to expand */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-2.5 cursor-pointer hover:bg-paper-2 transition-colors"
      >
        {/* Code + badges */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="font-mono text-micro font-semibold text-ink-500 tnum">
            {batch.code}
          </span>
          {batch.priority && (
            <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-caps px-1.5 py-0.5 rounded-[4px] bg-terra-100 text-terra-700">
              <Flame className="w-2.5 h-2.5" strokeWidth={2.5} />
              PRIO
            </span>
          )}
          {batch.suggested && (
            <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-caps px-1.5 py-0.5 rounded-[4px] bg-brand-100 text-brand-800">
              <Sparkles className="w-2.5 h-2.5" strokeWidth={2.5} />
              IA
            </span>
          )}
          <span className="ml-auto">
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-ink-400" strokeWidth={1.75} />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-ink-400" strokeWidth={1.75} />
            )}
          </span>
        </div>

        {/* Program + machine */}
        <p className="text-sm font-semibold text-ink-900 truncate">
          {batch.program}
        </p>
        <p className="font-mono text-tiny text-ink-500 truncate">
          {batch.machine}
        </p>

        {/* Stacked contributors bar */}
        <div className="mt-2.5">
          <div className="flex h-2 rounded-pill overflow-hidden bg-ink-100">
            {batch.contributors.map((c, i) => {
              const share = batch.capacity > 0
                ? ((batch.unit === 'kg' ? c.kg : c.pieces) / batch.capacity) * 100
                : 0;
              return (
                <div
                  key={c.client}
                  className={cn('h-full', CLIENT_COLORS[i % CLIENT_COLORS.length])}
                  style={{ width: `${share}%` }}
                  title={`${c.client} · ${batch.unit === 'kg' ? c.kg + ' kg' : c.pieces + ' pcs'}`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-tiny text-ink-500">
              {batch.contributors.length} client{batch.contributors.length > 1 ? 's' : ''}
            </span>
            <span className={cn('font-mono text-tiny font-semibold tnum', fillTint)}>
              {totalLoad}
              <span className="text-ink-500">
                /{batch.capacity} {batch.unit} · {Math.round(fillPct * 100)}%
              </span>
            </span>
          </div>
        </div>

        {/* Cycle progress */}
        <div className="mt-2 pt-2 border-t border-hairline border-ink-200">
          <div className="h-[3px] bg-ink-100 rounded-pill overflow-hidden">
            <div
              className={cn('h-full rounded-pill transition-all', laneColor)}
              style={{ width: `${cyclePct * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono text-micro text-ink-500 tnum">
              {batch.elapsed} / {batch.total}
            </span>
            {fillPct < 0.5 && !batch.suggested && (
              <span className="inline-flex items-center gap-0.5 text-micro text-warn-700">
                <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2} />
                sous-rempli
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded contributors detail */}
      {expanded && (
        <div className="border-t border-hairline border-ink-200 bg-paper-2 px-2.5 py-2 space-y-1">
          <div className="caps mb-1">Contributeurs</div>
          {batch.contributors.map((c, i) => (
            <div key={c.client} className="flex items-center gap-2">
              <span
                className={cn(
                  'w-2 h-2 rounded-sm shrink-0',
                  CLIENT_COLORS[i % CLIENT_COLORS.length],
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-tiny font-semibold text-ink-900 truncate">
                  {c.client}
                </p>
                <p className="font-mono text-micro text-ink-500 tnum">{c.tagPrefix}</p>
              </div>
              <p className="font-mono text-tiny text-ink-900 tnum tabular-nums">
                {batch.unit === 'kg'
                  ? `${c.kg} kg · ${c.pieces} pcs`
                  : `${c.pieces} pcs`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}
