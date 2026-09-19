import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Building2,
  ChevronRight,
  QrCode,
  AlertTriangle,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { formatDate, formatWeight } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useOrders, useOrdersRealtime } from '@/hooks/queries/useOrders';
import { useClients } from '@/hooks/queries/useClients';
import { OrderQrModal, type OrderDetailWithMeta } from '@/components/orders/OrderQrModal';
import { usePageHeader } from '@/context/PageHeaderContext';
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

const FILTERS: {
  key: string;
  label: string;
  match: (s: string) => boolean;
  bg: string;
  fg: string;
  border: string;
}[] = [
  { key: 'all', label: 'Toutes', match: () => true, bg: '#F1F3F7', fg: '#17356B', border: '#DDE2EA' },
  {
    key: 'pending',
    label: 'En attente',
    match: (s) => s === 'En attente' || s === 'Confirmée',
    bg: '#F1F3F7',
    fg: '#4A5768',
    border: '#DDE2EA',
  },
  {
    key: 'in-progress',
    label: 'En cours',
    match: (s) => ['Collectée', 'Réceptionnée', 'En production', 'En traitement'].includes(s),
    bg: '#FCEBD9',
    fg: '#B3540A',
    border: '#F3D6B4',
  },
  {
    key: 'done',
    label: 'Livrées',
    match: (s) => s === 'Livrée' || s === 'Terminée',
    bg: '#E4F3E9',
    fg: '#215C38',
    border: '#BFE0CB',
  },
  {
    key: 'cancelled',
    label: 'Annulées',
    match: (s) => s === 'Annulée',
    bg: '#FBEAE5',
    fg: '#C1441F',
    border: '#F0C4B8',
  },
];

type DueKey = 'all' | 'today' | '7d' | '30d';
const DUE_OPTS: { key: DueKey; label: string }[] = [
  { key: 'all', label: 'Toutes échéances' },
  { key: 'today', label: "Collecte aujourd'hui" },
  { key: '7d', label: 'Collecte · 7 jours' },
  { key: '30d', label: 'Collecte · 30 jours' },
];

type SortKey = 'recent' | 'old' | 'weight-desc' | 'weight-asc';
const SORT_OPTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Plus récentes' },
  { key: 'old', label: 'Plus anciennes' },
  { key: 'weight-desc', label: 'Poids · décroissant' },
  { key: 'weight-asc', label: 'Poids · croissant' },
];

type ApiOrderWithMeta = Order & {
  clientName?: string;
  estimatedWeight?: number;
  receivedWeight?: number;
  apiStatus?: string;
};

/** Colonnes du Kanban — calées sur le workflow API. */
interface ColumnDef {
  key: string;
  title: string;
  matches: (apiStatus: string) => boolean;
  accent: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'pending', title: 'En attente', matches: (s) => ['pending', 'confirmed', 'collection_planned'].includes(s), accent: '#8B97A8' },
  { key: 'collected', title: 'Collectées', matches: (s) => s === 'collected', accent: '#2C5A9E' },
  { key: 'received', title: 'Reçues', matches: (s) => s === 'received', accent: '#F0A03D' },
  { key: 'triaged', title: 'Triées · pool', matches: (s) => s === 'triaged', accent: '#17356B' },
  { key: 'in_production', title: 'En production', matches: (s) => s === 'in_production', accent: '#F0A03D' },
  { key: 'ready', title: 'Prêtes', matches: (s) => s === 'ready', accent: '#2C7A4B' },
  { key: 'delivered', title: 'Livrées', matches: (s) => ['delivered', 'invoiced'].includes(s), accent: '#2C7A4B' },
];

