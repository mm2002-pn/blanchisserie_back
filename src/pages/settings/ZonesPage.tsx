import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import zonesData from '@/mocks/data/zones.json';
import type { Zone } from '@/types';

export default function ZonesPage() {
  const { canEdit } = usePermissions();
  const [zones] = useState<Zone[]>(zonesData as any);

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
          <h2 className="text-2xl font-heading font-bold text-gray-900">Zones et emplacements</h2>
          <p className="text-gray-600 mt-1">{zones.length} zones configurées</p>
        </div>
        {canEdit('settings') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une zone
          </Button>
        )}
      </div>

      <DataTable data={zones} columns={columns} />
    </div>
  );
}
