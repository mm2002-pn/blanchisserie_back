import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge, Modal, Input, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatDate } from '@/lib/utils';
import machinesData from '@/mocks/data/machines.json';
import type { Machine } from '@/types';

export default function MachinesPage() {
  const { canEdit } = usePermissions();
  const [machines] = useState<Machine[]>(machinesData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'Référence', accessorKey: 'reference' as keyof Machine },
    {
      header: 'Type',
      accessorKey: 'type' as keyof Machine,
      cell: (row: Machine) => (
        <Badge variant={row.type === 'Laveuse' ? 'info' : 'success'}>{row.type}</Badge>
      ),
    },
    {
      header: 'Marque/Modèle',
      accessorKey: 'brand' as keyof Machine,
      cell: (row: Machine) => `${row.brand} ${row.model}`,
    },
    {
      header: 'Capacité',
      accessorKey: 'capacity' as keyof Machine,
      cell: (row: Machine) => `${row.capacity} kg`,
    },
    { header: 'Localisation', accessorKey: 'location' as keyof Machine },
    {
      header: 'Statut',
      accessorKey: 'status' as keyof Machine,
      cell: (row: Machine) => (
        <Badge
          variant={
            row.status === 'Active'
              ? 'success'
              : row.status === 'En maintenance'
              ? 'warning'
              : 'error'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Dernière maintenance',
      accessorKey: 'lastMaintenance' as keyof Machine,
      cell: (row: Machine) => (row.lastMaintenance ? formatDate(row.lastMaintenance, 'dd/MM/yyyy') : '-'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-ink-900">Machines et équipements</h2>
          <p className="text-ink-500 mt-1">{machines.length} machines configurées</p>
        </div>
        {canEdit('settings') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une machine
          </Button>
        )}
      </div>

      <DataTable data={machines} columns={columns} />

      {/* Modal d'ajout */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle machine"
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
                { label: 'Presse', value: 'Presse' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Marque" placeholder="Electrolux" required />
            <Input label="Modèle" placeholder="W4850H" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacité (kg)" type="number" placeholder="50" required />
            <Input label="Emplacement" placeholder="Zone 1" required />
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
