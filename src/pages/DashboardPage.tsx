import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { TrendingUp, ShoppingCart, Weight, Users } from 'lucide-react';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DashboardPage() {
  // Mock stats data
  const stats = [
    {
      label: 'Chiffre d\'affaires',
      value: formatCurrency(53000989),
      change: '+6%',
      icon: TrendingUp,
      trend: 'up',
    },
    {
      label: 'Commandes',
      value: '95',
      change: '+10%',
      icon: ShoppingCart,
      trend: 'up',
    },
    {
      label: 'Poids traité',
      value: formatWeight(1022000),
      change: '+8%',
      icon: Weight,
      trend: 'up',
    },
    {
      label: 'Clients actifs',
      value: '101',
      change: '+2%',
      icon: Users,
      trend: 'up',
    },
  ];

  // Revenue chart data (last 6 months)
  const revenueData = [
    { month: 'Juillet', revenue: 45000000 },
    { month: 'Août', revenue: 48000000 },
    { month: 'Septembre', revenue: 47500000 },
    { month: 'Octobre', revenue: 50000000 },
    { month: 'Novembre', revenue: 49000000 },
    { month: 'Décembre', revenue: 53000000 },
  ];

  // Orders chart data (last 7 days)
  const ordersData = [
    { day: 'Lun', orders: 12, weight: 180 },
    { day: 'Mar', orders: 15, weight: 220 },
    { day: 'Mer', orders: 18, weight: 260 },
    { day: 'Jeu', orders: 14, weight: 210 },
    { day: 'Ven', orders: 16, weight: 240 },
    { day: 'Sam', orders: 10, weight: 150 },
    { day: 'Dim', orders: 10, weight: 140 },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">
          Tableau de bord
        </h1>
        <p className="text-gray-600 mt-1">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-success mt-1">
                    {stat.change} par rapport au mois dernier
                  </p>
                </div>
                <div className="p-3 bg-accent-50 rounded-lg">
                  <Icon className="w-6 h-6 text-accent-600" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du chiffre d'affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <Tooltip
                  formatter={(value: number | undefined) => formatCurrency(value || 0)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Chiffre d'affaires"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes de la semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="orders" fill="#f97316" name="Commandes" radius={[4, 4, 0, 0]} />
                <Bar dataKey="weight" fill="#10b981" name="Poids (kg)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Nouvelle commande</p>
                <p className="text-sm text-gray-600">Hôtel Radisson - 150 kg</p>
              </div>
              <span className="text-sm text-gray-500">Il y a 2 heures</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Production terminée</p>
                <p className="text-sm text-gray-600">Lot #LP-2024-001 - 200 pièces</p>
              </div>
              <span className="text-sm text-gray-500">Il y a 4 heures</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Livraison effectuée</p>
                <p className="text-sm text-gray-600">Hôtel Marriott - Commande #CMD-2024-089</p>
              </div>
              <span className="text-sm text-gray-500">Il y a 6 heures</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
