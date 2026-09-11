import { api } from './client';
import type { Machine, MachineLocation, MachineStatus, MachineType } from '@/types';

export interface ApiMachine {
  id: string;
  reference: string;
  brand: string;
  model: string;
  kind: 'laveuse' | 'secheuse' | 'calandre' | 'presse' | 'secheuse_repasseuse';
  capacityKg: number;
  location: string | null;
  status: 'active' | 'maintenance' | 'out_of_service';
  installedAt: string | null;
  lastMaintenanceAt: string | null;
  waterLitersPerCycle: number | null;
  energyKwhPerCycle: number | null;
  createdAt: string;
  updatedAt: string;
}

const KIND_TO_TYPE: Record<ApiMachine['kind'], MachineType> = {
  laveuse: 'Laveuse',
  secheuse: 'Sécheuse',
  secheuse_repasseuse: 'Sécheuse',
  calandre: 'Calandreuse',
  presse: 'Repasseuse',
};

const STATUS_TO_FR: Record<ApiMachine['status'], MachineStatus> = {
  active: 'Active',
  maintenance: 'En maintenance',
  out_of_service: 'Hors service',
};

function locationToZone(loc: string | null): MachineLocation {
  const v = (loc ?? '').toLowerCase();
  if (v.includes('sale')) return 'Zone sale';
  if (v.includes('intermédiaire') || v.includes('intermediaire')) return 'Zone intermédiaire';
  return 'Zone propre';
}

export function mapApiMachine(m: ApiMachine): Machine {
  return {
    id: m.id,
    reference: m.reference,
    brand: m.brand,
    model: m.model,
    type: KIND_TO_TYPE[m.kind],
    capacity: m.capacityKg,
    location: locationToZone(m.location),
    status: STATUS_TO_FR[m.status],
    lastMaintenance: m.lastMaintenanceAt ? new Date(m.lastMaintenanceAt) : undefined,
    dateInstalled: new Date(m.installedAt ?? m.createdAt),
    waterConsumption: m.waterLitersPerCycle ?? undefined,
    electricityConsumption: m.energyKwhPerCycle ?? undefined,
    compatiblePrograms: [],
  };
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listMachines(params: { page?: number; pageSize?: number; search?: string } = {}) {
  const { data } = await api.get<PageResult<ApiMachine>>('/machines', {
    params: { pageSize: 200, ...params },
  });
  return data.items.map(mapApiMachine);
}
