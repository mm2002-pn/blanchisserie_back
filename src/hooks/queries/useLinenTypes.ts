import { useQuery } from '@tanstack/react-query';
import { listLinenTypes } from '@/lib/api/linenTypes.api';

export const linenTypesKeys = {
  all: ['linenTypes'] as const,
  list: () => [...linenTypesKeys.all, 'list'] as const,
};

export function useLinenTypes() {
  return useQuery({
    queryKey: linenTypesKeys.list(),
    queryFn: listLinenTypes,
  });
}
