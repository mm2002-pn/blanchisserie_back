import { api } from './client';

export interface ApiBatchContributor {
  id: string;
  orderId: string;
  pieces: number;
  weight: number; // grammes
  order?: {
    orderNumber: string;
    client?: { id: string; name: string };
  };
}

export interface ApiBatch {
  id: string;
  code: string;
  stage: 'lavage' | 'sechage' | 'calandrage' | 'repassage' | 'finition';
  status: 'suggested' | 'validated' | 'in_progress' | 'completed' | 'cancelled';
  priority: boolean;
  machineId: string;
  machine?: { reference: string; brand: string; model: string };
  programId: string | null;
  program?: { code: string; name: string };
  capacity: number;
  currentLoad: number; // grammes
  utilization: number;
  estimatedDurationMin: number;
  startedAt: string | null;
  estimatedEndAt: string | null;
  completedAt: string | null;
  actualWaterL: number | null;
  actualEnergyKwh: number | null;
  suggestedByAi: boolean;
  aiScore: number | null;
  aiRationale: string | null;
  createdAt: string;
  contributors: ApiBatchContributor[];
}

export type Stage = ApiBatch['stage'];

export async function listBatches(stage?: Stage): Promise<ApiBatch[]> {
  const { data } = await api.get<{ items: ApiBatch[] }>('/batches', {
    params: stage ? { stage } : {},
  });
  return data.items;
}

export type StageWaitingCounts = Partial<
  Record<'sechage' | 'calandrage' | 'repassage' | 'finition', number>
>;

export async function getWaitingCounts(): Promise<StageWaitingCounts> {
  const { data } = await api.get<StageWaitingCounts>('/batches/waiting-counts');
  return data;
}

export type StageName = 'sechage' | 'calandrage' | 'repassage' | 'finition';

export interface CreateStageBatchesResult {
  batches: unknown[];
  itemsPlaced: number;
  finalized?: boolean;
}

export async function createStageBatches(
  stage: StageName,
): Promise<CreateStageBatchesResult> {
  const { data } = await api.post<CreateStageBatchesResult>(
    '/batches/create-stage-batches',
    { stage },
  );
  return data;
}

/* ─── Stage proposal (suggest + persist avec édition) ─── */

export interface StageProposalItem {
  tagId: string;
  orderId: string;
  clientName?: string;
  weight: number; // grammes
  linenTypeCode?: string;
  linenTypeName?: string;
}

export interface StageProposalContributor {
  orderId: string;
  clientName: string;
  pieces: number;
  weight: number;
}

export interface StageProposalBatch {
  machineId: string;
  machineRef?: string;
  programId: string;
  programName?: string;
  capacity: number; // kg
  totalWeight: number; // kg
  utilization: number;
  contributors: StageProposalContributor[];
  items: StageProposalItem[];
}

export interface StageProposal {
  source: 'heuristic-stage';
  stage: StageName;
  finalized?: boolean;
  batches: StageProposalBatch[];
  meta: {
    itemsPlaced: number;
    itemsLeftover: number;
    averageUtilization: number;
    aiRationale?: string;
  };
}

export async function suggestStageBatches(
  stage: StageName,
): Promise<StageProposal> {
  const { data } = await api.post<StageProposal>('/batches/suggest-stage', {
    stage,
  });
  return data;
}

export async function persistStageProposal(
  proposal: StageProposal,
): Promise<CreateStageBatchesResult> {
  const { data } = await api.post<CreateStageBatchesResult>(
    '/batches/persist-stage',
    { proposal },
  );
  return data;
}

/* ─── Mappers vers la shape Batch utilisée par ProductionPage ────── */

const STAGE_TO_LANE: Record<Stage, number> = {
  lavage: 0,
  sechage: 1,
  calandrage: 2,
  repassage: 3,
  finition: 4,
};

function fmtHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.max(0, Math.round(min % 60));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface UiBatch {
  lane: number;
  code: string;
  program: string;
  machine: string;
  capacity: number;
  unit: 'kg' | 'pcs';
  contributors: { client: string; kg: number; pieces: number; tagPrefix: string }[];
  elapsed: string;
  total: string;
  priority?: boolean;
  suggested?: boolean;
}

export function mapApiBatchToUi(b: ApiBatch): UiBatch {
  const startedAt = b.startedAt ? new Date(b.startedAt) : null;
  const elapsedMin = startedAt
    ? Math.max(0, (Date.now() - startedAt.getTime()) / 60_000)
    : 0;
  return {
    lane: STAGE_TO_LANE[b.stage],
    code: b.code,
    program: b.program ? `${b.program.code} · ${b.program.name}` : '—',
    machine: b.machine ? `${b.machine.brand} ${b.machine.model}` : '—',
    capacity: b.capacity,
    unit: 'kg',
    contributors: b.contributors.map((c) => ({
      client: c.order?.client?.name ?? '—',
      kg: Math.round(c.weight / 100) / 10,
      pieces: c.pieces,
      tagPrefix: c.order?.orderNumber ?? c.orderId.slice(0, 8),
    })),
    elapsed: fmtHHMM(elapsedMin),
    total: fmtHHMM(b.estimatedDurationMin),
    priority: b.priority,
    suggested: b.status === 'suggested',
  };
}

