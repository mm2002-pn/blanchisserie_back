import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Smartphone,
  AlertTriangle,
  Truck,
  Search,
  Calendar,
  Package,
  X,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday, isBefore, addHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Button, Card, CardContent, Input, Select } from '@/components/ui';
import { formatWeight, cn } from '@/lib/utils';
import { useOrders, useOrdersRealtime } from '@/hooks/queries/useOrders';
import { useVehicles } from '@/hooks/queries/useVehicles';
import {
  useCollectionRoundsRealtime,
  useCreateCollectionRound,
} from '@/hooks/queries/useCollectionRounds';
import { ROUTES } from '@/lib/constants';
import type { MappedOrder } from '@/lib/api/orders.api';
import type { RoundType } from '@/lib/api/collectionRounds.api';

type DateChip = 'all' | 'overdue' | 'today' | 'tomorrow' | 'week';
type SortKey = 'date' | 'client' | 'weight' | 'city';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 50;

/**
 * Page de création de tournée — design table dense pour scale 1000+ commandes.
 *
 *  - Filtres en haut : recherche, date (chips), ville
 *  - Tableau triable + pagination 50/page
 *  - Indicateur d'urgence par ligne (badge En retard pulsé / Imminent / Aujourd'hui)
 *  - Sélection "tout filtré" en un clic
 *  - Sidebar sticky : config tournée + résumé
 */
