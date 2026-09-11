import { useMemo, useState } from 'react';
import {
  Scale,
  Search,
  Truck,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Building2,
  Package,
  X,
  Delete,
  Pencil,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { OrderDetailsPanel } from '@/components/orders/OrderDetailsPanel';
import {
  useOrders,
  useOrdersRealtime,
  useReceiveOrder,
} from '@/hooks/queries/useOrders';
import { useLinenTypes } from '@/hooks/queries/useLinenTypes';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Réception atelier — refonte industriel-friendly :
 *  - Liste : KPI strip + cards d'orders à peser (grosses cibles, lecture rapide)
 *  - Form : hero compact + 2 grosses tuiles (Poids / Pièces), chacune tappable
 *  - Focus mode plein écran avec pavé numérique (décimal pour kg, entier pour pcs)
 *  - Pré-remplissage automatique depuis driverWeight / driverPieces
 *  - Aucun seuil d'écart bloquant (acceptDeviation: true en permanence)
 */

type DateFilter = 'today' | 'yesterday' | 'week' | 'all';
const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'yesterday', label: 'Hier' },
  { key: 'week', label: 'Cette semaine' },
  { key: 'all', label: 'Tout' },
];

function matchesDate(filter: DateFilter, date: Date | string | undefined): boolean {
  if (!date) return filter === 'all';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (filter === 'today') return isToday(d);
  if (filter === 'yesterday') return isYesterday(d);
  if (filter === 'week') return isThisWeek(d, { weekStartsOn: 1 });
  return true;
}

