import { api } from './client';

export type PdaStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service';

export interface ApiPda {
  id: string;
  reference: string;
  brand: string | null;
  model: string | null;
  status: PdaStatus;
  batteryLevel: number | null;
  lastSyncAt: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PDA_STATUS_FR: Record<PdaStatus, string> = {
  available: 'Disponible',
  in_use: 'En tournée',
  maintenance: 'Maintenance',
  out_of_service: 'Hors service',
};

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ListPdasParams {
  search?: string;
  status?: PdaStatus;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listPdas(params: ListPdasParams = {}) {
  const { data } = await api.get<PageResult<ApiPda>>('/pdas', {
    params: { pageSize: 200, ...params },
  });
  return data.items;
}

export async function getPdaOverview() {
  const { data } = await api.get<{
    total: number;
    counters: Record<PdaStatus, number>;
  }>('/pdas/overview');
  return data;
}

export interface UpsertPdaInput {
  reference: string;
  brand?: string | null;
  model?: string | null;
  status?: PdaStatus;
  batteryLevel?: number | null;
  notes?: string | null;
  isActive?: boolean;
}

export async function createPda(input: UpsertPdaInput) {
  const { data } = await api.post<ApiPda>('/pdas', input);
  return data;
}

export async function updatePda(id: string, input: Partial<UpsertPdaInput>) {
  const { data } = await api.patch<ApiPda>(`/pdas/${id}`, input);
  return data;
}

export async function setPdaStatus(id: string, status: PdaStatus, reason?: string) {
  const { data } = await api.post<ApiPda>(`/pdas/${id}/status`, { status, reason });
  return data;
}
