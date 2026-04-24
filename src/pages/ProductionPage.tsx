import { useMemo, useState } from 'react';
import { Plus, AlertTriangle, Flame } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { WorkflowTabs } from '@/components/layout/WorkflowTabs';

/**
 * Production page — Kanban board aligned on the AdminWorkflow mockup
 * (5 lanes · batches with code, client, weight, progress, elapsed/total).
 *
 * Part of the "Workflow quotidien" flow : Réception → Triage → Production →
 * Tracking. Each tab is a standalone route.
 */

type Lane = {
  id: number;
  name: string;
  color: string; // tailwind bg class for the accent bar
  dot: string; // tailwind bg class for the progress bar
};

type Batch = {
  lane: number;
  code: string;
  client: string;
  kg: number;
  elapsed: string; // HH:MM
  total: string; // HH:MM
  priority?: boolean;
};

const LANES: Lane[] = [
  { id: 0, name: 'Lavage', color: 'bg-brand-800', dot: 'bg-brand-800' },
  { id: 1, name: 'Séchage', color: 'bg-brand-600', dot: 'bg-brand-600' },
  { id: 2, name: 'Calandrage', color: 'bg-terra-600', dot: 'bg-terra-600' },
  { id: 3, name: 'Pliage', color: 'bg-ok-600', dot: 'bg-ok-600' },
  { id: 4, name: 'Conditionnement', color: 'bg-ink-500', dot: 'bg-ink-500' },
];

const BATCHES: Batch[] = [
  { lane: 0, code: 'B-0408', client: 'Pullman Téranga', kg: 60, elapsed: '00:28', total: '01:00', priority: true },
  { lane: 0, code: 'B-0409', client: 'Radisson Blu', kg: 42, elapsed: '00:12', total: '00:50' },
  { lane: 0, code: 'B-0410', client: 'King Fahd Palace', kg: 58, elapsed: '00:08', total: '01:10' },
  { lane: 0, code: 'B-0411', client: 'Terrou-Bi', kg: 23, elapsed: '00:02', total: '00:45' },
  { lane: 1, code: 'B-0406', client: 'Novotel', kg: 45, elapsed: '00:22', total: '00:40', priority: true },
  { lane: 1, code: 'B-0405', client: 'Onomo', kg: 32, elapsed: '00:15', total: '00:35' },
  { lane: 1, code: 'B-0404', client: 'Résidence Mamoune', kg: 28, elapsed: '00:28', total: '00:40' },
  { lane: 2, code: 'B-0402', client: 'Pullman Téranga', kg: 60, elapsed: '00:14', total: '00:30' },
  { lane: 2, code: 'B-0401', client: 'Radisson Blu', kg: 38, elapsed: '00:08', total: '00:25' },
  { lane: 3, code: 'B-0399', client: 'Terrou-Bi', kg: 23, elapsed: '00:06', total: '00:15' },
  { lane: 3, code: 'B-0398', client: 'Novotel', kg: 45, elapsed: '00:11', total: '00:20' },
  { lane: 3, code: 'B-0397', client: 'Onomo', kg: 32, elapsed: '00:04', total: '00:15' },
  { lane: 4, code: 'B-0395', client: 'Résidence Mamoune', kg: 28, elapsed: '00:03', total: '00:10' },
  { lane: 4, code: 'B-0394', client: 'Pullman Téranga', kg: 60, elapsed: '00:07', total: '00:12' },
];

export default function ProductionPage() {
  const [search] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? BATCHES.filter((b) => `${b.code} ${b.client}`.toLowerCase().includes(q)) : BATCHES;
  }, [search]);

  const byLane = useMemo(() => {
    const m: Record<number, Batch[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    visible.forEach((b) => m[b.lane].push(b));
    return m;
  }, [visible]);

  const totalBatches = BATCHES.length;

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
            · {totalBatches} batches en production
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <WorkflowTabs />
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouveau batch
          </Button>
        </div>
      </div>

      {/* Kanban — scrollable horizontally on narrow screens */}
      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 h-full">
          {LANES.map((lane) => {
            const items = byLane[lane.id] ?? [];
            return (
              <div
                key={lane.id}
                className="bg-paper-2 border-hairline border-ink-200 rounded-card p-3 flex flex-col min-h-[480px]"
              >
                {/* Lane header */}
                <div className="flex items-center gap-2 px-1 pb-2.5 border-b border-hairline border-ink-200">
                  <span className={cn('w-1 h-4 rounded-full', lane.color)} />
                  <p className="text-sm font-semibold text-ink-900">{lane.name}</p>
                  <span className="ml-auto font-mono text-micro font-semibold text-ink-500 tnum px-2 py-0.5 bg-paper rounded-pill border-hairline border-ink-200">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto pt-2.5 flex flex-col gap-2">
                  {items.length === 0 && (
                    <div className="text-center py-8 text-tiny text-ink-400">
                      —
                    </div>
                  )}
                  {items.map((b) => (
                    <BatchCard key={b.code} batch={b} dot={lane.dot} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BatchCard({ batch, dot }: { batch: Batch; dot: string }) {
  const elapsed = minutes(batch.elapsed);
  const total = minutes(batch.total);
  const pct = total > 0 ? Math.min(1, elapsed / total) : 0;

  return (
    <button
      type="button"
      className="bg-paper border-hairline border-ink-200 rounded-[8px] p-2.5 text-left cursor-grab hover:bg-paper-3 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-micro font-semibold text-ink-500 tnum">
          {batch.code}
        </span>
        {batch.priority && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-caps px-1.5 py-0.5 rounded-[4px] bg-terra-100 text-terra-700">
            <Flame className="w-2.5 h-2.5" strokeWidth={2.5} />
            PRIO
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-ink-900 mt-1 truncate">
        {batch.client}
      </p>
      <p className="font-mono text-tiny text-ink-500 tnum mt-0.5">
        {batch.kg} kg
      </p>

      {/* progress bar */}
      <div className="h-[3px] bg-ink-100 rounded-pill mt-2 overflow-hidden">
        <div
          className={cn('h-full rounded-pill transition-all', dot)}
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <p className="font-mono text-micro text-ink-500 tnum">
          {batch.elapsed} / {batch.total}
        </p>
        {pct >= 0.95 && (
          <span className="inline-flex items-center gap-0.5 font-mono text-micro font-semibold text-ok-700 tnum">
            ✓
          </span>
        )}
        {pct < 0.5 && batch.priority && (
          <span className="inline-flex items-center gap-0.5 text-micro text-warn-700">
            <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2} />
          </span>
        )}
      </div>
    </button>
  );
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}
