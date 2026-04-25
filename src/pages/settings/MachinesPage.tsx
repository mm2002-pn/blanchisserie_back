import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Droplet,
  Thermometer,
  Sparkles,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { Button, Badge, Modal, Input, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import machinesData from '@/mocks/data/machines.json';
import type { Machine } from '@/types';

const TYPE_ICON: Record<string, typeof Droplet> = {
  Laveuse: Droplet,
  Sécheuse: Thermometer,
  Presse: Sparkles,
  Calandre: Sparkles,
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  Active: 'success',
  'En maintenance': 'warning',
  'Hors service': 'error',
  Disponible: 'success',
};

export default function MachinesPage() {
  const { canEdit } = usePermissions();
  const [machines] = useState<Machine[]>(machinesData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return machines;
    return machines.filter((m) =>
      `${m.reference} ${m.brand} ${m.model} ${m.type} ${m.location}`
        .toLowerCase()
        .includes(q),
    );
  }, [machines, search]);

  const stats = useMemo(() => {
    const active = machines.filter((m) => m.status === 'Active').length;
    const maintenance = machines.filter((m) => m.status === 'En maintenance').length;
    const hs = machines.filter((m) => m.status === 'Hors service').length;
    const totalCap = machines.reduce((s, m) => s + (m.capacity ?? 0), 0);
    return { active, maintenance, hs, totalCap };
  }, [machines]);

  /**
   * Charge actuelle simulée par machine (en réalité = somme des batches affectés).
   * Mock déterministe basé sur l'id.
   */
  const currentLoad = (m: Machine) => {
    if (m.status !== 'Active') return 0;
    const seed = (m.reference?.length ?? 0) + (m.capacity ?? 0);
    const ratio = 0.55 + ((seed * 13) % 50) / 100; // entre 0.55 et 1.05
    return Math.round((m.capacity ?? 0) * Math.min(1.05, ratio));
  };

  /** Indicateur global : déficit selon le CDC */
  const totalActive = machines
    .filter((m) => m.status === 'Active')
    .reduce((s, m) => s + (m.capacity ?? 0), 0);
  const totalLoad = machines.reduce((s, m) => s + currentLoad(m), 0);
  const utilization = totalActive > 0 ? totalLoad / totalActive : 0;
  const deficit = utilization > 1;

  const columns = [
    {
      header: 'Référence',
      accessorKey: 'reference' as keyof Machine,
      cell: (row: Machine) => {
        const Icon = TYPE_ICON[row.type ?? ''] ?? Wrench;
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold text-ink-900 tnum">
                {row.reference}
              </p>
              <p className="text-tiny text-ink-500 truncate">
                {row.brand} {row.model}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Type',
      accessorKey: 'type' as keyof Machine,
      cell: (row: Machine) => (
        <Badge variant={row.type === 'Laveuse' ? 'info' : 'success'}>
          {row.type}
        </Badge>
      ),
    },
    {
      header: 'Capacité',
      accessorKey: 'capacity' as keyof Machine,
      align: 'right' as const,
      cell: (row: Machine) => (
        <span className="font-mono text-sm text-ink-900 tnum">
          {row.capacity}
          <span className="text-ink-500"> kg</span>
        </span>
      ),
    },
    {
      header: 'Charge',
      accessorKey: 'reference' as keyof Machine,
      cell: (row: Machine) => {
        const load = currentLoad(row);
        const cap = row.capacity ?? 0;
        const pct = cap > 0 ? Math.min(1, load / cap) : 0;
        const fillCls =
          pct >= 0.9
            ? 'bg-danger-600'
            : pct >= 0.7
              ? 'bg-baobab-600'
              : pct >= 0.4
                ? 'bg-warn-600'
                : 'bg-ink-300';
        return (
          <div className="space-y-1 min-w-[110px]">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-tiny font-semibold text-ink-900 tnum">
                {load}
                <span className="text-ink-500">/{cap} kg</span>
              </span>
              <span className="font-mono text-micro text-ink-500 tnum">
                {Math.round(pct * 100)}%
              </span>
            </div>
            <div className="h-1 bg-ink-100 rounded-pill overflow-hidden">
              <div
                className={cn('h-full rounded-pill', fillCls)}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Emplacement',
      accessorKey: 'location' as keyof Machine,
      cell: (row: Machine) => (
        <span className="text-sm text-ink-700">{row.location}</span>
      ),
    },
    {
      header: 'Statut',
      accessorKey: 'status' as keyof Machine,
      cell: (row: Machine) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? 'neutral'} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Dernière maint.',
      accessorKey: 'lastMaintenance' as keyof Machine,
      cell: (row: Machine) => (
        <span className="font-mono text-tiny text-ink-500 tnum">
          {row.lastMaintenance
            ? formatDate(row.lastMaintenance, 'dd/MM/yyyy')
            : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Machines & équipements</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {machines.length}
            <span className="text-ink-500 text-lg ml-2 font-normal">
              machines configurées
            </span>
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Parc industriel : laveuses, sécheuses, calandres et presses.
          </p>
        </div>
        {canEdit('settings') && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Ajouter une machine
          </Button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MachineKpi label="Actives" value={`${stats.active}`} tint="ok" />
        <MachineKpi label="En maintenance" value={`${stats.maintenance}`} tint="warn" />
        <MachineKpi label="Hors service" value={`${stats.hs}`} tint="danger" />
        <MachineKpi
          label="Capacité totale"
          value={`${stats.totalCap} kg`}
          tint="brand"
          mono
        />
      </div>

      {/* Capacité atelier — déficit ou OK */}
      <div
        className={cn(
          'card-surface p-4 flex items-start gap-3',
          deficit
            ? 'bg-danger-100 border-danger-600'
            : utilization > 0.85
              ? 'bg-warn-100 border-warn-600'
              : 'bg-ok-100 border-ok-600',
        )}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-input flex items-center justify-center shrink-0',
            deficit
              ? 'bg-danger-600 text-paper'
              : utilization > 0.85
                ? 'bg-warn-600 text-paper'
                : 'bg-ok-600 text-paper',
          )}
        >
          <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'caps',
              deficit
                ? 'text-danger-600'
                : utilization > 0.85
                  ? 'text-warn-700'
                  : 'text-ok-700',
            )}
          >
            Capacité atelier · charge actuelle
          </p>
          <p className="text-sm text-ink-900 font-medium mt-1">
            <span className="font-mono font-semibold tnum">
              {totalLoad} / {totalActive} kg
            </span>{' '}
            ({Math.round(utilization * 100)} %)
            {deficit && (
              <span className="text-danger-600 font-semibold">
                {' · déficit de '}
                <span className="font-mono tnum">
                  {totalLoad - totalActive} kg
                </span>{' '}
                — redistribuer ou activer une machine en stand-by
              </span>
            )}
            {!deficit && utilization > 0.85 && ' · saturation imminente'}
            {!deficit && utilization <= 0.85 && ' · marge confortable'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-serif text-3xl font-medium tnum tracking-tight text-ink-900 leading-none">
            {Math.round(utilization * 100)}
            <span className="text-ink-500 text-base">%</span>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="caps">Parc · {filtered.length}</div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une machine, une marque…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        emptyMessage={
          search ? `Aucun résultat pour « ${search} »` : 'Aucune machine'
        }
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle machine"
        subtitle="Référence, type, capacité et emplacement"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Référence" placeholder="LAV-001" required />
            <Select
              label="Type"
              options={[
                { label: 'Laveuse', value: 'Laveuse' },
                { label: 'Sécheuse', value: 'Sécheuse' },
                { label: 'Calandre', value: 'Calandre' },
                { label: 'Presse', value: 'Presse' },
              ]}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Marque" placeholder="Primus" required />
            <Input label="Modèle" placeholder="FX600" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacité (kg)" type="number" placeholder="60" required />
            <Input label="Emplacement" placeholder="Zone lavage A" required />
          </div>
          <Select
            label="Statut"
            options={[
              { label: 'Active', value: 'Active' },
              { label: 'En maintenance', value: 'En maintenance' },
              { label: 'Hors service', value: 'Hors service' },
            ]}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter la machine</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MachineKpi({
  label,
  value,
  tint,
  mono = false,
}: {
  label: string;
  value: string;
  tint: 'ok' | 'warn' | 'danger' | 'brand';
  mono?: boolean;
}) {
  const bg =
    tint === 'ok'
      ? 'bg-ok-100'
      : tint === 'warn'
        ? 'bg-warn-100'
        : tint === 'danger'
          ? 'bg-danger-100'
          : 'bg-brand-100';
  const fg =
    tint === 'ok'
      ? 'text-ok-700'
      : tint === 'warn'
        ? 'text-warn-700'
        : tint === 'danger'
          ? 'text-danger-600'
          : 'text-brand-800';

  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p
            className={cn(
              'mt-1.5 leading-none tracking-tight text-ink-900',
              mono
                ? 'font-mono text-lg font-semibold tnum'
                : 'font-serif text-2xl font-medium tnum',
            )}
          >
            {value}
          </p>
        </div>
        <div className={cn('w-2 h-12 rounded-full', bg)}>
          <div className={cn('h-full w-full rounded-full opacity-100', fg.replace('text-', 'bg-'))} />
        </div>
      </div>
    </div>
  );
}
