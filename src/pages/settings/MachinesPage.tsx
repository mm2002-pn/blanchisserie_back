import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatDate } from '@/lib/utils';
import machinesData from '@/mocks/data/machines.json';
import type { Machine } from '@/types';

export default function MachinesPage() {
  const { canEdit } = usePermissions();
  const [machines] = useState<Machine[]>(machinesData as any);

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
          <h2 className="text-2xl font-heading font-bold text-gray-900">Machines et équipements</h2>
          <p className="text-gray-600 mt-1">{machines.length} machines configurées</p>
        </div>
        {canEdit('settings') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une machine
          </Button>
        )}
      </div>

      <DataTable data={machines} columns={columns} />
    </div>
  );
}
