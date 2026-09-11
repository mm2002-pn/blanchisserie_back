import { useMemo, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { DataTable } from '@/components/table';
import {
  FileText,
  Download,
  AlertCircle,
  Search,
  Plus,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { useInvoices, useInvoicesRealtime } from '@/hooks/queries/useInvoices';

type StatusKey = 'Payée' | 'En attente' | 'En retard' | 'Brouillon';

const STATUS_VARIANT: Record<StatusKey, 'success' | 'warning' | 'error' | 'neutral'> = {
  Payée: 'success',
  'En attente': 'warning',
  'En retard': 'error',
  Brouillon: 'neutral',
};

type FilterKey = 'all' | 'paid' | 'pending' | 'overdue';

const FILTERS: { key: FilterKey; label: string; match: (s: string) => boolean }[] = [
  { key: 'all', label: 'Toutes', match: () => true },
  { key: 'paid', label: 'Payées', match: (s) => s === 'Payée' },
  { key: 'pending', label: 'En attente', match: (s) => s === 'En attente' },
  { key: 'overdue', label: 'En retard', match: (s) => s === 'En retard' },
];

export default function InvoicesPage() {
  useInvoicesRealtime();
  const { data, isLoading, error } = useInvoices();
  const invoices = data ?? [];
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) ?? FILTERS[0];
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (!f.match(inv.status)) return false;
      if (!q) return true;
      return `${inv.invoiceNumber} ${inv.clientName} ${inv.orderReference}`
        .toLowerCase()
        .includes(q);
    });
  }, [invoices, filter, search]);

  // Aggregates
  const paid = invoices.filter((i) => i.status === 'Payée');
  const pending = invoices.filter((i) => i.status === 'En attente');
  const overdue = invoices.filter((i) => i.status === 'En retard');
  const totalRevenue = paid.reduce((s, i) => s + i.totalAmount, 0);
  const outstanding = [...pending, ...overdue].reduce((s, i) => s + i.totalAmount, 0);
  const overdueAmount = overdue.reduce((s, i) => s + i.totalAmount, 0);

  const countByKey: Record<FilterKey, number> = {
    all: invoices.length,
    paid: paid.length,
    pending: pending.length,
    overdue: overdue.length,
  };

  const columns = [
    {
      header: 'Facture',
      accessorKey: 'invoiceNumber' as const,
      cell: (row: typeof invoices[0]) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-ink-900 tnum">
              {row.invoiceNumber}
            </p>
            <p className="text-tiny text-ink-500 font-mono">{row.orderReference}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Client',
      accessorKey: 'clientName' as const,
      cell: (row: typeof invoices[0]) => (
        <span className="text-sm text-ink-900 font-medium">{row.clientName}</span>
      ),
    },
    {
      header: 'Émise',
      accessorKey: 'invoiceDate' as const,
      cell: (row: typeof invoices[0]) => (
        <span className="text-sm text-ink-700 font-mono tnum">
          {format(new Date(row.invoiceDate), 'dd MMM yyyy', { locale: fr })}
        </span>
      ),
    },
    {
      header: 'Échéance',
      accessorKey: 'dueDate' as const,
      cell: (row: typeof invoices[0]) => {
        const overdue = row.status === 'En retard';
        return (
          <span
            className={cn(
              'text-sm font-mono tnum',
              overdue ? 'text-danger-600 font-semibold' : 'text-ink-700',
            )}
          >
            {format(new Date(row.dueDate), 'dd MMM yyyy', { locale: fr })}
          </span>
        );
      },
    },
    {
      header: 'TTC',
      accessorKey: 'totalAmount' as const,
      align: 'right' as const,
      cell: (row: typeof invoices[0]) => (
        <span className="font-mono text-sm font-semibold text-ink-900 tnum">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Statut',
      accessorKey: 'status' as const,
      cell: (row: typeof invoices[0]) => (
        <div>
          <Badge
            variant={STATUS_VARIANT[row.status as StatusKey] ?? 'neutral'}
            dot
          >
            {row.status}
          </Badge>
          {row.paidDate && (
            <p className="text-micro font-mono text-ink-500 mt-1">
              {format(new Date(row.paidDate), 'dd/MM/yyyy', { locale: fr })}
            </p>
          )}
        </div>
      ),
    },
    {
      header: '',
      accessorKey: 'id' as const,
      align: 'right' as const,
      cell: () => (
        <div className="flex items-center gap-1 justify-end">
          <button
            className="p-1.5 rounded-input hover:bg-paper-2 text-ink-500 hover:text-brand-800 transition-colors"
            title="Télécharger"
          >
            <Download className="w-4 h-4" strokeWidth={1.75} />
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
          <div className="caps mb-2">Facturation</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            Factures
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            {invoices.length} factures émises · {paid.length} payées
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            Export PDF
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Revenue hero + alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Hero revenue */}
        <div className="card-surface bg-brand-900 border-brand-900 text-paper p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="caps text-brand-100">Encaissé · à date</p>
              <p className="font-serif text-4xl font-medium tnum tracking-tight mt-2 leading-none">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-tiny text-brand-100 mt-2">
                {paid.length} factures payées · avril 2026
              </p>
            </div>
            <div className="w-11 h-11 rounded-input bg-terra-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-paper" strokeWidth={1.75} />
            </div>
          </div>

          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-brand-700">
            <div>
              <p className="caps text-brand-100">En attente</p>
              <p className="font-mono text-base font-semibold mt-1 tnum">
                {formatCurrency(outstanding - overdueAmount)}
              </p>
            </div>
            <div className="h-8 w-px bg-brand-700" />
            <div>
              <p className="caps text-brand-100">En retard</p>
              <p className="font-mono text-base font-semibold mt-1 tnum text-danger-100">
                {formatCurrency(overdueAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 ? (
          <div className="card-surface bg-danger-100 border-danger-600 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-danger-600" strokeWidth={2} />
                <p className="caps text-danger-600">Action requise</p>
              </div>
              <p className="font-serif text-xl font-medium tracking-tight text-ink-900">
                {overdue.length} facture
                {overdue.length > 1 ? 's' : ''} en retard
              </p>
              <p className="text-tiny text-ink-700 mt-1.5">
                Total : {formatCurrency(overdueAmount)}
              </p>
            </div>
            <Button variant="danger" size="sm" className="self-start mt-4">
              Relancer les clients
            </Button>
          </div>
        ) : (
          <div className="card-surface bg-ok-100 border-ok-600 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-ok-700" strokeWidth={2} />
                <p className="caps text-ok-700">Facturation à jour</p>
              </div>
              <p className="font-serif text-xl font-medium tracking-tight text-ink-900">
                Aucune facture en retard
              </p>
              <p className="text-tiny text-ink-700 mt-1.5">
                Continue comme ça, l'encaissement suit.
              </p>
            </div>
          </div>
        )}
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
                  {countByKey[f.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une facture, un client…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Impossible de charger les factures : {(error as Error).message}
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns as any}
          onRowClick={() => {
            /* navigate to invoice-details when available */
          }}
          emptyMessage={
            isLoading
              ? 'Chargement…'
              : search
                ? `Aucun résultat pour « ${search} »`
                : 'Aucune facture dans cette catégorie'
          }
        />
      )}
    </div>
  );
}
