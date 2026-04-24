import { useMemo, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import {
  Package,
  CheckCircle,
  Clock,
  PlayCircle,
  Search,
  Building2,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { formatWeight } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import ordersData from '@/mocks/data/orders.json';
import workflowsData from '@/mocks/data/workflows.json';

const WORKFLOW_STATES = {
  COLLECTE_SCHEDULED: { label: 'Collecte programmée', badge: 'neutral', step: 0 },
  COLLECTE_IN_PROGRESS: { label: 'Collecte en cours', badge: 'info', step: 1 },
  COLLECTE_COMPLETED: { label: 'Collectée', badge: 'success', step: 1 },
  RECEPTION_PENDING: { label: 'En attente de réception', badge: 'warning', step: 2 },
  WEIGHING_IN_PROGRESS: { label: 'Pesée en cours', badge: 'info', step: 3 },
  WEIGHING_COMPLETED: { label: 'Pesée terminée', badge: 'success', step: 3 },
  TRIAGE_PENDING: { label: 'En attente de triage', badge: 'warning', step: 4 },
  TRIAGE_IN_PROGRESS: { label: 'Triage en cours', badge: 'info', step: 4 },
  TRIAGE_COMPLETED: { label: 'Triage terminé', badge: 'success', step: 4 },
  LAVAGE_PENDING: { label: 'En attente de lavage', badge: 'warning', step: 5 },
  LAVAGE_IN_PROGRESS: { label: 'Lavage en cours', badge: 'info', step: 5 },
  LAVAGE_COMPLETED: { label: 'Lavage terminé', badge: 'success', step: 5 },
  SECHAGE_IN_PROGRESS: { label: 'Séchage en cours', badge: 'info', step: 6 },
  SECHAGE_COMPLETED: { label: 'Séchage terminé', badge: 'success', step: 6 },
  CALANDRAGE_IN_PROGRESS: { label: 'Calandrage en cours', badge: 'info', step: 7 },
  CALANDRAGE_COMPLETED: { label: 'Calandrage terminé', badge: 'success', step: 7 },
  REPASSAGE_IN_PROGRESS: { label: 'Repassage en cours', badge: 'info', step: 8 },
  REPASSAGE_COMPLETED: { label: 'Repassage terminé', badge: 'success', step: 8 },
  FINITION_IN_PROGRESS: { label: 'Finition en cours', badge: 'info', step: 9 },
  FINITION_COMPLETED: { label: 'Finition terminée', badge: 'success', step: 9 },
  LIVRAISON_SCHEDULED: { label: 'Livraison programmée', badge: 'warning', step: 10 },
  LIVRAISON_IN_PROGRESS: { label: 'En cours de livraison', badge: 'info', step: 10 },
  LIVRAISON_COMPLETED: { label: 'Livrée', badge: 'success', step: 10 },
  CANCELLED: { label: 'Annulée', badge: 'error', step: -1 },
} as const;

type WorkflowStateKey = keyof typeof WORKFLOW_STATES;

const WORKFLOW_STEPS: { key: string; label: string; icon: typeof Package }[] = [
  { key: 'COLLECTE', label: 'Collecte', icon: Package },
  { key: 'RECEPTION', label: 'Réception', icon: CheckCircle },
  { key: 'WEIGHING', label: 'Pesée', icon: Clock },
  { key: 'TRIAGE', label: 'Triage', icon: PlayCircle },
  { key: 'LAVAGE', label: 'Lavage', icon: PlayCircle },
  { key: 'SECHAGE', label: 'Séchage', icon: PlayCircle },
  { key: 'CALANDRAGE', label: 'Calandrage', icon: PlayCircle },
  { key: 'REPASSAGE', label: 'Repassage', icon: PlayCircle },
  { key: 'FINITION', label: 'Finition', icon: PlayCircle },
  { key: 'LIVRAISON', label: 'Livraison', icon: CheckCircle },
];

export default function WorkflowTrackingPage() {
  const [orders] = useState(ordersData);
  const [_workflows] = useState(workflowsData);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const selectedOrder = selectedOrderId
    ? orders.find((o) => o.id === selectedOrderId)
    : null;

  const statusCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.clientName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const getWorkflowProgress = (state: string): number => {
    const info = WORKFLOW_STATES[state as WorkflowStateKey];
    if (!info || info.step < 0) return 0;
    return Math.round((info.step / 10) * 100);
  };

  const getCurrentStepIndex = (state: string): number => {
    return WORKFLOW_STATES[state as WorkflowStateKey]?.step ?? 0;
  };

  const getStepStatus = (
    stepIndex: number,
    currentStepIndex: number,
  ): 'completed' | 'current' | 'pending' => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Suivi workflow</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            État des commandes en production
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Chaque type de linge (LP / LF / NAE) suit son workflow configuré · avancement en temps réel.
          </p>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip
          label="Toutes"
          count={orders.length}
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        />
        {Object.entries(statusCounts).map(([status, count]) => (
          <StatusChip
            key={status}
            label={status}
            count={count}
            active={statusFilter === status}
            onClick={() => setStatusFilter(status)}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
          strokeWidth={1.75}
        />
        <input
          type="search"
          placeholder="Rechercher par numéro de commande ou client…"
          className="w-full max-w-lg pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders list */}
        <div>
          <div className="caps mb-2">
            Commandes · {filteredOrders.length}
          </div>
          <div className="space-y-2 max-h-[660px] overflow-y-auto pr-1">
            {filteredOrders.map((order) => {
              const info = WORKFLOW_STATES[order.workflowState as WorkflowStateKey];
              const progress = getWorkflowProgress(order.workflowState);
              const isSelected = selectedOrderId === order.id;

              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={cn(
                    'w-full text-left card-surface p-4 transition-colors',
                    isSelected
                      ? 'border-brand-800 bg-brand-50'
                      : 'hover:bg-paper-2',
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
                        <Building2
                          className="w-4 h-4 text-brand-800"
                          strokeWidth={1.75}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">
                          {order.clientName}
                        </p>
                        <p className="font-mono text-tiny text-ink-500 tnum">
                          {order.orderNumber}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={(info?.badge ?? 'neutral') as any}
                      dot
                    >
                      {order.status}
                    </Badge>
                  </div>

                  <div className="mt-3 mb-1 flex items-center justify-between text-micro">
                    <span className="text-ink-500 truncate">
                      {info?.label ?? order.workflowState}
                    </span>
                    <span className="font-mono text-ink-900 tnum ml-2">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-ink-100 rounded-full h-1">
                    <div
                      className={cn(
                        'h-1 rounded-full transition-all',
                        progress === 100 ? 'bg-ok-600' : 'bg-brand-800',
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-micro font-mono text-ink-500 tnum">
                    <span>
                      <span className="uppercase">Col.</span>{' '}
                      {format(new Date(order.collectionDate), 'dd/MM', { locale: fr })}
                    </span>
                    <span>→</span>
                    <span>
                      <span className="uppercase">Liv.</span>{' '}
                      {format(new Date(order.deliveryDate), 'dd/MM', { locale: fr })}
                    </span>
                    {order.actualWeight && (
                      <span className="ml-auto text-ink-700">
                        {formatWeight(order.actualWeight)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="card-surface px-6 py-10 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-paper-2 rounded-full mb-3 border-hairline border-ink-200">
                  <Package className="w-5 h-5 text-ink-400" strokeWidth={1.6} />
                </div>
                <p className="text-sm text-ink-500">
                  Aucune commande ne correspond à ces critères.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detail with timeline */}
        <div>
          <div className="caps mb-2">Détail workflow</div>
          {selectedOrder ? (
            <div className="card-surface p-5 sticky top-4">
              {/* Client head */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-11 h-11 rounded-input bg-brand-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-brand-800" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-medium tracking-tight text-ink-900 truncate">
                      {selectedOrder.clientName}
                    </p>
                    <p className="font-mono text-tiny text-ink-500 tnum">
                      {selectedOrder.orderNumber}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    (WORKFLOW_STATES[selectedOrder.workflowState as WorkflowStateKey]
                      ?.badge ?? 'neutral') as any
                  }
                  dot
                >
                  {selectedOrder.status}
                </Badge>
              </div>

              {/* Summary strip */}
              <div className="grid grid-cols-2 gap-3 mt-5 mb-6">
                <div className="p-3 bg-paper-2 rounded-input border-hairline border-ink-200">
                  <p className="caps">Progression</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-serif text-2xl font-medium tnum tracking-tight text-ink-900">
                      {getWorkflowProgress(selectedOrder.workflowState)}
                    </span>
                    <span className="text-tiny text-ink-500">%</span>
                  </div>
                  <div className="w-full bg-ink-100 rounded-full h-1 mt-2">
                    <div
                      className="h-1 rounded-full bg-brand-800"
                      style={{
                        width: `${getWorkflowProgress(selectedOrder.workflowState)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-paper-2 rounded-input border-hairline border-ink-200">
                  <p className="caps">Poids</p>
                  <p className="font-mono text-sm font-semibold text-ink-900 tnum mt-1">
                    {selectedOrder.actualWeight
                      ? formatWeight(selectedOrder.actualWeight)
                      : '—'}
                  </p>
                  {selectedOrder.estimatedWeight && (
                    <p className="text-micro text-ink-500 font-mono tnum mt-1">
                      est. {formatWeight(selectedOrder.estimatedWeight)}
                    </p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="caps mb-3">Étapes</div>
              <div className="relative">
                {WORKFLOW_STEPS.map((step, index) => {
                  const currentStepIndex = getCurrentStepIndex(
                    selectedOrder.workflowState,
                  );
                  const stepStatus = getStepStatus(index, currentStepIndex);
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex gap-3 relative">
                      {/* connector */}
                      {index < WORKFLOW_STEPS.length - 1 && (
                        <div
                          className={cn(
                            'absolute left-[18px] top-9 w-px h-7',
                            stepStatus === 'completed' ? 'bg-ok-600' : 'bg-ink-200',
                          )}
                        />
                      )}

                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
                          stepStatus === 'completed' && 'bg-ok-600 text-paper',
                          stepStatus === 'current' && 'bg-brand-800 text-paper ring-2 ring-brand-100',
                          stepStatus === 'pending' && 'bg-ink-100 text-ink-500',
                        )}
                      >
                        {stepStatus === 'completed' ? (
                          <CheckCircle className="w-4 h-4" strokeWidth={2} />
                        ) : stepStatus === 'current' ? (
                          <Clock className="w-4 h-4" strokeWidth={2} />
                        ) : (
                          <Icon className="w-4 h-4" strokeWidth={1.75} />
                        )}
                      </div>

                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p
                            className={cn(
                              'font-sans text-sm font-semibold',
                              stepStatus === 'completed' && 'text-ok-700',
                              stepStatus === 'current' && 'text-brand-800',
                              stepStatus === 'pending' && 'text-ink-500',
                            )}
                          >
                            {step.label}
                          </p>
                          <span className="font-mono text-micro text-ink-400 tnum">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <p className="text-tiny text-ink-500 mt-0.5">
                          {stepStatus === 'completed' &&
                            `Terminée · ${format(new Date(selectedOrder.collectionDate), 'dd MMM à HH:mm', { locale: fr })}`}
                          {stepStatus === 'current' && 'En cours…'}
                          {stepStatus === 'pending' && 'En attente'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action */}
              {selectedOrder.workflowState !== 'LIVRAISON_COMPLETED' && (
                <Button className="w-full mt-2 gap-1.5">
                  <PlayCircle className="w-4 h-4" strokeWidth={1.75} />
                  Passer à l'étape suivante
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </Button>
              )}
            </div>
          ) : (
            <div className="card-surface px-6 py-14 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-paper-2 rounded-full mb-4 border-hairline border-ink-200">
                <ChevronRight className="w-6 h-6 text-ink-400" strokeWidth={1.6} />
              </div>
              <h3 className="font-serif text-lg font-medium tracking-tight text-ink-900 mb-1">
                Sélectionne une commande
              </h3>
              <p className="text-sm text-ink-500 max-w-xs mx-auto">
                Clique sur une commande à gauche pour voir son workflow détaillé et les étapes franchies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-tiny font-semibold transition-colors border-hairline',
        active
          ? 'bg-brand-800 text-paper border-brand-800'
          : 'bg-paper text-ink-700 border-ink-200 hover:bg-paper-2',
      )}
    >
      {label}
      <span
        className={cn(
          'font-mono tnum',
          active ? 'text-brand-100' : 'text-ink-400',
        )}
      >
        {count}
      </span>
    </button>
  );
}
