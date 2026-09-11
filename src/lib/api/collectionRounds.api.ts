import { api } from './client';

export type CollectionRoundStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RoundType = 'collect' | 'delivery';

export const ROUND_STATUS_FR: Record<CollectionRoundStatus, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export const ROUND_TYPE_FR: Record<RoundType, string> = {
  collect: 'Collecte',
  delivery: 'Livraison',
};

export interface RoundOrder {
  id: string;
  orderNumber: string;
  status: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    address: string;
    city: string | null;
  } | null;
  collectionDate: string;
  estimatedWeight: number | null;
  pickupGeoLat: number | null;
  pickupGeoLng: number | null;
  collectedAt: string | null;
}

export interface ApiCollectionRound {
  id: string;
  number: string;
  type: RoundType;
  vehicleId: string;
  plannedAt: string;
  status: CollectionRoundStatus;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: string;
    matricule: string;
    brand: string;
    model: string;
    capacityKg: number;
    enrolledDriverId: string | null;
    enrolledPdaId: string | null;
    enrolledDriver: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string | null;
    } | null;
    enrolledPda: {
      id: string;
      reference: string;
      brand: string | null;
      model: string | null;
    } | null;
  };
  orders: RoundOrder[];
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ListRoundsParams {
  type?: RoundType;
  status?: CollectionRoundStatus;
  vehicleId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function listCollectionRounds(params: ListRoundsParams = {}) {
  const { data } = await api.get<PageResult<ApiCollectionRound>>(
    '/collection-rounds',
    { params: { pageSize: 100, ...params } },
  );
  return data.items;
}

export async function getCollectionRound(id: string) {
  const { data } = await api.get<ApiCollectionRound>(`/collection-rounds/${id}`);
  return data;
}

export interface CreateRoundInput {
  type?: RoundType; // default 'collect' côté backend
  vehicleId: string;
  plannedAt: string; // ISO
  orderIds: string[];
  notes?: string;
}

export async function createCollectionRound(input: CreateRoundInput) {
  const { data } = await api.post<ApiCollectionRound>('/collection-rounds', input);
  return data;
}

export interface UpdateRoundInput {
  vehicleId?: string;
  plannedAt?: string;
  notes?: string | null;
}

export async function updateCollectionRound(id: string, input: UpdateRoundInput) {
  const { data } = await api.patch<ApiCollectionRound>(
    `/collection-rounds/${id}`,
    input,
  );
  return data;
}

export async function addOrdersToRound(id: string, orderIds: string[]) {
  const { data } = await api.post<ApiCollectionRound>(
    `/collection-rounds/${id}/orders/add`,
    { orderIds },
  );
  return data;
}

export async function removeOrderFromRound(id: string, orderId: string) {
  const { data } = await api.post<ApiCollectionRound>(
    `/collection-rounds/${id}/orders/remove`,
    { orderId },
  );
  return data;
}

export async function startCollectionRound(id: string) {
  const { data } = await api.post<ApiCollectionRound>(
    `/collection-rounds/${id}/start`,
  );
  return data;
}

export async function cancelCollectionRound(id: string, reason: string) {
  const { data } = await api.post<ApiCollectionRound>(
    `/collection-rounds/${id}/cancel`,
    { reason },
  );
  return data;
}
