import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatDate, formatWeight } from '@/lib/utils';
import ordersData from '@/mocks/data/orders.json';
import clientsData from '@/mocks/data/clients.json';
import type { Order } from '@/types';

export default function OrdersPage() {
  const { canCreate } = usePermissions();
  const [orders] = useState<Order[]>(ordersData as any);

  const getClientName = (clientId: string) => {
    const client = clientsData.find((c) => c.id === clientId);
    return client?.name || 'Inconnu';
  };

  const columns = [
    { header: 'N° Commande', accessorKey: 'orderNumber' as keyof Order },
    {
      header: 'Client',
      accessorKey: 'clientId' as keyof Order,
      cell: (row: Order) => getClientName(row.clientId),
    },
    {
      header: 'Poids total',
      accessorKey: 'totalWeight' as keyof Order,
      cell: (row: Order) => formatWeight(row.totalWeight),
    },
    {
      header: 'Collecte',
      accessorKey: 'collectionDate' as keyof Order,
      cell: (row: Order) => formatDate(row.collectionDate, 'dd/MM/yyyy'),
    },
    {
      header: 'Livraison',
      accessorKey: 'deliveryDate' as keyof Order,
      cell: (row: Order) => formatDate(row.deliveryDate, 'dd/MM/yyyy'),
    },
    {
      header: 'Statut',
      accessorKey: 'status' as keyof Order,
      cell: (row: Order) => {
        const variants = {
          'En attente': 'gray',
          'Collectée': 'info',
          'En traitement': 'warning',
          'Terminée': 'success',
          'Livrée': 'success',
        } as const;
        return <Badge variant={variants[row.status] || 'gray'}>{row.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Commandes</h1>
          <p className="text-gray-600 mt-1">{orders.length} commandes</p>
        </div>
        {canCreate('orders') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle commande
          </Button>
        )}
      </div>

      <DataTable data={orders} columns={columns} />
    </div>
  );
}
