import { api } from './client';
import type { Order } from '@/types';

/* API → web types */

export interface ApiOrderDriver {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
}

export interface ApiOrderVehicle {
  id: string;
  matricule: string;
  brand: string;
  model: string;
}

export interface ApiOrderPda {
  id: string;
  reference: string;
  brand?: string | null;
  model?: string | null;
  batteryLevel?: number | null;
}

export interface ApiOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  client?: { id: string; name: string; type: string; address?: string | null; phone?: string | null; email?: string | null };
  status: string;
  workflowState: string;
  estimatedItems: { category: string; type: string; quantity: number }[];
  estimatedWeight: number | null;
  driverWeight: number | null;
  driverPieces: number | null;
  driverItems?: { type: string; quantity: number }[] | null;
  receivedWeight: number | null;
  receivedPieces: number | null;
  receivedItems?: { type: string; quantity: number }[] | null;
  weightDeviation: number | null;
  visualEstimation: string | null;
  collectionPhotos: string[];
  deliveryPhotos?: string[];
  collectionSignatureUrl?: string | null;
  deliverySignatureUrl?: string | null;
  collectionRecipientName?: string | null;
  deliveryRecipientName?: string | null;
  collectionDate: string;
  collectionPlannedAt: string | null;
  collectedAt: string | null;
  receivedAt: string | null;
  deliveredAt: string | null;
  triagedAt: string | null;
  unloadedAt: string | null;
  collectionDriverId: string | null;
  collectionVehicleId: string | null;
  collectionPdaId?: string | null;
  deliveryDriverId: string | null;
  deliveryVehicleId: string | null;
  deliveryPdaId?: string | null;
  collectionDriver?: ApiOrderDriver | null;
  deliveryDriver?: ApiOrderDriver | null;
  collectionVehicle?: ApiOrderVehicle | null;
  deliveryVehicle?: ApiOrderVehicle | null;
  collectionPda?: ApiOrderPda | null;
  deliveryPda?: ApiOrderPda | null;
  instructions: string | null;
  cancelReason?: string | null;
  pickupGeoLat?: number | null;
  pickupGeoLng?: number | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_MAP: Record<string, MappedOrder['status']> = {
  pending: 'En attente',
  confirmed: 'En attente',
  collection_planned: 'En attente',
  collected: 'Collectée',
  received: 'Réceptionnée',
  triaged: 'En traitement',
  in_production: 'En traitement',
  ready: 'Terminée',
  delivered: 'Livrée',
  invoiced: 'Livrée',
  cancelled: 'Annulée',
};

export type MappedOrder = Omit<Order, 'status'> & {
  status: Order['status'] | 'Réceptionnée' | 'Annulée';
  apiStatus: string;
  workflowState: string;
  version: number;
  clientName?: string;
  clientType?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  /** Items estimés bruts (categorie + type + quantité) pour affichage détaillé. */
  estimatedItemsRaw?: { category: string; type: string; quantity: number }[];
  driverItems?: { type: string; quantity: number }[];
  receivedItems?: { type: string; quantity: number }[];
  instructions?: string;
  /** Champs additionnels exposés en lecture pour les pages opérationnelles. */
  estimatedWeight?: number;
  driverWeight?: number;
  receivedWeight?: number;
  /** Alias FR de receivedWeight, en kg (compat pages mock). */
  actualWeight?: number;
  driverPieces?: number;
  receivedPieces?: number;
  weightDeviation?: number;
  visualEstimation?: string;
  estimatedSize?: string;
  collectionPhotos?: string[];
  collectedAt?: Date;
  receivedAt?: Date;
  receptionDateTime?: Date;
  weighingDateTime?: Date;
  triagedAt?: Date;
  /** Détail du triage (présent si triagé côté API). */
  triage?: {
    completedAt?: Date;
    totalPieces?: number;
    totalAmount?: number;
  } | null;
  vehicleId?: string;
  /** Date de dernière mise à jour côté API — utilisée comme proxy de readyAt. */
  updatedAt?: Date;
  /** Timestamp d'arrivée des sacs à l'usine (post-collecte) — gate la pesée. */
  unloadedAt?: Date;
  /** Drivers explicites — distinguer collecte vs livraison (assignedDriverId fusionne les deux). */
  collectionDriverId?: string | null;
  deliveryDriverId?: string | null;
  /** Calculé en aval ; pas exposé par l'API listing — placeholder. */
  estimatedInvoiceAmount?: number;
  /** Alias de weightDeviation pour compat pages. */
  invoiceDeviation?: number;
  /** Localisation cible de collecte (renseignée par le client à la commande). */
  pickupGeoLat?: number;
  pickupGeoLng?: number;
};

