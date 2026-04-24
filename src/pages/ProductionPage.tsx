import { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { DataTable } from '@/components/table';
import {
  Play,
  CheckCircle,
  Clock,
  Boxes,
  Plus,
  Droplet,
  Thermometer,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { formatWeight } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import batchesData from '@/mocks/data/batches.json';
import machinesData from '@/mocks/data/machines.json';

type Tone = 'ok' | 'warn' | 'danger' | 'neutral' | 'brand';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'brand'> = {
  Terminé: 'success',
  'En cours': 'warning',
  'En attente': 'neutral',
  Planifié: 'brand',
};

export default function ProductionPage() {
  const [batches] = useState(batchesData);
  const [machines] = useState(machinesData);

  const getMachineStatus = (machineId: string) => {
    const batch = batches.find(
      (b) => b.machineId === machineId && b.status === 'En cours',
    );
    return batch ? 'En cours' : 'Disponible';
  };

  const activeMachines = batches.filter((b) => b.status === 'En cours').length;
  const completedToday = batches.filter((b) => b.status === 'Terminé').length;
  const pending = batches.filter(
    (b) => b.status === 'En attente' || b.status === 'Planifié',
  ).length;

  const batchColumns = [
    {
      header: 'Lot',
      accessorKey: 'batchNumber' as const,
      cell: (row: typeof batches[0]) => (
        <span className="font-mono text-sm font-semibold text-ink-900 tnum">
          {row.batchNumber}
        </span>
      ),
    },
    {
      header: 'Client',
      accessorKey: 'clientName' as const,
      cell: (row: typeof batches[0]) => (
        <div>
          <p className="text-sm font-semibold text-ink-900">{row.clientName}</p>
          <p className="text-tiny font-mono text-ink-500">{row.orderReference}</p>
        </div>
      ),
    },
    {
      header: 'Machine',
      accessorKey: 'machineReference' as const,
      cell: (row: typeof batches[0]) => (
        <span className="font-mono text-tiny text-ink-700">
          {row.machineReference}
        </span>
      ),
    },
    {
      header: 'Programme',
      accessorKey: 'programName' as const,
      cell: (row: typeof batches[0]) => (
        <span className="text-sm text-ink-700">{row.programName}</span>
      ),
    },
    {
      header: 'Poids',
      accessorKey: 'weight' as const,
      align: 'right' as const,
      cell: (row: typeof batches[0]) => (
        <span className="font-mono text-sm text-ink-900 tnum">
          {formatWeight(row.weight)}
        </span>
      ),
    },
    {
      header: 'Statut',
      accessorKey: 'status' as const,
      cell: (row: typeof batches[0]) => (
        <div className="space-y-1.5">
          <Badge
            variant={(STATUS_VARIANT[row.status] ?? 'neutral') as any}
            dot
          >
            {row.status}
          </Badge>
          {row.status === 'En cours' && row.progress != null && (
            <div className="w-full bg-ink-100 rounded-full h-1">
              <div
                className="bg-warn-600 h-1 rounded-full transition-all"
                style={{ width: `${row.progress}%` }}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Heure',
      accessorKey: 'startTime' as const,
      cell: (row: typeof batches[0]) => (
        <div className="font-mono text-tiny text-ink-700 tnum">
          {row.startTime ? (
            <>
              <p>{format(new Date(row.startTime), 'HH:mm', { locale: fr })}</p>
              {row.estimatedEndTime && row.status === 'En cours' && (
                <p className="text-ink-500">
                  → {format(new Date(row.estimatedEndTime), 'HH:mm', { locale: fr })}
                </p>
              )}
            </>
          ) : (
            '—'
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Production</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            Lots en cours
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Machines et lots de production en temps réel · atelier Dakar Nord
          </p>
        </div>
        <Button size="sm" className="gap-1.5 shrink-0">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Nouveau lot
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Machines actives" value={activeMachines} tint="warn" icon={Play} />
        <Kpi label="Lots terminés" value={completedToday} tint="ok" icon={CheckCircle} />
        <Kpi label="En attente" value={pending} tint="neutral" icon={Clock} />
        <Kpi label="Total lots" value={batches.length} tint="brand" icon={Boxes} />
      </div>

      {/* Machine grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="caps">Parc machines · aujourd'hui</div>
          <Button variant="ghost" size="sm">
            Voir le parc
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {machines.slice(0, 8).map((machine) => {
            const status = getMachineStatus(machine.id);
            const isActive = status === 'En cours';
            const MachineIcon = pickMachineIcon(machine.type);
            return (
              <div
                key={machine.id}
                className={cn(
                  'card-surface p-4',
                  isActive && 'border-warn-600',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-input flex items-center justify-center shrink-0',
                      isActive ? 'bg-warn-100' : 'bg-paper-2',
                    )}
                  >
                    <MachineIcon
                      className={cn(
                        'w-4 h-4',
                        isActive ? 'text-warn-700' : 'text-ink-500',
                      )}
                      strokeWidth={1.75}
                    />
                  </div>
                  <Badge
                    variant={isActive ? 'warning' : 'success'}
                    dot
                  >
                    {status}
                  </Badge>
                </div>
                <p className="font-mono text-sm font-semibold text-ink-900 tnum">
                  {machine.reference}
                </p>
                <p className="text-tiny text-ink-500 truncate mt-0.5">
                  {machine.brand} {machine.model}
                </p>
                <p className="text-micro font-mono text-ink-500 mt-2">
                  {machine.capacity} kg · capacité
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Batches Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="caps">Lots de production · {batches.length}</div>
        </div>
        <DataTable data={batches} columns={batchColumns as any} />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tint,
  icon: Icon,
}: {
  label: string;
  value: number;
  tint: Tone;
  icon: typeof Play;
}) {
  const bg =
    tint === 'ok'
      ? 'bg-ok-100'
      : tint === 'warn'
        ? 'bg-warn-100'
        : tint === 'danger'
          ? 'bg-danger-100'
          : tint === 'brand'
            ? 'bg-brand-100'
            : 'bg-ink-100';
  const fg =
    tint === 'ok'
      ? 'text-ok-700'
      : tint === 'warn'
        ? 'text-warn-700'
        : tint === 'danger'
          ? 'text-danger-600'
          : tint === 'brand'
            ? 'text-brand-800'
            : 'text-ink-500';

  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p className="font-serif text-3xl font-medium tnum tracking-tight text-ink-900 mt-2 leading-none">
            {value}
          </p>
        </div>
        <div
          className={cn(
            'w-9 h-9 rounded-input flex items-center justify-center shrink-0',
            bg,
          )}
        >
          <Icon className={cn('w-4 h-4', fg)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

function pickMachineIcon(type?: string) {
  if (!type) return Wrench;
  const t = type.toLowerCase();
  if (t.includes('laveuse') || t.includes('washing')) return Droplet;
  if (t.includes('sécheuse') || t.includes('secheuse') || t.includes('drying')) return Thermometer;
  if (t.includes('calandre') || t.includes('calandring') || t.includes('presse')) return Sparkles;
  return Wrench;
}
