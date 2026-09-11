import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLinenCategory,
  listLinenCategories,
  updateLinenCategory,
  type UpdateLinenCategoryInput,
  type UpsertLinenCategoryInput,
} from '@/lib/api/linenCategories.api';

export function useLinenCategories() {
  return useQuery({
    queryKey: ['linen-categories'],
    queryFn: () => listLinenCategories(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateLinenCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertLinenCategoryInput) => createLinenCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['linen-categories'] });
    },
  });
}

export function useUpdateLinenCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLinenCategoryInput }) =>
      updateLinenCategory(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['linen-categories'] });
    },
  });
}
