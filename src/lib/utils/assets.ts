/**
 * Préfixe une URL d'asset relative (ex: `/uploads/...`) avec l'hôte API.
 * Les URLs absolues (http/https) sont retournées telles quelles.
 */
const API_HOST = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const ASSET_HOST = API_HOST.replace(/\/api\/v1\/?$/, '');

export function resolveAsset(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${ASSET_HOST}${url}`;
}
