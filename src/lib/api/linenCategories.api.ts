import { api } from './client';

export type LinenCategoryCode = 'LP' | 'LF' | 'NAE';

export interface ApiLinenCategory {
  id: string;
  code: LinenCategoryCode;
  label: string;
  emoji: string | null;
  sortOrder: number;
  isActive: boolean;
}

export async function listLinenCategories(opts: { isActive?: boolean } = {}) {
  const { data } = await api.get<{ items: ApiLinenCategory[]; count: number }>(
    '/linen-categories',
    { params: opts },
  );
  return data.items;
}

export interface UpsertLinenCategoryInput {
  code: LinenCategoryCode;
  label: string;
  emoji?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function createLinenCategory(input: UpsertLinenCategoryInput) {
  const { data } = await api.post<ApiLinenCategory>('/linen-categories', input);
  return data;
}

export interface UpdateLinenCategoryInput {
  label?: string;
  emoji?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function updateLinenCategory(id: string, input: UpdateLinenCategoryInput) {
  const { data } = await api.patch<ApiLinenCategory>(`/linen-categories/${id}`, input);
  return data;
}
