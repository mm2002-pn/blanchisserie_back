import { useMemo, useState } from 'react';
import { Plus, Search, Droplet, Thermometer, Wind } from 'lucide-react';
import { Button, Modal, Input, Select, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { cn } from '@/lib/utils';
import programsData from '@/mocks/data/washingPrograms.json';
import type { WashingProgram } from '@/types';

export default function WashingProgramsPage() {
  const { canEdit } = usePermissions();
  const [programs] = useState<WashingProgram[]>(programsData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) =>
      `${p.code} ${p.name} ${p.detergentType}`.toLowerCase().includes(q),
    );
  }, [programs, search]);

  const avgTemp = programs.reduce((s, p) => s + (p.temperature ?? 0), 0) / (programs.length || 1);
  const avgDuration = programs.reduce((s, p) => s + (p.duration ?? 0), 0) / (programs.length || 1);

  const columns = [
    {
      header: 'Code',
      accessorKey: 'code' as keyof WashingProgram,
      cell: (row: WashingProgram) => (
        <span className="font-mono text-sm font-semibold text-ink-900 tnum">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Programme',
      accessorKey: 'name' as keyof WashingProgram,
      cell: (row: WashingProgram) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-input bg-brand-100 flex items-center justify-center shrink-0">
            <Droplet className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold text-ink-900">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Température',
      accessorKey: 'temperature' as keyof WashingProgram,
      align: 'right' as const,
      cell: (row: WashingProgram) => {
        const temp = row.temperature ?? 0;
        const tint = temp >= 60 ? 'text-terra-700' : temp >= 40 ? 'text-warn-700' : 'text-brand-800';
        return (
          <span className={cn('font-mono text-sm font-semibold tnum', tint)}>
            {temp}°C
          </span>
        );
      },
    },
    {
      header: 'Durée',
      accessorKey: 'duration' as keyof WashingProgram,
      align: 'right' as const,
      cell: (row: WashingProgram) => (
        <span className="font-mono text-sm text-ink-900 tnum">
          {row.duration}
          <span className="text-ink-500"> min</span>
        </span>
      ),
    },
    {
      header: 'Essorage',
      accessorKey: 'spinLevel' as keyof WashingProgram,
      align: 'right' as const,
      cell: (row: WashingProgram) => (
        <span className="font-mono text-sm text-ink-700 tnum">
          {row.spinLevel}
          <span className="text-ink-500"> tr/min</span>
        </span>
      ),
    },
    {
      header: 'Lessive',
      accessorKey: 'detergentType' as keyof WashingProgram,
      cell: (row: WashingProgram) => (
        <Badge
          variant={
            row.detergentType === 'écologique'
              ? 'success'
              : row.detergentType === 'hypoallergénique'
                ? 'info'
                : 'neutral'
          }
        >
          {row.detergentType}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Programmes de lavage</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {programs.length}
            <span className="text-ink-500 text-lg ml-2 font-normal">
              programmes configurés
            </span>
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Cycles de lavage définis par température, durée, essorage et lessive.
          </p>
        </div>
        {canEdit('settings') && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouveau programme
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ProgStat label="Programmes" value={`${programs.length}`} icon={Droplet} tint="brand" />
        <ProgStat label="Température moyenne" value={`${avgTemp.toFixed(0)}°C`} icon={Thermometer} tint="terra" mono />
        <ProgStat label="Durée moyenne" value={`${avgDuration.toFixed(0)} min`} icon={Wind} tint="ok" mono />
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="caps">Catalogue · {filtered.length}</div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un programme…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        emptyMessage={search ? `Aucun résultat pour « ${search} »` : 'Aucun programme'}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau programme de lavage"
        subtitle="Température, durée, essorage et consommation"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Code" placeholder="PROG-001" required />
            <Input label="Nom" placeholder="Coton blanc 60°C" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Température (°C)" type="number" placeholder="60" required />
            <Input label="Durée (min)" type="number" placeholder="90" required />
            <Input label="Essorage (rpm)" type="number" placeholder="1200" required />
          </div>
          <Input label="Consommation d'eau (L)" type="number" placeholder="150" required />
          <Select
            label="Type de détergent"
            options={[
              { label: 'Standard', value: 'standard' },
              { label: 'Hypoallergénique', value: 'hypoallergénique' },
              { label: 'Écologique', value: 'écologique' },
            ]}
            required
          />
          <Input label="Description" placeholder="Programme pour linge blanc en coton…" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer le programme</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ProgStat({
  label,
  value,
  icon: Icon,
  tint,
  mono = false,
}: {
  label: string;
  value: string;
  icon: typeof Droplet;
  tint: 'brand' | 'terra' | 'ok';
  mono?: boolean;
}) {
  const bg =
    tint === 'brand' ? 'bg-brand-100' : tint === 'terra' ? 'bg-terra-100' : 'bg-ok-100';
  const fg =
    tint === 'brand' ? 'text-brand-800' : tint === 'terra' ? 'text-terra-700' : 'text-ok-700';

  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
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
        <div className={cn('w-9 h-9 rounded-input flex items-center justify-center shrink-0', bg)}>
          <Icon className={cn('w-4 h-4', fg)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
