import { useQuery } from '@tanstack/react-query';
import {
  getDashboardSummary,
  getProductionReport,
  getRevenueReport,
} from '@/lib/api/reports.api';

interface Period {
  from?: string;
  to?: string;
}

export const reportsKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportsKeys.all, 'dashboard'] as const,
  revenue: (p: Period) => [...reportsKeys.all, 'revenue', p] as const,
  production: (p: Period) => [...reportsKeys.all, 'production', p] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: reportsKeys.dashboard(),
    queryFn: getDashboardSummary,
    staleTime: 60_000,
  });
}

export function useRevenueReport(period: Period = {}) {
  return useQuery({
    queryKey: reportsKeys.revenue(period),
    queryFn: () => getRevenueReport(period),
    staleTime: 60_000,
  });
}

export function useProductionReport(period: Period = {}) {
  return useQuery({
    queryKey: reportsKeys.production(period),
    queryFn: () => getProductionReport(period),
    staleTime: 60_000,
  });
}
