import { useMemo, useState } from 'react';
import { Plus, Search, Filter, Building2, ChevronRight } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { formatDate, formatWeight } from '@/lib/utils';
import { cn } from '@/lib/utils';
import ordersData from '@/mocks/data/orders.json';
import clientsData from '@/mocks/data/clients.json';
import type { Order } from '@/types';

/** Mapping "Statut FR" → variantes Badge */
const STATUS_VARIANT = {
  'En attente': 'neutral',
  'Confirmée': 'info',
  'Collectée': 'info',
  'Réceptionnée': 'warning',
  'En production': 'warning',
  'En traitement': 'warning',
  Terminée: 'success',
  'Prête': 'success',
  'Livrée': 'success',
  'Annulée': 'error',
} as const;

type StatusKey = keyof typeof STATUS_VARIANT;

const FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: 'all', label: 'Toutes', match: () => true },
  { key: 'pending', label: 'En attente', match: (s) => s === 'En attente' || s === 'Confirmée' },
  { key: 'in-progress', label: 'En cours', match: (s) => ['Collectée', 'Réceptionnée', 'En production', 'En traitement'].includes(s) },
  { key: 'done', label: 'Livrées', match: (s) => s === 'Livrée' || s === 'Terminée' },
  { key: 'cancelled', label: 'Annulées', match: (s) => s === 'Annulée' },
];

export default function OrdersPage() {
  const [orders] = useState<Order[]>(ordersData as any);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const getClientName = (clientId: string) => {
    const client = clientsData.find((c) => c.id === clientId);
    return client?.name || 'Inconnu';
  };

  const filtered = useMemo(() => {
    const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (!active.match(o.status)) return false;
      if (!q) return true;
      const hay = `${o.orderNumber} ${getClientName(o.clientId)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [orders, filter, search]);

  const countByKey = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.key, orders.filter((o) => f.match(o.status)).length]),
      ),
    [orders],
  );

  const columns = [
    {
      header: 'N° commande',
      accessorKey: 'orderNumber' as keyof Order,
      cell: (row: Order) => (
        <span className="font-mono text-sm font-medium text-ink-900 tnum">
          {row.orderNumber}
        </span>
      ),
    },
    {
      header: 'Client',
      accessorKey: 'clientId' as keyof Order,
      cell: (row: Order) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-brand-800" strokeWidth={1.75} />
          </div>
          <span className="text-sm text-ink-900 font-medium">
            {getClientName(row.clientId)}
          </span>
        </div>
      ),
    },
    {
      header: 'Poids',
      accessorKey: 'totalWeight' as keyof Order,
      align: 'right' as const,
      cell: (row: Order) => (
        <span className="font-mono text-sm text-ink-900 tnum">
          {formatWeight(row.totalWeight)}
        </span>
      ),
    },
    {
      header: 'Collecte',
      accessorKey: 'collectionDate' as keyof Order,
      cell: (row: Order) => (
        <span className="font-mono text-sm text-ink-700 tnum">
          {formatDate(row.collectionDate, 'dd/MM/yyyy')}
        </span>
      ),
    },
    {
      header: 'Livraison',
      accessorKey: 'deliveryDate' as keyof Order,
      cell: (row: Order) => (
        <span className="font-mono text-sm text-ink-700 tnum">
          {formatDate(row.deliveryDate, 'dd/MM/yyyy')}
        </span>
      ),
    },
    {
      header: 'Statut',
      accessorKey: 'status' as keyof Order,
      cell: (row: Order) => (
        <Badge
          variant={(STATUS_VARIANT[row.status as StatusKey] ?? 'neutral') as any}
          dot
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: '',
      accessorKey: 'id' as keyof Order,
      align: 'right' as const,
      cell: () => (
        <ChevronRight className="w-4 h-4 text-ink-400 inline" strokeWidth={1.75} />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Commandes</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            {orders.length}
            <span className="text-ink-500 text-xl ml-2 font-normal">
              commandes · avril 2026
            </span>
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Gère le cycle complet de chaque commande, de la collecte à la facturation.
          </p>
        </div>
        <Button size="sm" className="gap-1.5 shrink-0">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Nouvelle commande
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="En attente" value={countByKey.pending ?? 0} tint="neutral" />
        <KpiTile label="En cours" value={countByKey['in-progress'] ?? 0} tint="warning" />
        <KpiTile label="Livrées" value={countByKey.done ?? 0} tint="success" />
        <KpiTile label="Annulées" value={countByKey.cancelled ?? 0} tint="danger" />
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-tiny font-semibold transition-colors border-hairline',
                  active
                    ? 'bg-brand-800 text-paper border-brand-800'
                    : 'bg-paper text-ink-700 border-ink-200 hover:bg-paper-2',
                )}
              >
                {f.label}
                <span
                  className={cn(
                    'font-mono tnum',
                    active ? 'text-brand-100' : 'text-ink-400',
                  )}
                >
                  {countByKey[f.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un n° ou un client…"
              className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
            />
          </div>
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Filter className="w-3.5 h-3.5" strokeWidth={1.75} />
            Filtres
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        onRowClick={() => {
          /* navigate to order-details when available */
        }}
        emptyMessage={
          search
            ? `Aucun résultat pour « ${search} »`
            : 'Aucune commande dans cette catégorie'
        }
      />
    </div>
  );
}

function KpiTile({
  label,
  value,
  tint,
}: {
  label: string;
  value: number;
  tint: 'neutral' | 'warning' | 'success' | 'danger';
}) {
  const tintBg =
    tint === 'success'
      ? 'bg-ok-100'
      : tint === 'warning'
        ? 'bg-warn-100'
        : tint === 'danger'
          ? 'bg-danger-100'
          : 'bg-ink-100';
  const tintFg =
    tint === 'success'
      ? 'text-ok-700'
      : tint === 'warning'
        ? 'text-warn-700'
        : tint === 'danger'
          ? 'text-danger-600'
          : 'text-ink-700';

  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'w-9 h-9 rounded-input flex items-center justify-center',
            tintBg,
          )}
        >
          <span className={cn('font-mono text-sm font-semibold tnum', tintFg)}>
            {value}
          </span>
        </div>
        <span className="text-tiny font-medium text-ink-700">{label}</span>
      </div>
    </div>
  );
}
