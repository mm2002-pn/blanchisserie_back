import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Truck,
  User,
  XCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Card, CardContent, Button, Modal, Input } from '@/components/ui';
import { formatWeight, cn } from '@/lib/utils';

import { useOrders, useOrdersRealtime } from '@/hooks/queries/useOrders';
import {
  useCancelCollectionRound,
  useCollectionRounds,
  useCollectionRoundsRealtime,
} from '@/hooks/queries/useCollectionRounds';
import {
  ROUND_STATUS_FR,
  type ApiCollectionRound,
  type RoundType,
} from '@/lib/api/collectionRounds.api';
import { ROUTES } from '@/lib/constants';


export default function RoutePlanningPage() {
  const navigate = useNavigate();
  useOrdersRealtime();
  useCollectionRoundsRealtime();
  const { data: rounds = [], isLoading } = useCollectionRounds();
  const { data: ordersResp } = useOrders({ pageSize: 200 });

  const orders = ordersResp?.items ?? [];

  const [cancelTarget, setCancelTarget] = useState<ApiCollectionRound | null>(null);
  const [typeFilter, setTypeFilter] = useState<RoundType>('collect');

  // Commandes à planifier selon le type sélectionné
  // - collecte : status "En attente" non assignée
  // - livraison : status "Terminée" (ready, prête à livrer) non assignée
  const availableOrders = useMemo(() => {
    if (typeFilter === 'delivery') {
      return orders.filter(
        (o) => o.apiStatus === 'ready' && !o.deliveryDriverId,
      );
    }
    return orders.filter(
      (o) => o.status === 'En attente' && !o.assignedDriverId,
    );
  }, [orders, typeFilter]);

  // Rounds filtrés par type
  const typedRounds = useMemo(
    () => rounds.filter((r) => r.type === typeFilter),
    [rounds, typeFilter],
  );

  const groups = useMemo(() => {
    const planned: ApiCollectionRound[] = [];
    const inProgress: ApiCollectionRound[] = [];
    const recent: ApiCollectionRound[] = [];
    for (const r of typedRounds) {
      if (r.status === 'planned') planned.push(r);
      else if (r.status === 'in_progress') inProgress.push(r);
      else recent.push(r);
    }
    return { planned, inProgress, recent: recent.slice(0, 10) };
  }, [typedRounds]);

  // Compteurs globaux pour les tabs (toutes les rounds, pas filtrées)
  const tabCounts = useMemo(() => {
    let collect = 0;
    let delivery = 0;
    for (const r of rounds) {
      if (r.status === 'planned' || r.status === 'in_progress') {
        if (r.type === 'delivery') delivery += 1;
        else collect += 1;
      }
    }
    return { collect, delivery };
  }, [rounds]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Planification</div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            Tournées {typeFilter === 'delivery' ? 'de livraison' : 'de collecte'}
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Groupez plusieurs commandes par véhicule pour une même tournée.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() =>
            navigate(`${ROUTES.ROUTE_PLANNING_NEW}?type=${typeFilter}`)
          }
          disabled={availableOrders.length === 0}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Nouvelle tournée
        </Button>
      </div>

      {/* Tabs Collecte / Livraison */}
      <div className="flex gap-1.5 border-b border-ink-200">
        <TypeTab
          active={typeFilter === 'collect'}
          onClick={() => setTypeFilter('collect')}
          icon={ArrowDownToLine}
          label="Collecte"
          count={tabCounts.collect}
        />
        <TypeTab
          active={typeFilter === 'delivery'}
          onClick={() => setTypeFilter('delivery')}
          icon={ArrowUpFromLine}
          label="Livraison"
          count={tabCounts.delivery}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="À planifier" value={`${availableOrders.length}`} sub="commandes" tint="warn" />
        <KpiTile label="Planifiées" value={`${groups.planned.length}`} sub="tournées" tint="info" />
        <KpiTile label="En cours" value={`${groups.inProgress.length}`} sub="tournées actives" tint="brand" />
        <KpiTile
          label="Terminées"
          value={`${rounds.filter((r) => r.status === 'completed').length}`}
          sub="cumulé"
          tint="success"
        />
      </div>

      {/* Table dense — toutes tournées du type sélectionné, triées par priorité statut + date */}
      {isLoading ? (
        <p className="text-sm text-ink-500 italic">Chargement…</p>
      ) : typedRounds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="w-12 h-12 text-ink-400 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-ink-700 font-semibold">
              Aucune tournée {typeFilter === 'delivery' ? 'de livraison' : 'de collecte'}
            </p>
            <p className="text-sm text-ink-500 mt-1">
              {typeFilter === 'delivery'
                ? 'Créez une tournée pour grouper les commandes prêtes à livrer.'
                : 'Créez une tournée pour grouper les commandes en attente.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <RoundsTable
          rounds={[
            ...groups.inProgress,
            ...groups.planned,
            ...groups.recent,
          ]}
          onCancel={setCancelTarget}
        />
      )}

      <CancelRoundModal round={cancelTarget} onClose={() => setCancelTarget(null)} />
    </div>
  );
}

