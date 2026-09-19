import { useMemo } from 'react';
import { useDashboard, useProductionReport } from '@/hooks/queries/useReports';
import { useAuditLogs } from '@/hooks/queries/useAuditLogs';
import { useMachines } from '@/hooks/queries/useMachines';
import { usePageHeader } from '@/context/PageHeaderContext';

const TERRA_600 = '#DE6B0E';
const BRAND_800 = '#17356B';

function last14DaysRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 13);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function DashboardPage() {
  usePageHeader({
    eyebrow: 'Pilotage',
    title: 'Tableau de bord',
    sub: "Vue consolidée de l'activité du jour",
  });

  const { data: dash } = useDashboard();
  const period = useMemo(last14DaysRange, []);
  const { data: production } = useProductionReport(period);
  const { data: auditLogs } = useAuditLogs();
  const { data: machines } = useMachines();

  const monthRevenueM = dash ? Number(dash.revenue.monthInvoicedFcfa) / 1_000_000 : 0;
  const totalOrders = dash
    ? Object.values(dash.orders.byStatus).reduce((s, n) => s + n, 0)
    : 0;

  const encoursTotal = dash ? Number(dash.invoices.pendingTotalFcfa) : 0;
  const encoursEchu = dash ? Number(dash.invoices.overdueTotalFcfa) : 0;

  const kpis = [
    {
      label: 'Commandes du jour',
      value: dash ? String(dash.orders.today) : '—',
      sub: dash ? `${totalOrders} au total · ${dash.orders.last7Days} / 7j` : '—',
      accent: TERRA_600,
    },
    {
      label: 'Poids traité (7j)',
      value: dash ? `${dash.production.kgReceivedLast7Days.toFixed(0)} kg` : '—',
      sub: 'pesées atelier',
      accent: '#2C7A4B',
    },
    {
      label: "Chiffre d'affaires",
      value: `${monthRevenueM.toFixed(1).replace('.', ',')} M`,
      sub: 'facturé ce mois-ci',
      accent: BRAND_800,
    },
    {
      label: 'Encours client',
      value: `${(encoursTotal / 1_000_000).toFixed(1)} M`,
      sub: dash ? `dont ${(encoursEchu / 1_000_000).toFixed(1)} M échu` : '—',
      accent: '#C1441F',
    },
  ];

  const chart = production?.kgByDay ?? [];
  const maxKg = Math.max(1, ...chart.map((d) => d.kg));

  const alerts = (machines ?? []).filter((m) => m.status !== 'Active').slice(0, 4);
  const audit = (auditLogs ?? []).slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-paper border border-hairline border-ink-200 rounded-card p-4.5 pt-4"
            style={{ borderTop: `3px solid ${k.accent}` }}
          >
            <div className="caps" style={{ color: k.accent }}>
              {k.label}
            </div>
            <div className="font-heading font-bold text-[28px] tracking-tight mt-2 leading-none text-ink-900 tnum">
              {k.value}
            </div>
            <div className="text-xs text-ink-600 mt-1.5 font-medium">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Alerts */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        <div className="bg-paper border border-hairline border-ink-200 rounded-card p-5">
          <div className="flex justify-between items-baseline gap-3">
            <h3 className="font-heading font-bold text-[17px] text-ink-900">
              Poids traité — 14 derniers jours
            </h3>
            <span className="font-heading text-[11.5px] text-ink-600">kg / jour</span>
          </div>
          <div className="flex items-end gap-1.5 mt-5" style={{ height: 180 }}>
            {chart.length === 0 ? (
              <p className="text-tiny text-ink-500 self-center mx-auto">Pas encore de données.</p>
            ) : (
              chart.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center gap-1.5 justify-end h-full"
                  title={`${d.kg} kg`}
                >
                  <div
                    className="w-full bg-brand-700 rounded-t-sm"
                    style={{ height: `${Math.max(3, (d.kg / maxKg) * 100)}%` }}
                  />
                  <span className="font-heading text-[10px] text-ink-600">
                    {new Date(d.day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-paper border border-hairline border-ink-200 rounded-card p-5">
          <h3 className="font-heading font-bold text-[17px] text-ink-900">Alertes</h3>
          <div className="flex flex-col gap-2.5 mt-3.5">
            {alerts.length === 0 ? (
              <p className="text-tiny text-ink-500">Aucune alerte machine active.</p>
            ) : (
              alerts.map((m) => (
                <div
                  key={m.id}
                  className="border-l-[3px] border-danger-600 bg-danger-100 px-3.5 py-3"
                >
                  <div className="font-heading font-bold text-[13px] text-danger-600">
                    {m.reference} · {m.brand} {m.model}
                  </div>
                  <div className="text-[12.5px] text-danger-600 mt-1 leading-snug">
                    {m.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-paper border border-hairline border-ink-200 rounded-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-hairline border-ink-200 font-heading font-bold text-[17px] text-ink-900">
          Journal d'audit — activité récente
        </div>
        {audit.length === 0 ? (
          <p className="text-tiny text-ink-500 px-5 py-4">Aucune activité récente.</p>
        ) : (
          audit.map((a) => (
            <div
              key={a.id}
              className="px-5 py-3 border-b border-ink-100 last:border-0 flex gap-4 items-center text-sm flex-wrap"
            >
              <span className="flex-none font-heading text-xs text-ink-600 w-14">
                {new Date(a.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex-none w-36 font-medium text-ink-900 truncate">{a.actor}</span>
              <span className="flex-1 min-w-[160px] text-ink-600 truncate">
                {a.entity} · {a.details}
              </span>
              <span className="flex-none font-heading text-xs text-ink-800">{a.action}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
