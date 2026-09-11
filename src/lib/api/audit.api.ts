import { api } from './client';

export type ApiAuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'permission'
  | 'scan'
  | 'weigh'
  | 'sign'
  | 'print'
  | 'ai_suggest'
  | 'ai_validate';

export interface ApiAuditLog {
  id: string;
  at: string;
  action: ApiAuditAction;
  entity: string;
  entityId: string | null;
  payload: Record<string, unknown> | null;
  ipAddress: string | null;
  geoLat: number | null;
  geoLng: number | null;
  actor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

/** Action UI réduite (la page n'en gère que 5). */
export type UiAuditAction = 'create' | 'update' | 'delete' | 'login' | 'permission';

const ACTION_TO_UI: Record<ApiAuditAction, UiAuditAction> = {
  create: 'create',
  update: 'update',
  delete: 'delete',
  login: 'login',
  logout: 'login',
  permission: 'permission',
  scan: 'update',
  weigh: 'update',
  sign: 'update',
  print: 'update',
  ai_suggest: 'create',
  ai_validate: 'update',
};

const ENTITY_FR: Record<string, string> = {
  order: 'Commande',
  invoice: 'Facture',
  client: 'Client',
  user: 'Utilisateur',
  vehicle: 'Véhicule',
  machine: 'Machine',
  batch: 'Batch',
  item_tag: 'Étiquette',
  triage: 'Triage',
  tariff: 'Tarif',
  linen_type: 'Type de linge',
  wash_program: 'Programme',
};

function payloadSummary(p: Record<string, unknown> | null): string {
  if (!p) return '';
  const parts: string[] = [];
  if (typeof p.event === 'string') parts.push(p.event);
  if (typeof p.orderNumber === 'string') parts.push(p.orderNumber);
  if (typeof p.invoiceNumber === 'string') parts.push(p.invoiceNumber);
  if (typeof p.reason === 'string') parts.push(p.reason);
  if (typeof p.notes === 'string') parts.push(p.notes);
  return parts.join(' · ');
}

export interface MappedAuditLog {
  id: string;
  at: string;
  actor: string;
  action: UiAuditAction;
  entity: string;
  details: string;
  ip: string;
}

export function mapApiAuditLog(l: ApiAuditLog): MappedAuditLog {
  const actorName = l.actor
    ? `${l.actor.firstName} ${l.actor.lastName.charAt(0)}.`.trim()
    : 'Système';
  return {
    id: l.id,
    at: l.at,
    actor: actorName,
    action: ACTION_TO_UI[l.action] ?? 'update',
    entity: ENTITY_FR[l.entity] ?? l.entity,
    details: payloadSummary(l.payload) || (l.entityId ? `#${l.entityId.slice(0, 8)}` : ''),
    ip: l.ipAddress ?? '—',
  };
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listAuditLogs(params: { action?: string; entity?: string; pageSize?: number } = {}) {
  const { data } = await api.get<PageResult<ApiAuditLog>>('/audit', {
    params: { pageSize: 200, ...params },
  });
  return data.items.map(mapApiAuditLog);
}
