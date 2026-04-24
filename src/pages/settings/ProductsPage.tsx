import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge, Modal, Input, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import productsData from '@/mocks/data/products.json';
import type { Product } from '@/types';

export default function ProductsPage() {
  const { canEdit } = usePermissions();
  const [products] = useState<Product[]>(productsData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un produit
          </Button>
        )}
      </div>

      <DataTable data={products} columns={columns} />

      {/* Modal d'ajout */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau produit"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Référence" placeholder="DET-001" required />
            <Input label="Nom" placeholder="Détergent liquide" required />
          </div>

          <Input label="Fournisseur" placeholder="ChimieClean" required />

          <div className="grid grid-cols-3 gap-4">
            <Input label="Stock actuel" type="number" placeholder="100" required />
            <Input label="Stock minimum" type="number" placeholder="20" required />
            <Select
              label="Unité"
              options={[
                { label: 'Litre', value: 'litre' },
                { label: 'Kg', value: 'kg' },
                { label: 'Bidon', value: 'bidon' },
              ]}
              required
            />
          </div>

          <Input label="Prix unitaire (XOF)" type="number" placeholder="5000" required />

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
