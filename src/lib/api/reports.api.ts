import { api } from './client';

/** Réponse de GET /reports/dashboard. */
export interface DashboardSummary {
  orders: {
    byStatus: Record<string, number>;
    today: number;
    last7Days: number;
  };
  production: {
    batchesByStatus: Record<string, number>;
    kgReceivedLast7Days: number;
  };
  invoices: {
    pendingCount: number;
    pendingTotalFcfa: string;
    overdueCount: number;
    overdueTotalFcfa: string;
  };
  revenue: {
    monthInvoicedFcfa: string;
    monthPaidFcfa: string;
  };
}

export async function getDashboardSummary() {
  const { data } = await api.get<DashboardSummary>('/reports/dashboard');
  return data;
}

export interface RevenueReport {
  period: { from: string; to: string };
  invoicesCount: number;
  totalInvoicedFcfa: string;
  totalPaidFcfa: string;
  totalTaxFcfa: string;
  byStatus: { status: string; count: number; totalFcfa: string }[];
  topClients: { client: { id?: string; name?: string; type?: string }; invoicesCount: number; totalFcfa: string }[];
  monthly: { month: string; totalFcfa: number; paidFcfa: number }[];
}

export interface ProductionReport {
  period: { from: string; to: string };
  batchesCompleted: number;
  waterConsumedL: number;
  energyConsumedKwh: number;
  avgBatchUtilization: number;
  avgWeightDeviationPct: number;
  maxWeightDeviationPct: number;
  machineBreakdown: {
    machine: { id: string; reference?: string; brand?: string; model?: string; kind?: string };
    batchesCompleted: number;
    avgUtilization: number;
  }[];
  kgByDay: { day: string; kg: number }[];
}

export async function getRevenueReport(period: { from?: string; to?: string } = {}) {
  const { data } = await api.get<RevenueReport>('/reports/revenue', { params: period });
  return data;
}

export async function getProductionReport(period: { from?: string; to?: string } = {}) {
  const { data } = await api.get<ProductionReport>('/reports/production', { params: period });
  return data;
}
