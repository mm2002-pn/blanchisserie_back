import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  Sparkles,
  CheckCircle2,
  Building2,
  Loader2,
  Scale,
  ListChecks,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui';
import {
  useOrders,
  useOrdersRealtime,
  ordersKeys,
  useScheduleDelivery,
} from '@/hooks/queries/useOrders';
import { useUsers } from '@/hooks/queries/useUsers';
import { useVehicles } from '@/hooks/queries/useVehicles';
import { Truck, User, Calendar } from 'lucide-react';
import {
  useBatches,
  useBatchesRealtime,
  batchesKeys,
  useStartBatch,
  useCompleteBatch,
  useWaitingCounts,
  useCreateStageBatches,
} from '@/hooks/queries/useBatches';
import type { StageName } from '@/lib/api/batches.api';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { OrderDetailWithMeta } from '@/components/orders/OrderQrModal';

/**
 * Production du jour — wizard simple en 3 étapes :
 *   1. Sélectionner les commandes du pool
 *   2. Valider le plan IA
 *   3. Suivre l'avancement
 *
 * Le superviseur descend de haut en bas, une seule action à faire à la fois.
 */

const DAILY_CAPACITY_KG = 800;

export default function ProductionDayPage() {
  useOrdersRealtime();
  useBatchesRealtime();
  const qc = useQueryClient();

  const { data: ordersResp } = useOrders({ pageSize: 200 });
  const { data: batches = [] } = useBatches();

  const orders = (ordersResp?.items ?? []) as OrderDetailWithMeta[];
  const pool = orders.filter((o) => o.apiStatus === 'triaged');
  const inProduction = orders.filter((o) => o.apiStatus === 'in_production');
  const ready = orders.filter((o) => o.apiStatus === 'ready');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [aiProposal, setAiProposal] = useState<AiProposal | null>(null);
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  const composeAuto = () => {
    const sorted = [...pool].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const set = new Set<string>();
    let cumKg = 0;
    for (const o of sorted) {
      const kg = o.totalWeight ?? 0;
      if (cumKg + kg > DAILY_CAPACITY_KG) break;
      set.add(o.id);
      cumKg += kg;
    }
    setSelectedIds(set);
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedKg = pool
    .filter((o) => selectedIds.has(o.id))
    .reduce((s, o) => s + (o.totalWeight ?? 0), 0);

  /** Étape 1 : calcule la proposition (sans persister) */
  const compute = useMutation({
    mutationFn: async () => {
      const orderIds = Array.from(selectedIds);
      const { data } = await api.post<AiProposal>('/batches/suggest', {
        orderIds,
        useAi: mode === 'ai',
      });
      return data;
    },
    onSuccess: (data) => {
      setAiProposal(data);
    },
  });

  /** Étape 2 : valide la proposition (persiste) */
  const persist = useMutation({
    mutationFn: async () => {
      if (!aiProposal) throw new Error('Pas de proposition à valider');
      const { data } = await api.post('/batches/persist', { proposal: aiProposal });
      return data;
    },
    onSuccess: () => {
      setAiProposal(null);
      setSelectedIds(new Set());
      // Invalide caches : les commandes passent triaged → in_production,
      // les batches sont créés
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      void qc.invalidateQueries({ queryKey: batchesKeys.all });
    },
  });

  const stageStats = useMemo(() => {
    const stages = ['lavage', 'sechage', 'calandrage', 'repassage', 'finition'] as const;
    return stages.map((s) => {
      const items = batches.filter((b) => b.stage === s);
      const completed = items.filter((b) => b.status === 'completed').length;
      return { stage: s, total: items.length, completed };
    });
  }, [batches]);

  const hasLiveProduction = batches.length > 0 || inProduction.length > 0;
  const showStep3 = hasLiveProduction;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <div className="caps mb-1">Production du jour</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900 capitalize">
            {new Intl.DateTimeFormat('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(new Date())}
          </h1>
        </div>
        <div className="text-right">
          <p className="caps text-ink-500">Capacité atelier</p>
          <p className="font-mono text-lg font-semibold tnum">
            {selectedKg.toFixed(0)}
            <span className="text-ink-500"> / {DAILY_CAPACITY_KG} kg</span>
          </p>
        </div>
      </div>

      {/* ─── ÉTAPE 1 ─── */}
      <Step
        number={1}
        title="Choisis les commandes à traiter aujourd'hui"
        active
        done={false}
      >
        {pool.length === 0 ? (
          <EmptyHint>
            Aucune commande dans le pool.
            <br />
            <span className="text-tiny">
              Les commandes apparaissent ici après la <strong>réception + triage</strong>.
            </span>
          </EmptyHint>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-ink-500">
                {pool.length} commande{pool.length > 1 ? 's' : ''} en attente. Coche celles à traiter.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={composeAuto}
                className="gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                Sélection auto
              </Button>
            </div>

            <div className="border-hairline border-ink-200 rounded-input divide-y divide-ink-100 bg-paper">
              {pool.map((o) => (
                <PoolRow
                  key={o.id}
                  order={o}
                  selected={selectedIds.has(o.id)}
                  onToggle={() => toggle(o.id)}
                />
              ))}
            </div>

            <CapacityBar selectedKg={selectedKg} totalKg={DAILY_CAPACITY_KG} />

            {/* Footer : récap + toggle mode + bouton Lancer */}
            <div className="mt-4 pt-4 border-t-hairline border-ink-200 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm">
                  {selectedIds.size === 0 ? (
                    <span className="text-ink-500 italic">
                      Coche au moins une commande pour lancer la production
                    </span>
                  ) : (
                    <span className="text-ink-700">
                      <strong className="text-ink-900">{selectedIds.size}</strong> commande
                      {selectedIds.size > 1 ? 's' : ''} ·{' '}
                      <span className="font-mono tnum">{selectedKg.toFixed(0)} kg</span>
                      {' à envoyer en production'}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                {/* Toggle mode */}
                <div className="inline-flex border-hairline border-ink-200 rounded-input p-0.5 bg-paper">
                  <button
                    type="button"
                    onClick={() => setMode('ai')}
                    className={cn(
                      'px-3 py-1.5 text-tiny font-semibold rounded-input transition-colors flex items-center gap-1.5',
                      mode === 'ai'
                        ? 'bg-brand-800 text-paper'
                        : 'text-ink-700 hover:bg-paper-2',
                    )}
                  >
                    <Sparkles className="w-3 h-3" strokeWidth={2} />
                    Avec IA
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('manual')}
                    className={cn(
                      'px-3 py-1.5 text-tiny font-semibold rounded-input transition-colors',
                      mode === 'manual'
                        ? 'bg-ink-900 text-paper'
                        : 'text-ink-700 hover:bg-paper-2',
                    )}
                  >
                    ✋ Heuristique
                  </button>
                </div>

                <Button
                  onClick={() => compute.mutate()}
                  disabled={selectedIds.size === 0 || compute.isPending || aiProposal !== null}
                  className="gap-1.5"
                >
                  {compute.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cpu className="w-3.5 h-3.5" strokeWidth={1.75} />
                  )}
                  Calculer la proposition
                </Button>
              </div>

              <p className="text-tiny text-ink-500 text-right">
                {mode === 'ai'
                  ? 'L\'IA Groq analyse et propose une répartition (~2 sec)'
                  : 'Heuristique seule, instantané (sans appel IA)'}
              </p>
            </div>
          </>
        )}
      </Step>

      {/* Proposition à valider (entre étape 1 et étape 2) */}
      {aiProposal && (
        <ProposalReview
          proposal={aiProposal}
          mode={mode}
          onCancel={() => setAiProposal(null)}
          onValidate={() => persist.mutate()}
          validating={persist.isPending}
        />
      )}

      {/* ─── ÉTAPE 2 : production en cours (interactive) ─── */}
      {showStep3 && (
        <>
          <Step number={2} title="Production en cours" active done={false}>
            <ActiveBatchesView batches={batches} stageStats={stageStats} />
          </Step>

          {ready.length > 0 && (
            <Step number={3} title="Regroupe par client et planifie la livraison" active done={false}>
              <ReadyDeliveryView orders={ready} />
            </Step>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Sous-composants ─── */

function Step({
  number,
  title,
  active,
  done,
  children,
}: {
  number: number;
  title: string;
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'card-surface p-5 transition-all',
        active && 'ring-2 ring-brand-800 ring-offset-2 ring-offset-paper-2',
        done && !active && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-bold',
            done
              ? 'bg-ok-700 text-paper'
              : active
                ? 'bg-brand-800 text-paper'
                : 'bg-ink-200 text-ink-500',
          )}
        >
          {done ? '✓' : number}
        </div>
        <h2 className="font-serif text-xl font-medium text-ink-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PoolRow({
  order,
  selected,
  onToggle,
}: {
  order: OrderDetailWithMeta & {
    receivedWeight?: number;
    receivedPieces?: number;
    triage?: { completedAt?: Date; totalPieces?: number } | null;
    triagedAt?: Date;
  };
  selected: boolean;
  onToggle: () => void;
}) {
  // Données de pesée officielle atelier
  const officialKg = order.receivedWeight
    ? Math.round((order.receivedWeight / 1000) * 10) / 10
    : (order.totalWeight ?? 0);
  // Pièces issues du triage (source de vérité = ItemTags)
  const piecesTriaged = order.triage?.totalPieces ?? order.receivedPieces ?? 0;
  // Date du triage
  const triagedAt = order.triagedAt ?? order.triage?.completedAt;
  const triagedTime = triagedAt
    ? new Date(triagedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;
  const triagedDate = triagedAt
    ? new Date(triagedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null;

  return (
    <label
      className={cn(
        'flex items-start gap-3 py-3 px-4 cursor-pointer transition-colors',
        selected ? 'bg-brand-50' : 'hover:bg-paper-2',
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="w-4 h-4 accent-brand-800 mt-0.5"
      />

      <div className="flex-1 min-w-0">
        {/* Ligne 1 : client + N° commande */}
        <div className="flex items-center gap-2 mb-1.5">
          <Building2 className="w-4 h-4 text-brand-800 shrink-0" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-ink-900 truncate">
            {order.clientName ?? '—'}
          </p>
          <p className="font-mono text-tiny text-ink-500 tnum">{order.orderNumber}</p>
        </div>

        {/* Ligne 2 : badges de validation pesée + triage */}
        <div className="flex items-center gap-3 text-tiny">
          <span className="inline-flex items-center gap-1 text-ok-700">
            <Scale className="w-3 h-3" strokeWidth={2} />
            <span className="font-semibold">Pesé</span>
            <span className="font-mono tnum text-ink-700">{officialKg.toFixed(1)} kg</span>
          </span>
          <span className="text-ink-300">·</span>
          <span className="inline-flex items-center gap-1 text-ok-700">
            <ListChecks className="w-3 h-3" strokeWidth={2} />
            <span className="font-semibold">Triagé</span>
            <span className="font-mono tnum text-ink-700">
              {piecesTriaged} pièces
            </span>
          </span>
          {triagedTime && (
            <>
              <span className="text-ink-300">·</span>
              <span className="text-ink-500">
                {triagedDate} à {triagedTime}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Total kg à droite, gros */}
      <div className="text-right shrink-0">
        <p className="font-mono text-base font-semibold tnum text-ink-900">
          {officialKg.toFixed(0)}
          <span className="text-sm font-normal text-ink-500"> kg</span>
        </p>
        <p className="text-tiny text-ink-500">à traiter</p>
      </div>
    </label>
  );
}

function CapacityBar({ selectedKg, totalKg }: { selectedKg: number; totalKg: number }) {
  const pct = Math.min(100, (selectedKg / totalKg) * 100);
  const overload = selectedKg > totalKg;
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between text-tiny text-ink-500 mb-1">
        <span>Capacité utilisée</span>
        <span className="font-mono tnum">
          {selectedKg.toFixed(0)} / {totalKg} kg
        </span>
      </div>
      <div className="h-2 bg-ink-100 rounded-pill overflow-hidden">
        <div
          className={cn(
            'h-full rounded-pill transition-all',
            overload ? 'bg-rose-500' : pct > 70 ? 'bg-baobab-600' : 'bg-brand-800',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface ProposalItem {
  tagId: string;
  orderId: string;
  clientName?: string;
  weight: number; // grammes
  linenTypeCode?: string;
  linenTypeName?: string;
}

interface ProposalBatch {
  machineId: string;
  machineRef?: string;
  programId: string;
  programName?: string;
  capacity: number;
  totalWeight: number;
  utilization: number;
  contributors: { orderId: string; clientName: string; pieces: number; weight: number }[];
  items: ProposalItem[];
}

interface AiProposal {
  source?: string;
  batches?: ProposalBatch[];
  meta?: {
    aiRationale?: string;
    itemsPlaced?: number;
    itemsLeftover?: number;
    averageUtilization?: number;
    estimatedWaterSavedL?: number;
    estimatedEnergySavedKwh?: number;
  };
}



function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-8 text-sm text-ink-500">
      <p>{children}</p>
    </div>
  );
}

/* ─── Suivi production : batches actifs avec actions ─── */

const STAGE_LABEL: Record<string, { icon: string; label: string }> = {
  lavage: { icon: '💧', label: 'Lavage' },
  sechage: { icon: '☀️', label: 'Séchage' },
  calandrage: { icon: '🔥', label: 'Calandrage' },
  repassage: { icon: '👔', label: 'Repassage' },
  finition: { icon: '📦', label: 'Finition' },
};

const STAGES_ORDER = ['lavage', 'sechage', 'calandrage', 'repassage', 'finition'];

function ActiveBatchesView({
  batches,
  stageStats,
}: {
  batches: any[];
  stageStats: { stage: string; total: number; completed: number }[];
}) {
  const { data: waitingCounts } = useWaitingCounts();

  // Grouper par stage
  const byStage = STAGES_ORDER.map((s) => ({
    stage: s,
    batches: batches.filter((b) => b.stage === s),
  })).filter((g) => g.batches.length > 0);

  const totalWaiting = (['sechage', 'calandrage', 'repassage', 'finition'] as const).reduce(
    (s, k) => s + (waitingCounts?.[k] ?? 0),
    0,
  );

  if (batches.length === 0 && totalWaiting === 0) {
    return <EmptyHint>Aucun batch en cours.</EmptyHint>;
  }

  return (
    <div className="space-y-5">
      {/* Mini résumé en haut */}
      <div className="grid grid-cols-5 gap-2">
        {STAGES_ORDER.map((s) => {
          const stat = stageStats.find((st) => st.stage === s);
          const cfg = STAGE_LABEL[s];
          const waiting =
            s !== 'lavage' ? (waitingCounts?.[s as Exclude<typeof s, 'lavage'>] ?? 0) : 0;
          if ((!stat || stat.total === 0) && waiting === 0) {
            return (
              <div key={s} className="text-center py-2 px-2 rounded-input bg-paper-2 opacity-50">
                <p className="text-xl">{cfg.icon}</p>
                <p className="text-tiny text-ink-500">{cfg.label}</p>
                <p className="text-micro text-ink-400">—</p>
              </div>
            );
          }
          const allDone = stat && stat.total > 0 && stat.completed === stat.total;
          return (
            <div
              key={s}
              className={cn(
                'text-center py-2 px-2 rounded-input border-hairline',
                allDone ? 'bg-ok-50 border-ok-200' : 'bg-paper-2 border-ink-200',
              )}
            >
              <p className="text-xl">{cfg.icon}</p>
              <p className="text-tiny font-semibold text-ink-900">{cfg.label}</p>
              <p className="font-mono text-micro text-ink-500 tnum">
                {stat ? `${stat.completed}/${stat.total}` : '0/0'}
              </p>
              {waiting > 0 && (
                <p className="text-micro font-semibold text-baobab-700 mt-0.5">
                  +{waiting} en attente
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* CTAs : créer les batches du stage suivant pour les items en attente */}
      {(['sechage', 'calandrage', 'repassage', 'finition'] as const).map((stage) => {
        const count = waitingCounts?.[stage] ?? 0;
        if (count === 0) return null;
        return <StageWaitingCta key={stage} stage={stage} count={count} />;
      })}

      {/* Détail batches groupés par stage */}
      {byStage.map(({ stage, batches: stageBatches }) => (
        <div key={stage} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{STAGE_LABEL[stage].icon}</span>
            <h3 className="font-serif text-base font-semibold text-ink-900">
              {STAGE_LABEL[stage].label}
            </h3>
            <span className="text-tiny text-ink-500">
              ({stageBatches.length} batch{stageBatches.length > 1 ? 'es' : ''})
            </span>
          </div>
          <div className="space-y-2">
            {stageBatches.map((b) => (
              <ActiveBatchCard key={b.id} batch={b} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StageWaitingCta({ stage, count }: { stage: StageName; count: number }) {
  const create = useCreateStageBatches();
  const cfg = STAGE_LABEL[stage];
  const isFinition = stage === 'finition';

  return (
    <div className="rounded-input border-hairline border-baobab-200 bg-baobab-50 p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl shrink-0">{cfg.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900">
            <strong className="text-baobab-800">{count}</strong> pièce{count > 1 ? 's' : ''} en
            attente de {cfg.label.toLowerCase()}
          </p>
          <p className="text-tiny text-ink-700">
            {isFinition
              ? 'Pliage / mise en sachet — finalise les commandes (passage en "prête à livrer")'
              : `Crée les batches pour démarrer le ${cfg.label.toLowerCase()}`}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => create.mutate(stage)}
        disabled={create.isPending}
        className="gap-1.5 shrink-0"
      >
        {create.isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <PlayCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
        )}
        {isFinition ? 'Finaliser' : `Créer les batches ${cfg.label.toLowerCase()}`}
      </Button>
    </div>
  );
}

function ActiveBatchCard({ batch }: { batch: any }) {
  const startBatch = useStartBatch();
  const completeBatch = useCompleteBatch();

  const status = batch.status as string;
  const machine = batch.machine
    ? `${batch.machine.brand ?? ''} ${batch.machine.model ?? ''}`.trim()
    : batch.machineId;
  const program = batch.program?.name ?? batch.programId ?? '—';
  const loadKg = (batch.currentLoad ?? 0) / 1000;
  const utilizationPct = Math.round((batch.utilization ?? 0) * 100);

  const startedAt = batch.startedAt ? new Date(batch.startedAt) : null;
  const elapsedMin = startedAt
    ? Math.floor((Date.now() - startedAt.getTime()) / 60_000)
    : 0;
  const totalMin = batch.estimatedDurationMin ?? 0;

  const STATUS_LABEL: Record<string, { label: string; tint: string }> = {
    suggested: { label: 'Proposé', tint: 'bg-paper-2 text-ink-700' },
    validated: { label: 'Prêt à démarrer', tint: 'bg-brand-50 text-brand-800' },
    in_progress: { label: 'En cours', tint: 'bg-baobab-50 text-baobab-700' },
    completed: { label: 'Terminé ✓', tint: 'bg-ok-50 text-ok-700' },
    cancelled: { label: 'Annulé', tint: 'bg-rose-50 text-rose-700' },
  };
  const st = STATUS_LABEL[status] ?? STATUS_LABEL.suggested;

  return (
    <div className="border-hairline border-ink-200 rounded-input bg-paper overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-hairline border-ink-100">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="font-mono text-sm font-bold text-ink-900 shrink-0">
            {batch.code}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">{machine}</p>
            <p className="text-tiny text-ink-500 truncate">{program}</p>
          </div>
        </div>
        <span className={cn('px-2.5 py-1 rounded-pill text-tiny font-semibold shrink-0', st.tint)}>
          {st.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="caps">Charge</p>
          <p className="font-mono text-sm font-semibold tnum text-ink-900 mt-0.5">
            {loadKg.toFixed(1)}
            <span className="text-tiny text-ink-500"> / {batch.capacity ?? '—'} kg</span>
          </p>
          <p className="text-tiny text-ink-500">{utilizationPct}% utilisation</p>
        </div>

        <div>
          <p className="caps">Temps</p>
          {status === 'in_progress' ? (
            <>
              <p className="font-mono text-sm font-semibold tnum text-baobab-700 mt-0.5">
                {elapsedMin} min écoulées
              </p>
              <p className="text-tiny text-ink-500">{totalMin} min total prévu</p>
            </>
          ) : status === 'completed' ? (
            <p className="font-mono text-sm font-semibold tnum text-ok-700 mt-0.5">Terminé</p>
          ) : (
            <p className="text-sm text-ink-700 mt-0.5">{totalMin} min prévues</p>
          )}
        </div>

        <div>
          <p className="caps">Clients</p>
          <p className="text-sm text-ink-700 mt-0.5">
            {(batch.contributors ?? []).length} commande
            {(batch.contributors ?? []).length > 1 ? 's' : ''}
          </p>
          {batch.contributors && batch.contributors[0] && (
            <p className="text-tiny text-ink-500 truncate">
              {batch.contributors
                .slice(0, 2)
                .map((c: any) => c.order?.client?.name ?? '—')
                .join(', ')}
              {batch.contributors.length > 2 && ` +${batch.contributors.length - 2}`}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {(status === 'suggested' || status === 'validated' || status === 'in_progress') && (
        <div className="px-4 py-3 border-t border-hairline border-ink-100 bg-paper-2 flex justify-end gap-2">
          {(status === 'suggested' || status === 'validated') && (
            <Button
              size="sm"
              onClick={() => startBatch.mutate(batch.id)}
              disabled={startBatch.isPending}
              className="gap-1.5"
            >
              {startBatch.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PlayCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
              )}
              Démarrer le batch
            </Button>
          )}
          {status === 'in_progress' && (
            <Button
              size="sm"
              onClick={() => completeBatch.mutate({ batchId: batch.id })}
              disabled={completeBatch.isPending}
              className="gap-1.5"
            >
              {completeBatch.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              )}
              Terminer (passer au stage suivant)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Section : revue/validation de la proposition ─── */

function ProposalReview({
  proposal,
  mode,
  onCancel,
  onValidate,
  validating,
}: {
  proposal: AiProposal;
  mode: 'ai' | 'manual';
  onCancel: () => void;
  onValidate: () => void;
  validating: boolean;
}) {
  const batches = proposal.batches ?? [];
  const m = proposal.meta ?? {};

  return (
    <Step number={2} title="Vérifie le plan proposé puis lance la production" active done={false}>
      {/* Stats globales */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KpiBox
          label="Batches proposés"
          value={String(batches.length)}
          sub={mode === 'ai' ? 'IA Groq' : 'Heuristique'}
          tint="brand"
        />
        <KpiBox
          label="Items placés"
          value={String(m.itemsPlaced ?? 0)}
          sub={`${m.itemsLeftover ?? 0} non placés`}
        />
        <KpiBox
          label="Utilisation moy."
          value={`${Math.round((m.averageUtilization ?? 0) * 100)}%`}
          sub="par machine"
        />
        <KpiBox
          label="Économies"
          value={`${m.estimatedWaterSavedL ?? 0} L`}
          sub={`${m.estimatedEnergySavedKwh ?? 0} kWh`}
        />
      </div>

      {/* Rationale IA */}
      {m.aiRationale && (
        <div className="p-3 mb-4 rounded-input bg-brand-50 border-hairline border-brand-200">
          <p className="text-tiny text-brand-800 font-semibold mb-1">🤖 Analyse IA</p>
          <p className="text-sm text-ink-700 italic">{m.aiRationale}</p>
        </div>
      )}

      {/* Liste détaillée des batches proposés */}
      {batches.length === 0 ? (
        <div className="text-center py-6 text-sm text-ink-500 italic">
          Aucun batch proposé. Sélectionne plus de commandes ou vérifie les programmes compatibles.
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((b, i) => (
            <ProposedBatchCard key={i} batch={b} index={i + 1} />
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t-hairline border-ink-200">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={validating}>
          Annuler
        </Button>
        <Button
          onClick={onValidate}
          disabled={batches.length === 0 || validating}
          className="gap-1.5"
        >
          {validating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <PlayCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
          )}
          Valider et lancer la production
        </Button>
      </div>
    </Step>
  );
}

function ProposedBatchCard({ batch, index }: { batch: ProposalBatch; index: number }) {
  const utilizationPct = Math.round((batch.utilization ?? 0) * 100);
  const utilColor =
    utilizationPct >= 90
      ? 'text-ok-700'
      : utilizationPct >= 70
        ? 'text-brand-800'
        : 'text-baobab-700';
  const fillColor =
    utilizationPct >= 90
      ? 'bg-ok-700'
      : utilizationPct >= 70
        ? 'bg-brand-800'
        : 'bg-baobab-600';

  // Regroupe les items par TYPE D'ARTICLE
  const byArticle = useMemo(() => {
    const m = new Map<string, { name: string; pieces: number; weightG: number }>();
    for (const it of batch.items ?? []) {
      const key = it.linenTypeCode ?? '?';
      const name = it.linenTypeName ?? key;
      if (!m.has(key)) m.set(key, { name, pieces: 0, weightG: 0 });
      const e = m.get(key)!;
      e.pieces += 1;
      e.weightG += it.weight;
    }
    return Array.from(m.entries())
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.weightG - a.weightG);
  }, [batch.items]);

  return (
    <div className="rounded-input border-hairline border-ink-200 bg-paper overflow-hidden">
      {/* Header batch : machine + programme */}
      <div className="px-4 py-3 bg-paper-2 border-b border-hairline border-ink-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-input bg-brand-100 flex items-center justify-center">
            <span className="font-mono text-sm font-bold text-brand-800">
              B{String(index).padStart(2, '0')}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">
              {batch.machineRef ?? 'Machine ?'}
            </p>
            <p className="text-tiny text-ink-500">
              Programme : {batch.programName ?? batch.programId}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-base font-semibold tnum text-ink-900">
            {(batch.totalWeight ?? 0).toFixed(1)}
            <span className="text-sm font-normal text-ink-500"> / {batch.capacity} kg</span>
          </p>
          <p className={cn('font-mono text-tiny tnum font-semibold', utilColor)}>
            {utilizationPct}% utilisation
          </p>
        </div>
      </div>

      {/* Barre utilisation */}
      <div className="h-1 bg-ink-100">
        <div
          className={cn('h-full', fillColor)}
          style={{ width: `${Math.min(100, utilizationPct)}%` }}
        />
      </div>

      {/* Détail articles */}
      <div className="px-4 py-3">
        <p className="caps mb-2">📋 Articles dans ce batch</p>
        {byArticle.length === 0 ? (
          <p className="text-tiny text-ink-500 italic">Aucun détail article</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
            {byArticle.map((a) => (
              <div
                key={a.code}
                className="flex items-center justify-between gap-2 px-2 py-1.5 bg-paper-2 rounded-input"
              >
                <span className="text-sm text-ink-900 truncate">{a.name}</span>
                <span className="font-mono text-tiny text-ink-700 shrink-0">
                  <strong>{a.pieces}</strong> pc · {(a.weightG / 1000).toFixed(1)} kg
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Clients contributeurs */}
        <p className="caps mb-2">🏨 Clients dans ce batch ({batch.contributors.length})</p>
        <div className="flex flex-wrap gap-1.5">
          {batch.contributors.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-pill bg-brand-50 border-hairline border-brand-200 text-tiny"
            >
              <span className="font-semibold text-brand-800">{c.clientName}</span>
              <span className="text-ink-500 font-mono">
                {c.pieces}pc · {(c.weight / 1000).toFixed(1)}kg
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Étape 3 : regroupement par client + planification livraison ─── */

function ReadyDeliveryView({ orders }: { orders: OrderDetailWithMeta[] }) {
  // Regroupe par client
  const groups = useMemo(() => {
    const m = new Map<string, { clientId: string; clientName: string; orders: OrderDetailWithMeta[] }>();
    for (const o of orders) {
      const key = o.clientId ?? '_unknown';
      const e = m.get(key) ?? {
        clientId: key,
        clientName: o.clientName ?? '—',
        orders: [],
      };
      e.orders.push(o);
      m.set(key, e);
    }
    return Array.from(m.values()).sort((a, b) => b.orders.length - a.orders.length);
  }, [orders]);

  // Sépare planifiées vs non-planifiées par groupe
  const isOrderPlanned = (o: OrderDetailWithMeta) =>
    o.workflowState === 'LIVRAISON_SCHEDULED' || o.workflowState === 'LIVRAISON_IN_PROGRESS';

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-500 mb-2">
        {orders.length} commande{orders.length > 1 ? 's' : ''} prête
        {orders.length > 1 ? 's' : ''} · {groups.length} client{groups.length > 1 ? 's' : ''}
      </p>
      {groups.map((g) => {
        const allPlanned = g.orders.every(isOrderPlanned);
        return (
          <ClientDeliveryGroup
            key={g.clientId}
            group={g}
            allPlanned={allPlanned}
          />
        );
      })}
    </div>
  );
}

function ClientDeliveryGroup({
  group,
  allPlanned,
}: {
  group: { clientId: string; clientName: string; orders: OrderDetailWithMeta[] };
  allPlanned: boolean;
}) {
  const [open, setOpen] = useState(!allPlanned);
  const totalKg = group.orders.reduce((s, o) => s + (o.totalWeight ?? 0), 0);
  const totalPieces = group.orders.reduce(
    (s, o) => s + (o.receivedPieces ?? o.triage?.totalPieces ?? 0),
    0,
  );
  const plannedCount = group.orders.filter(
    (o) => o.workflowState === 'LIVRAISON_SCHEDULED' || o.workflowState === 'LIVRAISON_IN_PROGRESS',
  ).length;

  return (
    <div
      className={cn(
        'rounded-input border-hairline overflow-hidden',
        allPlanned ? 'bg-ok-50 border-ok-200' : 'bg-paper border-ink-200',
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-paper-2 transition-colors text-left"
      >
        <Building2
          className={cn('w-5 h-5 shrink-0', allPlanned ? 'text-ok-700' : 'text-brand-800')}
          strokeWidth={1.75}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink-900 truncate">{group.clientName}</p>
          <p className="text-tiny text-ink-500">
            {group.orders.length} commande{group.orders.length > 1 ? 's' : ''} ·{' '}
            <span className="font-mono tnum">{totalKg.toFixed(1)} kg</span>
            {totalPieces > 0 && (
              <>
                {' · '}
                <span className="font-mono tnum">{totalPieces} pièces</span>
              </>
            )}
          </p>
        </div>
        {allPlanned ? (
          <span className="px-2.5 py-1 rounded-pill text-tiny font-semibold bg-ok-100 text-ok-700 shrink-0">
            ✓ Planifiée
          </span>
        ) : plannedCount > 0 ? (
          <span className="px-2.5 py-1 rounded-pill text-tiny font-semibold bg-baobab-50 text-baobab-700 shrink-0">
            {plannedCount}/{group.orders.length} planifiées
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-pill text-tiny font-semibold bg-brand-50 text-brand-800 shrink-0">
            À planifier
          </span>
        )}
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 py-3 border-t border-hairline border-ink-100 space-y-3">
          {/* Liste des commandes du client */}
          <div className="space-y-1">
            {group.orders.map((o) => (
              <ReadyOrderRow key={o.id} order={o} />
            ))}
          </div>

          {/* Form planification — uniquement s'il reste des commandes non planifiées */}
          {!allPlanned && <DeliveryPlanForm group={group} />}
        </div>
      )}
    </div>
  );
}

function ReadyOrderRow({ order }: { order: OrderDetailWithMeta }) {
  const planned =
    order.workflowState === 'LIVRAISON_SCHEDULED' ||
    order.workflowState === 'LIVRAISON_IN_PROGRESS';
  return (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded-input bg-paper-2">
      <span className="font-mono text-sm font-semibold text-ink-900 tnum shrink-0">
        {order.orderNumber}
      </span>
      <span className="font-mono text-tiny text-ink-500 tnum flex-1">
        {(order.totalWeight ?? 0).toFixed(1)} kg
        {order.receivedPieces != null && (
          <span className="ml-2">{order.receivedPieces} pc</span>
        )}
      </span>
      {planned && (
        <span className="text-tiny text-ok-700 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
          Planifiée
        </span>
      )}
    </div>
  );
}

function DeliveryPlanForm({
  group,
}: {
  group: { clientId: string; clientName: string; orders: OrderDetailWithMeta[] };
}) {
  const { data: usersData = [] } = useUsers();
  const { data: vehiclesData = [] } = useVehicles();
  const schedule = useScheduleDelivery();

  const drivers = useMemo(
    () => usersData.filter((u) => u.role === 'Chauffeur' && u.isActive),
    [usersData],
  );
  const vehicles = useMemo(
    () => vehiclesData.filter((v) => v.status === 'Disponible' || v.status === 'En tournée'),
    [vehiclesData],
  );

  const today = new Date();
  const defaultDate = today.toISOString().slice(0, 10);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('14:00');
  const [error, setError] = useState<string | null>(null);

  const targets = group.orders.filter(
    (o) =>
      o.workflowState !== 'LIVRAISON_SCHEDULED' &&
      o.workflowState !== 'LIVRAISON_IN_PROGRESS',
  );

  const submit = async () => {
    setError(null);
    if (!driverId) {
      setError('Choisis un chauffeur');
      return;
    }
    const plannedAt = new Date(`${date}T${time}:00`).toISOString();
    try {
      // Planifie chaque commande non planifiée du groupe
      for (const o of targets) {
        await schedule.mutateAsync({
          id: o.id,
          data: {
            driverId,
            vehicleId: vehicleId || undefined,
            plannedAt,
          },
        });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Erreur de planification');
    }
  };

  return (
    <div className="rounded-input border-hairline border-ink-200 bg-paper p-3 space-y-3">
      <p className="caps">Planifier la tournée pour ce client</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-tiny font-semibold text-ink-700 mb-1 flex items-center gap-1.5">
            <User className="w-3 h-3" strokeWidth={2} />
            Chauffeur *
          </label>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-full px-3 py-2 text-sm border-hairline border-ink-200 rounded-input bg-paper focus:ring-2 focus:ring-brand-800/30 focus:border-brand-800"
          >
            <option value="">— Sélectionner —</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.firstName} {d.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-tiny font-semibold text-ink-700 mb-1 flex items-center gap-1.5">
            <Truck className="w-3 h-3" strokeWidth={2} />
            Véhicule
          </label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full px-3 py-2 text-sm border-hairline border-ink-200 rounded-input bg-paper focus:ring-2 focus:ring-brand-800/30 focus:border-brand-800"
          >
            <option value="">— (optionnel) —</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.marque} {v.modele} · {v.matricule}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-tiny font-semibold text-ink-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" strokeWidth={2} />
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border-hairline border-ink-200 rounded-input bg-paper focus:ring-2 focus:ring-brand-800/30 focus:border-brand-800"
          />
        </div>

        <div>
          <label className="text-tiny font-semibold text-ink-700 mb-1">Heure</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border-hairline border-ink-200 rounded-input bg-paper focus:ring-2 focus:ring-brand-800/30 focus:border-brand-800"
          />
        </div>
      </div>

      {error && (
        <p className="text-tiny text-rose-700 bg-rose-50 border-hairline border-rose-200 rounded-input px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-tiny text-ink-500">
          {targets.length} commande{targets.length > 1 ? 's' : ''} à planifier
        </p>
        <Button
          size="sm"
          onClick={submit}
          disabled={!driverId || schedule.isPending || targets.length === 0}
          className="gap-1.5"
        >
          {schedule.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Truck className="w-3.5 h-3.5" strokeWidth={1.75} />
          )}
          Planifier la livraison
        </Button>
      </div>
    </div>
  );
}

function KpiBox({
  label,
  value,
  sub,
  tint,
}: {
  label: string;
  value: string;
  sub?: string;
  tint?: 'brand';
}) {
  return (
    <div
      className={cn(
        'p-3 rounded-input border-hairline',
        tint === 'brand' ? 'bg-brand-50 border-brand-200' : 'bg-paper-2 border-ink-200',
      )}
    >
      <p className="caps">{label}</p>
      <p className="font-mono text-xl font-semibold text-ink-900 tnum mt-1">{value}</p>
      {sub && <p className="text-tiny text-ink-500">{sub}</p>}
    </div>
  );
}
