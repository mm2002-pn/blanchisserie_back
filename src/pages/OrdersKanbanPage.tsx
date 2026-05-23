import { useMemo, useState } from 'react';
import { Building2, Search, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useOrders, useOrdersRealtime } from '@/hooks/queries/useOrders';
import { OrderQrModal, type OrderDetailWithMeta } from '@/components/orders/OrderQrModal';
import { cn } from '@/lib/utils';

/**
 * Vue Kanban — workflow board des commandes du jour.
 *
 * 7 colonnes calquées sur le workflow API (statuts groupés) :
 *  - Pending          : pending, confirmed, collection_planned
 *  - Collectées       : collected
 *  - Reçues           : received
 *  - Triées (pool)    : triaged
 *  - En production    : in_production
 *  - Prêtes           : ready
 *  - Livrées          : delivered, invoiced (collapsé)
 *
 * Click carte → modal détail + actions contextuelles.
 * Live updates via Socket.IO (useOrdersRealtime).
 */

interface ColumnDef {
  key: string;
  title: string;
  matches: (apiStatus: string) => boolean;
  tint: 'neutral' | 'info' | 'warning' | 'brand' | 'success';
}

const COLUMNS: ColumnDef[] = [
  {
    key: 'pending',
    title: 'En attente',
    matches: (s) => ['pending', 'confirmed', 'collection_planned'].includes(s),
    tint: 'neutral',
  },
  {
    key: 'collected',
    title: 'Collectées',
    matches: (s) => s === 'collected',
    tint: 'info',
  },
  {
    key: 'received',
    title: 'Reçues',
    matches: (s) => s === 'received',
    tint: 'warning',
  },
  {
    key: 'triaged',
    title: 'Triées · pool',
    matches: (s) => s === 'triaged',
    tint: 'brand',
  },
  {
    key: 'in_production',
    title: 'En production',
    matches: (s) => s === 'in_production',
    tint: 'warning',
  },
  {
    key: 'ready',
    title: 'Prêtes',
    matches: (s) => s === 'ready',
    tint: 'success',
  },
  {
    key: 'delivered',
    title: 'Livrées',
    matches: (s) => ['delivered', 'invoiced'].includes(s),
    tint: 'success',
  },
];

export default function OrdersKanbanPage() {
  useOrdersRealtime();
  const { data, isLoading, error } = useOrders({ pageSize: 200 });
  const orders = (data?.items ?? []) as OrderDetailWithMeta[];

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OrderDetailWithMeta | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      `${o.orderNumber} ${o.clientName ?? ''}`.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const byColumn = useMemo(() => {
    const m: Record<string, OrderDetailWithMeta[]> = {};
    for (const col of COLUMNS) m[col.key] = [];
    for (const o of filtered) {
      const apiStatus = o.apiStatus ?? '';
      const col = COLUMNS.find((c) => c.matches(apiStatus));
      if (col) m[col.key].push(o);
    }
    return m;
  }, [filtered]);

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Workflow board</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            Kanban des commandes
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Suivi temps réel · {orders.length} commandes au total
          </p>
        </div>
        <div className="relative shrink-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher commande / hôtel…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Erreur de chargement : {(error as Error).message}
        </div>
      )}

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden -mx-4 px-4">
        <div className="grid gap-3 min-h-full" style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(220px, 1fr))` }}>
          {COLUMNS.map((col) => {
            const items = byColumn[col.key] ?? [];
            return (
              <div
                key={col.key}
                className="flex flex-col bg-paper-2 border-hairline border-ink-200 rounded-card overflow-hidden"
              >
                {/* Column header */}
                <div className="px-3 py-2.5 border-b border-hairline border-ink-200 bg-paper">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-tiny font-semibold text-ink-700 uppercase tracking-wide">
                      {col.title}
                    </h3>
                    <Badge variant={col.tint} dot>
                      {items.length}
                    </Badge>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
                  {isLoading && items.length === 0 ? (
                    <p className="text-tiny text-ink-400 italic px-2 py-4">
                      Chargement…
                    </p>
                  ) : items.length === 0 ? (
                    <p className="text-tiny text-ink-400 italic px-2 py-4 text-center">
                      Aucune commande
                    </p>
                  ) : (
                    items.map((o) => (
                      <KanbanCard
                        key={o.id}
                        order={o}
                        onClick={() => setSelected(o)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <OrderQrModal
        open={!!selected}
        onClose={() => setSelected(null)}
        order={selected}
      />
    </div>
  );
}

function KanbanCard({
  order,
  onClick,
}: {
  order: OrderDetailWithMeta;
  onClick: () => void;
}) {
  const ageHours =
    (Date.now() - new Date(order.createdAt).getTime()) / 3_600_000;
  const slaRisk = ageHours > 24 && ['triaged', 'in_pool'].includes(order.apiStatus ?? '');
  const totalKg = order.totalWeight ?? 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-paper border-hairline rounded-input p-2.5 hover:shadow-sm transition-all',
        slaRisk
          ? 'border-rose-300 ring-1 ring-rose-100'
          : 'border-ink-200 hover:border-brand-800',
      )}
    >
      {/* Top row: order number + sla */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-mono text-tiny font-semibold text-ink-900 tnum truncate">
          {order.orderNumber}
        </span>
        {slaRisk && (
          <AlertTriangle
            className="w-3 h-3 text-rose-500 shrink-0"
            strokeWidth={2}
          />
        )}
      </div>

      {/* Client */}
      <div className="flex items-center gap-1.5 mb-2">
        <Building2 className="w-3 h-3 text-brand-800 shrink-0" strokeWidth={1.75} />
        <span className="text-tiny text-ink-700 truncate">
          {order.clientName ?? '—'}
        </span>
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-between text-micro text-ink-500">
        <span className="font-mono tnum">
          {totalKg > 0 ? `${totalKg.toFixed(1)} kg` : '— kg'}
        </span>
        <span className="font-mono tnum">
          {ageHours < 24
            ? `${Math.round(ageHours)}h`
            : `J+${Math.floor(ageHours / 24)}`}
        </span>
      </div>
    </button>
  );
}
