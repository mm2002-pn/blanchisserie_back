import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui';
import { DataTable } from '@/components/table';
import { FileText, Loader2, Search, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePageHeader } from '@/context/PageHeaderContext';

import { useInvoices, useInvoicesRealtime, useGenerateInvoicePdf } from '@/hooks/queries/useInvoices';

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

/** Origine de l'API (sans le préfixe /api/v1) — pour ouvrir les PDF statiques (/uploads/...). */
const API_ORIGIN = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api/v1'
).replace(/\/api\/v1\/?$/, '');

export default function InvoicesPage() {
  usePageHeader({
    eyebrow: 'Facturation',
    title: 'Factures',
    sub: 'Encaissement, relances et documents commerciaux.',
  });

  useInvoicesRealtime();
  const { data, isLoading, error } = useInvoices();
  const invoices = data ?? [];
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const generatePdf = useGenerateInvoicePdf();
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

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

  const paid = invoices.filter((i) => i.status === 'Payée');
  const pending = invoices.filter((i) => i.status === 'En attente');
  const overdue = invoices.filter((i) => i.status === 'En retard');
  const encaisse = paid.reduce((s, i) => s + i.totalAmount, 0);
  const enAttente = pending.reduce((s, i) => s + i.totalAmount, 0);
  const enRetard = overdue.reduce((s, i) => s + i.totalAmount, 0);

  const countByKey: Record<FilterKey, number> = {
    all: invoices.length,
    paid: paid.length,
    pending: pending.length,
    overdue: overdue.length,
  };

  const kpis = [
    { label: 'Encaissé', value: formatCurrency(encaisse), accent: '#2C7A4B' },
    { label: 'En attente', value: formatCurrency(enAttente), accent: '#F0A03D' },
    { label: 'En retard', value: formatCurrency(enRetard), accent: '#C1441F' },
  ];

  const openPdf = async (invoiceId: string, pdfUrl: string | null) => {
    if (pdfUrl) {
      window.open(`${API_ORIGIN}${pdfUrl}`, '_blank', 'noopener,noreferrer');
      return;
    }
    setPdfLoadingId(invoiceId);
    try {
      const res = await generatePdf.mutateAsync({ id: invoiceId });
      window.open(`${API_ORIGIN}${res.pdfUrl}`, '_blank', 'noopener,noreferrer');
    } finally {
      setPdfLoadingId(null);
    }
  };

  const columns = [
    {
      header: 'Facture',
      accessorKey: 'invoiceNumber' as const,
      cell: (row: (typeof invoices)[0]) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
          </div>
          <span className="font-mono text-sm font-semibold text-ink-900 tnum">
            {row.invoiceNumber}
          </span>
        </div>
      ),
    },
    {
      header: 'Client',
      accessorKey: 'clientName' as const,
      cell: (row: (typeof invoices)[0]) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-ink-500 shrink-0" strokeWidth={1.75} />
          <span className="text-sm text-ink-900 font-medium truncate">{row.clientName}</span>
        </div>
      ),
    },
    {
      header: 'Statut',
      accessorKey: 'status' as const,
      cell: (row: (typeof invoices)[0]) => (
        <Badge variant={STATUS_VARIANT[row.status as StatusKey] ?? 'neutral'} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Échéance',
      accessorKey: 'dueDate' as const,
      cell: (row: (typeof invoices)[0]) => {
        const isOverdue = row.status === 'En retard';
        return (
          <span
            className={cn(
              'text-sm font-mono tnum',
              isOverdue ? 'text-danger-600 font-semibold' : 'text-ink-700',
            )}
          >
            {format(new Date(row.dueDate), 'dd MMM yyyy', { locale: fr })}
          </span>
        );
      },
    },
    {
      header: 'Montant',
      accessorKey: 'totalAmount' as const,
      align: 'right' as const,
      cell: (row: (typeof invoices)[0]) => (
        <span className="font-mono text-sm font-semibold text-ink-900 tnum">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Documents',
      accessorKey: 'id' as const,
      align: 'right' as const,
      cell: (row: (typeof invoices)[0]) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            void openPdf(row.id, row.pdfUrl);
          }}
          disabled={pdfLoadingId === row.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-ink-200 hover:border-terra-600 hover:bg-terra-100 text-ink-700 hover:text-terra-700 transition-colors text-tiny font-semibold disabled:opacity-50"
        >
          {pdfLoadingId === row.id ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
          )}
          {row.pdfUrl ? 'Ouvrir PDF' : 'Générer PDF'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-paper border border-hairline border-ink-200 rounded-card p-4 pt-3.5"
            style={{ borderTop: `3px solid ${k.accent}` }}
          >
            <div className="caps" style={{ color: k.accent }}>
              {k.label}
            </div>
            <div className="font-heading font-bold text-2xl tracking-tight mt-2 text-ink-900 tnum">
              {k.value}
            </div>
          </div>
        ))}
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
                <span className={cn('font-mono tnum', active ? 'text-brand-100' : 'text-ink-400')}>
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
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800"
          />
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-input border border-danger-600/40 bg-danger-100 px-4 py-3 text-sm text-danger-600">
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
                : 'Aucune facture pour le moment'
          }
        />
      )}
    </div>
  );
}
