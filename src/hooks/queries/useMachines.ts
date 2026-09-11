import { useQuery } from '@tanstack/react-query';
import { listMachines } from '@/lib/api/machines.api';

export const machinesKeys = {
  all: ['machines'] as const,
  list: (search?: string) => [...machinesKeys.all, 'list', search ?? null] as const,
};

export function useMachines(search?: string) {
  return useQuery({
    queryKey: machinesKeys.list(search),
    queryFn: () => listMachines(search ? { search } : {}),
  });
}
