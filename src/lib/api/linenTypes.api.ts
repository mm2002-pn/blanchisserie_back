import { api } from './client';
import type { LinenType } from '@/types';

export interface ApiLinenType {
  id: string;
  code: string;
  name: string;
  category: 'LP' | 'LF' | 'NAE';
  averageWeight: number;
  billingMode: 'weight' | 'piece';
  unitPrice: string; // Decimal sérialisé
  treatmentMinutes: number | null;
  notes: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

const CATEGORY_FR: Record<ApiLinenType['category'], LinenType['category']> = {
  LP: 'Linge Plat',
  LF: 'Linge Forme',
  NAE: 'NAE',
};

const BILLING_FR: Record<ApiLinenType['billingMode'], LinenType['billingMode']> = {
  weight: 'Poids',
  piece: 'Pièce',
};

export function mapApiLinenType(t: ApiLinenType): LinenType {
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    category: CATEGORY_FR[t.category],
    averageWeight: t.averageWeight,
    billingMode: BILLING_FR[t.billingMode],
    unitPrice: Number(t.unitPrice),
    estimatedProcessingTime: t.treatmentMinutes ?? 0,
    specialInstructions: t.notes ?? undefined,
    imageUrl: t.imageUrl ?? undefined,
  };
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listLinenTypes() {
  const { data } = await api.get<PageResult<ApiLinenType>>('/linen-types', {
    params: { pageSize: 200 },
  });
  return data.items.map(mapApiLinenType);
}

export interface UpsertLinenTypeInput {
  code: string;
  name: string;
  category: 'LP' | 'LF' | 'NAE';
  averageWeight: number;
  billingMode: 'weight' | 'piece';
  unitPrice: number;
  treatmentMinutes?: number;
  notes?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}

export async function createLinenType(input: UpsertLinenTypeInput) {
  const { data } = await api.post<ApiLinenType>('/linen-types', input);
  return mapApiLinenType(data);
}

export async function updateLinenType(id: string, input: Partial<UpsertLinenTypeInput>) {
  const { data } = await api.patch<ApiLinenType>(`/linen-types/${id}`, input);
  return mapApiLinenType(data);
}

/** Upload une image catalogue, renvoie l'URL relative (à concaténer avec API_URL). */
export async function uploadLinenTypeImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<{ url: string }>('/uploads/linen-types', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
