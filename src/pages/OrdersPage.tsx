import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, ChevronRight, QrCode, Calendar, X } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { formatDate, formatWeight } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useOrders, useOrdersRealtime } from '@/hooks/queries/useOrders';
import { OrderQrModal, type OrderDetailWithMeta } from '@/components/orders/OrderQrModal';
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

type ApiOrderWithMeta = Order & { clientName?: string };

type DateField = 'collectionDate' | 'createdAt' | 'updatedAt';
type DatePreset = 'all' | 'today' | '7d' | '30d' | 'custom';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'Toutes dates' },
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 derniers jours' },
  { key: '30d', label: '30 derniers jours' },
  { key: 'custom', label: 'Personnalisé' },
];

const DATE_FIELDS: { key: DateField; label: string }[] = [
  { key: 'collectionDate', label: 'Date de collecte' },
  { key: 'createdAt', label: 'Date de création' },
  { key: 'updatedAt', label: 'Dernière mise à jour' },
];

/** Helpers ISO bornes pour les presets. */
function bounds(preset: DatePreset, custom: { from: string; to: string }) {
  if (preset === 'all') return { dateFrom: undefined, dateTo: undefined };
  const start = new Date();
  const end = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1); // borne exclusive

  if (preset === 'today') {
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  if (preset === '7d') {
    start.setDate(start.getDate() - 6);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  if (preset === '30d') {
    start.setDate(start.getDate() - 29);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  // custom (yyyy-mm-dd → ISO datetime)
  const customFrom = custom.from ? new Date(`${custom.from}T00:00:00`).toISOString() : undefined;
  const customTo = custom.to
    ? new Date(`${custom.to}T00:00:00`).toISOString()
    : undefined;
  // Pour la borne haute, on inclut le jour entier en ajoutant 1 jour
  const customToInclusive = custom.to
    ? new Date(new Date(`${custom.to}T00:00:00`).getTime() + 86_400_000).toISOString()
    : undefined;
  return { dateFrom: customFrom, dateTo: customToInclusive ?? customTo };
}

export default function OrdersPage() {
  const navigate = useNavigate();
  useOrdersRealtime(); // invalide cache sur events order:*

  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [qrOrder, setQrOrder] = useState<OrderDetailWithMeta | null>(null);

  // ─── Filtres date (envoyés à l'API) ───
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [dateField, setDateField] = useState<DateField>('collectionDate');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const { dateFrom, dateTo } = useMemo(
    () => bounds(datePreset, { from: customFrom, to: customTo }),
    [datePreset, customFrom, customTo],
  );

  // Reset preset → 'all' si l'utilisateur efface les dates custom
  const clearDates = () => {
    setDatePreset('all');
    setCustomFrom('');
    setCustomTo('');
  };

  const { data, isLoading, error } = useOrders({
    pageSize: 100,
    dateFrom,
    dateTo,
    dateField: datePreset === 'all' ? undefined : dateField,
  });
  const orders = (data?.items ?? []) as ApiOrderWithMeta[];

  const getClientName = (_clientId: string, row?: ApiOrderWithMeta) => row?.clientName ?? 'Inconnu';

  const filtered = useMemo(() => {
    const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (!active.match(o.status)) return false;
      if (!q) return true;
      const hay = `${o.orderNumber} ${getClientName(o.clientId, o)}`.toLowerCase();
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
            {getClientName(row.clientId, row as ApiOrderWithMeta)}
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
      cell: (row: Order) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQrOrder(row as OrderDetailWithMeta);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-input border-hairline border-ink-200 hover:bg-paper-2 text-ink-700 hover:text-brand-800 transition-colors"
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
                    ? 'bg-brand-800 text-white border-brand-800'
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
              className="w-72 pl-9 pr-4 py-2 text-sm bg-paper-2 border border-ink-300 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:bg-paper focus:border-brand-800 focus:ring-2 focus:ring-brand-800/15"
            />
          </div>
        </div>
      </div>

      {/* ── Filtre date (envoyé à l'API : dateFrom/dateTo/dateField) ── */}
      <div className="card-surface p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-brand-800" strokeWidth={1.75} />
          <span className="text-tiny font-semibold text-ink-700">
            Période
          </span>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1">
          {DATE_PRESETS.map((p) => {
            const active = datePreset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setDatePreset(p.key)}
                className={cn(
                  'px-2.5 py-1 rounded-pill text-tiny font-semibold border transition-colors',
                  active
                    ? 'bg-brand-800 text-white border-brand-800'
                    : 'bg-paper text-ink-700 border-ink-200 hover:bg-paper-2',
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Inputs custom */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 text-tiny font-mono bg-paper-2 border border-ink-300 rounded-input text-ink-900 focus:outline-none focus:border-brand-800"
              aria-label="Date début"
            />
            <span className="text-tiny text-ink-500">→</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1 text-tiny font-mono bg-paper-2 border border-ink-300 rounded-input text-ink-900 focus:outline-none focus:border-brand-800"
              aria-label="Date fin"
            />
          </div>
        )}

        {/* Sélecteur de champ filtré */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-tiny text-ink-500">filtrée sur</span>
          <select
            value={dateField}
            onChange={(e) => setDateField(e.target.value as DateField)}
            className="px-2 py-1 text-tiny font-semibold bg-paper-2 border border-ink-300 rounded-input text-ink-900 focus:outline-none focus:border-brand-800"
            disabled={datePreset === 'all'}
          >
            {DATE_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          {datePreset !== 'all' && (
            <button
              type="button"
              onClick={clearDates}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-input text-tiny text-ink-600 hover:bg-paper-2"
              title="Réinitialiser le filtre date"
            >
              <X className="w-3 h-3" strokeWidth={2} />
              Effacer
            </button>
          )}
        </div>

      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
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

      <OrderQrModal
        open={!!qrOrder}
        onClose={() => setQrOrder(null)}
        order={qrOrder}
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
