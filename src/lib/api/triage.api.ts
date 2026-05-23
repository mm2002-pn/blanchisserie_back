import { api } from './client';

export interface TriageItemInput {
  linenTypeId: string;
  pieces: number;
  weight: number; // grammes
}

export interface TriageInput {
  items: TriageItemInput[];
  acceptDeviation?: boolean;
}

/** Crée un triage pour la commande + génère les ItemTags. */
export async function createTriage(orderId: string, dto: TriageInput) {
  // Récupère la version courante pour l'optimistic lock
  const { data: current } = await api.get<{ version: number }>(`/orders/${orderId}`);
  const { data } = await api.post(`/triage/orders/${orderId}`, {
    ...dto,
    expectedOrderVersion: current.version,
  });
  return data;
}