export default function ReceptionPage() {
  useOrdersRealtime();
  const { data: ordersData, isLoading } = useOrders({ pageSize: 200 });
  const orders = ordersData?.items ?? [];

  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Pesée n'est éligible QUE pour les commandes déchargées à l'usine
  // (le chauffeur a confirmé son retour avec les sacs). Tant que la round
  // n'a pas été déchargée, les commandes restent invisibles côté atelier.
  const ordersToWeigh = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.apiStatus === 'collected' &&
          o.unloadedAt != null &&
          !o.receivedWeight &&
          matchesDate(dateFilter, o.collectedAt ?? o.collectionDate),
      ),
    [orders, dateFilter],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ordersToWeigh;
    return ordersToWeigh.filter((o) =>
      `${o.orderNumber} ${o.clientName ?? ''}`.toLowerCase().includes(q),
    );
  }, [ordersToWeigh, search]);

  const totalKg = filtered.reduce(
    (s, o) => s + (o.driverWeight ?? 0) / 1000,
    0,
  );
  const totalPieces = filtered.reduce((s, o) => s + (o.driverPieces ?? 0), 0);

  const selectedOrder = orders.find((o) => o.id === selectedId);

  if (selectedOrder) {
    return (
      <WeighForm
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
            Réception · Pesée
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Pesée officielle des commandes collectées
          </p>
        </div>

        <div className="flex items-center gap-2">
          <KpiTile
            icon={Package}
            label="Commandes"
            value={String(filtered.length)}
          />
          <KpiTile
            icon={Scale}
            label="Poids estimé"
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

      {isLoading ? (
        <div className="text-sm text-ink-500 italic px-4 py-8 text-center">
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface p-10 text-center bg-ok-50 border-ok-200">
          <CheckCircle2
            className="w-12 h-12 text-ok-700 mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="text-base font-semibold text-ok-700">
            Aucune commande à peser
          </p>
          <p className="text-tiny text-ok-700 mt-1">
            {dateFilter === 'today'
              ? "Pas de réception aujourd'hui. Les commandes apparaissent ici dès que le chauffeur confirme son arrivée à l'usine."
              : 'Toutes les commandes déchargées de cette période ont été pesées.'}
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
        <p className="text-micro text-ink-500 uppercase tracking-wide">{label}</p>
        <p className="font-mono text-lg font-semibold tnum text-ink-900 leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function OrderTile({ order, onClick }: { order: any; onClick: () => void }) {
  const kg = order.driverWeight ? order.driverWeight / 1000 : 0;
  const pieces = order.driverPieces ?? 0;
  const collectedAt = order.collectedAt ? new Date(order.collectedAt) : null;
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
            <Building2
              className="w-4 h-4 text-brand-800 shrink-0"
              strokeWidth={1.75}
            />
            {order.clientName ?? '—'}
          </p>
        </div>
        <Badge variant="info" dot>
          À peser
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-paper-2 rounded-input p-2.5 text-center">
          <p className="font-mono text-xl font-semibold tnum text-ink-900 leading-tight">
            {kg.toFixed(1)}
            <span className="text-tiny font-normal text-ink-500"> kg</span>
          </p>
          <p className="text-micro text-ink-500 uppercase tracking-wide mt-0.5">
            Poids driver
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
        <span className="flex items-center gap-1">
          <Truck className="w-3 h-3" strokeWidth={1.75} />
          Collectée{' '}
          {collectedAt
            ? format(collectedAt, "d MMM 'à' HH:mm", { locale: fr })
            : '—'}
        </span>
        <span className="text-brand-800 font-semibold group-hover:underline">
          Peser →
        </span>
      </div>
    </button>
  );
}

/* ─── Formulaire de pesée ────────────────────────────────────── */

function WeighForm({
  order,
  onCancel,
  onDone,
}: {
  order: any;
  onCancel: () => void;
  onDone: () => void;
}) {
  const driverKg = order.driverWeight ? order.driverWeight / 1000 : 0;
  const driverPieces = order.driverPieces ?? 0;

  const { data: linenTypes = [] } = useLinenTypes();
  const labelByCode = useMemo(() => {
    const m: Record<string, string> = {};
    for (const lt of linenTypes) m[lt.code] = lt.name;
    return m;
  }, [linenTypes]);

  // Pré-remplissage depuis ce qu'a saisi le driver
  const [weightKg, setWeightKg] = useState<number>(driverKg);
  const [pieces, setPieces] = useState<number>(driverPieces);
  const [focused, setFocused] = useState<'weight' | 'pieces' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const receive = useReceiveOrder();
  const valid = weightKg > 0 && pieces > 0;

  const handleSubmit = async () => {
    if (!valid) {
      setError('Saisis un poids et un nombre de pièces valides.');
      return;
    }
    setError(null);
    try {
      await receive.mutateAsync({
        id: order.id,
        data: {
          receivedWeight: Math.round(weightKg * 1000),
          receivedPieces: pieces,
          acceptDeviation: true,
        },
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la pesée.');
    }
  };

  const driverItems: { type: string; quantity: number }[] =
    order.driverItems ?? [];

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

      {/* Hero : client + référence driver */}
      <div className="card-surface p-5 bg-paper border-2 border-ink-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="caps">Client</p>
            <p className="font-serif text-xl font-medium text-ink-900 mt-0.5 flex items-center gap-2">
              <Building2
                className="w-5 h-5 text-brand-800"
                strokeWidth={1.75}
              />
              {order.clientName ?? '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="caps">Référence chauffeur</p>
            <p className="font-mono text-2xl font-semibold tnum text-ink-700 leading-tight mt-0.5">
              {driverKg.toFixed(1)} kg
            </p>
            <p className="text-tiny text-ink-500">
              {driverPieces} pièces annoncées
            </p>
          </div>
        </div>

        {/* Détail items chauffeur — collapsé visuellement, juste pour comparaison */}
        {driverItems.length > 0 && (
          <details className="mt-4 pt-3 border-t border-ink-100">
            <summary className="caps cursor-pointer select-none flex items-center gap-1.5 hover:text-brand-800">
              Détail comptage chauffeur ({driverItems.length} type
              {driverItems.length > 1 ? 's' : ''})
            </summary>
            <ul className="mt-2 space-y-1">
              {driverItems.map((it, i) => (
                <li
                  key={`${it.type}-${i}`}
                  className="flex items-center justify-between gap-2 text-tiny"
                >
                  <span className="text-ink-700 truncate">
                    {labelByCode[it.type] ?? it.type}
                  </span>
                  <span className="font-mono tnum font-semibold text-ink-900 shrink-0">
                    {it.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* Tuiles de saisie principales — chacune tappable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BigInputTile
          label="Pesée atelier"
          unit="kg"
          value={weightKg > 0 ? weightKg.toFixed(1).replace('.', ',') : '—'}
          subline={
            driverKg > 0
              ? `Référence chauffeur : ${driverKg.toFixed(1)} kg`
              : 'Aucune référence chauffeur'
          }
          icon={Scale}
          highlight={weightKg > 0}
          onTap={() => setFocused('weight')}
        />
        <BigInputTile
          label="Nombre de pièces"
          unit="pcs"
          value={pieces > 0 ? String(pieces) : '—'}
          subline={
            driverPieces > 0
              ? `Référence chauffeur : ${driverPieces} pièces`
              : 'Aucune référence chauffeur'
          }
          icon={Package}
          highlight={pieces > 0}
          onTap={() => setFocused('pieces')}
        />
      </div>

      {/* Détails commande (items annoncés + photos) */}
      <OrderDetailsPanel order={order} />

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
                Pesée en cours
              </p>
              <p className="font-mono text-2xl font-semibold tnum text-ink-900 leading-tight truncate">
                {weightKg > 0 ? `${weightKg.toFixed(1)} kg` : '— kg'} ·{' '}
                <span className="text-ink-700">
                  {pieces > 0 ? `${pieces} pcs` : '— pcs'}
                </span>
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!valid || receive.isPending}
              className="gap-2 h-14 px-6 text-base shrink-0"
            >
              {receive.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
              )}
              Valider la pesée
            </Button>
          </div>
        </div>
      </div>

      {/* Focus mode keypad */}
      {focused === 'weight' && (
        <FocusKeypad
          mode="decimal"
          title="Pesée atelier"
          subtitle={
            driverKg > 0
              ? `Référence chauffeur : ${driverKg.toFixed(1)} kg`
              : undefined
          }
          unit="kg"
          initialValue={weightKg}
          onCancel={() => setFocused(null)}
          onValidate={(v) => {
            setWeightKg(v);
            setFocused(null);
          }}
        />
      )}
      {focused === 'pieces' && (
        <FocusKeypad
          mode="integer"
          title="Nombre de pièces"
          subtitle={
            driverPieces > 0
              ? `Référence chauffeur : ${driverPieces} pièces`
              : undefined
          }
          unit="pcs"
          initialValue={pieces}
          onCancel={() => setFocused(null)}
          onValidate={(v) => {
            setPieces(Math.round(v));
            setFocused(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Grosse tuile de saisie : valeur + bouton modifier ───────── */

function BigInputTile({
  label,
  value,
  unit,
  subline,
  icon: Icon,
  highlight,
  onTap,
}: {
  label: string;
  value: string;
  unit: string;
  subline?: string;
  icon: typeof Scale;
  highlight?: boolean;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        'rounded-input border-2 transition-all p-5 text-left flex flex-col gap-3 group',
        highlight
          ? 'border-brand-800 bg-brand-50 shadow-sm'
          : 'border-dashed border-ink-300 bg-paper hover:border-brand-800',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="caps flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-brand-800" strokeWidth={1.75} />
          {label}
        </p>
        <Pencil
          className={cn(
            'w-4 h-4 transition-colors',
            highlight
              ? 'text-brand-800'
              : 'text-ink-400 group-hover:text-brand-800',
          )}
          strokeWidth={1.75}
        />
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            'font-mono text-5xl font-semibold tnum leading-none',
            highlight ? 'text-brand-800' : 'text-ink-400',
          )}
        >
          {value}
        </span>
        <span
          className={cn(
            'font-mono text-base',
            highlight ? 'text-brand-800' : 'text-ink-400',
          )}
        >
          {unit}
        </span>
      </div>

      {subline && <p className="text-tiny text-ink-500">{subline}</p>}
    </button>
  );
}

/* ─── Focus mode : pavé numérique plein écran ─────────────────── */

function FocusKeypad({
  mode,
  title,
  subtitle,
  unit,
  initialValue,
  onCancel,
  onValidate,
}: {
  mode: 'decimal' | 'integer';
  title: string;
  subtitle?: string;
  unit: string;
  initialValue: number;
  onCancel: () => void;
  onValidate: (n: number) => void;
}) {
  // En décimal on stocke "12,5" comme string pour permettre la saisie
  // progressive (12, 12,, 12,5). En entier on stocke juste les chiffres.
  const [draft, setDraft] = useState<string>(() => {
    if (initialValue === 0) return '';
    if (mode === 'decimal') return initialValue.toString().replace('.', ',');
    return String(Math.round(initialValue));
  });

  const parsed =
    mode === 'decimal'
      ? parseFloat(draft.replace(',', '.')) || 0
      : parseInt(draft, 10) || 0;

  const pressDigit = (d: string) => {
    setDraft((prev) => {
      // Pas de zéro initial sauf si déjà décimal
      if (prev === '0' && d !== ',') return d;
      // Si vide et on tape virgule → "0,"
      if (prev === '' && d === ',') return '0,';
      // Si on tape virgule alors qu'il y en a déjà une → ignore
      if (d === ',' && prev.includes(',')) return prev;
      // Cap longueur raisonnable
      const next = `${prev}${d}`;
      if (next.length > 7) return prev;
      return next;
    });
  };
  const pressBack = () => setDraft((prev) => prev.slice(0, -1));
  const pressClear = () => setDraft('');

  return (
    <div className="fixed inset-0 z-40 bg-ink-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md card-surface bg-paper shadow-2xl rounded-t-2xl sm:rounded-input border-2 border-brand-800 flex flex-col max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4 border-b border-ink-200 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg sm:text-xl font-medium text-ink-900 truncate">
              {title}
            </p>
            {subtitle && (
              <p className="font-mono text-tiny text-ink-500 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
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

        {/* Scrollable body : display + keypad shrink ensemble si la hauteur est limitée */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Display */}
          <div className="px-4 py-4 sm:py-6 bg-brand-50">
            <p className="text-center text-micro text-ink-500 uppercase tracking-wide mb-2">
              Saisie
            </p>
            <p className="font-mono text-5xl sm:text-6xl md:text-7xl font-semibold tnum text-brand-800 text-center leading-none break-all">
              {draft || '0'}
              <span className="text-2xl sm:text-3xl font-normal text-brand-800/60 ml-2">
                {unit}
              </span>
            </p>
          </div>

          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-2 p-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <KeypadBtn key={d} onClick={() => pressDigit(d)}>
                {d}
              </KeypadBtn>
            ))}
            {mode === 'decimal' ? (
              <KeypadBtn onClick={() => pressDigit(',')} variant="muted">
                ,
              </KeypadBtn>
            ) : (
              <KeypadBtn onClick={pressClear} variant="muted">
                C
              </KeypadBtn>
            )}
            <KeypadBtn onClick={() => pressDigit('0')}>0</KeypadBtn>
            <KeypadBtn onClick={pressBack} variant="muted">
              <Delete className="w-6 h-6" strokeWidth={2} />
            </KeypadBtn>
          </div>

          {/* C button row for decimal mode (no room in main grid) */}
          {mode === 'decimal' && (
            <div className="px-3 pb-3">
              <button
                type="button"
                onClick={pressClear}
                className="w-full h-12 rounded-input bg-paper-2 text-ink-700 font-mono text-sm font-semibold hover:bg-ink-100 active:scale-95 transition-all"
              >
                Effacer
              </button>
            </div>
          )}
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
            onClick={() => onValidate(parsed)}
            disabled={parsed <= 0}
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
