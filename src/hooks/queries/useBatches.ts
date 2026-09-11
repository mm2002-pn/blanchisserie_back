import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createStageBatches,
  getWaitingCounts,
  listBatches,
  mapApiBatchToUi,
  persistStageProposal,
  suggestStageBatches,
  type Stage,
  type StageName,
  type StageProposal,
  type StageWaitingCounts,
  type UiBatch,
} from '@/lib/api/batches.api';
import { api } from '@/lib/api/client';
import { useRealtime } from '../useRealtime';
import { ordersKeys } from './useOrders';

export const batchesKeys = {
  all: ['batches'] as const,
  list: (stage?: Stage) => [...batchesKeys.all, 'list', stage ?? null] as const,
  waitingCounts: () => [...batchesKeys.all, 'waiting-counts'] as const,
};

export function useBatches(stage?: Stage) {
  return useQuery({
    queryKey: batchesKeys.list(stage),
    queryFn: () => listBatches(stage),
    refetchInterval: 30_000, // doublé par realtime, mais filet de sécurité
  });
}

/** Variante mappée à la shape Kanban (lane index, contributors avec nom client). */
export function useUiBatches(stage?: Stage) {
  const q = useBatches(stage);
  const items: UiBatch[] = (q.data ?? []).map(mapApiBatchToUi);
  return { ...q, items };
}

/** Démarre un batch (validated → in_progress) */
export function useStartBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (batchId: string) => {
      const { data } = await api.post(`/batches/${batchId}/start`);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: batchesKeys.all });
    },
  });
}

/** Termine un batch (in_progress → completed, items avancent au stage suivant) */
export function useCompleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      batchId: string;
      actualWaterL?: number;
      actualEnergyKwh?: number;
      notes?: string;
    }) => {
      const { batchId, ...body } = vars;
      const { data } = await api.post(`/batches/${batchId}/complete`, body);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: batchesKeys.all });
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

/** Compteurs des items en attente par stage post-lavage. */
export function useWaitingCounts() {
  return useQuery<StageWaitingCounts>({
    queryKey: batchesKeys.waitingCounts(),
    queryFn: getWaitingCounts,
    refetchInterval: 30_000,
  });
}

/** Crée les batches d'un stage (sechage, calandrage, repassage, finition). */
export function useCreateStageBatches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stage: StageName) => createStageBatches(stage),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: batchesKeys.all });
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

/** Propose un plan de batches pour un stage post-lavage (sans persister). */
export function useSuggestStageBatches() {
  return useMutation({
    mutationFn: (stage: StageName) => suggestStageBatches(stage),
  });
}

/** Persiste une proposition de stage (potentiellement éditée). */
export function usePersistStageProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposal: StageProposal) => persistStageProposal(proposal),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: batchesKeys.all });
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

export function useBatchesRealtime() {
  const { socket } = useRealtime();
  const qc = useQueryClient();
  useEffect(() => {
    if (!socket) return;
    const events = ['batch:created', 'batch:started', 'batch:completed'];
    const handler = () => {
      void qc.invalidateQueries({ queryKey: batchesKeys.all });
    };
    events.forEach((e) => socket.on(e, handler));
    return () => events.forEach((e) => socket.off(e, handler));
  }, [socket, qc]);
}
