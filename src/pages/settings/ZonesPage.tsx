import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge, Modal, Input, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import zonesData from '@/mocks/data/zones.json';
import type { Zone } from '@/types';

export default function ZonesPage() {
  const { canEdit } = usePermissions();
  const [zones] = useState<Zone[]>(zonesData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'Nom', accessorKey: 'name' as keyof Zone },
    {
      header: 'Type',
      accessorKey: 'type' as keyof Zone,
      cell: (row: Zone) => (
        <Badge variant={row.type === 'propre' ? 'success' : row.type === 'sale' ? 'error' : 'warning'}>
          {row.type}
        </Badge>
      ),
    },
    { header: 'Règles d\'accès', accessorKey: 'accessRules' as keyof Zone },
    {
      header: 'Équipements',
      accessorKey: 'equipment' as keyof Zone,
      cell: (row: Zone) => `${row.equipment.length} machine(s)`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-ink-900">Zones et emplacements</h2>
          <p className="text-ink-500 mt-1">{zones.length} zones configurées</p>
        </div>
        {canEdit('settings') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une zone
          </Button>
        )}
      </div>

      <DataTable data={zones} columns={columns} />

      {/* Modal d'ajout */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle zone"
        size="lg"
      >
        <form className="space-y-4">
          <Input label="Nom de la zone" placeholder="Zone de lavage" required />

          <Select
            label="Type de zone"
            options={[
              { label: 'Propre', value: 'propre' },
              { label: 'Sale', value: 'sale' },
              { label: 'Transition', value: 'transition' },
            ]}
            required
          />

          <Input label="Règles d'accès" placeholder="Accès réservé au personnel autorisé" />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
