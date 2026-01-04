import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { DataTable } from '@/components/table';
import { Package, AlertTriangle, TrendingDown, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import mock data
import inventoryData from '@/mocks/data/inventory.json';

export default function InventoryPage() {
  const [inventory] = useState(inventoryData);

  // Calculate stock status
  const getStockStatus = (item: typeof inventory[0]) => {
    const stockLevel = (item.currentStock / item.maxStock) * 100;
    if (item.currentStock <= item.minStock) return 'critical';
    if (item.currentStock <= item.reorderPoint) return 'low';
    if (stockLevel >= 80) return 'high';
    return 'normal';
  };

  const getStockBadge = (item: typeof inventory[0]) => {
    const status = getStockStatus(item);
    if (status === 'critical') return { variant: 'error' as const, label: 'Critique' };
    if (status === 'low') return { variant: 'warning' as const, label: 'Bas' };
    if (status === 'high') return { variant: 'success' as const, label: 'Bon' };
    return { variant: 'gray' as const, label: 'Normal' };
  };

  // Columns for inventory table
  const inventoryColumns = [
    {
      header: 'Produit',
      accessorKey: 'productName',
      cell: (row: typeof inventory[0]) => (
        <div>
          <p className="font-medium text-gray-900">{row.productName}</p>
          <p className="text-sm text-gray-500">{row.category}</p>
        </div>
      ),
    },
    {
      header: 'Stock actuel',
      accessorKey: 'currentStock',
      cell: (row: typeof inventory[0]) => {
        const percentage = (row.currentStock / row.maxStock) * 100;
        const badge = getStockBadge(row);
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {row.currentStock} {row.unit}
              </span>
              <Badge variant={badge.variant} className="text-xs">
                {badge.label}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  percentage <= 20 ? 'bg-danger' :
                  percentage <= 40 ? 'bg-warning' :
                  'bg-success'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Min / Max',
      accessorKey: 'minStock',
      cell: (row: typeof inventory[0]) => (
        <div className="text-sm text-gray-600">
          <p>Min: {row.minStock} {row.unit}</p>
          <p>Max: {row.maxStock} {row.unit}</p>
        </div>
      ),
    },
    {
      header: 'Point de commande',
      accessorKey: 'reorderPoint',
      cell: (row: typeof inventory[0]) => (
        <span className="text-sm text-gray-600">
          {row.reorderPoint} {row.unit}
        </span>
      ),
    },
    {
      header: 'Prix unitaire',
      accessorKey: 'unitPrice',
      cell: (row: typeof inventory[0]) => (
        <span className="text-sm text-gray-900 font-medium">
          {formatCurrency(row.unitPrice)}
        </span>
      ),
    },
    {
      header: 'Valeur stock',
      accessorKey: 'value',
      cell: (row: typeof inventory[0]) => (
        <span className="text-sm text-gray-900 font-medium">
          {formatCurrency(row.currentStock * row.unitPrice)}
        </span>
      ),
    },
    {
      header: 'Fournisseur',
      accessorKey: 'supplier',
      cell: (row: typeof inventory[0]) => (
        <span className="text-sm text-gray-600">{row.supplier}</span>
      ),
    },
    {
      header: 'Dernier réappro',
      accessorKey: 'lastRestockDate',
      cell: (row: typeof inventory[0]) => (
        <span className="text-sm text-gray-600">
          {format(new Date(row.lastRestockDate), 'dd/MM/yyyy', { locale: fr })}
        </span>
      ),
    },
  ];

  // Stats
  const totalItems = inventory.length;
  const criticalItems = inventory.filter(item => getStockStatus(item) === 'critical').length;
  const lowStockItems = inventory.filter(item => getStockStatus(item) === 'low').length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);

  // Items needing reorder
  const reorderItems = inventory.filter(item => item.currentStock <= item.reorderPoint);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">Inventaire</h1>
        <p className="text-gray-600 mt-1">Gestion des stocks</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total articles</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <div className="p-3 bg-accent-50 rounded-lg">
              <Package className="w-6 h-6 text-accent-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Stock critique</p>
              <p className="text-2xl font-bold text-danger">{criticalItems}</p>
            </div>
            <div className="p-3 bg-danger-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-danger" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Stock bas</p>
              <p className="text-2xl font-bold text-warning">{lowStockItems}</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <TrendingDown className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Valeur totale</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
            <div className="p-3 bg-success-50 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Reorder Alert */}
      {reorderItems.length > 0 && (
        <Card className="border-warning-200 bg-warning-50">
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-warning-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-warning-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-warning-900 mb-1">
                  Réapprovisionnement nécessaire
                </h3>
                <p className="text-sm text-warning-700 mb-3">
                  {reorderItems.length} article(s) ont atteint ou dépassé leur point de commande
                </p>
                <div className="flex flex-wrap gap-2">
                  {reorderItems.map(item => (
                    <Badge key={item.id} variant="warning">
                      {item.productName} ({item.currentStock} {item.unit})
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="primary" size="sm">
                Créer commande
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stock des produits</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Ajustement
              </Button>
              <Button size="sm">
                + Nouveau produit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={inventory}
            columns={inventoryColumns as any}
          />
        </CardContent>
      </Card>
    </div>
  );
}