export default function RoutePlanningNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Realtime : on écoute orders ET rounds. Quand un chauffeur collecte/livre
  // ou qu'une tournée est créée/annulée/complétée sur mobile, la liste des
  // commandes disponibles se rafraîchit sans recharger la page.
  useOrdersRealtime();
  useCollectionRoundsRealtime();

  // Type de tournée : passé via query param ?type=collect|delivery
  const roundType: RoundType =
    searchParams.get('type') === 'delivery' ? 'delivery' : 'collect';
  const isDelivery = roundType === 'delivery';

  const { data: ordersResp } = useOrders({ pageSize: 500 });
  const { data: vehicles = [] } = useVehicles();
  const create = useCreateCollectionRound();

  const availableOrders = useMemo(() => {
    const items = ordersResp?.items ?? [];
    if (isDelivery) {
      // Livraison : commandes prêtes (status=ready) non encore assignées à un livreur
      return items.filter(
        (o) => o.apiStatus === 'ready' && !o.deliveryDriverId,
      );
    }
    // Collecte : commandes en attente non assignées
    return items.filter(
      (o) => o.status === 'En attente' && !o.assignedDriverId,
    );
  }, [ordersResp, isDelivery]);

  /* ── Filtres ── */
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateChip>('all');
  const [cityFilter, setCityFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  /* ── Form ── */
  const [vehicleId, setVehicleId] = useState('');
  const [plannedAt, setPlannedAt] = useState(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return toLocalDateTime(d);
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const o of availableOrders) {
      const c = (o as MappedOrder & { hotelCity?: string }).hotelCity;
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [availableOrders]);

  /* ── Application des filtres ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    return availableOrders.filter((o) => {
      // En collecte : filtre sur la date prévue de ramassage
      // En livraison : filtre sur la date où la commande est devenue ready (updatedAt)
      const d = isDelivery ? (o.updatedAt ?? o.createdAt) : o.collectionDate;
      if (isDelivery) {
        const hoursReady = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
        // "overdue" en delivery = prêt depuis > 24h
        if (dateFilter === 'overdue' && hoursReady < 24) return false;
        // "today" en delivery = prêt aujourd'hui
        if (dateFilter === 'today' && !isToday(d)) return false;
        // "tomorrow" en delivery → masqué/non pertinent : on ignore (laisse passer)
        if (dateFilter === 'tomorrow') return false;
        if (dateFilter === 'week') {
          // Prêt depuis moins d'une semaine
          if (hoursReady > 24 * 7) return false;
        }
      } else {
        if (dateFilter === 'overdue' && !isBefore(d, now)) return false;
        if (dateFilter === 'today' && !isToday(d)) return false;
        if (dateFilter === 'tomorrow' && !isTomorrow(d)) return false;
        if (dateFilter === 'week') {
          const inWeek = isBefore(d, addHours(now, 24 * 7)) && !isBefore(d, now);
          if (!inWeek) return false;
        }
      }
      if (cityFilter) {
        const c = (o as MappedOrder & { hotelCity?: string }).hotelCity;
        if (c !== cityFilter) return false;
      }
      if (q) {
        const hay = `${o.orderNumber} ${o.clientName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [availableOrders, search, dateFilter, cityFilter, isDelivery]);

  /* ── Tri ── */
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date':
          cmp = isDelivery
            ? (a.updatedAt ?? a.createdAt).getTime() -
              (b.updatedAt ?? b.createdAt).getTime()
            : a.collectionDate.getTime() - b.collectionDate.getTime();
          break;
        case 'client':
          cmp = (a.clientName ?? '').localeCompare(b.clientName ?? '');
          break;
        case 'weight':
          cmp = (a.estimatedWeight ?? 0) - (b.estimatedWeight ?? 0);
          break;
        case 'city': {
          const ac = (a as MappedOrder & { hotelCity?: string }).hotelCity ?? '';
          const bc = (b as MappedOrder & { hotelCity?: string }).hotelCity ?? '';
          cmp = ac.localeCompare(bc);
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir, isDelivery]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  /* ── Counters ──
   *  Collect : "en retard" = date prévue dépassée
   *  Delivery : "à livrer rapidement" = prêt depuis > 24h */
  const overdueCount = useMemo(() => {
    const now = new Date();
    if (isDelivery) {
      return availableOrders.filter((o) => {
        const ready = (o.updatedAt ?? o.createdAt);
        const hoursReady = (now.getTime() - ready.getTime()) / (1000 * 60 * 60);
        return hoursReady >= 24;
      }).length;
    }
    return availableOrders.filter((o) => isBefore(o.collectionDate, now)).length;
  }, [availableOrders, isDelivery]);

  const todayCount = useMemo(
    () =>
      isDelivery
        ? availableOrders.filter((o) => isToday((o.updatedAt ?? o.createdAt))).length
        : availableOrders.filter((o) => isToday(o.collectionDate)).length,
    [availableOrders, isDelivery],
  );

  const selectedOrders = useMemo(
    () => availableOrders.filter((o) => selectedIds.has(o.id)),
    [availableOrders, selectedIds],
  );
  const selectedWeight = selectedOrders.reduce(
    (s, o) => s + (o.estimatedWeight ?? 0),
    0,
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicles, vehicleId],
  );
  const enrolledVehicles = vehicles.filter(
    (v) => v.enrolledDriverId && v.status === 'Disponible',
  );

  /* ── Actions ── */
  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    const allFilteredSelected = sorted.every((o) => selectedIds.has(o.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) sorted.forEach((o) => next.delete(o.id));
      else sorted.forEach((o) => next.add(o.id));
      return next;
    });
  };

  const togglePage = () => {
    const allPageSelected = paginated.every((o) => selectedIds.has(o.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) paginated.forEach((o) => next.delete(o.id));
      else paginated.forEach((o) => next.add(o.id));
      return next;
    });
  };

  const setSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!vehicleId) {
      setError('Sélectionne un véhicule');
      return;
    }
    if (selectedOrders.length === 0) {
      setError('Sélectionne au moins une commande');
      return;
    }
    if (!selectedVehicle?.enrolledDriverId) {
      setError(
        "Le véhicule n'a pas d'équipage enrôlé. Configure dans Paramètres → Véhicules.",
      );
      return;
    }
    try {
      const round = await create.mutateAsync({
        type: roundType,
        vehicleId,
        plannedAt: new Date(plannedAt).toISOString(),
        orderIds: Array.from(selectedIds),
        notes: notes.trim() || undefined,
      });
      toast.success(`Tournée ${round.number} créée · ${selectedOrders.length} commandes`);
      navigate(ROUTES.ROUTE_PLANNING);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec création tournée');
    }
  };

  const allFilteredSelected =
    sorted.length > 0 && sorted.every((o) => selectedIds.has(o.id));
  const somePageSelected = paginated.some((o) => selectedIds.has(o.id));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(ROUTES.ROUTE_PLANNING)}
          className="gap-1.5 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          Retour
        </Button>
        <div className="flex-1 min-w-0">
          <p className="caps">Planification</p>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            Nouvelle tournée de {isDelivery ? 'livraison' : 'collecte'}
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            {availableOrders.length} commande(s){' '}
            {isDelivery ? 'prête(s) à livrer' : 'en attente'}
            {isDelivery
              ? ` · ${overdueCount} en attente >24h · ${todayCount} prête(s) aujourd'hui`
              : ` · ${overdueCount} en retard · ${todayCount} pour aujourd'hui`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Colonne gauche : table */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filtres */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
                    strokeWidth={1.75}
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Rechercher client ou n° commande…"
                    className="w-full pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
                  />
                </div>
                {cities.length > 0 && (
                  <select
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900"
                  >
                    <option value="">Toutes villes</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  label={`Tous · ${availableOrders.length}`}
                  active={dateFilter === 'all'}
                  onClick={() => {
                    setDateFilter('all');
                    setPage(1);
                  }}
                />
                {overdueCount > 0 && (
                  <FilterChip
                    label={
                      isDelivery
                        ? `À livrer rapidement · ${overdueCount}`
                        : `En retard · ${overdueCount}`
                    }
                    active={dateFilter === 'overdue'}
                    onClick={() => {
                      setDateFilter('overdue');
                      setPage(1);
                    }}
                    tint="danger"
                  />
                )}
                <FilterChip
                  label={
                    isDelivery
                      ? `Prêtes aujourd'hui · ${todayCount}`
                      : `Aujourd'hui · ${todayCount}`
                  }
                  active={dateFilter === 'today'}
                  onClick={() => {
                    setDateFilter('today');
                    setPage(1);
                  }}
                  tint="warn"
                />
                {!isDelivery && (
                  <FilterChip
                    label="Demain"
                    active={dateFilter === 'tomorrow'}
                    onClick={() => {
                      setDateFilter('tomorrow');
                      setPage(1);
                    }}
                  />
                )}
                <FilterChip
                  label={isDelivery ? 'Prêtes cette semaine' : 'Cette semaine'}
                  active={dateFilter === 'week'}
                  onClick={() => {
                    setDateFilter('week');
                    setPage(1);
                  }}
                />

                {(search || cityFilter || dateFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setCityFilter('');
                      setDateFilter('all');
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-tiny text-ink-600 hover:text-ink-900"
                  >
                    <X className="w-3 h-3" strokeWidth={2} />
                    Réinitialiser
                  </button>
                )}
              </div>

              {/* Compteur résultats + select-all */}
              <div className="flex items-center justify-between text-tiny text-ink-500 border-t border-ink-200 pt-2">
                <span>
                  {sorted.length} résultat(s) · {selectedOrders.length} sélectionnée(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePage}
                    className="text-brand-800 font-semibold hover:underline"
                  >
                    {paginated.every((o) => selectedIds.has(o.id))
                      ? 'Désélectionner page'
                      : 'Sélectionner page'}
                  </button>
                  {sorted.length > PAGE_SIZE && (
                    <>
                      <span className="text-ink-300">·</span>
                      <button
                        type="button"
                        onClick={toggleAllFiltered}
                        className="text-brand-800 font-semibold hover:underline"
                      >
                        {allFilteredSelected
                          ? `Désélectionner ${sorted.length} filtrés`
                          : `Sélectionner ${sorted.length} filtrés`}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <div className="bg-paper rounded-card border-hairline border-ink-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-paper-2 border-b border-ink-200">
                    <th className="px-2 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={
                          paginated.length > 0 &&
                          paginated.every((o) => selectedIds.has(o.id))
                        }
                        ref={(el) => {
                          if (el)
                            el.indeterminate =
                              somePageSelected &&
                              !paginated.every((o) => selectedIds.has(o.id));
                        }}
                        onChange={togglePage}
                        className="w-4 h-4 accent-brand-800"
                      />
                    </th>
                    <SortableTh
                      label={isDelivery ? 'Prête depuis' : 'Date prévue'}
                      sortKey="date"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                    />
                    <th className="px-3 py-2 text-left text-micro font-semibold uppercase tracking-caps text-ink-500">
                      État
                    </th>
                    <SortableTh
                      label="Client"
                      sortKey="client"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                    />
                    <SortableTh
                      label="Ville"
                      sortKey="city"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                    />
                    <th className="px-3 py-2 text-left text-micro font-semibold uppercase tracking-caps text-ink-500">
                      N° commande
                    </th>
                    <SortableTh
                      label="Poids"
                      sortKey="weight"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                      align="right"
                    />
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-ink-500"
                      >
                        <Package
                          className="w-10 h-10 text-ink-400 mx-auto mb-2"
                          strokeWidth={1.5}
                        />
                        {availableOrders.length === 0
                          ? isDelivery
                            ? 'Aucune commande prête à livrer. Les commandes apparaissent ici une fois le nettoyage terminé (statut « Prête »).'
                            : 'Aucune commande en attente de collecte.'
                          : 'Aucun résultat pour ces filtres.'}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((o) => {
                      const checked = selectedIds.has(o.id);
                      const urgency = isDelivery
                        ? computeDeliveryUrgency((o.updatedAt ?? o.createdAt))
                        : computeUrgency(o.collectionDate);
                      const city =
                        (o as MappedOrder & { hotelCity?: string }).hotelCity ?? '—';
                      return (
                        <tr
                          key={o.id}
                          onClick={() => toggle(o.id)}
                          className={cn(
                            'border-b border-ink-100 cursor-pointer transition-colors',
                            checked ? 'bg-brand-50' : 'hover:bg-paper-2',
                            (urgency.kind === 'overdue' ||
                              urgency.kind === 'ready-old') &&
                              !checked &&
                              'bg-rose-50/40',
                          )}
                        >
                          <td className="px-2 py-2.5 w-8">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(o.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 accent-brand-800"
                            />
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar
                                className="w-3 h-3 text-ink-400 shrink-0"
                                strokeWidth={1.75}
                              />
                              <span className="font-mono text-tiny tnum text-ink-800">
                                {format(
                                  isDelivery
                                    ? (o.updatedAt ?? o.createdAt)
                                    : o.collectionDate,
                                  'dd/MM HH:mm',
                                  { locale: fr },
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <UrgencyBadge urgency={urgency} />
                          </td>
                          <td className="px-3 py-2.5 max-w-[200px] truncate font-semibold text-ink-900">
                            {o.clientName ?? '—'}
                          </td>
                          <td className="px-3 py-2.5 text-ink-700">{city}</td>
                          <td className="px-3 py-2.5 font-mono text-tiny text-ink-500">
                            {o.orderNumber}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tnum text-ink-900">
                            {formatWeight(o.estimatedWeight ?? 0)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sorted.length > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-ink-200 bg-paper-2">
                <p className="text-tiny text-ink-500">
                  Page {safePage} sur {totalPages} · {sorted.length} résultats
                </p>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                    disabled={safePage === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite : config + résumé (sticky) */}
        <div className="space-y-3">
          <div className="sticky top-4 space-y-3">
            <Card>
              <CardContent className="p-4 space-y-4">
                <p className="caps">Configuration tournée</p>

                <Select
                  label="Véhicule"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                  options={[
                    { label: '— Choisir —', value: '' },
                    ...enrolledVehicles.map((v) => ({
                      label: `${v.matricule} · ${v.enrolledDriver?.firstName} ${v.enrolledDriver?.lastName}`,
                      value: v.id,
                    })),
                  ]}
                  hint={`${enrolledVehicles.length} véhicule(s) avec équipage`}
                />

                <Input
                  label="Date + heure tournée"
                  type="datetime-local"
                  value={plannedAt}
                  onChange={(e) => setPlannedAt(e.target.value)}
                  required
                />

                <div>
                  <label className="block text-tiny font-medium text-ink-700 mb-1.5">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Instructions chauffeur…"
                    className="w-full px-3 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {selectedVehicle && (
              <Card>
                <CardContent className="p-4 space-y-1.5">
                  <p className="caps">Équipage enrôlé</p>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
                    {selectedVehicle.enrolledDriver ? (
                      <span className="font-semibold text-ink-900">
                        {selectedVehicle.enrolledDriver.firstName}{' '}
                        {selectedVehicle.enrolledDriver.lastName}
                      </span>
                    ) : (
                      <span className="italic text-ink-500">Aucun chauffeur</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
                    {selectedVehicle.enrolledPda ? (
                      <span className="font-mono text-ink-900">
                        {selectedVehicle.enrolledPda.reference}
                      </span>
                    ) : (
                      <span className="italic text-ink-500">Aucun PDA</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
                    <span className="text-ink-900">
                      Capacité : {selectedVehicle.capacityKg} kg
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card
              className={
                selectedOrders.length > 0 ? 'bg-brand-50 border-brand-200' : ''
              }
            >
              <CardContent className="p-4 space-y-2">
                <p
                  className={cn(
                    'caps',
                    selectedOrders.length > 0 && 'text-brand-800',
                  )}
                >
                  Résumé
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-700">Commandes</span>
                  <span className="font-semibold text-ink-900 tnum">
                    {selectedOrders.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-700">Poids total</span>
                  <span className="font-mono font-semibold text-ink-900">
                    {formatWeight(selectedWeight)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {selectedVehicle &&
              selectedWeight > selectedVehicle.capacityKg * 1000 && (
                <div className="flex items-start gap-2 rounded-input bg-amber-50 border-hairline border-amber-200 p-3 text-tiny text-amber-900">
                  <AlertTriangle
                    className="w-4 h-4 shrink-0 mt-0.5"
                    strokeWidth={1.75}
                  />
                  <span>
                    Poids ({formatWeight(selectedWeight)}) dépasse capacité (
                    {selectedVehicle.capacityKg} kg).
                  </span>
                </div>
              )}

            {error && (
              <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={create.isPending}
              disabled={selectedOrders.length === 0 || !vehicleId}
              className="gap-1.5 w-full"
              size="lg"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
              Créer la tournée
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(ROUTES.ROUTE_PLANNING)}
              className="w-full"
            >
              Annuler
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─── Sous-composants ─── */

function FilterChip({
  label,
  active,
  onClick,
  tint,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tint?: 'danger' | 'warn';
}) {
  const activeBg =
    tint === 'danger'
      ? 'bg-rose-600 text-paper'
      : tint === 'warn'
        ? 'bg-warn-600 text-paper'
        : 'bg-ink-900 text-paper';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-pill text-tiny font-semibold border-hairline transition-colors',
        active
          ? `${activeBg} border-transparent`
          : 'bg-paper border-ink-200 text-ink-700 hover:border-brand-300',
      )}
    >
      {label}
    </button>
  );
}

function SortableTh({
  label,
  sortKey,
  active,
  dir,
  onSort,
  align,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const isActive = sortKey === active;
  return (
    <th
      className={cn(
        'px-3 py-2 text-micro font-semibold uppercase tracking-caps text-ink-500 select-none',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 transition-colors hover:text-ink-900',
          isActive && 'text-ink-900',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {label}
        {isActive && (
          <span className="font-mono">{dir === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    </th>
  );
}

type Urgency =
  | { kind: 'overdue'; minutesPast: number }
  | { kind: 'urgent'; hoursLeft: number }
  | { kind: 'today'; hoursLeft: number }
  | { kind: 'tomorrow' }
  | { kind: 'later' }
  | { kind: 'ready-fresh'; hoursReady: number }
  | { kind: 'ready-day'; hoursReady: number }
  | { kind: 'ready-stale'; hoursReady: number }
  | { kind: 'ready-old'; daysReady: number };

/** Urgence collecte : basée sur la date prévue de ramassage. */
function computeUrgency(date: Date): Urgency {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffH = diffMin / 60;
  if (diffMs < 0) {
    if (isYesterday(date) || !isToday(date)) {
      return { kind: 'overdue', minutesPast: -diffMin };
    }
    return { kind: 'overdue', minutesPast: -diffMin };
  }
  if (isToday(date)) {
    if (diffH < 2) return { kind: 'urgent', hoursLeft: diffH };
    return { kind: 'today', hoursLeft: diffH };
  }
  if (isTomorrow(date)) return { kind: 'tomorrow' };
  return { kind: 'later' };
}

/** Urgence livraison : basée sur combien de temps la commande est `ready`.
 *  Plus elle attend, plus il faut la livrer.
 *  `readyAt` = approximé via order.updatedAt (last update = quand status est passé à ready). */
function computeDeliveryUrgency(readyAt: Date): Urgency {
  const now = new Date();
  const hoursReady = (now.getTime() - readyAt.getTime()) / (1000 * 60 * 60);
  if (hoursReady >= 48) {
    return { kind: 'ready-old', daysReady: Math.floor(hoursReady / 24) };
  }
  if (hoursReady >= 24) return { kind: 'ready-stale', hoursReady };
  if (hoursReady >= 12) return { kind: 'ready-day', hoursReady };
  return { kind: 'ready-fresh', hoursReady };
}

function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  if (urgency.kind === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-rose-600 text-paper text-tiny font-semibold animate-pulse">
        <AlertCircle className="w-3 h-3" strokeWidth={2.5} />
        En retard
      </span>
    );
  }
  if (urgency.kind === 'urgent') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-amber-500 text-paper text-tiny font-semibold">
        <Clock className="w-3 h-3" strokeWidth={2.5} />
        Imminent
      </span>
    );
  }
  if (urgency.kind === 'today') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-warn-600 text-paper text-tiny font-semibold">
        Aujourd'hui
      </span>
    );
  }
  if (urgency.kind === 'tomorrow') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-brand-100 text-brand-800 text-tiny font-semibold border-hairline border-brand-200">
        Demain
      </span>
    );
  }
  /* ── États livraison (urgence basée sur "depuis combien de temps la commande est prête") ── */
  if (urgency.kind === 'ready-old') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-rose-600 text-paper text-tiny font-semibold animate-pulse">
        <AlertCircle className="w-3 h-3" strokeWidth={2.5} />
        Prête {urgency.daysReady}j
      </span>
    );
  }
  if (urgency.kind === 'ready-stale') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-amber-500 text-paper text-tiny font-semibold">
        <Clock className="w-3 h-3" strokeWidth={2.5} />
        Prête {Math.round(urgency.hoursReady)}h
      </span>
    );
  }
  if (urgency.kind === 'ready-day') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-warn-600 text-paper text-tiny font-semibold">
        Prête {Math.round(urgency.hoursReady)}h
      </span>
    );
  }
  if (urgency.kind === 'ready-fresh') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-ok-50 text-ok-700 text-tiny font-semibold border-hairline border-ok-200">
        <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
        Prête
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-paper-2 text-ink-600 text-tiny font-semibold border-hairline border-ink-200">
      À venir
    </span>
  );
}

function toLocalDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
