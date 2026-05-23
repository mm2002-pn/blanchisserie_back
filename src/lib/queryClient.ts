import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/client';

/**
 * QueryClient global. Une instance pour toute l'app.
 *
 *  - Pas de retry sur 4xx (sauf 408/429) : ce sont des erreurs métier, inutile
 *    de spammer le serveur.
 *  - 5xx → 2 retries avec backoff exponentiel.
 *  - staleTime 30s par défaut (les listes peuvent rester chaudes).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.status === 408 || error.status === 429) return failureCount < 2;
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
