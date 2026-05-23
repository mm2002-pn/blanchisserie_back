import type { Client } from '@/types';
import { api } from './client';

/**
 * Raw API client for /clients.
 * Toutes les fonctions de transformation API → shape métier vivent ici,
 * jamais dans les pages.
 */

export type ApiClientType =
  | 'hotel_3_etoiles'
  | 'hotel_4_etoiles'
  | 'hotel_5_etoiles'
  | 'restaurant'
  | 'autre';

export interface ApiClient {
  id: string;
  name: string;
  type: ApiClientType;
  address: string;
  city: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  ninea: string | null;
  tariffId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TYPE_MAP: Record<ApiClientType, Client['type']> = {
  hotel_3_etoiles: 'Hôtel 3 étoiles',
  hotel_4_etoiles: 'Hôtel 4 étoiles',
  hotel_5_etoiles: 'Hôtel 5 étoiles',
  restaurant: 'Restaurant',
  autre: 'Restaurant', // fallback pour le type strict du back
};

const TYPE_REVERSE: Record<Client['type'], ApiClientType> = {
  'Hôtel 3 étoiles': 'hotel_3_etoiles',
  'Hôtel 4 étoiles': 'hotel_4_etoiles',
  'Hôtel 5 étoiles': 'hotel_5_etoiles',
  Restaurant: 'restaurant',
};

export function mapApiClient(c: ApiClient): Client {
  return {
    id: c.id,
    name: c.name,
    type: TYPE_MAP[c.type],
    address: `${c.address}, ${c.city}`,
    phone: c.phone ?? '',
    email: c.email ?? '',
    contactPerson: c.contactPerson ?? '',
    tariffId: c.tariffId ?? undefined,
    isActive: c.isActive,
    createdAt: new Date(c.createdAt),
  };
}

export interface ListClientsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listClients(params: ListClientsParams = {}) {
  const { data } = await api.get<PageResult<ApiClient>>('/clients', { params });
  return {
    items: data.items.map(mapApiClient),
    pagination: data.pagination,
  };
}

export async function getClient(id: string) {
  const { data } = await api.get<ApiClient>(`/clients/${id}`);
  return mapApiClient(data);
}

export interface CreateClientInput {
  name: string;
  type: Client['type'];
  address: string;
  city?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export async function createClient(input: CreateClientInput) {
  const payload = {
    name: input.name,
    type: TYPE_REVERSE[input.type],
    address: input.address,
    city: input.city ?? 'Dakar',
    contactPerson: input.contactPerson,
    phone: input.phone,
    email: input.email,
  };
  const { data } = await api.post<ApiClient>('/clients', payload);
  return mapApiClient(data);
}

export type UpdateClientInput = Partial<CreateClientInput> & { isActive?: boolean };

export async function updateClient(id: string, input: UpdateClientInput) {
  const payload: Record<string, unknown> = { ...input };
  if (input.type) payload.type = TYPE_REVERSE[input.type];
  const { data } = await api.patch<ApiClient>(`/clients/${id}`, payload);
  return mapApiClient(data);
}