/** Bornes ISO pour le filtre "Échéance" — sur la date de collecte prévue. */
function dueBounds(due: DueKey) {
  if (due === 'all') return { dateFrom: undefined, dateTo: undefined };
  const start = new Date();
  const end = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1); // borne exclusive

  if (due === 'today') {
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  if (due === '7d') {
    end.setDate(end.getDate() + 6);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  // 30d
  end.setDate(end.getDate() + 29);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

export default function OrdersPage() {
  usePageHeader({
    eyebrow: 'Workflow',
    title: 'Commandes',
    sub: 'Gère le cycle complet de chaque commande, de la collecte à la facturation.',
  });

  const navigate = useNavigate();
  useOrdersRealtime(); // invalide cache sur events order:*

  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'kanban' ? 'kanban' : 'list';
  const setView = (v: 'list' | 'kanban') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (v === 'list') next.delete('view');
      else next.set('view', v);
      return next;
    });
  };

  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [qrOrder, setQrOrder] = useState<OrderDetailWithMeta | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [due, setDue] = useState<DueKey>('all');
  const [sort, setSort] = useState<SortKey>('recent');

  const { dateFrom, dateTo } = useMemo(() => dueBounds(due), [due]);

  const { data: clientsData } = useClients({ pageSize: 200 });
  const clients = clientsData?.items ?? [];

  const { data, isLoading, error } = useOrders({
    pageSize: 200,
    clientId: clientId || undefined,
    dateFrom,
    dateTo,
    dateField: due === 'all' ? undefined : 'collectionDate',
  });
  const orders = (data?.items ?? []) as ApiOrderWithMeta[];

  const getClientName = (_clientId: string, row?: ApiOrderWithMeta) => row?.clientName ?? 'Inconnu';

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      `${o.orderNumber} ${getClientName(o.clientId, o)}`.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const statusFiltered = useMemo(() => {
    const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
    return searched.filter((o) => active.match(o.status));
  }, [searched, filter]);

  const filtered = useMemo(() => {
    const arr = [...statusFiltered];
    arr.sort((a, b) => {
      if (sort === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'old') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      const aw = (a as ApiOrderWithMeta).receivedWeight ?? (a.totalWeight ?? 0) * 1000;
      const bw = (b as ApiOrderWithMeta).receivedWeight ?? (b.totalWeight ?? 0) * 1000;
      return sort === 'weight-desc' ? bw - aw : aw - bw;
    });
    return arr;
  }, [statusFiltered, sort]);

  const countByKey = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.key, orders.filter((o) => f.match(o.status)).length]),
      ),
    [orders],
  );

  const totalKg = filtered.reduce((s, o) => s + (o.totalWeight ?? 0), 0);

  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; clear: () => void }[] = [];
    if (filter !== 'all') {
      const f = FILTERS.find((x) => x.key === filter);
      if (f) list.push({ key: 'status', label: f.label, clear: () => setFilter('all') });
    }
    if (clientId) {
      const c = clients.find((x) => x.id === clientId);
      list.push({ key: 'client', label: c?.name ?? 'Client', clear: () => setClientId('') });
    }
    if (due !== 'all') {
      const d = DUE_OPTS.find((x) => x.key === due);
      if (d) list.push({ key: 'due', label: d.label, clear: () => setDue('all') });
    }
    if (search.trim()) {
      list.push({ key: 'search', label: `« ${search.trim()} »`, clear: () => setSearch('') });
    }
    return list;
  }, [filter, clientId, due, search, clients]);

  const clearAllFilters = () => {
    setFilter('all');
    setClientId('');
    setDue('all');
    setSearch('');
  };

  const byColumn = useMemo(() => {
    const m: Record<string, ApiOrderWithMeta[]> = {};
    for (const col of COLUMNS) m[col.key] = [];
    for (const o of searched) {
      const apiStatus = o.apiStatus ?? '';
      const col = COLUMNS.find((c) => c.matches(apiStatus));
      if (col) m[col.key].push(o);
    }
    return m;
  }, [searched]);

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
            {getClientName(row.clientId, row as ApiOrderWithMeta)}
          </span>
        </div>
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
      header: 'Est. kg',
      accessorKey: 'totalWeight' as keyof Order,
      align: 'right' as const,
      cell: (row: Order) => (
        <span className="font-mono text-sm text-ink-600 tnum">
          {(row as ApiOrderWithMeta).estimatedWeight != null
            ? formatWeight((row as ApiOrderWithMeta).estimatedWeight! * 1000)
            : '—'}
        </span>
      ),
    },
    {
      header: 'Réel kg',
      accessorKey: 'totalWeight' as keyof Order,
      align: 'right' as const,
      cell: (row: Order) => (
        <span className="font-mono text-sm font-medium text-ink-900 tnum">
          {(row as ApiOrderWithMeta).receivedWeight != null
            ? formatWeight((row as ApiOrderWithMeta).receivedWeight! * 1000)
            : '—'}
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
      header: '',
      accessorKey: 'id' as keyof Order,
      align: 'right' as const,
      cell: (row: Order) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQrOrder(row as OrderDetailWithMeta);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-input border-hairline border-ink-200 hover:border-terra-600 hover:bg-terra-100 text-ink-700 hover:text-terra-700 transition-colors"
            aria-label="QR code"
            title="Voir QR code pour scan driver"
          >
            <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span className="text-tiny font-semibold">QR</span>
          </button>
          <ChevronRight className="w-4 h-4 text-ink-400" strokeWidth={1.75} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Toolbar unifiée : recherche + client + échéance + tri + vue + nouvelle commande */}
      <div className="bg-paper border border-ink-200">
        <div className="p-3.5 flex items-center gap-2.5 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
              strokeWidth={1.8}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Commande, client, n° de facture…"
              className="w-full h-10 pl-9 pr-3 text-[13.5px] font-sans bg-paper border border-ink-300 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800"
            />
          </div>

          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="flex-none h-10 border border-ink-300 bg-paper px-2.5 text-[13px] text-ink-900 focus:outline-none focus:border-brand-800 cursor-pointer"
          >
            <option value="">Tous les clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={due}
            onChange={(e) => setDue(e.target.value as DueKey)}
            className="flex-none h-10 border border-ink-300 bg-paper px-2.5 text-[13px] text-ink-900 focus:outline-none focus:border-brand-800 cursor-pointer"
          >
            {DUE_OPTS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="flex-none h-10 border border-ink-300 bg-paper px-2.5 text-[13px] text-ink-900 focus:outline-none focus:border-brand-800 cursor-pointer"
          >
            {SORT_OPTS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="flex-none flex border border-ink-300 p-0.5">
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3.5 py-1.5 text-[12.5px] font-heading font-semibold',
                view === 'list' ? 'bg-brand-800 text-white' : 'bg-transparent text-ink-700',
              )}
            >
              Liste
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'px-3.5 py-1.5 text-[12.5px] font-heading font-semibold',
                view === 'kanban' ? 'bg-brand-800 text-white' : 'bg-transparent text-ink-700',
              )}
            >
              Kanban
            </button>
          </div>

          <Button size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouvelle commande
          </Button>
        </div>

        {/* Chips de statut */}
        <div className="px-3.5 pb-3 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(active ? 'all' : f.key)}
                className="flex items-center gap-1.5 px-2.5 py-1.5"
                style={{
                  border: `1px solid ${active ? '#17356B' : f.border}`,
                  background: active ? '#17356B' : f.bg,
                }}
              >
                <span
                  className="font-heading text-[12.5px] font-semibold"
                  style={{ color: active ? '#fff' : f.fg }}
                >
                  {f.label}
                </span>
                <span
                  className="font-heading text-[10.5px] font-bold px-1.5"
                  style={{
                    background: active ? '#DE6B0E' : '#fff',
                    color: active ? '#fff' : '#4A5768',
                  }}
                >
                  {countByKey[f.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bandeau résultats + filtres actifs */}
        <div className="px-3.5 py-2.5 border-t border-ink-200 bg-[#FAFBFC] flex items-center gap-2.5 flex-wrap">
          <span className="flex-none text-[12.5px] text-ink-600">
            <strong className="font-heading font-bold text-ink-900">{filtered.length}</strong>{' '}
            résultat{filtered.length > 1 ? 's' : ''} · {formatWeight(totalKg * 1000)}
          </span>
          {activeFilters.length > 0 && (
            <>
              <span className="flex-none w-px h-[18px] bg-ink-300" />
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={f.clear}
                  className="flex-none inline-flex items-center gap-1.5 bg-terra-100 border border-[#F3D6B4] px-2.5 py-1 text-terra-700"
                >
                  <span className="font-heading text-[11.5px] font-semibold">{f.label}</span>
                  <span className="font-heading text-xs font-bold">×</span>
                </button>
              ))}
              <button
                onClick={clearAllFilters}
                className="flex-none font-heading text-[11.5px] font-semibold text-danger-600"
              >
                Tout effacer
              </button>
            </>
          )}
          <span className="flex-1" />
          <span className="flex-none text-[11.5px] text-ink-500">
            Trié par {SORT_OPTS.find((o) => o.key === sort)?.label.toLowerCase()}
          </span>
        </div>
      </div>

      {view === 'list' && (
        <>
          {/* Table */}
          {error ? (
            <div className="rounded-input border border-danger-600/40 bg-danger-100 px-4 py-3 text-sm text-danger-600">
              Impossible de charger les commandes : {(error as Error).message}
            </div>
          ) : (
            <DataTable
              data={filtered}
              columns={columns}
              onRowClick={(row) => navigate(`/orders/${row.id}`)}
              emptyMessage={
                isLoading
                  ? 'Chargement…'
                  : search
                    ? `Aucun résultat pour « ${search} »`
                    : 'Aucune commande dans cette catégorie'
              }
            />
          )}
        </>
      )}

      {view === 'kanban' && (
        <>
          {error && (
            <div className="rounded-input border border-danger-600/40 bg-danger-100 px-4 py-3 text-sm text-danger-600">
              Erreur de chargement : {(error as Error).message}
            </div>
          )}
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-3 pb-2.5">
              {COLUMNS.map((col) => {
                const items = byColumn[col.key] ?? [];
                return (
                  <div
                    key={col.key}
                    className="flex-none w-[228px] flex flex-col bg-paper-2 border border-ink-200 p-3 gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="caps !text-ink-800">{col.title}</h3>
                      <span className="text-xs font-heading text-ink-600">{items.length}</span>
                    </div>
                    <div className="flex-1 space-y-2.5 min-h-[160px]">
                      {isLoading && items.length === 0 ? (
                        <p className="text-tiny text-ink-500 italic px-2 py-4">Chargement…</p>
                      ) : items.length === 0 ? (
                        <p className="text-tiny text-ink-500 px-2.5 py-4 text-center border border-dashed border-ink-300">
                          Aucune commande
                        </p>
                      ) : (
                        items.map((o) => (
                          <KanbanCard
                            key={o.id}
                            order={o}
                            accent={col.accent}
                            onClick={() => setQrOrder(o as OrderDetailWithMeta)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <OrderQrModal
        open={!!qrOrder}
        onClose={() => setQrOrder(null)}
        order={qrOrder}
      />
    </div>
  );
}

function KanbanCard({
  order,
  accent,
  onClick,
}: {
  order: ApiOrderWithMeta;
  accent: string;
  onClick: () => void;
}) {
  const ageHours = (Date.now() - new Date(order.createdAt).getTime()) / 3_600_000;
  const slaRisk = ageHours > 24 && order.apiStatus === 'triaged';
  const totalKg = order.totalWeight ?? 0;

  return (
    <div
      className="bg-paper border border-ink-200 p-3"
      style={{ borderLeft: `3px solid ${slaRisk ? '#C1441F' : accent}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-heading font-medium text-[12.5px] text-ink-800 truncate">
          {order.orderNumber}
        </span>
        <span className="font-heading text-[11px] text-ink-600 tnum shrink-0">
          {totalKg > 0 ? `${totalKg.toFixed(1)} kg` : '— kg'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <Building2 className="w-3 h-3 text-ink-500 shrink-0" strokeWidth={1.75} />
        <span className="text-[12.5px] text-ink-600 truncate">{order.clientName ?? '—'}</span>
        {slaRisk && (
          <AlertTriangle className="w-3 h-3 text-danger-600 shrink-0 ml-auto" strokeWidth={2} />
        )}
      </div>
      <button
        onClick={onClick}
        className="w-full h-8 mt-3 border border-ink-200 bg-paper text-ink-800 text-[11.5px] font-heading font-medium hover:border-terra-600 hover:bg-terra-100 transition-colors"
      >
        Détail
      </button>
    </div>
  );
}
