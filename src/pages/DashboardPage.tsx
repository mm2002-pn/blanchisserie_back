import { Card } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Calendar,
  Download,
  TrendingUp,
  ShoppingCart,
  Weight,
  Users,
  Package,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import { formatCurrency, formatWeight } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const BRAND_800 = '#2C3C79';
const BRAND_100 = '#DDE2F0';
const TERRA_600 = '#CF7B4B';
const INK_200 = '#E4E0DA';
const INK_400 = '#A39E93';
const INK_500 = '#807A6F';
const INK_900 = '#1A1712';
const PAPER = '#FCFBF9';

export default function DashboardPage() {
  const kpis = [
    {
      label: "Chiffre d'affaires",
      value: '42,8',
      unit: 'M F',
      delta: '+8,2%',
      sub: 'vs mars',
      icon: TrendingUp,
    },
    {
      label: 'Commandes traitées',
      value: '384',
      unit: '',
      delta: '+12,4%',
      sub: '94 cette semaine',
      icon: ShoppingCart,
    },
    {
      label: 'Volume traité',
      value: '18,6',
      unit: 't',
      delta: '+5,1%',
      sub: 'vs mars',
      icon: Weight,
    },
    {
      label: 'Clients actifs',
      value: '52',
      unit: '',
      delta: '+3',
      sub: 'hôtels · restaurants',
      icon: Users,
    },
  ];

  const revenueData = [
    { month: 'M', revenue: 26, objective: 30 },
    { month: 'J', revenue: 28, objective: 30 },
    { month: 'J', revenue: 32, objective: 30 },
    { month: 'A', revenue: 30, objective: 30 },
    { month: 'S', revenue: 29, objective: 30 },
    { month: 'O', revenue: 34, objective: 30 },
    { month: 'N', revenue: 36, objective: 30 },
    { month: 'D', revenue: 38, objective: 30 },
    { month: 'J', revenue: 35, objective: 30 },
    { month: 'F', revenue: 40, objective: 30 },
    { month: 'M', revenue: 38, objective: 30 },
    { month: 'A', revenue: 42.8, objective: 30 },
  ];

  const linenDistribution = [
    { name: 'Draps', value: 42, color: BRAND_800 },
    { name: 'Serviettes', value: 26, color: '#4A62BC' },
    { name: 'Nappes', value: 18, color: TERRA_600 },
    { name: 'Uniformes', value: 9, color: INK_400 },
    { name: 'Autres', value: 5, color: '#CDC8BF' },
  ];

  const activities = [
    {
      icon: ShoppingCart,
      title: 'Nouvelle commande',
      sub: 'Hôtel Radisson Blu · 150 kg',
      when: 'Il y a 2 h',
      tint: 'info' as const,
    },
    {
      icon: CheckCircle2,
      title: 'Production terminée',
      sub: 'Lot LP-2024-001 · 200 pièces',
      when: 'Il y a 4 h',
      tint: 'success' as const,
    },
    {
      icon: Truck,
      title: 'Livraison effectuée',
      sub: 'Hôtel Marriott · CMD-2024-089',
      when: 'Il y a 6 h',
      tint: 'brand' as const,
    },
    {
      icon: Package,
      title: 'Collecte reçue',
      sub: 'Terrou-Bi · 96 pièces · 24,5 kg',
      when: 'Hier · 17:20',
      tint: 'neutral' as const,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Tableau de bord</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            Vue consolidée · Avril 2026
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Activité de l'atelier Dakar Nord pour le mois en cours.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
            Avril 2026
          </Button>
          <Button variant="primary" size="sm" className="gap-1.5">
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} padding="md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-tiny font-medium text-ink-500">{k.label}</p>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="font-serif text-3xl font-medium tnum tracking-tight text-ink-900 leading-none">
                      {k.value}
                    </span>
                    {k.unit && (
                      <span className="text-sm text-ink-500">{k.unit}</span>
                    )}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-tiny tnum font-semibold text-ok-700">
                  ↗ {k.delta}
                </span>
                <span className="text-tiny text-ink-500">{k.sub}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Revenue + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Revenue */}
        <Card padding="lg" className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-medium tracking-tight text-ink-900">
                Chiffre d'affaires · 12 mois
              </h3>
              <p className="text-tiny text-ink-500 mt-1">
                Mai 2025 — Avril 2026 · en millions XOF
              </p>
            </div>
            <div className="flex items-center gap-3 text-tiny">
              <LegendDot color={BRAND_800} label="CA" />
              <LegendDot color={TERRA_600} label="Objectif" dashed />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={revenueData}
              margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id="ca-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND_100} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={BRAND_100} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={INK_200} strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="month"
                stroke={INK_500}
                tick={{ fontSize: 11, fill: INK_500 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={INK_500}
                tick={{ fontSize: 10, fill: INK_500, fontFamily: 'DM Mono' }}
                tickLine={false}
                axisLine={false}
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
              <ReferenceLine
                y={30}
                stroke={TERRA_600}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={BRAND_800}
                strokeWidth={2}
                fill="url(#ca-fill)"
                activeDot={{ r: 5, fill: BRAND_800, stroke: PAPER, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Donut */}
        <Card padding="lg">
          <h3 className="font-serif text-lg font-medium tracking-tight text-ink-900">
            Répartition · types
          </h3>
          <p className="text-tiny text-ink-500 mt-1 mb-4">
            18,6 tonnes ce mois
          </p>

          <div className="flex items-center gap-4">
            <div className="relative w-[130px] h-[130px] shrink-0">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie
                    data={linenDistribution}
                    dataKey="value"
                    innerRadius={42}
                    outerRadius={62}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {linenDistribution.map((e) => (
                      <Cell key={e.name} fill={e.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-micro text-ink-500">Total</span>
                <span className="font-serif text-lg font-medium text-ink-900 tnum">
                  18,6 t
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {linenDistribution.map((d) => (
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
                  <span className="font-mono text-ink-900 font-medium">
                    {d.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent activity + Secondary KPIs row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-medium tracking-tight text-ink-900">
                Activité récente
              </h3>
              <p className="text-tiny text-ink-500 mt-1">
                Dernières 24 heures
              </p>
            </div>
            <Button variant="ghost" size="sm">
              Tout voir
            </Button>
          </div>
          <div className="space-y-1">
            {activities.map((a, i) => {
              const Icon = a.icon;
              const iconBg =
                a.tint === 'success'
                  ? 'bg-ok-100 text-ok-700'
                  : a.tint === 'info'
                    ? 'bg-brand-100 text-brand-800'
                    : a.tint === 'brand'
                      ? 'bg-brand-800 text-paper'
                      : 'bg-paper-2 text-ink-700';
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 py-3 ${
                    i < activities.length - 1
                      ? 'border-b border-hairline border-ink-200'
                      : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-input flex items-center justify-center shrink-0 ${iconBg}`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">
                      {a.title}
                    </p>
                    <p className="text-tiny text-ink-500 truncate">{a.sub}</p>
                  </div>
                  <span className="text-micro font-mono text-ink-500 shrink-0">
                    {a.when}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Ops snapshot */}
        <Card padding="lg">
          <h3 className="font-serif text-lg font-medium tracking-tight text-ink-900">
            Opérations · aujourd'hui
          </h3>
          <p className="text-tiny text-ink-500 mt-1 mb-4">
            Atelier · 07:00 – 19:00
          </p>
          <div className="space-y-3">
            <OpsLine label="Collectes planifiées" value="18" caption="12 faites" />
            <OpsLine label="Livraisons à honorer" value="9" caption="4 en route" />
            <OpsLine label="Cycles machines" value="27" caption="3 laveuses actives" />
            <div className="pt-3 mt-2 border-t border-hairline border-ink-200 flex items-center justify-between">
              <span className="text-tiny text-ink-500">Qualité moyenne</span>
              <Badge variant="success" dot>
                98,6 %
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <p className="text-center text-micro font-mono text-ink-500 py-2">
        {formatCurrency(53000989)} · {formatWeight(1022000)} consolidés depuis janvier
      </p>
    </div>
  );
}

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-ink-500">
      <span
        className="inline-block w-4 h-px"
        style={{
          backgroundColor: color,
          borderTop: dashed ? `1px dashed ${color}` : undefined,
          borderTopWidth: dashed ? 1 : 2,
          height: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function OpsLine({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-ink-700">{label}</p>
        <p className="text-tiny text-ink-500">{caption}</p>
      </div>
      <span className="font-serif text-xl font-medium text-ink-900 tnum">
        {value}
      </span>
    </div>
  );
}
