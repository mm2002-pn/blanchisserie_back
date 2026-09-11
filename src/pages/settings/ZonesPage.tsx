import { useMemo, useState } from 'react';
import { Plus, MapPin, ShieldAlert } from 'lucide-react';
import { Button, Badge, Modal, Input, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { cn } from '@/lib/utils';
import zonesData from '@/mocks/data/zones.json';
import type { Zone } from '@/types';

const TYPE_VARIANT: Record<string, 'success' | 'error' | 'warning' | 'neutral'> = {
  propre: 'success',
  sale: 'error',
  transition: 'warning',
};

const TYPE_ICON_BG: Record<string, string> = {
  propre: 'bg-ok-100 text-ok-700',
  sale: 'bg-danger-100 text-danger-600',
  transition: 'bg-warn-100 text-warn-700',
};

export default function ZonesPage() {
  const { canEdit } = usePermissions();
  const [zones] = useState<Zone[]>(zonesData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const counts = useMemo(() => {
    return zones.reduce(
      (acc, z) => {
        acc[z.type] = (acc[z.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [zones]);

  const columns = [
    {
      header: 'Zone',
      accessorKey: 'name' as keyof Zone,
      cell: (row: Zone) => (
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-9 h-9 rounded-input flex items-center justify-center shrink-0',
              TYPE_ICON_BG[row.type] ?? 'bg-paper-2',
            )}
          >
            <MapPin className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold text-ink-900">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type' as keyof Zone,
      cell: (row: Zone) => (
        <Badge variant={TYPE_VARIANT[row.type] ?? 'neutral'} dot>
          {row.type}
        </Badge>
      ),
    },
    {
      header: "Règles d'accès",
      accessorKey: 'accessRules' as keyof Zone,
      cell: (row: Zone) => (
        <div className="flex items-center gap-2 max-w-md">
          <ShieldAlert className="w-3.5 h-3.5 text-ink-500 shrink-0" strokeWidth={1.75} />
          <span className="text-sm text-ink-700 truncate">{row.accessRules}</span>
        </div>
      ),
    },
    {
      header: 'Équipements',
      accessorKey: 'equipment' as keyof Zone,
      align: 'right' as const,
      cell: (row: Zone) => (
        <span className="font-mono text-sm text-ink-900 tnum">
          {row.equipment.length}
          <span className="text-ink-500"> machine{row.equipment.length > 1 ? 's' : ''}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Zones & emplacements</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {zones.length}
            <span className="text-ink-500 text-lg ml-2 font-normal">
              zones configurées
            </span>
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Séparation propre / sale / transition pour la traçabilité de l'hygiène.
          </p>
        </div>
        {canEdit('settings') && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Ajouter une zone
          </Button>
        )}
      </div>

      {/* Type strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TypeTile label="Zones propres" count={counts.propre ?? 0} variant="success" />
        <TypeTile label="Zones sales" count={counts.sale ?? 0} variant="error" />
        <TypeTile label="Zones transition" count={counts.transition ?? 0} variant="warning" />
      </div>

      <DataTable data={zones} columns={columns} />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle zone"
        subtitle="Nom, type (propre / sale / transition) et règles d'accès"
        size="lg"
      >
        <form className="space-y-4">
          <Input label="Nom de la zone" placeholder="Zone de lavage A" required />
          <Select
            label="Type de zone"
            options={[
              { label: 'Propre', value: 'propre' },
              { label: 'Sale', value: 'sale' },
              { label: 'Transition', value: 'transition' },
            ]}
            required
          />
          <Input
            label="Règles d'accès"
            placeholder="Accès réservé au personnel autorisé"
            hint="Affiché sur la porte et le terminal de badge"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter la zone</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TypeTile({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: 'success' | 'error' | 'warning';
}) {
  const tintBg =
    variant === 'success' ? 'bg-ok-100' : variant === 'error' ? 'bg-danger-100' : 'bg-warn-100';
  const tintFg =
    variant === 'success' ? 'text-ok-700' : variant === 'error' ? 'text-danger-600' : 'text-warn-700';

  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p className="font-serif text-2xl font-medium tnum tracking-tight text-ink-900 mt-1.5 leading-none">
            {count}
          </p>
        </div>
        <div className={cn('w-9 h-9 rounded-input flex items-center justify-center', tintBg)}>
          <MapPin className={cn('w-4 h-4', tintFg)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
