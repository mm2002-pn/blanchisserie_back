import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ConfirmCollectionInput,
  type ListOrdersParams,
  type ReceiveInput,
  type ScheduleDeliveryInput,
  confirmCollection,
  getOrder,
  getOrderRaw,
  listOrders,
  receiveOrder,
  scheduleDelivery,
} from '@/lib/api/orders.api';
import { useRealtime } from '../useRealtime';

export const ordersKeys = {
  all: ['orders'] as const,
  list: (params: ListOrdersParams = {}) => [...ordersKeys.all, 'list', params] as const,
  detail: (id: string) => [...ordersKeys.all, 'detail', id] as const,
};

export function useOrders(params: ListOrdersParams = {}) {
  return useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: () => listOrders(params),
  });
}

/** Renvoie les bornes ISO d'une journée locale (00:00 → +24h). */
export function dayBounds(d: Date = new Date()): { dateFrom: string; dateTo: string } {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.detail(id ?? ''),
    queryFn: () => getOrder(id as string),
    enabled: Boolean(id),
  });
}

/** Variante détail enrichie (driver, véhicule, photos, signature). */
export function useOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...ordersKeys.detail(id ?? ''), 'raw'],
    queryFn: () => getOrderRaw(id as string),
    enabled: Boolean(id),
  });
}

/** Pesée officielle atelier (collected → received). */
export function useReceiveOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: ReceiveInput }) =>
      receiveOrder(vars.id, vars.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

/** Planifie une COLLECTE : assigne driver + véhicule + créneau (pending → collection_planned). */
export function useConfirmCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: ConfirmCollectionInput }) =>
      confirmCollection(vars.id, vars.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

/** Planifie la livraison (ready → delivery_planned). */
export function useScheduleDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: ScheduleDeliveryInput }) =>
      scheduleDelivery(vars.id, vars.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

/** Branche le socket sur le cache orders + collection rounds.
 *  À appeler une fois en haut d'une page liste. */
export function useOrdersRealtime() {
  const { socket } = useRealtime();
  const qc = useQueryClient();
  useEffect(() => {
    if (!socket) return;
    const events = [
      'order:created',
      'order:updated',
      'order:confirmed',
      'order:collection_scheduled',
      'order:collected',
      'order:received',
      'order:ready',
      'order:delivery_scheduled',
      'order:delivered',
      'order:cancelled',
    ];
    const handler = (p: { orderId?: string }) => {
      // Invalide toute la clef orders (list + détail) + les tournées (une cmd
      // peut entrer/sortir d'un round).
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      if (p?.orderId) void qc.invalidateQueries({ queryKey: ordersKeys.detail(p.orderId) });
      void qc.invalidateQueries({ queryKey: ['collection-rounds'] });
    };
    events.forEach((e) => socket.on(e, handler));
    return () => events.forEach((e) => socket.off(e, handler));
  }, [socket, qc]);
}
