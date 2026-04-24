import { useState } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ResponsiveContainer } from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Weight,
  Users,
  Package,
  Download,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Tokens matched to tailwind config
const BRAND_800 = '#2C3C79';
const BRAND_600 = '#4A62BC';
const BRAND_100 = '#DDE2F0';
const TERRA_600 = '#CF7B4B';
const BAOBAB_600 = '#629853';
const INK_100 = '#F2EFEB';
const INK_200 = '#E4E0DA';
const INK_400 = '#A39E93';
const INK_500 = '#807A6F';
const INK_900 = '#1A1712';
const PAPER = '#FCFBF9';

type Period = '6m' | '12m' | 'year';

const PERIODS: { key: Period; label: string }[] = [
  { key: '6m', label: '6 mois' },
  { key: '12m', label: '12 mois' },
  { key: 'year', label: 'Année en cours' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('6m');

  const revenueByMonth = [
    { month: 'Juil', revenue: 45, orders: 82, weight: 950 },
    { month: 'Août', revenue: 48, orders: 88, weight: 1020 },
    { month: 'Sept', revenue: 47.5, orders: 85, weight: 980 },
    { month: 'Oct', revenue: 50, orders: 92, weight: 1050 },
    { month: 'Nov', revenue: 49, orders: 89, weight: 1010 },
    { month: 'Déc', revenue: 53, orders: 95, weight: 1100 },
  ];

  const revenueByCategory = [
    { name: 'Hôtels 5★', value: 28000000, pct: 52.8, color: BRAND_800 },
    { name: 'Hôtels 4★', value: 15000000, pct: 28.3, color: BRAND_600 },
    { name: 'Hôtels 3★', value: 7000000, pct: 13.2, color: TERRA_600 },
    { name: 'Restaurants', value: 3000000, pct: 5.7, color: INK_400 },
  ];

  const serviceDistribution = [
    { name: 'Lavage standard', value: 35, color: BRAND_800 },
    { name: 'Lavage express', value: 12, color: TERRA_600 },
    { name: 'Repassage', value: 4, color: BAOBAB_600 },
    { name: 'Pliage', value: 2, color: INK_400 },
  ];

  const topClients = [
    { name: 'Radisson Blu Dakar', orders: 28, revenue: 15200000, weight: 420000 },
    { name: 'Pullman Teranga', orders: 24, revenue: 12800000, weight: 380000 },
    { name: 'King Fahd Palace', orders: 18, revenue: 11500000, weight: 290000 },
    { name: 'Hôtel Terrou-Bi', orders: 15, revenue: 8300000, weight: 240000 },
    { name: 'Ngor Diarama', orders: 10, revenue: 5200000, weight: 170000 },
  ];

  const currentMonthRevenue = revenueByMonth[revenueByMonth.length - 1].revenue;
  const previousMonthRevenue = revenueByMonth[revenueByMonth.length - 2].revenue;
  const revenueGrowth = (
    ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
    100
  ).toFixed(1);

  const totalRevenueNum = revenueByMonth.reduce((s, i) => s + i.revenue, 0);
  const totalRevenue = totalRevenueNum * 1_000_000;
  const totalOrders = revenueByMonth.reduce((s, i) => s + i.orders, 0);
  const totalWeight =
    revenueByMonth.reduce((s, i) => s + i.weight, 0) * 1000; // to grams
  const avgOrderValue = totalRevenue / totalOrders;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Analyses</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            Rapports consolidés
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            CA, volume et répartition clientèle sur les derniers mois.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            Excel
          </Button>
          <Button size="sm" className="gap-1.5">
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Rapport PDF
          </Button>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex items-center gap-1.5">
        {PERIODS.map((p) => {
          const active = period === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-tiny font-semibold transition-colors border-hairline',
                active
                  ? 'bg-brand-800 text-paper border-brand-800'
                  : 'bg-paper text-ink-700 border-ink-200 hover:bg-paper-2',
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="CA 6 mois"
          value={formatCurrency(totalRevenue)}
          extra={
            <span className="flex items-center gap-1 text-ok-700 text-tiny font-semibold tnum">
              <TrendingUp className="w-3 h-3" strokeWidth={2} /> +{revenueGrowth}%
            </span>
          }
          icon={DollarSign}
          tint="ok"
          mono
        />
        <Kpi
          label="Commandes"
          value={`${totalOrders}`}
          extra={`Moy. ${formatCurrency(avgOrderValue)}`}
          icon={Package}
          tint="brand"
        />
        <Kpi
          label="Poids traité"
          value={formatWeight(totalWeight)}
          extra="Sur 6 mois"
          icon={Weight}
          tint="warn"
          mono
        />
        <Kpi
          label="Clients actifs"
          value="101"
          extra="+12 ce mois"
          icon={Users}
          tint="terra"
        />
      </div>

      {/* Row 1 — Revenue + Orders/Weight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ChartCard
          title="Évolution du CA"
          subtitle="6 derniers mois · en millions XOF"
          legend={<LegendDot color={BRAND_800} label="CA" />}
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={revenueByMonth}
              margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id="rep-ca" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND_100} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={BRAND_100} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={INK_200} vertical={false} />
              <XAxis
                dataKey="month"
                stroke={INK_500}
                tick={{ fontSize: 11, fill: INK_500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke={INK_500}
                tick={{ fontSize: 10, fill: INK_500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: PAPER,
                  border: `0.5px solid ${INK_200}`,
                  borderRadius: 10,
                  fontSize: 12,
                  color: INK_900,
                }}
                formatter={(value) => [`${value} M F CFA`, 'CA']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={BRAND_800}
                strokeWidth={2}
                fill="url(#rep-ca)"
                activeDot={{ r: 5, fill: BRAND_800, stroke: PAPER, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Volume et commandes"
          subtitle="6 derniers mois"
          legend={
            <>
              <LegendDot color={BRAND_800} label="Commandes" />
              <LegendDot color={BAOBAB_600} label="Poids (t)" />
            </>
          }
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={revenueByMonth}
              margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
            >
              <CartesianGrid stroke={INK_200} vertical={false} />
              <XAxis
                dataKey="month"
                stroke={INK_500}
                tick={{ fontSize: 11, fill: INK_500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke={INK_500}
                tick={{ fontSize: 10, fill: INK_500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: PAPER,
                  border: `0.5px solid ${INK_200}`,
                  borderRadius: 10,
                  fontSize: 12,
                  color: INK_900,
                }}
              />
              <Bar dataKey="orders" fill={BRAND_800} radius={[4, 4, 0, 0]} />
              <Bar dataKey="weight" fill={BAOBAB_600} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2 — Categories + Services */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <ChartCard
          className="lg:col-span-2"
          title="Par segment client"
          subtitle={formatCurrency(totalRevenue)}
        >
          <div className="flex items-center gap-4 mt-2">
            <div className="relative w-[150px] h-[150px] shrink-0">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie
                    data={revenueByCategory}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={72}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {revenueByCategory.map((e) => (
                      <Cell key={e.name} fill={e.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-micro text-ink-500">Segments</span>
                <span className="font-serif text-xl font-medium text-ink-900 tnum">
                  {revenueByCategory.length}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {revenueByCategory.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between gap-2 text-tiny"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-ink-700 truncate">{d.name}</span>
                  </div>
                  <span className="font-mono text-ink-900 font-medium tnum">
                    {d.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard
          className="lg:col-span-3"
          title="Par type de service"
          subtitle="Volumes en millions XOF"
        >
          <ResponsiveContainer width="100%" height={210}>
            <BarChart
              data={serviceDistribution}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke={INK_200} horizontal={false} />
              <XAxis
                type="number"
                stroke={INK_500}
                tick={{ fontSize: 10, fill: INK_500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}M`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke={INK_500}
                tick={{ fontSize: 11, fill: INK_500 }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip
                cursor={{ fill: INK_100 }}
                contentStyle={{
                  backgroundColor: PAPER,
                  border: `0.5px solid ${INK_200}`,
                  borderRadius: 10,
                  fontSize: 12,
                  color: INK_900,
                }}
                formatter={(value) => [`${value} M F CFA`, 'Volume']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {serviceDistribution.map((e) => (
                  <Cell key={e.name} fill={e.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top clients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="caps">Top 5 clients · CA cumulé</div>
          <Badge variant="brand">6 mois</Badge>
        </div>
        <div className="card-surface overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-paper-2 px-4 py-3 text-left text-micro font-semibold uppercase tracking-caps text-ink-500 border-b border-hairline border-ink-200">
                  Client
                </th>
                <th className="bg-paper-2 px-4 py-3 text-right text-micro font-semibold uppercase tracking-caps text-ink-500 border-b border-hairline border-ink-200">
                  Commandes
                </th>
                <th className="bg-paper-2 px-4 py-3 text-right text-micro font-semibold uppercase tracking-caps text-ink-500 border-b border-hairline border-ink-200">
                  CA
                </th>
                <th className="bg-paper-2 px-4 py-3 text-right text-micro font-semibold uppercase tracking-caps text-ink-500 border-b border-hairline border-ink-200">
                  Poids
                </th>
                <th className="bg-paper-2 px-4 py-3 text-right text-micro font-semibold uppercase tracking-caps text-ink-500 border-b border-hairline border-ink-200">
                  CA / cmd
                </th>
              </tr>
            </thead>
            <tbody>
              {topClients.map((client, index) => (
                <tr
                  key={client.name}
                  className={cn(
                    'transition-colors hover:bg-paper-2',
                    index < topClients.length - 1 &&
                      'border-b border-hairline border-ink-200',
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-serif text-sm font-medium',
                          index === 0 && 'bg-brand-800 text-paper',
                          index === 1 && 'bg-brand-600 text-paper',
                          index === 2 && 'bg-terra-600 text-paper',
                          index > 2 && 'bg-paper-2 text-ink-700 border-hairline border-ink-200',
                        )}
                      >
                        {index + 1}
                      </div>
                      <span className="text-sm font-semibold text-ink-900">
                        {client.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-ink-900 tnum">
                    {client.orders}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-ink-900 tnum">
                    {formatCurrency(client.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-ink-700 tnum">
                    {formatWeight(client.weight)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-ink-700 tnum">
                    {formatCurrency(client.revenue / client.orders)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  extra,
  icon: Icon,
  tint,
  mono = false,
}: {
  label: string;
  value: string;
  extra: React.ReactNode;
  icon: typeof DollarSign;
  tint: 'ok' | 'warn' | 'danger' | 'brand' | 'terra';
  mono?: boolean;
}) {
  const bg =
    tint === 'ok'
      ? 'bg-ok-100'
      : tint === 'warn'
        ? 'bg-warn-100'
        : tint === 'danger'
          ? 'bg-danger-100'
          : tint === 'terra'
            ? 'bg-terra-100'
            : 'bg-brand-100';
  const fg =
    tint === 'ok'
      ? 'text-ok-700'
      : tint === 'warn'
        ? 'text-warn-700'
        : tint === 'danger'
          ? 'text-danger-600'
          : tint === 'terra'
            ? 'text-terra-700'
            : 'text-brand-800';

  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p
            className={cn(
              'mt-1.5 leading-none tracking-tight text-ink-900',
              mono
                ? 'font-mono text-lg font-semibold tnum'
                : 'font-serif text-3xl font-medium tnum',
            )}
          >
            {value}
          </p>
          <p className="text-tiny text-ink-500 mt-1.5">{extra}</p>
        </div>
        <div
          className={cn(
            'w-9 h-9 rounded-input flex items-center justify-center shrink-0',
            bg,
          )}
        >
          <Icon className={cn('w-4 h-4', fg)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  legend,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card-surface p-5', className)}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-medium tracking-tight text-ink-900">
            {title}
          </h3>
          <p className="text-tiny text-ink-500 mt-1">{subtitle}</p>
        </div>
        {legend && (
          <div className="flex items-center gap-3 text-tiny">{legend}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-ink-500">
      <span
        className="inline-block w-3 h-0.5"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}
