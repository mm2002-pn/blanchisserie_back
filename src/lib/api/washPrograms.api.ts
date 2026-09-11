import { api } from './client';
import type { WashingProgram } from '@/types';

export interface ApiWashProgram {
  id: string;
  code: string;
  name: string;
  temperature: number;
  durationMin: number;
  spinSpeed: number;
  waterLiters: number;
  detergentType: string | null;
  suitable: ('LP' | 'LF' | 'NAE')[];
  notes: string | null;
  isActive: boolean;
}

export function mapApiWashProgram(p: ApiWashProgram): WashingProgram {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    temperature: p.temperature,
    duration: p.durationMin,
    spinLevel: p.spinSpeed,
    compatibleLinenTypes: p.suitable, // catégories LP/LF/NAE — pas d'IDs distincts
    compatibleMachines: [],
    detergentType: p.detergentType ?? undefined,
    operatorInstructions: p.notes ?? undefined,
  };
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listWashPrograms() {
  const { data } = await api.get<PageResult<ApiWashProgram>>('/wash-programs', {
    params: { pageSize: 200 },
  });
  return data.items.map(mapApiWashProgram);
}