export function mapApiOrder(o: ApiOrder): MappedOrder {
  const totalKg = (o.receivedWeight ?? o.driverWeight ?? o.estimatedWeight ?? 0) / 1000;
  const items = (o.estimatedItems ?? []).map((it) => ({
    linenTypeId: it.type,
    quantity: it.quantity,
    weight: 0,
  }));
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    clientId: o.clientId,
    status: STATUS_MAP[o.status] ?? 'En attente',
    items,
    totalWeight: totalKg,
    collectionDate: new Date(o.collectionDate),
    deliveryDate: new Date(o.deliveredAt ?? o.collectionDate),
    assignedDriverId: o.deliveryDriverId ?? o.collectionDriverId ?? undefined,
    collectionDriverId: o.collectionDriverId,
    deliveryDriverId: o.deliveryDriverId,
    notes: o.instructions ?? undefined,
    createdAt: new Date(o.createdAt),
    updatedAt: new Date(o.updatedAt),
    apiStatus: o.status,
    workflowState: o.workflowState,
    version: o.version,
    clientName: o.client?.name,
    clientType: o.client?.type,
    clientAddress: o.client?.address ?? undefined,
    clientPhone: o.client?.phone ?? undefined,
    clientEmail: o.client?.email ?? undefined,
    estimatedItemsRaw: o.estimatedItems ?? [],
    driverItems: o.driverItems ?? undefined,
    receivedItems: o.receivedItems ?? undefined,
    instructions: o.instructions ?? undefined,
    estimatedWeight: o.estimatedWeight ?? undefined,
    driverWeight: o.driverWeight ?? undefined,
    receivedWeight: o.receivedWeight ?? undefined,
    actualWeight: o.receivedWeight != null ? o.receivedWeight / 1000 : undefined,
    driverPieces: o.driverPieces ?? undefined,
    receivedPieces: o.receivedPieces ?? undefined,
    weightDeviation: o.weightDeviation ?? undefined,
    visualEstimation: o.visualEstimation ?? undefined,
    estimatedSize: o.visualEstimation ?? undefined,
    collectionPhotos: o.collectionPhotos ?? [],
    collectedAt: o.collectedAt ? new Date(o.collectedAt) : undefined,
    unloadedAt: o.unloadedAt ? new Date(o.unloadedAt) : undefined,
    receivedAt: o.receivedAt ? new Date(o.receivedAt) : undefined,
    receptionDateTime: o.receivedAt ? new Date(o.receivedAt) : undefined,
    weighingDateTime: o.receivedAt ? new Date(o.receivedAt) : undefined,
    triagedAt: o.triagedAt ? new Date(o.triagedAt) : undefined,
    triage: o.triagedAt
      ? {
          completedAt: new Date(o.triagedAt),
          totalPieces: o.receivedPieces ?? undefined,
          totalAmount: 0,
        }
      : null,
    vehicleId: o.collectionVehicleId ?? o.deliveryVehicleId ?? undefined,
    estimatedInvoiceAmount: 0,
    invoiceDeviation: o.weightDeviation ?? 0,
    pickupGeoLat: o.pickupGeoLat ?? undefined,
    pickupGeoLng: o.pickupGeoLng ?? undefined,
  };
}

