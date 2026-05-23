import { api } from './client';

export interface VehicleEnrolledDriver {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  role: string;
}

export interface VehicleEnrolledPda {
  id: string;
  reference: string;
  brand: string | null;
  model: string | null;
  batteryLevel: number | null;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
}

export interface ApiVehicle {
  id: string;
  matricule: string;
  brand: string;
  model: string;
  capacityKg: number;
  fuelLevel: number;
  status: 'available' | 'in_route' | 'maintenance' | 'out_of_service';
  lastMaintenanceAt: string | null;
  enrolledDriverId: string | null;
  enrolledPdaId: string | null;
  enrolledSince: string | null;
  enrolledDriver?: VehicleEnrolledDriver | null;
  enrolledPda?: VehicleEnrolledPda | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleEnrollmentRow {
  id: string;
  vehicleId: string;
  driverId: string | null;
  pdaId: string | null;
  startsAt: string;
  endsAt: string | null;
  notes: string | null;
  createdAt: string;
  driver: { id: string; firstName: string; lastName: string } | null;
  pda: { id: string; reference: string } | null;
}

const STATUS_FR: Record<ApiVehicle['status'], 'Disponible' | 'En tournée' | 'Maintenance' | 'Hors service'> = {
  available: 'Disponible',
  in_route: 'En tournée',
  maintenance: 'Maintenance',
  out_of_service: 'Hors service',
};

/** Format compatible avec l'ancienne shape vehicles.json (marque/modele FR). */
export function mapApiVehicle(v: ApiVehicle) {
  return {
    id: v.id,
    matricule: v.matricule,
    brand: v.brand,
    model: v.model,
    marque: v.brand,
    modele: v.model,
    type: 'Camion' as const,
    capacityKg: v.capacityKg,
    tonnage: v.capacityKg,
    /** Estimation : ~1 m³ pour 100 kg de capacité utile. */
    volumeM3: Math.round(v.capacityKg / 100),
    fuelLevel: v.fuelLevel,
    status: STATUS_FR[v.status],
    lastMaintenance: v.lastMaintenanceAt ?? undefined,
    enrolledDriverId: v.enrolledDriverId,
    enrolledPdaId: v.enrolledPdaId,
    enrolledSince: v.enrolledSince,
    enrolledDriver: v.enrolledDriver,
    enrolledPda: v.enrolledPda,
  };
}

export type MappedVehicle = ReturnType<typeof mapApiVehicle>;

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listVehicles(params: { search?: string; status?: string } = {}) {
  const { data } = await api.get<PageResult<ApiVehicle>>('/vehicles', {
    params: { pageSize: 100, ...params },
  });
  return data.items.map(mapApiVehicle);
}

export async function getFleetOverview() {
  const { data } = await api.get<{
    total: number;
    totalCapacityKg: number;
    avgFuelLevel: number;
    byStatus: Record<string, number>;
  }>('/vehicles/overview');
  return data;
}

export interface EnrollVehicleInput {
  driverId: string | null;
  pdaId: string | null;
  startsAt?: string;
  endsAt?: string | null;
  notes?: string;
}

/** Enrolle un crew (chauffeur + PDA) sur le véhicule, avec période. */
export async function enrollVehicle(id: string, input: EnrollVehicleInput) {
  const { data } = await api.post<ApiVehicle>(`/vehicles/${id}/enroll`, input);
  return mapApiVehicle(data);
}

/** Historique des enrollements d'un véhicule. */
export async function getVehicleEnrollmentHistory(id: string) {
  const { data } = await api.get<{ items: VehicleEnrollmentRow[]; count: number }>(
    `/vehicles/${id}/enrollments`,
  );
  return data.items;
}
