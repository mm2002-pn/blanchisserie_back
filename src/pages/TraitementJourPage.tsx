import { Fragment, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Truck,
  Building2,
  ChevronRight,
  Loader2,
  PlayCircle,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import {
  usePipelineSteps,
  type StepDef,
  type StepKey,
} from '@/lib/pipeline/steps';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  dayBounds,
  ordersKeys,
  useOrders,
  useOrdersRealtime,
} from '@/hooks/queries/useOrders';
import {
  batchesKeys,
  useBatches,
  useBatchesRealtime,
  useCompleteBatch,
  useCreateStageBatches,
  usePersistStageProposal,
  useStartBatch,
  useSuggestStageBatches,
  useWaitingCounts,
} from '@/hooks/queries/useBatches';
import { useMachines } from '@/hooks/queries/useMachines';
import { useWashPrograms } from '@/hooks/queries/useWashPrograms';
import type { Machine, WashingProgram } from '@/types';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { MappedOrder } from '@/lib/api/orders.api';
import type {
  ApiBatch,
  StageName,
  StageProposal,
} from '@/lib/api/batches.api';

/**
 * Traitement du jour — pipeline opérationnel A→Z, filtré côté API sur la journée.
 *
 * Pipeline (de gauche à droite) :
 *   ① À triater  →  ② Lavage  →  ③ Séchage  →  ④ Calandrage / ⑤ Repassage
 *                                                  →  ⑥ Finition  →  ⑦ Livraison
 *
 * Chaque étape est une carte autonome avec ses items, ses CTAs, et son statut.
 */

const DAILY_CAPACITY_KG = 800;

