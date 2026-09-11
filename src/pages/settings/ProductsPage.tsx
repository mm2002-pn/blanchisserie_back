import { useMemo, useState } from 'react';
import { Plus, Search, Droplet, AlertTriangle, Boxes } from 'lucide-react';
import { Button, Modal, Input, Select } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import productsData from '@/mocks/data/products.json';
import type { Product } from '@/types';

export default function ProductsPage() {
  const { canEdit } = usePermissions();
  const [products] = useState<Product[]>(productsData as any);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.reference} ${p.name} ${p.supplier}`.toLowerCase().includes(q),
    );
  }, [products, search]);

  const lowStock = products.filter((p) => p.currentStock <= p.minimumStock).length;
  const totalValue = products.reduce(
    (s, p) => s + (p.currentStock ?? 0) * (p.unitPrice ?? 0),
    0,
  );

  const columns = [
    {
      header: 'Produit',
      accessorKey: 'name' as keyof Product,
      cell: (row: Product) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
            <Droplet className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">{row.name}</p>
            <p className="font-mono text-tiny text-ink-500 tnum">{row.reference}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Fournisseur',
      accessorKey: 'supplier' as keyof Product,
      cell: (row: Product) => (
        <span className="text-sm text-ink-700">{row.supplier}</span>
      ),
    },
    {
      header: 'Stock',
      accessorKey: 'currentStock' as keyof Product,
      align: 'right' as const,
      cell: (row: Product) => {
        const isLow = row.currentStock <= row.minimumStock;
        return (
          <div className="inline-flex items-center gap-2">
            {isLow && (
              <AlertTriangle className="w-3.5 h-3.5 text-danger-600" strokeWidth={2} />
            )}
            <span
              className={cn(
                'font-mono text-sm font-semibold tnum',
                isLow ? 'text-danger-600' : 'text-ink-900',
              )}
            >
              {row.currentStock}
              <span
                className={cn(
                  'font-normal',
                  isLow ? 'text-danger-600' : 'text-ink-500',
                )}
              >
                {' '}
                {row.unit}
              </span>
            </span>
          </div>
        );
      },
    },
    {
      header: 'Minimum',
      accessorKey: 'minimumStock' as keyof Product,
      align: 'right' as const,
      cell: (row: Product) => (
        <span className="font-mono text-tiny text-ink-500 tnum">
          {row.minimumStock} {row.unit}
        </span>
      ),
    },
    {
      header: 'Prix unitaire',
      accessorKey: 'unitPrice' as keyof Product,
      align: 'right' as const,
      cell: (row: Product) => (
        <span className="font-mono text-sm text-ink-900 tnum">
          {formatCurrency(row.unitPrice)}
        </span>
      ),
    },
    {
      header: 'Valeur stock',
      accessorKey: 'reference' as keyof Product,
      align: 'right' as const,
      cell: (row: Product) => (
        <span className="font-mono text-sm font-semibold text-ink-900 tnum">
          {formatCurrency(row.currentStock * row.unitPrice)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Produits lessiviels</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {products.length}
            <span className="text-ink-500 text-lg ml-2 font-normal">
              produits en stock
            </span>
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Lessives, adoucissants, détachants et autres consommables.
          </p>
        </div>
        {canEdit('settings') && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Ajouter un produit
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PStat label="Références" value={`${products.length}`} icon={Boxes} tint="brand" />
        <PStat
          label="Stock bas"
          value={`${lowStock}`}
          icon={AlertTriangle}
          tint={lowStock > 0 ? 'danger' : 'ok'}
          sub={lowStock > 0 ? 'à commander' : 'tout est bon'}
        />
        <PStat label="Valeur stock" value={formatCurrency(totalValue)} icon={Droplet} tint="ok" mono />
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="caps">Catalogue · {filtered.length}</div>
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
        columns={columns}
        emptyMessage={search ? `Aucun résultat pour « ${search} »` : 'Aucun produit'}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau produit"
        subtitle="Référence, stock et prix unitaire"
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
          <Input label="Prix unitaire (F CFA)" type="number" placeholder="5000" required />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter le produit</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PStat({
  label,
  value,
  icon: Icon,
  tint,
  sub,
  mono = false,
}: {
  label: string;
  value: string;
  icon: typeof Boxes;
  tint: 'brand' | 'ok' | 'warn' | 'danger';
  sub?: string;
  mono?: boolean;
}) {
  const bg =
    tint === 'brand'
      ? 'bg-brand-100'
      : tint === 'ok'
        ? 'bg-ok-100'
        : tint === 'warn'
          ? 'bg-warn-100'
          : 'bg-danger-100';
  const fg =
    tint === 'brand'
      ? 'text-brand-800'
      : tint === 'ok'
        ? 'text-ok-700'
        : tint === 'warn'
          ? 'text-warn-700'
          : 'text-danger-600';

  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p
            className={cn(
              'mt-1.5 leading-none tracking-tight text-ink-900',
              mono
                ? 'font-mono text-lg font-semibold tnum'
                : 'font-serif text-2xl font-medium tnum',
            )}
          >
            {value}
          </p>
          {sub && <p className="text-tiny text-ink-500 mt-1.5">{sub}</p>}
        </div>
        <div className={cn('w-9 h-9 rounded-input flex items-center justify-center shrink-0', bg)}>
          <Icon className={cn('w-4 h-4', fg)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