export interface ListOrdersParams {
  page?: number;
  pageSize?: number;
  status?: string;
  /** Liste de status séparés par virgule, ex "received,triaged". */
  statusIn?: string;
  clientId?: string;
  search?: string;
  /** ISO datetime, borne basse incluse. */
  dateFrom?: string;
  /** ISO datetime, borne haute exclue. */
  dateTo?: string;
  dateField?: 'createdAt' | 'updatedAt' | 'collectionDate';
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listOrders(params: ListOrdersParams = {}) {
  const { data } = await api.get<PageResult<ApiOrder>>('/orders', { params });
  return {
    items: data.items.map(mapApiOrder),
    pagination: data.pagination,
  };
}

export async function getOrder(id: string) {
  const { data } = await api.get<ApiOrder>(`/orders/${id}`);
  return mapApiOrder(data);
}

/** Variante : retourne le brut API + le mapping. Utile pour la page détail
 *  qui veut afficher driver/véhicule/photos sans dépendre du seul mapper. */
export async function getOrderRaw(id: string) {
  const { data } = await api.get<ApiOrder>(`/orders/${id}`);
  return { raw: data, mapped: mapApiOrder(data) };
}

/** Planifie une COLLECTE.
 *  Pattern enrollement : il suffit de passer `collectionVehicleId` —
 *  l'API dérive driver+PDA depuis Vehicle.enrolledDriver/Pda.
 *  collectionDriverId/collectionPdaId restent acceptés pour override manuel.
 *  Backend transition la commande en `collection_planned`.
 *  Optimistic locking via `expectedVersion` (auto-fetch si absent). */
export interface ConfirmCollectionInput {
  collectionDriverId?: string;
  collectionVehicleId?: string;
  collectionPdaId?: string;
  collectionPlannedAt: string; // ISO
  expectedVersion?: number;
}

export async function confirmCollection(orderId: string, dto: ConfirmCollectionInput) {
  let expectedVersion = dto.expectedVersion;
  if (expectedVersion == null) {
    const { data: current } = await api.get<ApiOrder>(`/orders/${orderId}`);
    expectedVersion = current.version;
  }
  const { data } = await api.post<ApiOrder>(`/orders/${orderId}/confirm`, {
    collectionDriverId: dto.collectionDriverId,
    collectionVehicleId: dto.collectionVehicleId,
    collectionPdaId: dto.collectionPdaId,
    collectionPlannedAt: dto.collectionPlannedAt,
    expectedVersion,
  });
  return mapApiOrder(data);
}

/** Pesée officielle atelier (status collected → received). */
export interface ReceiveInput {
  receivedWeight: number; // grammes
  receivedPieces: number;
  acceptDeviation?: boolean;
}

export async function receiveOrder(orderId: string, dto: ReceiveInput) {
  const { data: current } = await api.get<ApiOrder>(`/orders/${orderId}`);
  const { data } = await api.post<ApiOrder>(`/orders/${orderId}/receive`, {
    ...dto,
    expectedVersion: current.version,
  });
  return mapApiOrder(data);
}

/** Planifie la livraison d'une commande (ready → delivery_planned). */
export interface ScheduleDeliveryInput {
  driverId: string;
  vehicleId?: string;
  pdaId?: string;
  plannedAt: string; // ISO
  /** Version attendue de la commande (optimistic locking).
   *  Si non fournie, fetch préalable de la commande (fallback). */
  expectedVersion?: number;
}

export async function scheduleDelivery(orderId: string, dto: ScheduleDeliveryInput) {
  let expectedVersion = dto.expectedVersion;
  if (expectedVersion == null) {
    const { data: current } = await api.get<ApiOrder>(`/orders/${orderId}`);
    expectedVersion = current.version;
  }
  const { driverId, vehicleId, pdaId, plannedAt } = dto;
  const { data } = await api.post<ApiOrder>(`/orders/${orderId}/schedule-delivery`, {
    driverId,
    vehicleId,
    pdaId,
    plannedAt,
    expectedVersion,
  });
  return mapApiOrder(data);
}
