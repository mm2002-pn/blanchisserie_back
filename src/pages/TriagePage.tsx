import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ChevronLeft,
  CheckCircle2,
  Building2,
  Loader2,
  Scale,
  Package,
  Plus,
  Trash2,
  X,
  Delete,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { useOrders, useOrdersRealtime } from '@/hooks/queries/useOrders';
import { useLinenTypes } from '@/hooks/queries/useLinenTypes';
import { useCreateTriage } from '@/hooks/queries/useTriage';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Triage atelier — refonte usage industriel :
 *  - Liste : KPI strip + cards d'orders (gros caractères, large surface clickable)
 *  - Formulaire : tuiles par type de linge avec compteur intégré (+1/+5/+10 / clear),
 *    onglets catégories pour filtrer rapidement, hero sticky avec totaux live
 *    (kg comptés vs kg pesés) et jauge d'écart visuelle.
 *  - Touch targets ≥ 56px, polices grandes, contraste fort — utilisable avec gants.
 */

type DateFilter = 'today' | 'yesterday' | 'all';
const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'yesterday', label: 'Hier' },
  { key: 'all', label: 'Tout' },
];

function matchesDate(filter: DateFilter, date: Date | string | undefined): boolean {
  if (!date) return filter === 'all';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (filter === 'today') return isToday(d);
  if (filter === 'yesterday') return isYesterday(d);
  return true;
}

