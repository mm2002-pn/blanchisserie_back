import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import clientsData from '@/mocks/data/clients.json';
import type { Client } from '@/types';

export default function ClientsPage() {
  const { canCreate } = usePermissions();
  const [clients] = useState<Client[]>(clientsData as any);

  const columns = [
    { header: 'Nom', accessorKey: 'name' as keyof Client },
    { header: 'Type', accessorKey: 'type' as keyof Client },
    { header: 'Ville', accessorKey: 'address' as keyof Client },
    { header: 'Contact', accessorKey: 'contactPerson' as keyof Client },
    { header: 'Téléphone', accessorKey: 'phone' as keyof Client },
    {
      header: 'Statut',
      accessorKey: 'isActive' as keyof Client,
      cell: (row: Client) => (
        <Badge variant={row.isActive ? 'success' : 'error'}>
          {row.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">{clients.length} clients enregistrés</p>
        </div>
        {canCreate('clients') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau client
          </Button>
        )}
      </div>

      <DataTable data={clients} columns={columns} />
    </div>
  );
}
