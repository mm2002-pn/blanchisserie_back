import { useQuery } from '@tanstack/react-query';
import { listTariffs } from '@/lib/api/tariffs.api';

export const tariffsKeys = {
  all: ['tariffs'] as const,
  list: () => [...tariffsKeys.all, 'list'] as const,
};

export function useTariffs() {
  return useQuery({
    queryKey: tariffsKeys.list(),
    queryFn: listTariffs,
  });
}