/* ─── Tabs type ─── */

function TypeTab({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof ArrowDownToLine;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px',
        active
          ? 'text-brand-800 border-brand-800'
          : 'text-ink-500 border-transparent hover:text-ink-700 hover:border-ink-300',
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={1.75} />
      {label}
      {count > 0 && (
        <span
          className={cn(
            'font-mono text-tiny tnum px-1.5 py-0.5 rounded-pill',
            active ? 'bg-brand-50 text-brand-800' : 'bg-paper-2 text-ink-600',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Tableau dense (industrie pattern) ─── */

function RoundsTable({
  rounds,
  onCancel,
}: {
  rounds: ApiCollectionRound[];
  onCancel: (r: ApiCollectionRound) => void;
}) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink-200 bg-paper-2">
              <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500 w-24">
                N°
              </th>
              <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500 w-28">
                Statut
              </th>
              <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500 w-36">
                Quand
              </th>
              <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500">
                Véhicule · Chauffeur
              </th>
              <th className="px-3 py-2 text-right font-semibold text-micro uppercase tracking-wide text-ink-500 w-16">
                Cmd
              </th>
              <th className="px-3 py-2 text-right font-semibold text-micro uppercase tracking-wide text-ink-500 w-24">
                Poids
              </th>
              <th className="px-2 py-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rounds.map((r) => (
              <RoundRow key={r.id} round={r} onCancel={onCancel} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STATUS_DOT: Record<string, string> = {
  planned: 'bg-brand-800',
  in_progress: 'bg-baobab-600 animate-pulse',
  completed: 'bg-ok-700',
  cancelled: 'bg-rose-700',
};
const STATUS_TINT: Record<string, string> = {
  planned: 'text-brand-800',
  in_progress: 'text-baobab-700',
  completed: 'text-ok-700',
  cancelled: 'text-rose-700',
};

function RoundRow({
  round,
  onCancel,
}: {
  round: ApiCollectionRound;
  onCancel: (r: ApiCollectionRound) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalWeight = round.orders.reduce(
    (s, o) => s + (o.estimatedWeight ?? 0),
    0,
  );
  const driverName = round.vehicle.enrolledDriver
    ? `${round.vehicle.enrolledDriver.firstName} ${round.vehicle.enrolledDriver.lastName}`
    : '—';
  const isDelivery = round.type === 'delivery';
  const dotKey = round.status as keyof typeof STATUS_DOT;
  const tintKey = round.status as keyof typeof STATUS_TINT;

  return (
    <Fragment>
      <tr
        onClick={() => setExpanded((v) => !v)}
        className="cursor-pointer hover:bg-paper-2 transition-colors align-middle"
      >
        {/* N° */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            {isDelivery ? (
              <ArrowUpFromLine
                className="w-3.5 h-3.5 text-baobab-700 shrink-0"
                strokeWidth={2}
              />
            ) : (
              <ArrowDownToLine
                className="w-3.5 h-3.5 text-brand-800 shrink-0"
                strokeWidth={2}
              />
            )}
            <span className="font-mono text-tiny font-semibold text-ink-900">
              {round.number}
            </span>
          </div>
        </td>

        {/* Statut */}
        <td className="px-3 py-2.5">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOT[dotKey])}
            />
            <span className={cn('text-tiny font-semibold', STATUS_TINT[tintKey])}>
              {ROUND_STATUS_FR[round.status]}
            </span>
          </span>
        </td>

        {/* Quand */}
        <td className="px-3 py-2.5">
          <p className="font-mono text-tiny tnum text-ink-700 leading-tight capitalize">
            {format(new Date(round.plannedAt), "EEE d MMM", { locale: fr })}
          </p>
          <p className="font-mono text-tiny tnum text-ink-900 font-semibold">
            {format(new Date(round.plannedAt), 'HH:mm', { locale: fr })}
          </p>
        </td>

        {/* Véhicule · Chauffeur */}
        <td className="px-3 py-2.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Truck className="w-3 h-3 text-ink-500 shrink-0" strokeWidth={1.75} />
            <span className="font-mono text-tiny font-semibold text-ink-900 truncate">
              {round.vehicle.matricule}
            </span>
            <span className="text-tiny text-ink-400 shrink-0">·</span>
            <User className="w-3 h-3 text-ink-500 shrink-0" strokeWidth={1.75} />
            <span className="text-tiny text-ink-700 truncate">{driverName}</span>
          </div>
        </td>

        {/* Cmd count */}
        <td className="px-3 py-2.5 text-right">
          <span className="font-mono text-tiny tnum font-semibold text-ink-900">
            {round.orders.length}
          </span>
        </td>

        {/* Poids */}
        <td className="px-3 py-2.5 text-right">
          <span className="font-mono text-tiny tnum text-ink-700">
            {formatWeight(totalWeight)}
          </span>
        </td>

        {/* Action / expand */}
        <td className="px-2 py-2.5 text-right">
          <ChevronRight
            className={cn(
              'w-4 h-4 text-ink-400 transition-transform inline-block',
              expanded && 'rotate-90',
            )}
            strokeWidth={1.75}
          />
        </td>
      </tr>

      {expanded && (
        <tr className="bg-paper-2/40">
          <td colSpan={7} className="px-4 py-3">
            <div className="space-y-3">
              {/* Clients */}
              <div>
                <p className="caps mb-2">
                  Clients ({round.orders.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {round.orders.map((o) => {
                    const done = isDelivery ? o.deliveredAt : o.collectedAt;
                    return (
                      <span
                        key={o.id}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-tiny border-hairline',
                          done
                            ? 'bg-ok-50 border-ok-200 text-ok-800'
                            : 'bg-paper border-ink-200 text-ink-700',
                        )}
                      >
                        <Building2
                          className="w-3 h-3 shrink-0"
                          strokeWidth={1.75}
                        />
                        <span className="font-semibold">
                          {o.client?.name ?? o.orderNumber}
                        </span>
                        {done && (
                          <span className="text-ok-700">✓</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              {round.notes && (
                <div>
                  <p className="caps mb-1">Notes</p>
                  <p className="text-tiny text-ink-700 italic">{round.notes}</p>
                </div>
              )}

              {/* Actions */}
              {round.status === 'planned' && (
                <div className="flex items-center justify-between pt-2 border-t border-ink-100">
                  <p className="text-micro text-ink-500 italic">
                    Démarrage par le chauffeur depuis son mobile
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(round);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-tiny font-semibold text-ink-700 hover:bg-rose-50 hover:text-rose-700 border-hairline border-ink-200 transition-colors"
                  >
                    <XCircle className="w-3 h-3" strokeWidth={1.75} />
                    Annuler la tournée
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

/* ─── Modale annulation ─── */

function CancelRoundModal({
  round,
  onClose,
}: {
  round: ApiCollectionRound | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const cancel = useCancelCollectionRound();

  const handleConfirm = async () => {
    if (!round || reason.trim().length < 3) return;
    try {
      await cancel.mutateAsync({ id: round.id, reason: reason.trim() });
      toast.success(`Tournée ${round.number} annulée`);
      setReason('');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec annulation');
    }
  };

  return (
    <Modal
      isOpen={!!round}
      onClose={() => {
        setReason('');
        onClose();
      }}
      title={`Annuler la tournée ${round?.number ?? ''}`}
      subtitle="Les commandes seront libérées et repasseront en attente"
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Motif d'annulation"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Pourquoi annule-t-on cette tournée ?"
          required
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Retour
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            loading={cancel.isPending}
            disabled={reason.trim().length < 3}
            className="gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
            Confirmer l'annulation
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Utils ─── */

function KpiTile({
  label,
  value,
  sub,
  tint,
}: {
  label: string;
  value: string;
  sub: string;
  tint: 'warn' | 'info' | 'brand' | 'success';
}) {
  const dotColor = {
    warn: 'bg-warn-600',
    info: 'bg-brand-800',
    brand: 'bg-baobab-600',
    success: 'bg-ok-700',
  }[tint];
  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn('w-2 h-2 rounded-full', dotColor)} />
        <p className="caps text-ink-500">{label}</p>
      </div>
      <p className="font-serif text-2xl font-medium tnum text-ink-900 leading-none">{value}</p>
      <p className="text-tiny text-ink-500 mt-1">{sub}</p>
    </div>
  );
}
