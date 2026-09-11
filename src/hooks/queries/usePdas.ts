import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPda,
  listPdas,
  setPdaStatus,
  updatePda,
  type ListPdasParams,
  type PdaStatus,
  type UpsertPdaInput,
} from '@/lib/api/pdas.api';

export function usePdas(params: ListPdasParams = {}) {
  return useQuery({
    queryKey: ['pdas', params],
    queryFn: () => listPdas(params),
    staleTime: 30_000,
  });
}

export function useCreatePda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertPdaInput) => createPda(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdas'] });
    },
  });
}

export function useUpdatePda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<UpsertPdaInput> }) =>
      updatePda(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdas'] });
    },
  });
}

export function useSetPdaStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: PdaStatus; reason?: string }) =>
      setPdaStatus(id, status, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdas'] });
    },
  });
}

