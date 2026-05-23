import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  enrollVehicle,
  getFleetOverview,
  getVehicleEnrollmentHistory,
  listVehicles,
  type EnrollVehicleInput,
} from '@/lib/api/vehicles.api';

export const vehiclesKeys = {
  all: ['vehicles'] as const,
  list: (search?: string) => [...vehiclesKeys.all, 'list', search ?? null] as const,
  overview: () => [...vehiclesKeys.all, 'overview'] as const,
  enrollments: (id: string) => [...vehiclesKeys.all, id, 'enrollments'] as const,
};

export function useVehicles(search?: string) {
  return useQuery({
    queryKey: vehiclesKeys.list(search),
    queryFn: () => listVehicles(search ? { search } : {}),
  });
}

export function useFleetOverview() {
  return useQuery({
    queryKey: vehiclesKeys.overview(),
    queryFn: getFleetOverview,
  });
}

export function useEnrollVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & EnrollVehicleInput) =>
      enrollVehicle(id, input),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: vehiclesKeys.all });
      qc.invalidateQueries({ queryKey: vehiclesKeys.enrollments(id) });
    },
  });
}

export function useVehicleEnrollmentHistory(id: string | null) {
  return useQuery({
    queryKey: vehiclesKeys.enrollments(id ?? ''),
    queryFn: () => getVehicleEnrollmentHistory(id as string),
    enabled: !!id,
    staleTime: 30_000,
  });
}
