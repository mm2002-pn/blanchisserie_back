import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import productsData from '@/mocks/data/products.json';
import type { Product } from '@/types';

export default function ProductsPage() {
  const { canEdit } = usePermissions();
  const [products] = useState<Product[]>(productsData as any);

  const columns = [
    { header: 'Référence', accessorKey: 'reference' as keyof Product },
    { header: 'Nom', accessorKey: 'name' as keyof Product },
    { header: 'Fournisseur', accessorKey: 'supplier' as keyof Product },
    {
      header: 'Stock actuel',
      accessorKey: 'currentStock' as keyof Product,
      cell: (row: Product) => (
        <Badge variant={row.currentStock <= row.minimumStock ? 'error' : 'success'}>
          {row.currentStock} {row.unit}
        </Badge>
      ),
    },
    {
      header: 'Prix unitaire',
      accessorKey: 'unitPrice' as keyof Product,
      cell: (row: Product) => formatCurrency(row.unitPrice),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">Produits lessiviels</h2>
          <p className="text-gray-600 mt-1">{products.length} produits en stock</p>
        </div>
        {canEdit('settings') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un produit
          </Button>
        )}
      </div>

      <DataTable data={products} columns={columns} />
    </div>
  );
}
