import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Droplet,
  Thermometer,
  Sparkles,
  Wrench,
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
