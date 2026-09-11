import { api } from './client';

export type OrderDocumentKind =
  | 'bon-commande'
  | 'bon-collecte'
  | 'bordereau-triage'
  | 'bon-livraison';

/**
 * Récupère un PDF de commande via le client authentifié,
 * crée un Blob URL et l'ouvre dans un nouvel onglet.
 * Le lien direct <a href> ne marche pas car la route /documents/* exige un Bearer token.
 */
export async function openOrderDocument(orderId: string, kind: OrderDocumentKind) {
  const res = await api.get<Blob>(`/documents/orders/${orderId}/${kind}.pdf`, {
    responseType: 'blob',
  });
  const blobUrl = URL.createObjectURL(res.data);
  const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
  if (!win) {
    // Bloqué par popup blocker → fallback download
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${kind}.pdf`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
