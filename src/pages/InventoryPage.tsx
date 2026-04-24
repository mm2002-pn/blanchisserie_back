import { useMemo, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { DataTable } from '@/components/table';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  ShoppingCart,
  Plus,
  Search,
  Boxes,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import inventoryData from '@/mocks/data/inventory.json';

type StockStatus = 'critical' | 'low' | 'normal' | 'high';

export default function InventoryPage() {
  const [inventory] = useState(inventoryData);
  const [search, setSearch] = useState('');

  const getStockStatus = (item: typeof inventory[0]): StockStatus => {
    const stockLevel = (item.currentStock / item.maxStock) * 100;
    if (item.currentStock <= item.minStock) return 'critical';
    if (item.currentStock <= item.reorderPoint) return 'low';
    if (stockLevel >= 80) return 'high';
    return 'normal';
  };

  const getStockBadge = (item: typeof inventory[0]) => {
    const status = getStockStatus(item);
    if (status === 'critical')
      return { variant: 'error' as const, label: 'Critique' };
    if (status === 'low') return { variant: 'warning' as const, label: 'Bas' };
    if (status === 'high') return { variant: 'success' as const, label: 'Bon' };
    return { variant: 'neutral' as const, label: 'Normal' };
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((item) =>
      `${item.productName} ${item.category} ${item.supplier}`.toLowerCase().includes(q),
    );
  }, [inventory, search]);

  const totalItems = inventory.length;
  const criticalItems = inventory.filter((i) => getStockStatus(i) === 'critical').length;
  const lowStockItems = inventory.filter((i) => getStockStatus(i) === 'low').length;
  const totalValue = inventory.reduce((s, i) => s + i.currentStock * i.unitPrice, 0);
  const reorderItems = inventory.filter((i) => i.currentStock <= i.reorderPoint);

  const columns = [
    {
      header: 'Produit',
      accessorKey: 'productName' as const,
      cell: (row: typeof inventory[0]) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">
              {row.productName}
            </p>
            <p className="text-tiny text-ink-500 truncate">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Stock',
      accessorKey: 'currentStock' as const,
      cell: (row: typeof inventory[0]) => {
        const pct = Math.min(100, (row.currentStock / row.maxStock) * 100);
        const badge = getStockBadge(row);
        const fill =
          pct <= 20
            ? 'bg-danger-600'
            : pct <= 40
              ? 'bg-warn-600'
              : 'bg-baobab-600';
        return (
          <div className="space-y-1.5 min-w-[180px]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-ink-900 tnum">
                {row.currentStock}
              </span>
              <span className="text-tiny text-ink-500">{row.unit}</span>
              <Badge variant={badge.variant} dot>
                {badge.label}
              </Badge>
            </div>
            <div className="w-full bg-ink-100 rounded-full h-1">
              <div
                className={cn('h-1 rounded-full transition-all', fill)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Min / Max',
      accessorKey: 'minStock' as const,
      cell: (row: typeof inventory[0]) => (
        <div className="font-mono text-tiny text-ink-700 tnum">
          <p>
            <span className="text-ink-500">min</span> {row.minStock} {row.unit}
          </p>
          <p>
            <span className="text-ink-500">max</span> {row.maxStock} {row.unit}
          </p>
        </div>
      ),
    },
    {
      header: 'Commande',
      accessorKey: 'reorderPoint' as const,
      cell: (row: typeof inventory[0]) => (
        <span className="font-mono text-sm text-ink-700 tnum">
          {row.reorderPoint} {row.unit}
        </span>
      ),
    },
    {
      header: 'PU',
      accessorKey: 'unitPrice' as const,
      align: 'right' as const,
      cell: (row: typeof inventory[0]) => (
        <span className="font-mono text-sm text-ink-700 tnum">
          {formatCurrency(row.unitPrice)}
        </span>
      ),
    },
    {
      header: 'Valeur',
      accessorKey: 'value' as keyof typeof inventory[0],
      align: 'right' as const,
      cell: (row: typeof inventory[0]) => (
        <span className="font-mono text-sm font-semibold text-ink-900 tnum">
          {formatCurrency(row.currentStock * row.unitPrice)}
        </span>
      ),
    },
    {
      header: 'Fournisseur',
      accessorKey: 'supplier' as const,
      cell: (row: typeof inventory[0]) => (
        <span className="text-sm text-ink-700">{row.supplier}</span>
      ),
    },
    {
      header: 'Réappro',
      accessorKey: 'lastRestockDate' as const,
      cell: (row: typeof inventory[0]) => (
        <span className="font-mono text-tiny text-ink-500 tnum">
          {format(new Date(row.lastRestockDate), 'dd/MM/yyyy', { locale: fr })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Inventaire</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            Stock consommables
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Lessives, détachants et produits d'entretien · Atelier Dakar Nord
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm">
            Ajustement
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          label="Articles"
          value={`${totalItems}`}
          sub="références en stock"
          tint="brand"
          icon={Boxes}
        />
        <Kpi
          label="Critique"
          value={`${criticalItems}`}
          sub="à commander"
          tint="danger"
          icon={AlertTriangle}
        />
        <Kpi
          label="Stock bas"
          value={`${lowStockItems}`}
          sub="à surveiller"
          tint="warn"
          icon={TrendingDown}
        />
        <Kpi
          label="Valeur"
          value={formatCurrency(totalValue)}
          sub="stock disponible"
          tint="ok"
          icon={ShoppingCart}
          mono
        />
      </div>

      {/* Reorder alert */}
      {reorderItems.length > 0 && (
        <div className="card-surface bg-warn-100 border-warn-600 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-input bg-warn-600 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4 text-paper" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="caps text-warn-700">Réapprovisionnement</p>
                <span className="font-mono text-tiny text-warn-700 tnum">
                  · {reorderItems.length} article{reorderItems.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-ink-900 font-medium mt-1">
                Point de commande atteint sur {reorderItems.length} produit
                {reorderItems.length > 1 ? 's' : ''}.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {reorderItems.slice(0, 6).map((item) => (
                  <Badge key={item.id} variant="warning">
                    {item.productName}
                    <span className="font-mono text-micro text-warn-700 ml-1 tnum">
                      · {item.currentStock} {item.unit}
                    </span>
                  </Badge>
                ))}
                {reorderItems.length > 6 && (
                  <Badge variant="neutral">+{reorderItems.length - 6}</Badge>
                )}
              </div>
            </div>
            <Button size="sm" className="shrink-0">
              Créer commande
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="caps">Stock · {filtered.length} produit{filtered.length > 1 ? 's' : ''}</div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit, un fournisseur…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns as any}
        emptyMessage={
          search ? `Aucun résultat pour « ${search} »` : 'Aucun produit en stock'
        }
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tint,
  icon: Icon,
  mono = false,
}: {
  label: string;
  value: string;
  sub: string;
  tint: 'ok' | 'warn' | 'danger' | 'brand';
  icon: typeof Package;
  mono?: boolean;
}) {
  const bg =
    tint === 'ok'
      ? 'bg-ok-100'
      : tint === 'warn'
        ? 'bg-warn-100'
        : tint === 'danger'
          ? 'bg-danger-100'
          : 'bg-brand-100';
  const fg =
    tint === 'ok'
      ? 'text-ok-700'
      : tint === 'warn'
        ? 'text-warn-700'
        : tint === 'danger'
          ? 'text-danger-600'
          : 'text-brand-800';

  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p
            className={cn(
              'mt-1.5 leading-none tracking-tight text-ink-900',
              mono
                ? 'font-mono text-lg font-semibold tnum'
                : 'font-serif text-3xl font-medium tnum',
            )}
          >
            {value}
          </p>
          <p className="text-tiny text-ink-500 mt-1.5">{sub}</p>
        </div>
        <div
          className={cn(
            'w-9 h-9 rounded-input flex items-center justify-center shrink-0',
            bg,
          )}
        >
          <Icon className={cn('w-4 h-4', fg)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