export default function TraitementJourPage() {
  useOrdersRealtime();
  useBatchesRealtime();

  // Page "du jour" : filtre figé sur aujourd'hui
  const baseDate = useMemo(() => new Date(), []);
  const { dateFrom, dateTo } = useMemo(() => dayBounds(baseDate), [baseDate]);

  // ---- Data fetching (filtres backend) ---------------------------------
  // Commandes en cours dans le pipeline atelier (filtre par updatedAt du jour)
  const { data: pipelineOrdersResp } = useOrders({
    pageSize: 200,
    statusIn: 'received,triaged,in_production,ready',
    dateFrom,
    dateTo,
    dateField: 'updatedAt',
  });
  // Commandes prêtes à livrer du jour (status=ready, planifiées ou non)
  const { data: readyOrdersResp } = useOrders({
    pageSize: 200,
    status: 'ready',
    dateFrom,
    dateTo,
    dateField: 'updatedAt',
  });

  const pipelineOrders = (pipelineOrdersResp?.items ?? []) as MappedOrder[];
  const readyOrders = (readyOrdersResp?.items ?? []) as MappedOrder[];

  // Batches en cours du jour (filtré client-side car endpoint /batches simple)
  const { data: batches = [] } = useBatches();
  const todayBatches = useMemo(
    () =>
      batches.filter((b) => {
        const d = b.startedAt
          ? new Date(b.startedAt)
          : new Date(b.createdAt);
        return d.getTime() >= new Date(dateFrom).getTime() && d.getTime() < new Date(dateTo).getTime();
      }),
    [batches, dateFrom, dateTo],
  );
  const { data: waitingCounts } = useWaitingCounts();

  // ---- Buckets par étape ------------------------------------------------
  // Sur cette page le triage est externalisé sur /atelier-jour/triage.
  // Ici on ne montre que les commandes "triagées" prêtes à sélectionner.
  const triagedPool = pipelineOrders.filter((o) => o.apiStatus === 'triaged');
  const inProduction = pipelineOrders.filter((o) => o.apiStatus === 'in_production');

  const batchesByStage = useMemo(() => {
    const m: Record<StageName | 'lavage', ApiBatch[]> = {
      lavage: [],
      sechage: [],
      calandrage: [],
      repassage: [],
      finition: [],
    };
    for (const b of todayBatches) {
      if (m[b.stage]) m[b.stage]!.push(b);
    }
    return m;
  }, [todayBatches]);

  // Un batch est "en cours / non terminé" si son status n'est pas completed/cancelled.
  // Les batches `completed` ne doivent PAS bloquer l'avance vers l'étape suivante.
  const isPending = (b: ApiBatch) =>
    b.status !== 'completed' && b.status !== 'cancelled';

  // Compteurs par étape (n'incluent que ce qui reste à faire)
  // Étape 1 "Sélection production" : commandes triagées prêtes à lancer.
  const stepCounts: Record<string, number> = {
    triage: triagedPool.length,
    lavage: batchesByStage.lavage.filter(isPending).length,
    sechage:
      batchesByStage.sechage.filter(isPending).length +
      (waitingCounts?.sechage ?? 0),
    calandrage:
      batchesByStage.calandrage.filter(isPending).length +
      (waitingCounts?.calandrage ?? 0),
    repassage:
      batchesByStage.repassage.filter(isPending).length +
      (waitingCounts?.repassage ?? 0),
    finition:
      batchesByStage.finition.filter(isPending).length +
      (waitingCounts?.finition ?? 0),
    livraison: readyOrders.length,
  };

  // KPIs jour
  const totalKgInPipeline = inProduction.reduce(
    (s, o) => s + (o.totalWeight ?? 0),
    0,
  );

  // Étapes "concernées" aujourd'hui : Triage et Livraison sont toujours
  // applicables. Les 5 stages production sont concernés s'ils ont eu (ou ont)
  // de l'activité — batches créés OU pièces en attente.
  // Les types de linge / leurs catégories déterminent automatiquement le
  // circuit côté backend (LP→calandre, LF→repassage, NAE→finition direct),
  // donc une étape vide aujourd'hui = non concernée par le pipeline du jour.
  const stageRelevant: Record<string, boolean> = {
    triage: true,
    lavage: batchesByStage.lavage.length > 0,
    sechage:
      batchesByStage.sechage.length > 0 || (waitingCounts?.sechage ?? 0) > 0,
    calandrage:
      batchesByStage.calandrage.length > 0 ||
      (waitingCounts?.calandrage ?? 0) > 0,
    repassage:
      batchesByStage.repassage.length > 0 ||
      (waitingCounts?.repassage ?? 0) > 0,
    finition:
      batchesByStage.finition.length > 0 ||
      (waitingCounts?.finition ?? 0) > 0,
    livraison: true,
  };

  // Pipeline dynamique (ordre + métadonnées des étapes).
  // Sur cette page la 1re étape (`triage`) devient "Sélection production"
  // car le triage opérationnel se fait désormais sur /atelier-jour/triage.
  const PIPELINE_STEPS = usePipelineSteps();
  const STEPS = useMemo(
    () =>
      PIPELINE_STEPS.map((s) =>
        s.key === 'triage'
          ? {
              ...s,
              title: 'Sélection production',
              shortLabel: 'Sélection',
              hint: 'Choisir les commandes triées à lancer en production',
            }
          : s,
      ),
    [PIPELINE_STEPS],
  );
  const stepByKey = useMemo(
    () => Object.fromEntries(STEPS.map((s) => [s.key, s])) as Record<StepKey, StepDef>,
    [STEPS],
  );

  // Navigation step bar — démarrer au début du workflow (1re étape de la séquence).
  const [activeStepKey, setActiveStepKey] = useState<StepKey>(
    () => STEPS[0]?.key ?? 'triage',
  );

  return (
    <div className="space-y-5 pb-12">
      {/* ===== Header + filtre jour ===== */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="caps mb-1">Atelier</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900 capitalize">
            Traitement —{' '}
            {new Intl.DateTimeFormat('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(baseDate)}
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Pipeline complet de la journée, filtré côté API (status + date).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <KpiPill
            icon={Scale}
            label="En production"
            value={`${totalKgInPipeline.toFixed(0)} kg`}
            sub={`${inProduction.length} commandes`}
          />
        </div>
      </div>

      {/* ===== Step bar dynamique (cliquable) ===== */}
      <PipelineStepper
        steps={STEPS}
        counts={stepCounts}
        activeKey={activeStepKey}
        onSelect={setActiveStepKey}
        relevant={stageRelevant}
      />

      {/* ===== Contenu : SEULE l'étape active est rendue ===== */}
      <StepSwitcher activeKey={activeStepKey}>
        {{
          triage: (
            <StepSection
              step={stepByKey.triage!}
              count={triagedPool.length}
              active={triagedPool.length > 0}
            >
              {triagedPool.length === 0 ? (
                <EmptyHint icon={CheckCircle2} tone="ok">
                  Aucune commande triée en attente. Le triage atelier se fait sur
                  la page dédiée — les commandes apparaîtront ici une fois
                  triées.
                </EmptyHint>
              ) : (
                <ProductionLauncher
                  pool={triagedPool}
                  dailyCapacity={DAILY_CAPACITY_KG}
                />
              )}
            </StepSection>
          ),

          lavage: (
            <StepSection
              step={stepByKey.lavage!}
              count={stepCounts.lavage ?? 0}
              active={(stepCounts.lavage ?? 0) > 0}
            >
              <BatchesList batches={batchesByStage.lavage} />
            </StepSection>
          ),

          sechage: (
            <StepSection
              step={stepByKey.sechage!}
              count={stepCounts.sechage ?? 0}
              waiting={waitingCounts?.sechage ?? 0}
              active={(stepCounts.sechage ?? 0) > 0}
            >
              {(waitingCounts?.sechage ?? 0) > 0 && (
                <StageLauncher stage="sechage" waiting={waitingCounts!.sechage!} />
              )}
              <BatchesList batches={batchesByStage.sechage} />
            </StepSection>
          ),

          calandrage: (
            <StepSection
              step={stepByKey.calandrage!}
              count={stepCounts.calandrage ?? 0}
              waiting={waitingCounts?.calandrage ?? 0}
              active={(stepCounts.calandrage ?? 0) > 0}
            >
              {(waitingCounts?.calandrage ?? 0) > 0 && (
                <SimpleStageStarter stage="calandrage" waiting={waitingCounts!.calandrage!} />
              )}
              <BatchesList batches={batchesByStage.calandrage} />
            </StepSection>
          ),

          repassage: (
            <StepSection
              step={stepByKey.repassage!}
              count={stepCounts.repassage ?? 0}
              waiting={waitingCounts?.repassage ?? 0}
              active={(stepCounts.repassage ?? 0) > 0}
            >
              {(waitingCounts?.repassage ?? 0) > 0 && (
                <SimpleStageStarter stage="repassage" waiting={waitingCounts!.repassage!} />
              )}
              <BatchesList batches={batchesByStage.repassage} />
            </StepSection>
          ),

          finition: (
            <StepSection
              step={stepByKey.finition!}
              count={stepCounts.finition ?? 0}
              waiting={waitingCounts?.finition ?? 0}
              active={(stepCounts.finition ?? 0) > 0}
            >
              {(waitingCounts?.finition ?? 0) > 0 && (
                <SimpleStageStarter stage="finition" waiting={waitingCounts!.finition!} />
              )}
              <BatchesList batches={batchesByStage.finition} />
            </StepSection>
          ),

          livraison: (
            <StepSection
              step={stepByKey.livraison!}
              count={readyOrders.length}
              active={readyOrders.length > 0}
            >
              {readyOrders.length === 0 ? (
                <EmptyHint icon={Truck} tone="muted">
                  Aucune commande prête à livrer.
                </EmptyHint>
              ) : (
                <div className="card-surface bg-paper p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg font-medium text-ink-900">
                      {readyOrders.length} commande
                      {readyOrders.length > 1 ? 's' : ''} prête
                      {readyOrders.length > 1 ? 's' : ''} à livrer
                    </p>
                    <p className="text-sm text-ink-500 mt-1">
                      La planification des tournées de livraison se fait sur la
                      page dédiée.
                    </p>
                  </div>
                  <Link
                    to="/route-planning/new?type=delivery"
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-input bg-brand-800 text-paper text-sm font-semibold hover:bg-brand-900 transition-colors shrink-0"
                  >
                    <Truck className="w-4 h-4" strokeWidth={2} />
                    Planifier les livraisons
                  </Link>
                </div>
              )}
            </StepSection>
          ),
        }}
      </StepSwitcher>

      {/* Navigation prev/next entre étapes */}
      <StepNav
        steps={STEPS}
        activeKey={activeStepKey}
        onSelect={setActiveStepKey}
        counts={stepCounts}
        relevant={stageRelevant}
      />
    </div>
  );
}

/* ════════════ UI — Step bar (stepper cliquable) ════════════ */

/** Indice de la première étape qui a encore du travail (count > 0).
 *  C'est la "barrière" : aucune étape postérieure n'est accessible tant qu'elle
 *  n'est pas vidée. -1 si tout est terminé. */
function blockingIdx(steps: StepDef[], counts: Record<string, number>): number {
  return steps.findIndex((s) => (counts[s.key] ?? 0) > 0);
}

/** Stages spécifiques à une seule catégorie de linge (signalés par badge sur le nœud). */
const CATEGORY_BADGES: Partial<Record<StepKey, { label: string; tint: string; title: string }>> = {
  calandrage: {
    label: 'LP',
    tint: 'bg-brand-50 text-brand-800 border-brand-200',
    title: 'Linge plat uniquement (draps, taies, nappes)',
  },
  repassage: {
    label: 'LF',
    tint: 'bg-violet-50 text-violet-700 border-violet-200',
    title: 'Linge forme uniquement (chemises, pantalons)',
  },
};

function PipelineStepper({
  steps,
  counts,
  activeKey,
  onSelect,
}: {
  steps: StepDef[];
  counts: Record<string, number>;
  activeKey: StepKey;
  onSelect: (k: StepKey) => void;
  /** Reste accepté pour compatibilité d'appel mais non utilisé. */
  relevant?: Record<string, boolean>;
}) {
  return (
    <div
      className="card-surface px-3 py-2.5 flex items-center gap-1 overflow-x-auto"
      role="navigation"
      aria-label="Étapes du pipeline production"
    >
      {steps.map((s, i) => (
        <Fragment key={s.key}>
          <StepNode
            step={s}
            count={counts[s.key] ?? 0}
            active={activeKey === s.key}
            onClick={() => onSelect(s.key as StepKey)}
            categoryBadge={CATEGORY_BADGES[s.key as StepKey]}
          />
          {i < steps.length - 1 && (
            <div
              className="flex items-center self-center shrink-0 px-0.5"
              aria-hidden="true"
            >
              <ChevronRight
                className="w-3.5 h-3.5 text-ink-300"
                strokeWidth={1.75}
              />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}

function StepNode({
  step,
  count,
  active,
  onClick,
  categoryBadge,
}: {
  step: StepDef;
  count: number;
  active: boolean;
  onClick: () => void;
  categoryBadge?: { label: string; tint: string; title: string };
}) {
  const Icon = step.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      title={categoryBadge?.title}
      className={cn(
        'relative flex-1 min-w-[80px] px-2 py-1.5 rounded-input flex items-center gap-2 transition-all text-left',
        active
          ? 'bg-brand-50 ring-2 ring-brand-800'
          : 'hover:bg-paper-2',
      )}
      aria-current={active ? 'step' : undefined}
    >
      <span
        className={cn(
          'w-8 h-8 rounded-input flex items-center justify-center shrink-0',
          active ? 'bg-brand-800 text-paper' : step.accentBg,
        )}
      >
        <Icon
          className={cn('w-4 h-4', active ? '' : step.accent)}
          strokeWidth={1.75}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-tiny font-semibold truncate leading-tight',
            active ? 'text-brand-800' : 'text-ink-700',
          )}
        >
          {step.shortLabel}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span
            className={cn(
              'font-mono text-tiny tnum leading-none',
              active
                ? 'text-brand-800 font-bold'
                : count > 0
                  ? 'text-ink-900 font-semibold'
                  : 'text-ink-400',
            )}
          >
            {count}
          </span>
          {categoryBadge && (
            <span
              className={cn(
                'px-1 py-px rounded font-mono text-[9px] font-bold leading-none border',
                categoryBadge.tint,
              )}
            >
              {categoryBadge.label}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ════════════ Switcher (rend uniquement l'étape active) ════════════ */

function StepSwitcher({
  activeKey,
  children,
}: {
  activeKey: StepKey;
  children: Partial<Record<StepKey, React.ReactNode>>;
}) {
  return <>{children[activeKey] ?? null}</>;
}

/* ════════════ Navigation Précédent / Suivant ════════════ */

function StepNav({
  steps,
  activeKey,
  onSelect,
  counts,
  relevant,
}: {
  steps: StepDef[];
  activeKey: StepKey;
  onSelect: (k: StepKey) => void;
  counts: Record<string, number>;
  relevant: Record<string, boolean>;
}) {
  const idx = steps.findIndex((s) => s.key === activeKey);
  const prev = idx > 0 ? steps[idx - 1] : null;
  // "next" saute les étapes non concernées (config par catégorie de linge :
  // si aucun item LF aujourd'hui, on saute Repassage automatiquement).
  let nextIdx = idx + 1;
  while (nextIdx < steps.length && relevant[steps[nextIdx]!.key] === false) {
    nextIdx += 1;
  }
  const next = nextIdx < steps.length ? steps[nextIdx] : null;
  const skippedCount = next ? nextIdx - idx - 1 : 0;

  // L'étape suivante est verrouillée :
  //  - quand l'étape actuelle a encore du contenu (block === idx)
  //  - OU quand le pipeline est entièrement vide (rien n'a été engagé)
  const block = blockingIdx(steps, counts);
  const nextLocked =
    next != null && (block === -1 || idx + 1 > block);
  // (Si on saute des étapes non concernées, le verrou reste basé sur la 1re
  //  étape avec du travail — pas sur l'index sauté.)

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {prev ? (
        <button
          type="button"
          onClick={() => onSelect(prev.key as StepKey)}
          className="flex items-center gap-2 px-4 py-2 rounded-input border-hairline border-ink-200 bg-paper text-sm text-ink-700 hover:bg-paper-2 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" strokeWidth={1.75} />
          <span>
            <span className="text-micro text-ink-500 block leading-none">Étape précédente</span>
            <span className="font-semibold">{prev.shortLabel}</span>
          </span>
        </button>
      ) : (
        <span />
      )}

      {next ? (
        <button
          type="button"
          onClick={() => !nextLocked && onSelect(next.key as StepKey)}
          disabled={nextLocked}
          title={
            nextLocked
              ? `Termine d'abord l'étape ${steps[idx]?.shortLabel ?? ''}`
              : undefined
          }
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-input text-sm transition-colors',
            nextLocked
              ? 'bg-ink-100 text-ink-400 cursor-not-allowed'
              : 'bg-brand-800 text-paper hover:bg-brand-900',
          )}
        >
          <span className="text-right">
            <span
              className={cn(
                'text-micro block leading-none',
                nextLocked ? 'text-ink-400' : 'text-brand-100',
              )}
            >
              {nextLocked
                ? 'Verrouillée'
                : skippedCount > 0
                  ? `Étape suivante · saute ${skippedCount} non concernée${skippedCount > 1 ? 's' : ''}`
                  : 'Étape suivante'}
            </span>
            <span className="font-semibold">{next.shortLabel}</span>
          </span>
          <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

/* ════════════ UI — Section d'étape ════════════ */

function StepSection({
  step,
  count,
  waiting,
  active,
  children,
}: {
  step: StepDef;
  count: number;
  waiting?: number;
  active: boolean;
  children: React.ReactNode;
}) {
  const Icon = step.icon;
  return (
    <section
      id={`step-${step.key}`}
      className={cn(
        'card-surface overflow-hidden',
        active ? 'ring-1 ring-brand-200' : '',
      )}
    >
      <header className="px-5 py-4 flex items-center gap-3 border-b border-hairline border-ink-100">
        <span
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm font-bold shrink-0',
            active ? 'bg-brand-800 text-paper' : 'bg-ink-100 text-ink-500',
          )}
        >
          {step.index}
        </span>
        <span
          className={cn(
            'w-9 h-9 rounded-input flex items-center justify-center shrink-0',
            step.accentBg,
          )}
        >
          <Icon className={cn('w-4 h-4', step.accent)} strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-lg font-medium text-ink-900">
            {step.title}
          </h2>
          <p className="text-tiny text-ink-500 truncate">{step.hint}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {waiting != null && waiting > 0 && (
            <span className="px-2 py-0.5 rounded-pill text-tiny font-semibold bg-baobab-50 text-baobab-700">
              +{waiting} en attente
            </span>
          )}
          <span
            className={cn(
              'px-2.5 py-1 rounded-pill font-mono text-tiny font-semibold tnum',
              active ? 'bg-brand-50 text-brand-800' : 'bg-paper-2 text-ink-500',
            )}
          >
            {count}
          </span>
        </div>
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

/* ════════════ Bloc lancement production ════════════ */

interface ProposalItem {
  tagId: string;
  orderId: string;
  clientName?: string;
  weight: number; // grammes
  linenTypeCode?: string;
  linenTypeName?: string;
}

interface ProposalContributor {
  orderId: string;
  clientName: string;
  pieces: number;
  weight: number; // grammes
}

interface ProposalBatch {
  machineId: string;
  machineRef?: string;
  programId: string;
  programName?: string;
  capacity: number; // kg
  totalWeight: number; // kg
  utilization: number; // 0..1
  contributors: ProposalContributor[];
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
  };
}

interface ItemGroup {
  key: string;
  linenTypeCode?: string;
  linenTypeName?: string;
  orderId: string;
  clientName?: string;
  itemIdxs: number[]; // indices dans batch.items
  totalWeightG: number;
}

/** Regroupe les items d'un batch par (article, commande). */
function groupItems(items: ProposalItem[]): ItemGroup[] {
  const m = new Map<string, ItemGroup>();
  items.forEach((it, idx) => {
    const k = `${it.linenTypeCode ?? '?'}::${it.orderId}`;
    const g =
      m.get(k) ?? {
        key: k,
        linenTypeCode: it.linenTypeCode,
        linenTypeName: it.linenTypeName,
        orderId: it.orderId,
        clientName: it.clientName,
        itemIdxs: [],
        totalWeightG: 0,
      };
    g.itemIdxs.push(idx);
    g.totalWeightG += it.weight ?? 0;
    m.set(k, g);
  });
  return Array.from(m.values()).sort(
    (a, b) => b.totalWeightG - a.totalWeightG,
  );
}

/** Recalcule poids total, utilisation et contributors d'un batch à partir de ses items. */
function recalcBatch(b: ProposalBatch): ProposalBatch {
  const totalG = b.items.reduce((s, it) => s + (it.weight ?? 0), 0);
  const totalKg = totalG / 1000;
  const utilization = b.capacity > 0 ? totalKg / b.capacity : 0;
  const contribMap = new Map<string, ProposalContributor>();
  for (const it of b.items) {
    const k = it.orderId;
    const e =
      contribMap.get(k) ?? {
        orderId: k,
        clientName: it.clientName ?? '—',
        pieces: 0,
        weight: 0,
      };
    e.pieces += 1;
    e.weight += it.weight ?? 0;
    contribMap.set(k, e);
  }
  return {
    ...b,
    totalWeight: totalKg,
    utilization,
    contributors: Array.from(contribMap.values()),
  };
}

function ProductionLauncher({
  pool,
  dailyCapacity,
}: {
  pool: MappedOrder[];
  dailyCapacity: number;
}) {
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  /** Proposition éditable (clone local de la réponse compute, modifiable). */
  const [editableProposal, setEditableProposal] = useState<AiProposal | null>(
    null,
  );

  // Catalogue machines + programmes pour la réaffectation manuelle
  const { data: machines = [] } = useMachines();
  const { data: programs = [] } = useWashPrograms();
  // On n'expose ici que les laveuses actives (étape Lavage = entrée production)
  const availableMachines = useMemo(
    () =>
      machines.filter(
        (m) => m.type === 'Laveuse' && m.status === 'Active',
      ),
    [machines],
  );

  const compose = () => {
    const sorted = [...pool].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const set = new Set<string>();
    let cumKg = 0;
    for (const o of sorted) {
      const kg = o.totalWeight ?? 0;
      if (cumKg + kg > dailyCapacity) break;
      set.add(o.id);
      cumKg += kg;
    }
    setSelectedIds(set);
  };

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedKg = pool
    .filter((o) => selectedIds.has(o.id))
    .reduce((s, o) => s + (o.totalWeight ?? 0), 0);

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
      // Clone profond pour pouvoir éditer sans muter le cache de la mutation
      setEditableProposal(JSON.parse(JSON.stringify(data)) as AiProposal);
    },
  });

  const persist = useMutation({
    mutationFn: async () => {
      if (!editableProposal) throw new Error('Pas de proposition');
      const { data } = await api.post('/batches/persist', {
        proposal: editableProposal,
      });
      return data;
    },
    onSuccess: () => {
      compute.reset();
      setEditableProposal(null);
      setSelectedIds(new Set());
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      void qc.invalidateQueries({ queryKey: batchesKeys.all });
    },
  });

  const cancelProposal = () => {
    compute.reset();
    setEditableProposal(null);
  };

  /** Déplace une liste d'items (par leur index dans le batch source) vers un autre batch. */
  const moveItems = (
    sourceIdx: number,
    itemIdxs: number[],
    targetIdx: number,
  ) => {
    if (sourceIdx === targetIdx || itemIdxs.length === 0) return;
    setEditableProposal((prev) => {
      if (!prev?.batches) return prev;
      const next: AiProposal = {
        ...prev,
        batches: prev.batches.map((b) => ({ ...b, items: [...b.items] })),
      };
      const source = next.batches![sourceIdx]!;
      const target = next.batches![targetIdx]!;
      // Trier en ordre décroissant pour splice sans décaler les index restants
      const sorted = [...itemIdxs].sort((a, b) => b - a);
      const taken: ProposalItem[] = [];
      for (const idx of sorted) {
        const [it] = source.items.splice(idx, 1);
        if (it) taken.push(it);
      }
      target.items.push(...taken);
      next.batches![sourceIdx] = recalcBatch(source);
      next.batches![targetIdx] = recalcBatch(target);
      return next;
    });
  };

  /** Change la machine d'un batch (et recalcule utilisation avec la nouvelle capacité). */
  const setBatchMachine = (batchIdx: number, machine: Machine) => {
    setEditableProposal((prev) => {
      if (!prev?.batches) return prev;
      const next: AiProposal = {
        ...prev,
        batches: prev.batches.map((b) => ({ ...b, items: [...b.items] })),
      };
      const b = next.batches![batchIdx]!;
      b.machineId = machine.id;
      b.machineRef = `${machine.brand} ${machine.model} · ${machine.reference}`;
      b.capacity = machine.capacity;
      next.batches![batchIdx] = recalcBatch(b);
      return next;
    });
  };

  /** Change le programme de lavage d'un batch. */
  const setBatchProgram = (batchIdx: number, program: WashingProgram) => {
    setEditableProposal((prev) => {
      if (!prev?.batches) return prev;
      const next: AiProposal = {
        ...prev,
        batches: prev.batches.map((b) => ({ ...b, items: [...b.items] })),
      };
      const b = next.batches![batchIdx]!;
      b.programId = program.id;
      b.programName = program.name;
      next.batches![batchIdx] = b;
      return next;
    });
  };

  /** Ajoute un batch vide ; l'utilisateur lui assignera ensuite machine/programme + déplacera des items. */
  const addEmptyBatch = () => {
    if (availableMachines.length === 0) return;
    const m = availableMachines[0]!;
    const p = programs[0];
    setEditableProposal((prev) => {
      if (!prev?.batches) return prev;
      const fresh: ProposalBatch = {
        machineId: m.id,
        machineRef: `${m.brand} ${m.model} · ${m.reference}`,
        programId: p?.id ?? '',
        programName: p?.name,
        capacity: m.capacity,
        totalWeight: 0,
        utilization: 0,
        contributors: [],
        items: [],
      };
      return { ...prev, batches: [...prev.batches, fresh] };
    });
  };

  /** Supprime un batch ; ses items sont absorbés par le batch précédent
   *  (ou suivant si on supprime le 1er) pour ne perdre aucune pièce. */
  const removeBatch = (batchIdx: number) => {
    setEditableProposal((prev) => {
      if (!prev?.batches || prev.batches.length <= 1) return prev;
      const next: AiProposal = {
        ...prev,
        batches: prev.batches.map((b) => ({ ...b, items: [...b.items] })),
      };
      const removed = next.batches!.splice(batchIdx, 1)[0];
      if (removed && removed.items.length > 0) {
        const fallbackIdx = batchIdx === 0 ? 0 : batchIdx - 1;
        const fallback = next.batches![fallbackIdx]!;
        fallback.items.push(...removed.items);
        next.batches![fallbackIdx] = recalcBatch(fallback);
      }
      return next;
    });
  };

  const allSelected = selectedIds.size === pool.length && pool.length > 0;
  const someSelected = selectedIds.size > 0;
  const selectedPieces = pool
    .filter((o) => selectedIds.has(o.id))
    .reduce(
      (s, o) => s + (o.triage?.totalPieces ?? o.receivedPieces ?? 0),
      0,
    );

  return (
    <section className="card-surface overflow-hidden border-2 border-brand-200">
      {/* ─── Header sélection ─────────────────────────────────────── */}
      <div className="px-5 py-4 bg-brand-50/50 border-b border-brand-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-input bg-brand-800 text-paper flex items-center justify-center shrink-0">
          <PlayCircle className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-lg font-medium text-ink-900">
            Sélection des commandes à lancer
          </h2>
          <p className="text-tiny text-ink-700">
            {pool.length} commande{pool.length > 1 ? 's' : ''} triée
            {pool.length > 1 ? 's' : ''} prête
            {pool.length > 1 ? 's' : ''} — choisis celles à envoyer en production.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              allSelected ? setSelectedIds(new Set()) : compose()
            }
          >
            {allSelected ? 'Tout désélectionner' : 'Sélection auto'}
          </Button>
        </div>
      </div>

      {/* ─── Liste + sélection bulk ───────────────────────────────── */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                allSelected
                  ? setSelectedIds(new Set())
                  : setSelectedIds(new Set(pool.map((o) => o.id)))
              }
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected;
              }}
              className="w-4 h-4 accent-brand-800"
            />
            <span className="font-semibold">
              {selectedIds.size}/{pool.length} sélectionnée
              {selectedIds.size > 1 ? 's' : ''}
            </span>
            {someSelected && (
              <span className="text-tiny font-mono tnum text-ink-500">
                · {selectedPieces} pc · {selectedKg.toFixed(1)} kg
              </span>
            )}
          </label>
          {someSelected && (
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-tiny font-semibold text-ink-500 hover:text-rose-700"
            >
              Effacer
            </button>
          )}
        </div>

        <div className="border-hairline border-ink-200 rounded-input divide-y divide-ink-100 bg-paper overflow-hidden">
          {pool.map((o) => (
            <PoolRow
              key={o.id}
              order={o}
              selected={selectedIds.has(o.id)}
              onToggle={() => toggle(o.id)}
            />
          ))}
        </div>

        <CapacityBar selectedKg={selectedKg} totalKg={dailyCapacity} />
      </div>

      {/* Proposition détaillée + édition manuelle */}
      {editableProposal && (
        <div className="px-5 pb-5">
          <ProposalReview
            proposal={editableProposal}
            onMoveItems={moveItems}
            onSetMachine={setBatchMachine}
            onSetProgram={setBatchProgram}
            onAddBatch={addEmptyBatch}
            onRemoveBatch={removeBatch}
            machines={availableMachines}
            programs={programs}
            onCancel={cancelProposal}
            onValidate={() => persist.mutate()}
            validating={persist.isPending}
          />
        </div>
      )}

      {/* ─── Footer actions ──────────────────────────────────────── */}
      <div className="px-5 py-4 bg-paper-2 border-t border-ink-200 flex items-center justify-between gap-3 flex-wrap">
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
            title="Optimisation par IA"
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
            title="Algorithme heuristique simple"
          >
            Heuristique
          </button>
        </div>

        <Button
          size="lg"
          onClick={() => compute.mutate()}
          disabled={
            selectedIds.size === 0 ||
            compute.isPending ||
            editableProposal != null
          }
          className="gap-2 h-12 px-5 text-base"
        >
          {compute.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PlayCircle className="w-4 h-4" strokeWidth={1.75} />
          )}
          Démarrer la production
        </Button>
      </div>
    </section>
  );
}

function PoolRow({
  order,
  selected,
  onToggle,
}: {
  order: MappedOrder;
  selected: boolean;
  onToggle: () => void;
}) {
  const officialKg = order.receivedWeight
    ? Math.round((order.receivedWeight / 1000) * 10) / 10
    : (order.totalWeight ?? 0);
  const piecesTriaged = order.triage?.totalPieces ?? order.receivedPieces ?? 0;

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
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-brand-800 shrink-0" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-ink-900 truncate">
            {order.clientName ?? '—'}
          </p>
          <p className="font-mono text-tiny text-ink-500 tnum">{order.orderNumber}</p>
        </div>
        <p className="font-mono text-tiny text-ink-500 tnum">
          {piecesTriaged} pièces · pesé {officialKg.toFixed(1)} kg
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-base font-semibold tnum text-ink-900">
          {officialKg.toFixed(0)}
          <span className="text-sm font-normal text-ink-500"> kg</span>
        </p>
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

/* ════════════ Proposition détaillée + édition manuelle ════════════ */

function ProposalReview({
  proposal,
  onMoveItems,
  onSetMachine,
  onSetProgram,
  onAddBatch,
  onRemoveBatch,
  machines,
  programs,
  onCancel,
  onValidate,
  validating,
}: {
  proposal: AiProposal;
  onMoveItems: (
    sourceIdx: number,
    itemIdxs: number[],
    targetIdx: number,
  ) => void;
  onSetMachine: (batchIdx: number, machine: Machine) => void;
  onSetProgram: (batchIdx: number, program: WashingProgram) => void;
  onAddBatch: () => void;
  onRemoveBatch: (batchIdx: number) => void;
  machines: Machine[];
  programs: WashingProgram[];
  onCancel: () => void;
  onValidate: () => void;
  validating: boolean;
}) {
  const batches = proposal.batches ?? [];
  const meta = proposal.meta ?? {};
  const [editMode, setEditMode] = useState(false);
  const itemsTotal = batches.reduce((s, b) => s + (b.items?.length ?? 0), 0);
  const totalKg = batches.reduce((s, b) => s + (b.totalWeight ?? 0), 0);
  const avgUtil =
    batches.length > 0
      ? batches.reduce((s, b) => s + (b.utilization ?? 0), 0) / batches.length
      : 0;

  return (
    <section className="mt-4 rounded-input border-2 border-ok-200 bg-paper overflow-hidden">
      {/* ─── Bandeau succès + KPIs ─────────────────────────────── */}
      <div className="px-5 py-4 bg-ok-50 border-b border-ok-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-input bg-ok-700 text-paper flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-medium text-ink-900">
              Proposition de production prête
            </h3>
            <p className="text-tiny text-ink-700">
              {batches.length} cycle{batches.length > 1 ? 's' : ''} de lavage ·{' '}
              {itemsTotal} pièces placées
            </p>
          </div>
          <Button
            variant={editMode ? 'success' : 'secondary'}
            size="sm"
            onClick={() => setEditMode((v) => !v)}
            className="shrink-0"
          >
            {editMode ? 'Édition active' : 'Modifier'}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <KpiTileSm label="Cycles" value={String(batches.length)} />
          <KpiTileSm label="Poids" value={`${totalKg.toFixed(1)} kg`} />
          <KpiTileSm
            label="Util. moy."
            value={`${Math.round(avgUtil * 100)}%`}
            tone={
              avgUtil >= 0.9 ? 'ok' : avgUtil >= 0.7 ? 'brand' : 'baobab'
            }
          />
        </div>
      </div>

      {/* ─── Rationale IA (si présent) ──────────────────────────── */}
      {meta.aiRationale && (
        <div className="px-5 py-3 bg-brand-50/40 border-b border-brand-200 flex items-start gap-2">
          <Sparkles
            className="w-4 h-4 text-brand-800 shrink-0 mt-0.5"
            strokeWidth={1.75}
          />
          <p className="text-tiny italic text-ink-700">{meta.aiRationale}</p>
        </div>
      )}

      {/* ─── Hint édition ───────────────────────────────────────── */}
      {editMode && (
        <div className="px-5 py-3 bg-baobab-50/60 border-b border-baobab-200 flex items-start gap-2.5">
          <AlertTriangle
            className="w-4 h-4 text-baobab-700 shrink-0 mt-0.5"
            strokeWidth={1.75}
          />
          <p className="text-tiny text-ink-700">
            <strong className="text-ink-900">Édition manuelle active.</strong>{' '}
            Ouvre le détail d'un cycle pour glisser une pièce vers un autre,
            modifier la machine / le programme, ou supprimer un cycle.
          </p>
        </div>
      )}

      {/* ─── Tableau dense des cycles ──────────────────────────── */}
      {batches.length === 0 ? (
        <p className="text-sm text-ink-500 italic text-center py-8">
          Aucun cycle proposé. Sélectionne plus de commandes ou vérifie les
          programmes compatibles.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink-200 bg-paper-2">
                <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500 w-14">
                  #
                </th>
                <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500">
                  Machine
                </th>
                <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500">
                  Programme
                </th>
                <th className="px-3 py-2 text-right font-semibold text-micro uppercase tracking-wide text-ink-500 w-16">
                  Art.
                </th>
                <th className="px-3 py-2 text-right font-semibold text-micro uppercase tracking-wide text-ink-500 w-20">
                  Pièces
                </th>
                <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500 w-44">
                  Poids
                </th>
                <th className="px-3 py-2 text-right font-semibold text-micro uppercase tracking-wide text-ink-500 w-16">
                  Util.
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {batches.map((b, i) => (
                <ProposedBatchCard
                  key={`${b.machineId}-${i}`}
                  batch={b}
                  index={i}
                  batches={batches}
                  editMode={editMode}
                  onMoveItems={onMoveItems}
                  onSetMachine={onSetMachine}
                  onSetProgram={onSetProgram}
                  onRemove={onRemoveBatch}
                  machines={machines}
                  programs={programs}
                  canRemove={batches.length > 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editMode && machines.length > 0 && batches.length > 0 && (
        <div className="px-5 py-3 border-t border-ink-100">
          <button
            type="button"
            onClick={onAddBatch}
            className="w-full py-3 rounded-input border-2 border-dashed border-brand-300 bg-paper text-sm font-semibold text-brand-800 hover:bg-brand-50 hover:border-brand-800 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" strokeWidth={1.75} />
            Ajouter un cycle vide
          </button>
        </div>
      )}

      {/* ─── Footer actions ─────────────────────────────────────── */}
      <div className="px-5 py-4 bg-paper-2 border-t border-ink-200 flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={validating}
        >
          Annuler
        </Button>
        <Button
          size="lg"
          onClick={onValidate}
          disabled={validating || batches.length === 0}
          className="gap-2 h-12 px-6 text-base"
        >
          {validating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <PlayCircle className="w-5 h-5" strokeWidth={2} />
          )}
          Lancer la production
        </Button>
      </div>
    </section>
  );
}

function KpiTileSm({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'brand' | 'baobab';
}) {
  const valueClass =
    tone === 'ok'
      ? 'text-ok-700'
      : tone === 'baobab'
        ? 'text-baobab-700'
        : tone === 'brand'
          ? 'text-brand-800'
          : 'text-ink-900';
  return (
    <div className="bg-paper border-hairline border-ok-200 rounded-input px-3 py-2.5">
      <p className="text-micro text-ink-500 uppercase tracking-wide">{label}</p>
      <p
        className={cn(
          'font-mono tnum text-xl font-semibold leading-tight mt-0.5',
          valueClass,
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** Format des données portées par dataTransfer durant un drag. */
const DND_MIME = 'application/x-laundry-batch-items';

function ProposedBatchCard({
  batch,
  index,
  batches,
  editMode,
  onMoveItems,
  onSetMachine,
  onSetProgram,
  onRemove,
  machines,
  programs,
  canRemove,
}: {
  batch: ProposalBatch;
  index: number;
  batches: ProposalBatch[];
  editMode: boolean;
  onMoveItems: (
    sourceIdx: number,
    itemIdxs: number[],
    targetIdx: number,
  ) => void;
  onSetMachine: (batchIdx: number, machine: Machine) => void;
  onSetProgram: (batchIdx: number, program: WashingProgram) => void;
  onRemove: (batchIdx: number) => void;
  machines: Machine[];
  programs: WashingProgram[];
  canRemove: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  // Compteur enter/leave : `dragleave` se déclenche aussi quand le curseur
  // entre dans un enfant du drop-target ; on ne reset le flag qu'à l'équilibre 0.
  const dragDepth = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    if (!editMode) return;
    if (!Array.from(e.dataTransfer.types).includes(DND_MIME)) return;
    dragDepth.current += 1;
    if (!dragOver) setDragOver(true);
  };
  const handleDragOver = (e: React.DragEvent) => {
    if (!editMode) return;
    if (!Array.from(e.dataTransfer.types).includes(DND_MIME)) return;
    // preventDefault est nécessaire pour autoriser le drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDragLeave = () => {
    if (!editMode) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0 && dragOver) setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    if (!editMode) return;
    dragDepth.current = 0;
    setDragOver(false);
    try {
      const raw = e.dataTransfer.getData(DND_MIME);
      if (!raw) return;
      const data = JSON.parse(raw) as { sourceIdx: number; itemIdxs: number[] };
      if (
        typeof data.sourceIdx === 'number' &&
        Array.isArray(data.itemIdxs) &&
        data.sourceIdx !== index
      ) {
        e.preventDefault();
        onMoveItems(data.sourceIdx, data.itemIdxs, index);
      }
    } catch {
      /* ignore */
    }
  };
  const [showItems, setShowItems] = useState(false);
  // Détail (articles + clients) plié par défaut pour ne pas saturer l'écran.
  // Auto-ouvert en mode édition pour exposer les sélecteurs machine/programme.
  const [showDetail, setShowDetail] = useState(false);
  const expanded = showDetail || editMode;
  const utilizationPct = Math.round((batch.utilization ?? 0) * 100);
  const pieces = batch.items?.length ?? 0;
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

  // Regroupement par type d'article (vue agrégée)
  const byArticle = useMemo(() => {
    const m = new Map<
      string,
      { name: string; pieces: number; weightG: number }
    >();
    for (const it of batch.items ?? []) {
      const key = it.linenTypeCode ?? '?';
      const name = it.linenTypeName ?? key;
      const e = m.get(key) ?? { name, pieces: 0, weightG: 0 };
      e.pieces += 1;
      e.weightG += it.weight;
      m.set(key, e);
    }
    return Array.from(m.entries())
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.weightG - a.weightG);
  }, [batch.items]);

  return (
    <Fragment>
      {/* ─── Ligne principale (table row dense) ─────────────────── */}
      <tr
        onClick={() => !editMode && setShowDetail((v) => !v)}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'transition-colors align-middle',
          editMode ? '' : 'cursor-pointer hover:bg-paper-2',
          dragOver && 'bg-brand-100',
        )}
      >
        {/* # Cycle */}
        <td className="px-3 py-2">
          <div className="w-9 h-9 rounded-input bg-brand-800 text-paper flex items-center justify-center">
            <span className="font-mono text-tiny font-bold">
              C{String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </td>

        {/* Machine */}
        <td className="px-3 py-2 min-w-0">
          {editMode ? (
            <select
              value={batch.machineId}
              onChange={(e) => {
                const m = machines.find((x) => x.id === e.target.value);
                if (m) onSetMachine(index, m);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-tiny font-semibold px-2 py-1.5 border-hairline border-ink-200 rounded bg-paper focus:border-brand-800 focus:outline-none"
              title="Changer de machine"
            >
              {machines.length === 0 && (
                <option value="">— aucune —</option>
              )}
              {!machines.some((m) => m.id === batch.machineId) && (
                <option value={batch.machineId}>
                  {batch.machineRef ?? batch.machineId}
                </option>
              )}
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brand} {m.model} · {m.reference} · {m.capacity}kg
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm font-semibold text-ink-900 truncate leading-tight">
              {batch.machineRef ?? batch.machineId}
            </p>
          )}
        </td>

        {/* Programme */}
        <td className="px-3 py-2 min-w-0">
          {editMode ? (
            <select
              value={batch.programId}
              onChange={(e) => {
                const p = programs.find((x) => x.id === e.target.value);
                if (p) onSetProgram(index, p);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-tiny font-semibold px-2 py-1.5 border-hairline border-ink-200 rounded bg-paper focus:border-brand-800 focus:outline-none"
              title="Changer de programme"
            >
              {!programs.some((p) => p.id === batch.programId) && (
                <option value={batch.programId}>
                  {batch.programName ?? batch.programId}
                </option>
              )}
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-ink-700 truncate leading-tight">
              {batch.programName ?? batch.programId}
            </p>
          )}
        </td>

        {/* Articles count */}
        <td className="px-3 py-2 text-right">
          <span className="font-mono text-sm tnum text-ink-700">
            {byArticle.length}
          </span>
        </td>

        {/* Pièces */}
        <td className="px-3 py-2 text-right">
          <span className="font-mono text-sm tnum font-semibold text-ink-900">
            {pieces}
          </span>
        </td>

        {/* Poids + mini-barre de remplissage */}
        <td className="px-3 py-2">
          <p className="font-mono text-tiny tnum text-ink-900 leading-tight mb-1">
            {(batch.totalWeight ?? 0).toFixed(1)}
            <span className="text-ink-500"> / {batch.capacity} kg</span>
          </p>
          <div className="h-1.5 bg-ink-100 rounded overflow-hidden">
            <div
              className={cn('h-full transition-all', fillColor)}
              style={{ width: `${Math.min(100, utilizationPct)}%` }}
            />
          </div>
        </td>

        {/* Util% */}
        <td className="px-3 py-2 text-right">
          <span
            className={cn(
              'font-mono text-sm tnum font-semibold',
              utilColor,
            )}
          >
            {utilizationPct}%
          </span>
        </td>

        {/* Action (chevron ou suppression) */}
        <td className="px-2 py-2 text-right">
          {editMode ? (
            canRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="w-8 h-8 rounded-input flex items-center justify-center text-ink-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                title="Supprimer ce cycle"
                aria-label="Supprimer ce cycle"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )
          ) : (
            <ChevronRight
              className={cn(
                'w-4 h-4 text-ink-400 transition-transform inline-block',
                expanded && 'rotate-90',
              )}
              strokeWidth={1.75}
            />
          )}
        </td>
      </tr>

      {/* ─── Ligne détail (Articles + Clients) ──────────────────── */}
      {expanded && (
        <tr className="bg-paper-2/40">
          <td colSpan={8} className="px-4 py-4">
            <div className="space-y-3">
              {/* Articles */}
              <div>
                <p className="caps mb-2">Articles ({byArticle.length})</p>
                {byArticle.length === 0 ? (
                  <p className="text-tiny text-ink-500 italic">Cycle vide</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {byArticle.map((a) => (
                      <div
                        key={a.code}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 bg-paper rounded-input border-hairline border-ink-200"
                      >
                        <span className="text-sm text-ink-900 truncate">
                          {a.name}
                        </span>
                        <span className="font-mono text-tiny text-ink-700 shrink-0 tnum">
                          <strong className="text-ink-900">{a.pieces}</strong> pc
                          {' · '}
                          {(a.weightG / 1000).toFixed(1)} kg
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clients */}
              <div>
                <p className="caps mb-2">Clients ({batch.contributors.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {batch.contributors.map((c, i) => (
                    <span
                      key={`${c.orderId}-${i}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-brand-50 border-hairline border-brand-200 text-tiny"
                    >
                      <Building2
                        className="w-3 h-3 text-brand-800"
                        strokeWidth={1.75}
                      />
                      <span className="font-semibold text-brand-800">
                        {c.clientName}
                      </span>
                      <span className="text-ink-500 font-mono tnum">
                        · {c.pieces} pc
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Détail pièce par pièce — uniquement en mode édition */}
              {editMode && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowItems((v) => !v)}
                    className="w-full px-3 py-2 rounded-input text-tiny font-semibold text-brand-800 hover:bg-brand-50 border-hairline border-brand-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 transition-transform',
                        showItems && 'rotate-90',
                      )}
                      strokeWidth={2}
                    />
                    {showItems ? 'Masquer' : 'Voir'} le détail pièce par pièce
                    {' '}({batch.items.length})
                  </button>

                  {showItems && (
                    <ItemGroupsTable
                      batch={batch}
                      index={index}
                      batches={batches}
                      editMode={editMode}
                      onMoveItems={onMoveItems}
                    />
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

/** Détail groupé : une ligne par (article × commande), avec contrôle de
 *  déplacement permettant de transférer N/total pièces vers un autre batch. */
function ItemGroupsTable({
  batch,
  index,
  batches,
  editMode,
  onMoveItems,
}: {
  batch: ProposalBatch;
  index: number;
  batches: ProposalBatch[];
  editMode: boolean;
  onMoveItems: (
    sourceIdx: number,
    itemIdxs: number[],
    targetIdx: number,
  ) => void;
}) {
  const groups = useMemo(() => groupItems(batch.items), [batch.items]);

  return (
    <div className="mt-2 border-hairline border-ink-200 rounded-input overflow-hidden">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 py-1.5 bg-paper-2 border-b border-hairline border-ink-200 text-micro font-semibold text-ink-500 uppercase tracking-wide">
        <span />
        <span>Article · Client</span>
        <span className="text-right">Pièces</span>
        <span className="text-right">Poids</span>
        <span className="text-right">{editMode ? 'Déplacer' : ''}</span>
      </div>
      <div className="divide-y divide-ink-100">
        {groups.map((g) => (
          <ItemGroupRow
            key={g.key}
            group={g}
            sourceIdx={index}
            batches={batches}
            editMode={editMode}
            onMoveItems={onMoveItems}
          />
        ))}
      </div>
    </div>
  );
}

function ItemGroupRow({
  group,
  sourceIdx,
  batches,
  editMode,
  onMoveItems,
}: {
  group: ItemGroup;
  sourceIdx: number;
  batches: ProposalBatch[];
  editMode: boolean;
  onMoveItems: (
    sourceIdx: number,
    itemIdxs: number[],
    targetIdx: number,
  ) => void;
}) {
  const total = group.itemIdxs.length;
  const [moveQty, setMoveQty] = useState<number>(total);
  const [target, setTarget] = useState<number | ''>('');
  const [isDragging, setIsDragging] = useState(false);

  // Si la qty stockée dépasse le total restant après un déplacement, on resync
  useMemo(() => {
    if (moveQty > total) setMoveQty(total);
  }, [moveQty, total]);

  const apply = () => {
    if (target === '' || target === sourceIdx) return;
    const qty = Math.max(1, Math.min(total, moveQty));
    const idxs = group.itemIdxs.slice(0, qty);
    onMoveItems(sourceIdx, idxs, Number(target));
    setTarget('');
    setMoveQty(total - qty || 1);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!editMode) return;
    const qty = Math.max(1, Math.min(total, moveQty));
    const idxs = group.itemIdxs.slice(0, qty);
    e.dataTransfer.setData(
      DND_MIME,
      JSON.stringify({ sourceIdx, itemIdxs: idxs }),
    );
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };
  const handleDragEnd = () => setIsDragging(false);

  return (
    <div
      draggable={editMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 py-2 items-center hover:bg-paper-2 transition-opacity',
        editMode ? 'cursor-grab active:cursor-grabbing' : '',
        isDragging && 'opacity-40',
      )}
      title={editMode ? 'Glisser ce groupe vers un autre batch' : undefined}
    >
      {editMode ? (
        <span className="text-ink-300 select-none" aria-hidden>
          ⋮⋮
        </span>
      ) : (
        <span />
      )}
      <div className="min-w-0">
        <p className="text-tiny font-semibold text-ink-900 truncate">
          {group.linenTypeName ?? group.linenTypeCode ?? '—'}
        </p>
        <p className="text-micro text-ink-500 truncate">
          {group.clientName ?? '—'}
        </p>
      </div>
      <span className="font-mono text-tiny tnum text-ink-900 text-right">
        {total}
      </span>
      <span className="font-mono text-tiny tnum text-ink-700 text-right">
        {(group.totalWeightG / 1000).toFixed(1)} kg
      </span>
      {editMode ? (
        <div className="flex items-center gap-1 justify-end">
          <input
            type="number"
            min={1}
            max={total}
            value={moveQty}
            onChange={(e) =>
              setMoveQty(
                Math.max(
                  1,
                  Math.min(total, parseInt(e.target.value, 10) || 1),
                ),
              )
            }
            className="w-12 text-tiny font-mono text-right px-1 py-0.5 border-hairline border-ink-200 rounded bg-paper focus:border-brand-800 focus:outline-none"
            aria-label="Nombre de pièces à déplacer"
            title="Pièces à déplacer (drag ou OK)"
          />
          <span className="text-micro text-ink-400">/{total}</span>
          <select
            value={target}
            onChange={(e) =>
              setTarget(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="text-tiny font-mono px-1.5 py-0.5 border-hairline border-ink-200 rounded bg-paper focus:border-brand-800 focus:outline-none"
          >
            <option value="">→ batch…</option>
            {batches.map((_, j) =>
              j === sourceIdx ? null : (
                <option key={j} value={j}>
                  B{String(j + 1).padStart(2, '0')}
                </option>
              ),
            )}
          </select>
          <button
            type="button"
            onClick={apply}
            disabled={target === ''}
            className={cn(
              'text-tiny font-semibold px-2 py-0.5 rounded',
              target === ''
                ? 'bg-ink-100 text-ink-400 cursor-not-allowed'
                : 'bg-brand-800 text-paper hover:bg-brand-900',
            )}
          >
            OK
          </button>
        </div>
      ) : (
        <span />
      )}
    </div>
  );
}

/* ════════════ Bloc batches d'un stage ════════════ */

function BatchesList({ batches }: { batches: ApiBatch[] }) {
  if (batches.length === 0) {
    return (
      <EmptyHint icon={CheckCircle2} tone="muted">
        Aucun cycle en cours sur cette étape pour le moment.
      </EmptyHint>
    );
  }
  return (
    <div className="mt-3 -mx-5 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-ink-200 bg-paper-2">
            <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500 w-24">
              Code
            </th>
            <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500">
              Machine · Programme
            </th>
            <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500 w-48">
              Charge
            </th>
            <th className="px-3 py-2 text-right font-semibold text-micro uppercase tracking-wide text-ink-500 w-16">
              Util.
            </th>
            <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500 w-32">
              Temps
            </th>
            <th className="px-3 py-2 text-right font-semibold text-micro uppercase tracking-wide text-ink-500 w-16">
              Clt.
            </th>
            <th className="px-3 py-2 text-left font-semibold text-micro uppercase tracking-wide text-ink-500 w-32">
              Statut
            </th>
            <th className="px-3 py-2 w-28" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {batches.map((b) => (
            <ActiveBatchRow key={b.id} batch={b} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BATCH_STATUS_META: Record<
  string,
  { label: string; dot: string; tint: string }
> = {
  suggested: {
    label: 'Proposé',
    dot: 'bg-ink-400',
    tint: 'text-ink-700',
  },
  validated: {
    label: 'Prêt',
    dot: 'bg-brand-800',
    tint: 'text-brand-800',
  },
  in_progress: {
    label: 'En cours',
    dot: 'bg-baobab-600 animate-pulse',
    tint: 'text-baobab-700',
  },
  completed: {
    label: 'Terminé',
    dot: 'bg-ok-700',
    tint: 'text-ok-700',
  },
  cancelled: {
    label: 'Annulé',
    dot: 'bg-rose-700',
    tint: 'text-rose-700',
  },
};

function ActiveBatchRow({ batch }: { batch: ApiBatch }) {
  const startBatch = useStartBatch();
  const completeBatch = useCompleteBatch();
  const [expanded, setExpanded] = useState(false);

  const machine = batch.machine
    ? `${batch.machine.brand ?? ''} ${batch.machine.model ?? ''}`.trim()
    : batch.machineId;
  const program = batch.program?.name ?? '—';
  const loadKg = (batch.currentLoad ?? 0) / 1000;
  const utilizationPct = Math.round((batch.utilization ?? 0) * 100);
  const capacity = batch.capacity ?? 0;
  const startedAt = batch.startedAt ? new Date(batch.startedAt) : null;
  const elapsedMin = startedAt
    ? Math.floor((Date.now() - startedAt.getTime()) / 60_000)
    : 0;
  const totalMin = batch.estimatedDurationMin ?? 0;
  const clientCount = batch.contributors?.length ?? 0;

  const fillColor =
    utilizationPct >= 90
      ? 'bg-ok-700'
      : utilizationPct >= 70
        ? 'bg-brand-800'
        : 'bg-baobab-600';
  const utilTextColor =
    utilizationPct >= 90
      ? 'text-ok-700'
      : utilizationPct >= 70
        ? 'text-brand-800'
        : 'text-baobab-700';

  const status =
    BATCH_STATUS_META[batch.status] ?? BATCH_STATUS_META.suggested!;
  const canStart =
    batch.status === 'suggested' || batch.status === 'validated';
  const canComplete = batch.status === 'in_progress';

  // Progression temps (in_progress only)
  const timeProgressPct =
    canComplete && totalMin > 0
      ? Math.min(100, (elapsedMin / totalMin) * 100)
      : 0;

  return (
    <Fragment>
      <tr
        onClick={() => setExpanded((v) => !v)}
        className="cursor-pointer hover:bg-paper-2 transition-colors align-middle"
      >
        {/* Code */}
        <td className="px-3 py-2">
          <span className="font-mono text-tiny font-bold text-ink-900">
            {batch.code}
          </span>
        </td>

        {/* Machine · Programme */}
        <td className="px-3 py-2 min-w-0">
          <p className="text-sm font-semibold text-ink-900 truncate leading-tight">
            {machine}
          </p>
          <p className="text-tiny text-ink-500 truncate mt-0.5">{program}</p>
        </td>

        {/* Charge + mini-bar */}
        <td className="px-3 py-2">
          <p className="font-mono text-tiny tnum text-ink-900 leading-tight mb-1">
            {loadKg.toFixed(1)}
            <span className="text-ink-500"> / {capacity} kg</span>
          </p>
          <div className="h-1.5 bg-ink-100 rounded overflow-hidden">
            <div
              className={cn('h-full transition-all', fillColor)}
              style={{ width: `${Math.min(100, utilizationPct)}%` }}
            />
          </div>
        </td>

        {/* Util% */}
        <td className="px-3 py-2 text-right">
          <span
            className={cn(
              'font-mono text-sm tnum font-semibold',
              utilTextColor,
            )}
          >
            {utilizationPct}%
          </span>
        </td>

        {/* Temps */}
        <td className="px-3 py-2">
          {canComplete ? (
            <>
              <p className="font-mono text-tiny tnum text-baobab-700 font-semibold leading-tight">
                {elapsedMin} / {totalMin} min
              </p>
              <div className="h-1.5 bg-ink-100 rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-baobab-600 transition-all"
                  style={{ width: `${timeProgressPct}%` }}
                />
              </div>
            </>
          ) : batch.status === 'completed' ? (
            <p className="font-mono text-tiny tnum text-ok-700">Fait</p>
          ) : (
            <p className="font-mono text-tiny tnum text-ink-700">
              {totalMin} min
            </p>
          )}
        </td>

        {/* Clients count */}
        <td className="px-3 py-2 text-right">
          <span className="font-mono text-sm tnum text-ink-700">
            {clientCount}
          </span>
        </td>

        {/* Statut */}
        <td className="px-3 py-2">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn('w-2 h-2 rounded-full shrink-0', status.dot)}
            />
            <span className={cn('text-tiny font-semibold', status.tint)}>
              {status.label}
            </span>
          </span>
        </td>

        {/* Action */}
        <td className="px-2 py-2">
          {canStart && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                startBatch.mutate(batch.id);
              }}
              disabled={startBatch.isPending}
              className="gap-1 w-full"
            >
              {startBatch.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <PlayCircle className="w-3 h-3" strokeWidth={2} />
              )}
              Démarrer
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              variant="success"
              onClick={(e) => {
                e.stopPropagation();
                completeBatch.mutate({ batchId: batch.id });
              }}
              disabled={completeBatch.isPending}
              className="gap-1 w-full"
            >
              {completeBatch.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
              )}
              Terminer
            </Button>
          )}
          {!canStart && !canComplete && (
            <ChevronRight
              className={cn(
                'w-4 h-4 text-ink-400 transition-transform inline-block',
                expanded && 'rotate-90',
              )}
              strokeWidth={1.75}
            />
          )}
        </td>
      </tr>

      {/* Détail clients sur expand */}
      {expanded && (
        <tr className="bg-paper-2/40">
          <td colSpan={8} className="px-4 py-3">
            <p className="caps mb-2">Clients ({clientCount})</p>
            {clientCount === 0 ? (
              <p className="text-tiny text-ink-500 italic">
                Aucun client associé
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {batch.contributors?.map((c, i) => (
                  <span
                    key={`${c.order?.id ?? i}-${i}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-brand-50 border-hairline border-brand-200 text-tiny"
                  >
                    <Building2
                      className="w-3 h-3 text-brand-800"
                      strokeWidth={1.75}
                    />
                    <span className="font-semibold text-brand-800">
                      {c.order?.client?.name ?? '—'}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

/* ════════════ Stage launcher : suggest → review → persist ════════════ */

const STAGE_FRENCH: Record<StageName, string> = {
  sechage: 'séchage',
  calandrage: 'calandrage',
  repassage: 'repassage',
  finition: 'finition',
};

/** Mappe une StageProposal API vers la shape AiProposal éditable du front,
 *  pour réutiliser ProposalReview (drag-and-drop, sélecteurs, etc.). */
function stageProposalToEditable(p: StageProposal): AiProposal {
  return {
    source: p.source,
    batches: p.batches.map((b) => ({
      machineId: b.machineId,
      machineRef: b.machineRef,
      programId: b.programId,
      programName: b.programName,
      capacity: b.capacity,
      totalWeight: b.totalWeight,
      utilization: b.utilization,
      contributors: b.contributors.map((c) => ({
        orderId: c.orderId,
        clientName: c.clientName,
        pieces: c.pieces,
        weight: c.weight,
      })),
      items: b.items.map((it) => ({
        tagId: it.tagId,
        orderId: it.orderId,
        clientName: it.clientName,
        weight: it.weight,
        linenTypeCode: it.linenTypeCode,
        linenTypeName: it.linenTypeName,
      })),
    })),
    meta: {
      itemsPlaced: p.meta.itemsPlaced,
      itemsLeftover: p.meta.itemsLeftover,
      averageUtilization: p.meta.averageUtilization,
      aiRationale: p.meta.aiRationale,
    },
  };
}

/** Reconvertit la version éditable vers la shape attendue par persist-stage. */
function editableToStageProposal(
  base: StageProposal,
  ed: AiProposal,
): StageProposal {
  return {
    ...base,
    batches: (ed.batches ?? []).map((b) => ({
      machineId: b.machineId,
      machineRef: b.machineRef,
      programId: b.programId,
      programName: b.programName,
      capacity: b.capacity,
      totalWeight: b.totalWeight,
      utilization: b.utilization,
      contributors: b.contributors.map((c) => ({
        orderId: c.orderId,
        clientName: c.clientName,
        pieces: c.pieces,
        weight: c.weight,
      })),
      items: b.items.map((it) => ({
        tagId: it.tagId,
        orderId: it.orderId,
        clientName: it.clientName,
        weight: it.weight,
        linenTypeCode: it.linenTypeCode,
        linenTypeName: it.linenTypeName,
      })),
    })),
    meta: {
      itemsPlaced: (ed.batches ?? []).reduce(
        (s, b) => s + (b.items?.length ?? 0),
        0,
      ),
      itemsLeftover: base.meta.itemsLeftover,
      averageUtilization:
        (ed.batches ?? []).length > 0
          ? (ed.batches ?? []).reduce(
              (s, b) => s + (b.utilization ?? 0),
              0,
            ) / (ed.batches ?? []).length
          : 0,
      aiRationale: base.meta.aiRationale,
    },
  };
}

/**
 * Lanceur simplifié pour les stages sans IA (calandrage, repassage, finition).
 * Un seul clic "Démarrer" : suggère + persiste + démarre les batches d'un coup.
 * Aucun choix de machine / programme requis — le backend pose les valeurs par défaut.
 */
function SimpleStageStarter({
  stage,
  waiting,
}: {
  stage: StageName;
  waiting: number;
}) {
  const suggest = useSuggestStageBatches();
  const persist = usePersistStageProposal();
  const startBatch = useStartBatch();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const label = STAGE_FRENCH[stage];

  const onStart = async () => {
    setError(null);
    setBusy(true);
    try {
      const proposal = await suggest.mutateAsync(stage);
      if (!proposal.batches || proposal.batches.length === 0) {
        setError(`Aucun item disponible pour ${label}.`);
        return;
      }
      const result = await persist.mutateAsync(proposal);
      const created = (result.batches ?? []) as Array<{ id?: string }>;
      for (const b of created) {
        if (b.id) {
          try {
            await startBatch.mutateAsync(b.id);
          } catch {
            // Le batch peut déjà être démarré par le backend ; on ignore.
          }
        }
      }
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ??
        (e instanceof Error ? e.message : 'Erreur lors du démarrage.');
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-hairline border-ink-200 rounded-input bg-paper-2 p-4 mb-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-ink-900">
            {waiting} pièce{waiting > 1 ? 's' : ''} en attente de {label}
          </p>
          <p className="text-tiny text-ink-500 mt-0.5">
            Démarrage groupé — pas de sélection de machine ni de programme.
          </p>
        </div>
        <Button
          onClick={onStart}
          isLoading={busy}
          disabled={busy || waiting === 0}
          className="gap-1.5"
        >
          <PlayCircle className="w-4 h-4" strokeWidth={1.75} />
          Démarrer le {label}
        </Button>
      </div>
      {error && (
        <p className="text-tiny text-danger-600 mt-2">{error}</p>
      )}
    </div>
  );
}

function StageLauncher({
  stage,
  waiting,
}: {
  stage: StageName;
  waiting: number;
}) {
  const suggest = useSuggestStageBatches();
  const persist = usePersistStageProposal();
  const isFinition = stage === 'finition';
  const stageLabel = STAGE_FRENCH[stage];

  // Catalogue machines + programmes pour l'édition manuelle
  const { data: allMachines = [] } = useMachines();
  const { data: programs = [] } = useWashPrograms();
  const machines = useMemo(() => {
    if (isFinition) return [];
    // Pour repassage on accepte aussi les sécheuses-repasseuses (combo dry+iron),
    // qui sont mappées vers le type 'Sécheuse' côté UI.
    const wantedTypes: Record<Exclude<StageName, 'finition'>, Machine['type'][]> = {
      sechage: ['Sécheuse'],
      calandrage: ['Calandreuse'],
      repassage: ['Repasseuse', 'Sécheuse'],
    };
    const wanted = wantedTypes[stage as Exclude<StageName, 'finition'>];
    return allMachines.filter(
      (m) => wanted.includes(m.type) && m.status === 'Active',
    );
  }, [allMachines, stage, isFinition]);

  const [base, setBase] = useState<StageProposal | null>(null);
  const [editable, setEditable] = useState<AiProposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSuggest = async () => {
    setError(null);
    try {
      const data = await suggest.mutateAsync(stage);
      if (!data.batches || data.batches.length === 0) {
        setError(
          `Le calcul n'a produit aucun batch (pas d'item en attente, ou capacité machine insuffisante).`,
        );
        return;
      }
      setBase(data);
      setEditable(JSON.parse(JSON.stringify(stageProposalToEditable(data))));
    } catch (e) {
      const msg =
        // axios error
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        (e instanceof Error ? e.message : 'Erreur lors du calcul.');
      setError(msg);
    }
  };

  const cancel = () => {
    setBase(null);
    setEditable(null);
    suggest.reset();
    persist.reset();
  };

  const validate = async () => {
    if (!base || !editable) return;
    const final = editableToStageProposal(base, editable);
    await persist.mutateAsync(final);
    cancel();
  };

  // Mutateurs partagés avec ProposalReview
  const moveItems = (sourceIdx: number, itemIdxs: number[], targetIdx: number) => {
    if (sourceIdx === targetIdx || itemIdxs.length === 0) return;
    setEditable((prev) => {
      if (!prev?.batches) return prev;
      const next: AiProposal = {
        ...prev,
        batches: prev.batches.map((b) => ({ ...b, items: [...b.items] })),
      };
      const source = next.batches![sourceIdx]!;
      const target = next.batches![targetIdx]!;
      const sorted = [...itemIdxs].sort((a, b) => b - a);
      const taken: ProposalItem[] = [];
      for (const idx of sorted) {
        const [it] = source.items.splice(idx, 1);
        if (it) taken.push(it);
      }
      target.items.push(...taken);
      next.batches![sourceIdx] = recalcBatch(source);
      next.batches![targetIdx] = recalcBatch(target);
      return next;
    });
  };

  const setBatchMachine = (batchIdx: number, machine: Machine) => {
    setEditable((prev) => {
      if (!prev?.batches) return prev;
      const next: AiProposal = {
        ...prev,
        batches: prev.batches.map((b) => ({ ...b, items: [...b.items] })),
      };
      const b = next.batches![batchIdx]!;
      b.machineId = machine.id;
      b.machineRef = `${machine.brand} ${machine.model} · ${machine.reference}`;
      b.capacity = machine.capacity;
      next.batches![batchIdx] = recalcBatch(b);
      return next;
    });
  };

  const setBatchProgram = (batchIdx: number, program: WashingProgram) => {
    setEditable((prev) => {
      if (!prev?.batches) return prev;
      const next: AiProposal = {
        ...prev,
        batches: prev.batches.map((b) => ({ ...b, items: [...b.items] })),
      };
      const b = next.batches![batchIdx]!;
      b.programId = program.id;
      b.programName = program.name;
      next.batches![batchIdx] = b;
      return next;
    });
  };

  const addEmptyBatch = () => {
    if (machines.length === 0) return;
    const m = machines[0]!;
    setEditable((prev) => {
      if (!prev?.batches) return prev;
      const fresh: ProposalBatch = {
        machineId: m.id,
        machineRef: `${m.brand} ${m.model} · ${m.reference}`,
        programId: '',
        capacity: m.capacity,
        totalWeight: 0,
        utilization: 0,
        contributors: [],
        items: [],
      };
      return { ...prev, batches: [...prev.batches, fresh] };
    });
  };

  const removeBatch = (batchIdx: number) => {
    setEditable((prev) => {
      if (!prev?.batches || prev.batches.length <= 1) return prev;
      const next: AiProposal = {
        ...prev,
        batches: prev.batches.map((b) => ({ ...b, items: [...b.items] })),
      };
      const removed = next.batches!.splice(batchIdx, 1)[0];
      if (removed && removed.items.length > 0) {
        const fallbackIdx = batchIdx === 0 ? 0 : batchIdx - 1;
        const fallback = next.batches![fallbackIdx]!;
        fallback.items.push(...removed.items);
        next.batches![fallbackIdx] = recalcBatch(fallback);
      }
      return next;
    });
  };

  // Pas encore de proposition → CTA initial (+ erreur éventuelle)
  if (!editable) {
    return (
      <div className="space-y-2 mb-3">
        <div className="rounded-input border-hairline border-baobab-200 bg-baobab-50 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="w-5 h-5 text-baobab-700 shrink-0" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">
                <strong className="text-baobab-800">{waiting}</strong> pièce
                {waiting > 1 ? 's' : ''} en attente de {stageLabel}
              </p>
              <p className="text-tiny text-ink-700">
                {isFinition
                  ? 'Pliage / mise en sachet — propose la finition pour valider.'
                  : 'Génère une proposition (modifiable) avant de créer les batches.'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={onSuggest}
            disabled={suggest.isPending}
            className="gap-1.5 shrink-0"
          >
            {suggest.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
            Proposer un plan {stageLabel}
          </Button>
        </div>

        {error && (
          <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-3 py-2 flex items-start gap-2">
            <AlertTriangle
              className="w-4 h-4 text-rose-700 shrink-0 mt-0.5"
              strokeWidth={1.75}
            />
            <div className="text-tiny text-rose-800">
              <strong className="block">
                Impossible de générer la proposition
              </strong>
              {error}
              {!isFinition && machines.length === 0 && (
                <p className="mt-1 text-ink-700">
                  Aucune machine compatible n'est marquée comme{' '}
                  <em>Active</em>. Va dans Paramètres → Machines pour vérifier.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Proposition en cours d'édition → ProposalReview avec tous les leviers
  return (
    <div className="mb-4">
      <ProposalReview
        proposal={editable}
        onMoveItems={moveItems}
        onSetMachine={setBatchMachine}
        onSetProgram={setBatchProgram}
        onAddBatch={addEmptyBatch}
        onRemoveBatch={removeBatch}
        machines={machines}
        programs={programs}
        onCancel={cancel}
        onValidate={validate}
        validating={persist.isPending}
      />
    </div>
  );
}

function StageWaitingCta({ stage, count }: { stage: StageName; count: number }) {
  const create = useCreateStageBatches();
  const labels: Record<StageName, string> = {
    sechage: 'séchage',
    calandrage: 'calandrage',
    repassage: 'repassage',
    finition: 'finition',
  };
  const isFinition = stage === 'finition';
  const label = labels[stage];
  return (
    <div className="rounded-input border-hairline border-baobab-200 bg-baobab-50 p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <AlertTriangle className="w-5 h-5 text-baobab-700 shrink-0" strokeWidth={1.75} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900">
            <strong className="text-baobab-800">{count}</strong> pièce{count > 1 ? 's' : ''}{' '}
            en attente de {label}
          </p>
          <p className="text-tiny text-ink-700">
            {isFinition
              ? 'Pliage / mise en sachet — finalise les commandes'
              : `Crée les batches pour démarrer le ${label}`}
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
        {isFinition ? 'Finaliser' : `Créer les batches`}
      </Button>
    </div>
  );
}

/* Bloc Livraison : la planification se fait sur /route-planning/new?type=delivery
   (la page Production se contente d'un CTA de redirection). */

/* ════════════ Bouts d'UI ════════════ */

function KpiPill({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="px-3 py-2 rounded-input bg-paper border-hairline border-ink-200 flex items-center gap-2.5">
      <Icon className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
      <div>
        <p className="text-micro text-ink-500 leading-none">{label}</p>
        <p className="font-mono text-sm font-semibold tnum text-ink-900">
          {value}
        </p>
        {sub && <p className="text-micro text-ink-500">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyHint({
  children,
  icon: Icon,
  tone = 'muted',
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  tone?: 'muted' | 'ok';
}) {
  return (
    <div
      className={cn(
        'text-center py-6 px-4 rounded-input',
        tone === 'ok'
          ? 'bg-ok-50 border-hairline border-ok-200 text-ok-700'
          : 'bg-paper-2 text-ink-500',
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'w-8 h-8 mx-auto mb-2',
            tone === 'ok' ? 'text-ok-700' : 'text-ink-400',
          )}
          strokeWidth={1.5}
        />
      )}
      <p className="text-sm">{children}</p>
    </div>
  );
}
