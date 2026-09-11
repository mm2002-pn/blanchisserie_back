import { useQuery } from '@tanstack/react-query';
import { listWashPrograms } from '@/lib/api/washPrograms.api';

export const washProgramsKeys = {
  all: ['washPrograms'] as const,
  list: () => [...washProgramsKeys.all, 'list'] as const,
};

export function useWashPrograms() {
  return useQuery({
    queryKey: washProgramsKeys.list(),
    queryFn: listWashPrograms,
  });
}
