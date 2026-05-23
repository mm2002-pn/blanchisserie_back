import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addOrdersToRound,
  cancelCollectionRound,
  createCollectionRound,
  getCollectionRound,
  listCollectionRounds,
  removeOrderFromRound,
  startCollectionRound,
  updateCollectionRound,
  type CreateRoundInput,
  type ListRoundsParams,
  type UpdateRoundInput,
} from '@/lib/api/collectionRounds.api';
import { useRealtime } from '../useRealtime';

export const roundsKeys = {
  all: ['collection-rounds'] as const,
  list: (params: ListRoundsParams) =>
    [...roundsKeys.all, 'list', params] as const,
  detail: (id: string) => [...roundsKeys.all, 'detail', id] as const,
};

export function useCollectionRounds(params: ListRoundsParams = {}) {
  return useQuery({
    queryKey: roundsKeys.list(params),
    queryFn: () => listCollectionRounds(params),
    staleTime: 15_000,
  });
}

export function useCollectionRound(id: string | null) {
  return useQuery({
    queryKey: roundsKeys.detail(id ?? ''),
    queryFn: () => getCollectionRound(id as string),
    enabled: !!id,
  });
}

export function useCreateCollectionRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoundInput) => createCollectionRound(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roundsKeys.all });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateCollectionRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoundInput }) =>
      updateCollectionRound(id, input),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: roundsKeys.all });
      qc.invalidateQueries({ queryKey: roundsKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAddOrdersToRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orderIds }: { id: string; orderIds: string[] }) =>
      addOrdersToRound(id, orderIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roundsKeys.all });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRemoveOrderFromRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orderId }: { id: string; orderId: string }) =>
      removeOrderFromRound(id, orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roundsKeys.all });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useStartCollectionRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startCollectionRound(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roundsKeys.all }),
  });
}

export function useCancelCollectionRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelCollectionRound(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roundsKeys.all });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/** Subscribe aux events round:* pour invalider auto le cache. */
export function useCollectionRoundsRealtime() {
  const { socket } = useRealtime();
  const qc = useQueryClient();
  useEffect(() => {
    if (!socket) return;
    const events = [
      'round:created',
      'round:started',
      'round:updated',
      'round:completed',
      'round:cancelled',
    ];
    const handler = (p: { roundId?: string }) => {
      qc.invalidateQueries({ queryKey: roundsKeys.all });
      if (p?.roundId) qc.invalidateQueries({ queryKey: roundsKeys.detail(p.roundId) });
      qc.invalidateQueries({ queryKey: ['orders'] });
    };
    events.forEach((e) => socket.on(e, handler));
    return () => events.forEach((e) => socket.off(e, handler));
  }, [socket, qc]);
}
