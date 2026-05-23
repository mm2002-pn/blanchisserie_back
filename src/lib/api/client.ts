import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

/**
 * Client HTTP central. Branche :
 *  - le token d'accès depuis le store sur chaque requête
 *  - un intercepteur 401 → tente un refresh → rejoue la requête (1 fois)
 *  - logout automatique si le refresh échoue
 *
 * Toutes les erreurs sont normalisées vers `ApiError` pour les hooks/UI.
 */

export interface ApiErrorBody {
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

/* ─── REQUEST: inject access token ────────────────────────────── */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ─── RESPONSE: 401 → refresh → retry ─────────────────────────── */

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    return null;
  }
  try {
    const res = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data.accessToken;
  } catch {
    logout();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<ApiErrorBody>) => {
    const status = err.response?.status ?? 0;
    const body = err.response?.data?.error;
    const original = err.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    // 401 → tenter un refresh une seule fois
    if (status === 401 && original && !original._retry) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
    }

    throw new ApiError(
      status,
      body?.code ?? 'NETWORK_ERROR',
      body?.message ?? err.message ?? 'Erreur réseau',
      body?.details,
    );
  },
);