export default function TriagePage() {
  useOrdersRealtime();
  const { data: ordersData } = useOrders({ pageSize: 200 });
  const orders = ordersData?.items ?? [];

  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ordersToTriage = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.apiStatus === 'received' &&
          matchesDate(dateFilter, o.receivedAt ?? o.collectedAt),
      ),
    [orders, dateFilter],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ordersToTriage;
    return ordersToTriage.filter((o) =>
      `${o.orderNumber} ${o.clientName ?? ''}`.toLowerCase().includes(q),
    );
  }, [ordersToTriage, search]);

  const selectedOrder = orders.find((o) => o.id === selectedId);

  // KPIs globaux pour le bandeau atelier
  const totalKg = filtered.reduce(
    (s, o) => s + (o.receivedWeight ?? 0) / 1000,
    0,
  );
  const totalPieces = filtered.reduce((s, o) => s + (o.receivedPieces ?? 0), 0);

  if (selectedOrder) {
    return (
      <TriageForm
        order={selectedOrder}
        onCancel={() => setSelectedId(null)}
        onDone={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="caps mb-1">Atelier</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            Triage
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Comptage des pièces par type — depuis la pesée
          </p>
        </div>

        {/* KPI strip — gros chiffres lisibles à distance */}
        <div className="flex items-center gap-2">
          <KpiTile
            icon={Package}
            label="Commandes"
            value={String(filtered.length)}
          />
          <KpiTile
            icon={Scale}
            label="Poids à trier"
            value={`${totalKg.toFixed(1)} kg`}
          />
          <KpiTile
            icon={CheckCircle2}
            label="Pièces"
            value={String(totalPieces)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {DATE_FILTERS.map((f) => {
            const active = dateFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setDateFilter(f.key)}
                className={cn(
                  'inline-flex items-center px-4 py-2 rounded-pill text-sm font-semibold border-hairline transition-colors',
                  active
                    ? 'bg-brand-800 text-paper border-brand-800'
                    : 'bg-paper text-ink-700 border-ink-200 hover:bg-paper-2',
                )}
              >
                {f.label}
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
            placeholder="Rechercher commande / hôtel…"
            className="w-72 pl-9 pr-4 py-2.5 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface p-10 text-center bg-ok-50 border-ok-200">
          <CheckCircle2
            className="w-12 h-12 text-ok-700 mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="text-base font-semibold text-ok-700">
            Aucune commande à trier
          </p>
          <p className="text-tiny text-ok-700 mt-1">
            Toutes les commandes pesées de cette période ont été triées.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((o) => (
            <OrderTile
              key={o.id}
              order={o}
              onClick={() => setSelectedId(o.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-paper border-hairline border-ink-200 rounded-input min-w-[140px]">
      <div className="w-9 h-9 rounded-input bg-paper-2 flex items-center justify-center">
        <Icon className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-micro text-ink-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="font-mono text-lg font-semibold tnum text-ink-900 leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function OrderTile({
  order,
  onClick,
}: {
  order: any;
  onClick: () => void;
}) {
  const kg = order.receivedWeight ? order.receivedWeight / 1000 : 0;
  const pieces = order.receivedPieces ?? 0;
  const receivedAt = order.receivedAt ? new Date(order.receivedAt) : null;
  return (
    <button
      onClick={onClick}
      className="card-surface p-4 text-left hover:border-brand-800 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-tiny text-ink-500 tnum mb-1">
            {order.orderNumber}
          </p>
          <p className="text-base font-semibold text-ink-900 truncate flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-brand-800 shrink-0" strokeWidth={1.75} />
            {order.clientName ?? '—'}
          </p>
        </div>
        <Badge variant="warning" dot>
          À trier
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-paper-2 rounded-input p-2.5 text-center">
          <p className="font-mono text-xl font-semibold tnum text-ink-900 leading-tight">
            {kg.toFixed(1)}
            <span className="text-tiny font-normal text-ink-500"> kg</span>
          </p>
          <p className="text-micro text-ink-500 uppercase tracking-wide mt-0.5">
            Poids pesé
          </p>
        </div>
        <div className="bg-paper-2 rounded-input p-2.5 text-center">
          <p className="font-mono text-xl font-semibold tnum text-ink-900 leading-tight">
            {pieces}
          </p>
          <p className="text-micro text-ink-500 uppercase tracking-wide mt-0.5">
            Pièces
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-tiny text-ink-500">
        <span>
          Pesée{' '}
          {receivedAt
            ? format(receivedAt, "d MMM 'à' HH:mm", { locale: fr })
            : '—'}
        </span>
        <span className="text-brand-800 font-semibold group-hover:underline">
          Trier →
        </span>
      </div>
    </button>
  );
}

/* ─── Formulaire de triage ────────────────────────────────────── */

type LinenType = {
  id: string;
  code: string;
  name: string;
  category: string;
  averageWeight: number;
  billingMode: string;
};

function TriageForm({
  order,
  onCancel,
  onDone,
}: {
  order: any;
  onCancel: () => void;
  onDone: () => void;
}) {
  const { data: linenTypes = [] } = useLinenTypes();
  const triage = useCreateTriage();

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefilledRef = useRef(false);

  /** Pré-remplissage : priorité au comptage chauffeur (collecte), fallback estimation client. */
  useEffect(() => {
    if (prefilledRef.current) return;
    if (linenTypes.length === 0) return;
    const idByCode: Record<string, string> = {};
    for (const lt of linenTypes) idByCode[lt.code] = lt.id;
    const source: { type: string; quantity: number }[] =
      (order.driverItems?.length ? order.driverItems : order.estimatedItemsRaw) ?? [];
    if (source.length === 0) return;
    const next: Record<string, number> = {};
    for (const it of source) {
      const id = idByCode[it.type];
      if (id && it.quantity > 0) next[id] = it.quantity;
    }
    if (Object.keys(next).length > 0) {
      setCounts(next);
      prefilledRef.current = true;
    }
  }, [linenTypes, order.driverItems, order.estimatedItemsRaw]);

  const setCount = (id: string, value: number) => {
    setCounts((prev) => {
      const next = { ...prev };
      if (value <= 0) delete next[id];
      else next[id] = value;
      return next;
    });
  };

  const ltById = useMemo(() => {
    const m: Record<string, LinenType> = {};
    for (const lt of linenTypes) m[lt.id] = lt as LinenType;
    return m;
  }, [linenTypes]);

  const totals = useMemo(() => {
    let pieces = 0;
    let weightG = 0;
    for (const [id, n] of Object.entries(counts)) {
      const lt = ltById[id];
      if (!lt) continue;
      pieces += n;
      weightG += n * (lt.averageWeight ?? 0);
    }
    return { pieces, weightG, weightKg: weightG / 1000 };
  }, [counts, ltById]);

  const expectedKg = order.receivedWeight ? order.receivedWeight / 1000 : 0;
  const valid = totals.pieces > 0;

  /** Articles à confirmer : tuiles avec count > 0 (pré-rempli ou ajouté manuellement). */
  const visibleIds = useMemo(
    () =>
      Object.keys(counts).filter((id) => ltById[id] !== undefined && counts[id] > 0),
    [counts, ltById],
  );

  /** Articles "non encore ajoutés" — pour la recherche dans le drawer. */
  const remainingTypes = useMemo(
    () => linenTypes.filter((lt) => !counts[lt.id] || counts[lt.id] === 0),
    [linenTypes, counts],
  );

  const handleSubmit = async () => {
    if (!valid) {
      setError('Saisis au moins une pièce.');
      return;
    }
    setError(null);
    const items = Object.entries(counts).map(([linenTypeId, n]) => ({
      linenTypeId,
      pieces: n,
      weight: n * (ltById[linenTypeId]?.averageWeight ?? 0),
    }));
    try {
      await triage.mutateAsync({
        orderId: order.id,
        data: { items, acceptDeviation: true },
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du triage.');
      setRecapOpen(false);
    }
  };

  const focusedLinen = focusedId ? ltById[focusedId] : null;

  return (
    <div className="space-y-4 pb-32">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={onCancel}
          className="gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          Retour
        </Button>
        <div className="text-right">
          <p className="text-micro text-ink-500 uppercase tracking-wide">
            Commande
          </p>
          <p className="font-mono text-lg font-semibold tnum text-ink-900 leading-tight">
            {order.orderNumber}
          </p>
        </div>
      </div>

      {/* Hero — compact, sans onglets ni jauge bruyante */}
      <div className="card-surface p-5 bg-paper border-2 border-ink-200">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="caps">Client</p>
            <p className="font-serif text-xl font-medium text-ink-900 mt-0.5 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-800" strokeWidth={1.75} />
              {order.clientName ?? '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="caps">Pesée atelier</p>
            <p className="font-mono text-3xl font-semibold tnum text-ink-900 leading-tight mt-0.5">
              {expectedKg.toFixed(1)}
              <span className="text-base font-normal text-ink-500"> kg</span>
            </p>
            <p className="text-tiny text-ink-500">
              {order.receivedPieces ?? 0} pièces annoncées
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <BigStat
            label="Pièces comptées"
            value={String(totals.pieces)}
            highlight
          />
          <BigStat
            label="Poids calculé"
            value={`${totals.weightKg.toFixed(1)} kg`}
          />
        </div>
      </div>

      {/* Articles à confirmer — vue épurée, ne montre que ce qui est pré-rempli ou ajouté */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="caps">Articles à confirmer</p>
          <p className="text-tiny text-ink-500">
            {visibleIds.length} type{visibleIds.length > 1 ? 's' : ''}
          </p>
        </div>

        {visibleIds.length === 0 ? (
          <div className="card-surface p-8 text-center bg-paper-2">
            <Package className="w-10 h-10 text-ink-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-ink-700">
              Aucun article pré-rempli
            </p>
            <p className="text-tiny text-ink-500 mt-1">
              Appuie sur "Ajouter un type d'article" pour commencer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {visibleIds.map((id) => {
              const lt = ltById[id];
              if (!lt) return null;
              return (
                <LinenChip
                  key={id}
                  linenType={lt}
                  count={counts[id] ?? 0}
                  onTap={() => setFocusedId(id)}
                  onClear={() => setCount(id, 0)}
                />
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 py-4 rounded-input border-2 border-dashed border-ink-300 bg-paper hover:bg-paper-2 hover:border-brand-800 hover:text-brand-800 text-ink-700 font-semibold text-sm transition-colors"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
          Ajouter un type d'article
        </button>
      </div>

      {/* Floating action bar — contraint à la zone de contenu (après la sidebar w-64) */}
      <div className="fixed bottom-4 left-64 right-0 px-4 z-20 pointer-events-none">
        <div className="mx-auto w-full max-w-[960px] card-surface p-4 shadow-xl border-2 border-brand-800 bg-paper pointer-events-auto">
          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 px-3 py-2 rounded-input border-hairline border-rose-200 mb-3">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <p className="text-micro text-ink-500 uppercase tracking-wide">
                Triage en cours
              </p>
              <p className="font-mono text-2xl font-semibold tnum text-ink-900 leading-tight truncate">
                {totals.pieces} pcs ·{' '}
                <span className="text-ink-700">
                  {totals.weightKg.toFixed(1)} kg
                </span>
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => {
                if (!valid) {
                  setError('Saisis au moins une pièce.');
                  return;
                }
                setError(null);
                setRecapOpen(true);
              }}
              disabled={!valid || triage.isPending}
              className="gap-2 h-14 px-6 text-base shrink-0"
            >
              <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
              Confirmer le triage
            </Button>
          </div>
        </div>
      </div>

      {/* Focus mode — pavé numérique plein écran */}
      {focusedLinen && (
        <FocusKeypad
          linenType={focusedLinen}
          initialCount={counts[focusedLinen.id] ?? 0}
          expectedKg={expectedKg}
          onCancel={() => setFocusedId(null)}
          onValidate={(n) => {
            setCount(focusedLinen.id, n);
            setFocusedId(null);
          }}
        />
      )}

      {/* Drawer "Ajouter un article" */}
      {drawerOpen && (
        <AddTypeDrawer
          types={remainingTypes as LinenType[]}
          onClose={() => setDrawerOpen(false)}
          onPick={(id) => {
            setDrawerOpen(false);
            setFocusedId(id);
          }}
        />
      )}

      {/* Recap modal avant confirmation finale */}
      {recapOpen && (
        <RecapModal
          counts={counts}
          ltById={ltById}
          totals={totals}
          expectedKg={expectedKg}
          isPending={triage.isPending}
          onCancel={() => setRecapOpen(false)}
          onEdit={(id) => {
            setRecapOpen(false);
            setFocusedId(id);
          }}
          onConfirm={handleSubmit}
        />
      )}
    </div>
  );
}

/* ─── Tuile compacte affichée dans la vue épurée ──────────────── */

function LinenChip({
  linenType,
  count,
  onTap,
  onClear,
}: {
  linenType: LinenType;
  count: number;
  onTap: () => void;
  onClear: () => void;
}) {
  const subKg = (count * (linenType.averageWeight ?? 0)) / 1000;
  return (
    <button
      type="button"
      onClick={onTap}
      className="rounded-input border-2 border-brand-800 bg-brand-50 shadow-sm hover:shadow-md transition-all p-4 text-left flex flex-col gap-2 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900 truncate leading-tight">
            {linenType.name}
          </p>
          <p className="font-mono text-micro text-ink-500 mt-0.5">
            {linenType.code} · {linenType.averageWeight}g
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="text-ink-400 hover:text-rose-700 p-1 -mr-1 -mt-1"
          aria-label="Retirer cet article"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex items-baseline justify-between">
        <p className="font-mono text-5xl font-semibold tnum text-brand-800 leading-none">
          {count}
        </p>
        <p className="font-mono text-tiny tnum text-ink-500">
          {subKg > 0 ? `${subKg.toFixed(1)} kg` : '—'}
        </p>
      </div>

      <p className="text-micro text-brand-800 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        Tap pour ajuster →
      </p>
    </button>
  );
}

function BigStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-input px-3 py-2.5 border-hairline',
        highlight
          ? 'bg-brand-50 border-brand-200'
          : 'bg-paper-2 border-ink-200',
      )}
    >
      <p className="text-micro text-ink-500 uppercase tracking-wide">{label}</p>
      <p
        className={cn(
          'font-mono tnum text-2xl font-semibold leading-tight mt-0.5',
          highlight ? 'text-brand-800' : 'text-ink-900',
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ─── Focus mode : pavé numérique plein écran ─────────────────── */

function FocusKeypad({
  linenType,
  initialCount,
  expectedKg,
  onCancel,
  onValidate,
}: {
  linenType: LinenType;
  initialCount: number;
  expectedKg: number;
  onCancel: () => void;
  onValidate: (n: number) => void;
}) {
  const [draft, setDraft] = useState<string>(String(initialCount || ''));

  const value = parseInt(draft, 10) || 0;
  const subKg = (value * (linenType.averageWeight ?? 0)) / 1000;

  const pressDigit = (d: string) => {
    setDraft((prev) => {
      if (prev === '0') return d;
      const next = `${prev}${d}`;
      return next.length > 5 ? prev : next;
    });
  };
  const pressBack = () => setDraft((prev) => prev.slice(0, -1));
  const pressClear = () => setDraft('');
  const bump = (delta: number) => {
    setDraft(String(Math.max(0, value + delta)));
  };

  return (
    <div className="fixed inset-0 z-40 bg-ink-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md card-surface bg-paper shadow-2xl rounded-t-2xl sm:rounded-input border-2 border-brand-800 flex flex-col max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4 border-b border-ink-200 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg sm:text-xl font-medium text-ink-900 truncate">
              {linenType.name}
            </p>
            <p className="font-mono text-tiny text-ink-500 mt-0.5 truncate">
              {linenType.code} · {linenType.averageWeight}g/pièce
              {expectedKg > 0 && (
                <> · cible {expectedKg.toFixed(1)} kg pesés</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-input flex items-center justify-center text-ink-500 hover:bg-paper-2 shrink-0"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable body : display + quick-add + keypad */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Display */}
          <div className="px-4 py-4 sm:py-6 bg-brand-50">
            <p className="text-center text-micro text-ink-500 uppercase tracking-wide mb-2">
              Quantité comptée
            </p>
            <p className="font-mono text-5xl sm:text-6xl md:text-7xl font-semibold tnum text-brand-800 text-center leading-none break-all">
              {draft || '0'}
            </p>
            <p className="text-center text-tiny text-ink-500 mt-2">
              ≈ {subKg.toFixed(2).replace('.', ',')} kg
            </p>
          </div>

          {/* Quick-add row */}
          <div className="grid grid-cols-3 gap-2 p-3 border-b border-ink-200">
            <QuickAdd label="+5" onClick={() => bump(5)} />
            <QuickAdd label="+10" onClick={() => bump(10)} />
            <QuickAdd label="+25" onClick={() => bump(25)} />
          </div>

          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-2 p-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <KeypadBtn key={d} onClick={() => pressDigit(d)}>
                {d}
              </KeypadBtn>
            ))}
            <KeypadBtn onClick={pressClear} variant="muted">
              C
            </KeypadBtn>
            <KeypadBtn onClick={() => pressDigit('0')}>0</KeypadBtn>
            <KeypadBtn onClick={pressBack} variant="muted">
              <Delete className="w-6 h-6" strokeWidth={2} />
            </KeypadBtn>
          </div>
        </div>

        {/* Action buttons — toujours visibles */}
        <div className="flex gap-2 p-3 border-t border-ink-200 shrink-0">
          <Button
            variant="secondary"
            size="lg"
            onClick={onCancel}
            className="flex-1 h-12 sm:h-14 text-sm sm:text-base"
          >
            Annuler
          </Button>
          <Button
            size="lg"
            onClick={() => onValidate(value)}
            className="flex-[2] h-12 sm:h-14 text-sm sm:text-base gap-2"
          >
            <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
            Valider
          </Button>
        </div>
      </div>
    </div>
  );
}

function KeypadBtn({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'muted';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-16 rounded-input font-mono text-2xl font-semibold tnum flex items-center justify-center transition-colors active:scale-95',
        variant === 'muted'
          ? 'bg-paper-2 text-ink-700 hover:bg-ink-100'
          : 'bg-paper border-hairline border-ink-200 text-ink-900 hover:bg-paper-2 active:bg-ink-100',
      )}
    >
      {children}
    </button>
  );
}

function QuickAdd({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 rounded-input bg-brand-800 text-paper font-mono text-sm font-semibold tnum hover:bg-brand-900 active:scale-95 transition-all"
    >
      {label}
    </button>
  );
}

/* ─── Drawer "Ajouter un article" ─────────────────────────────── */

function AddTypeDrawer({
  types,
  onClose,
  onPick,
}: {
  types: LinenType[];
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return types;
    return types.filter(
      (lt) =>
        lt.name.toLowerCase().includes(q) ||
        lt.code.toLowerCase().includes(q),
    );
  }, [types, query]);

  // Group by category for visual scanning
  const grouped = useMemo(() => {
    const g = new Map<string, LinenType[]>();
    for (const lt of filtered) {
      const cat = lt.category;
      if (!g.has(cat)) g.set(cat, []);
      g.get(cat)!.push(lt);
    }
    return Array.from(g.entries());
  }, [filtered]);

  return (
    <div className="fixed inset-0 z-40 bg-ink-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg card-surface bg-paper shadow-2xl rounded-t-2xl sm:rounded-input border-2 border-brand-800 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-ink-200">
          <p className="font-serif text-xl font-medium text-ink-900">
            Ajouter un type d'article
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-input flex items-center justify-center text-ink-500 hover:bg-paper-2"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="p-4 border-b border-ink-200">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
              strokeWidth={1.75}
            />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article…"
              className="w-full pl-10 pr-4 py-3 text-base bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-tiny text-ink-500">
              Aucun article correspondant.
            </p>
          ) : (
            grouped.map(([cat, items]) => (
              <div key={cat}>
                <p className="caps px-4 pt-3 pb-1 bg-paper-2/50 sticky top-0">
                  {cat}
                </p>
                <div className="divide-y divide-ink-100">
                  {items.map((lt) => (
                    <button
                      key={lt.id}
                      type="button"
                      onClick={() => onPick(lt.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-paper-2 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">
                          {lt.name}
                        </p>
                        <p className="font-mono text-micro text-ink-500 mt-0.5">
                          {lt.code} · {lt.averageWeight}g
                        </p>
                      </div>
                      <Plus
                        className="w-5 h-5 text-brand-800 shrink-0"
                        strokeWidth={2}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Modal récap avant confirmation finale ───────────────────── */

function RecapModal({
  counts,
  ltById,
  totals,
  expectedKg,
  isPending,
  onCancel,
  onEdit,
  onConfirm,
}: {
  counts: Record<string, number>;
  ltById: Record<string, LinenType>;
  totals: { pieces: number; weightKg: number };
  expectedKg: number;
  isPending: boolean;
  onCancel: () => void;
  onEdit: (id: string) => void;
  onConfirm: () => void;
}) {
  const rows = Object.entries(counts)
    .map(([id, n]) => ({ id, n, lt: ltById[id] }))
    .filter((r) => r.lt && r.n > 0)
    .sort((a, b) => b.n - a.n);

  // Jauge de remplissage (purement visuelle, non bloquante)
  const pct =
    expectedKg > 0
      ? Math.min(100, Math.max(0, (totals.weightKg / expectedKg) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-40 bg-ink-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg card-surface bg-paper shadow-2xl rounded-t-2xl sm:rounded-input border-2 border-brand-800 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-ink-200">
          <p className="font-serif text-xl font-medium text-ink-900">
            Récapitulatif du triage
          </p>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="w-10 h-10 rounded-input flex items-center justify-center text-ink-500 hover:bg-paper-2 disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Totaux */}
        <div className="p-4 grid grid-cols-2 gap-3 bg-paper-2 border-b border-ink-200">
          <BigStat
            label="Pièces totales"
            value={String(totals.pieces)}
            highlight
          />
          <BigStat
            label="Poids calculé"
            value={`${totals.weightKg.toFixed(1)} kg`}
          />
        </div>

        {/* Jauge légère vs pesée */}
        {expectedKg > 0 && (
          <div className="px-4 pt-3 pb-1">
            <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-800 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-micro text-ink-500 font-mono tnum mt-1 text-right">
              {totals.weightKg.toFixed(1)} kg / cible {expectedKg.toFixed(1)} kg
            </p>
          </div>
        )}

        {/* Détail */}
        <div className="overflow-y-auto flex-1">
          <p className="caps px-4 pt-3 pb-1">
            Détail · {rows.length} type{rows.length > 1 ? 's' : ''}
          </p>
          <div className="divide-y divide-ink-100">
            {rows.map(({ id, n, lt }) => (
              <button
                key={id}
                type="button"
                onClick={() => onEdit(id)}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-paper-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">
                    {lt!.name}
                  </p>
                  <p className="font-mono text-micro text-ink-500 mt-0.5">
                    {lt!.code} · {((n * lt!.averageWeight) / 1000).toFixed(2)} kg
                  </p>
                </div>
                <p className="font-mono text-2xl font-semibold tnum text-brand-800">
                  {n}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 p-3 border-t border-ink-200">
          <Button
            variant="secondary"
            size="lg"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 h-14 text-base"
          >
            Modifier
          </Button>
          <Button
            size="lg"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-[2] h-14 text-base gap-2"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
            )}
            Confirmer le triage
          </Button>
        </div>
      </div>
    </div>
  );
}
