import { useMemo, useState } from 'react';
import { Plus, Search, Building2, Star, ChevronRight } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { useClients } from '@/hooks/queries/useClients';
import { cn } from '@/lib/utils';
import type { Client } from '@/types';

type Segment = 'all' | 'hotel' | 'restaurant' | 'other';

const SEGMENTS: { key: Segment; label: string; match: (c: Client) => boolean }[] = [
  { key: 'all', label: 'Tous', match: () => true },
  { key: 'hotel', label: 'Hôtels', match: (c) => /h[oô]tel/i.test(c.type ?? '') },
  { key: 'restaurant', label: 'Restaurants', match: (c) => /restaurant/i.test(c.type ?? '') },
  { key: 'other', label: 'Autres', match: (c) => !/h[oô]tel|restaurant/i.test(c.type ?? '') },
];

export default function ClientsPage() {
  const { canCreate } = usePermissions();
  const [segment, setSegment] = useState<Segment>('all');
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useClients({ pageSize: 100 });
  const clients: Client[] = data?.items ?? [];

  const visible = useMemo(() => {
    const seg = SEGMENTS.find((s) => s.key === segment) ?? SEGMENTS[0];
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (!seg.match(c)) return false;
      if (!q) return true;
      return `${c.name} ${c.contactPerson} ${c.phone}`.toLowerCase().includes(q);
    });
  }, [clients, segment, search]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        SEGMENTS.map((s) => [s.key, clients.filter(s.match).length]),
      ),
    [clients],
  );

  const activeCount = clients.filter((c) => c.isActive).length;
  const stars = extractStars(clients);

  const columns = [
    {
      header: 'Client',
      accessorKey: 'name' as keyof Client,
      cell: (row: Client) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">{row.name}</p>
            <p className="text-tiny text-ink-500 truncate">{row.type}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessorKey: 'contactPerson' as keyof Client,
      cell: (row: Client) => (
        <div>
          <p className="text-sm text-ink-900">{row.contactPerson}</p>
          <p className="text-tiny font-mono text-ink-500">{row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Ville',
      accessorKey: 'address' as keyof Client,
      cell: (row: Client) => (
        <span className="text-sm text-ink-700">{row.address}</span>
      ),
    },
    {
      header: 'Statut',
      accessorKey: 'isActive' as keyof Client,
      cell: (row: Client) => (
        <Badge variant={row.isActive ? 'success' : 'neutral'} dot>
          {row.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      header: '',
      accessorKey: 'id' as keyof Client,
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
          <div className="caps mb-2">Clients</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            {clients.length}
            <span className="text-ink-500 text-xl ml-2 font-normal">
              comptes enregistrés
            </span>
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Hôtels, restaurants et autres établissements partenaires.
          </p>
        </div>
        {canCreate('clients') && (
          <Button size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouveau client
          </Button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Actifs" value={`${activeCount}`} sub={`${clients.length - activeCount} inactifs`} />
        <KpiTile label="Hôtels" value={`${counts.hotel ?? 0}`} sub="tous segments" />
        <KpiTile
          label="Hôtels 4★ / 5★"
          value={`${stars.high}`}
          sub="premium segment"
          tint="terra"
        />
        <KpiTile label="Restaurants" value={`${counts.restaurant ?? 0}`} sub="partenaires" />
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {SEGMENTS.map((s) => {
            const active = segment === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSegment(s.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-tiny font-semibold transition-colors border-hairline',
                  active
                    ? 'bg-brand-800 text-paper border-brand-800'
                    : 'bg-paper text-ink-700 border-ink-200 hover:bg-paper-2',
                )}
              >
                {s.label}
                <span
                  className={cn(
                    'font-mono tnum',
                    active ? 'text-brand-100' : 'text-ink-400',
                  )}
                >
                  {counts[s.key] ?? 0}
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
            placeholder="Rechercher un client, un contact…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Impossible de charger les clients : {(error as Error).message}
        </div>
      ) : (
        <DataTable
          data={visible}
          columns={columns}
          onRowClick={() => {
            /* navigate to client-details when available */
          }}
          emptyMessage={
            isLoading
              ? 'Chargement…'
              : search
                ? `Aucun résultat pour « ${search} »`
                : 'Aucun client dans cette catégorie'
          }
        />
      )}
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  tint = 'brand',
}: {
  label: string;
  value: string;
  sub: string;
  tint?: 'brand' | 'terra';
}) {
  const iconBg = tint === 'terra' ? 'bg-terra-100' : 'bg-brand-100';
  const iconFg = tint === 'terra' ? 'text-terra-700' : 'text-brand-800';
  const Icon = tint === 'terra' ? Star : Building2;

  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p className="font-serif text-2xl font-medium tnum tracking-tight text-ink-900 mt-1.5 leading-none">
            {value}
          </p>
          <p className="text-tiny text-ink-500 mt-1.5">{sub}</p>
        </div>
        <div className={cn('w-9 h-9 rounded-input flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-4 h-4', iconFg)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

/** Best-effort extraction of the number of high-tier hotels (4★/5★) */
function extractStars(clients: Client[]) {
  const high = clients.filter((c) => /[45]\s*[ée]toiles?/i.test(c.type ?? '')).length;
  return { high };
}
