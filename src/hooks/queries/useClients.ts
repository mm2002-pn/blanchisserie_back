import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type CreateClientInput,
  type ListClientsParams,
  type UpdateClientInput,
  createClient,
  getClient,
  listClients,
  updateClient,
} from '@/lib/api/clients.api';

/**
 * Query keys centralisés — important pour invalidation cohérente.
 */
export const clientsKeys = {
  all: ['clients'] as const,
  list: (params: ListClientsParams = {}) => [...clientsKeys.all, 'list', params] as const,
  detail: (id: string) => [...clientsKeys.all, 'detail', id] as const,
};

/* ─── Queries ───────────────────────────────────────────────── */

export function useClients(params: ListClientsParams = {}) {
  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: () => listClients(params),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: clientsKeys.detail(id ?? ''),
    queryFn: () => getClient(id as string),
    enabled: Boolean(id),
  });
}

/* ─── Mutations ─────────────────────────────────────────────── */

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClientInput) => createClient(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateClientInput) => updateClient(id, input),
    onSuccess: (data) => {
      qc.setQueryData(clientsKeys.detail(id), data);
      void qc.invalidateQueries({ queryKey: [...clientsKeys.all, 'list'] });
    },
  });
}
