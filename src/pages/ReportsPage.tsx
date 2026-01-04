// import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Weight, Users, Package } from 'lucide-react';
import { formatCurrency, formatWeight } from '@/lib/utils';

export default function ReportsPage() {
  // Revenue by month (last 6 months)
  const revenueByMonth = [
    { month: 'Juil', revenue: 45000000, orders: 82, weight: 950000 },
    { month: 'Août', revenue: 48000000, orders: 88, weight: 1020000 },
    { month: 'Sept', revenue: 47500000, orders: 85, weight: 980000 },
    { month: 'Oct', revenue: 50000000, orders: 92, weight: 1050000 },
    { month: 'Nov', revenue: 49000000, orders: 89, weight: 1010000 },
    { month: 'Déc', revenue: 53000000, orders: 95, weight: 1100000 },
  ];

  // Revenue by client category
  const revenueByCategory = [
    { name: 'Hôtels 5 étoiles', value: 28000000, percentage: 52.8 },
    { name: 'Hôtels 4 étoiles', value: 15000000, percentage: 28.3 },
    { name: 'Hôtels 3 étoiles', value: 7000000, percentage: 13.2 },
    { name: 'Restaurants', value: 3000000, percentage: 5.7 },
  ];

  // Service distribution
  const serviceDistribution = [
    { name: 'Lavage standard', value: 35000000 },
    { name: 'Lavage express', value: 12000000 },
    { name: 'Repassage', value: 4000000 },
    { name: 'Pliage', value: 2000000 },
  ];

  // Top 5 clients
  const topClients = [
    { name: 'Radisson Blu Dakar', orders: 28, revenue: 15200000, weight: 420000 },
    { name: 'Pullman Teranga', orders: 24, revenue: 12800000, weight: 380000 },
    { name: 'King Fahd Palace', orders: 18, revenue: 11500000, weight: 290000 },
    { name: 'Hôtel Terrou-Bi', orders: 15, revenue: 8300000, weight: 240000 },
    { name: 'Ngor Diarama', orders: 10, revenue: 5200000, weight: 170000 },
  ];

  const COLORS = ['#f97316', '#10b981', '#3b82f6', '#f59e0b'];

  // Calculate stats
  const currentMonthRevenue = revenueByMonth[revenueByMonth.length - 1].revenue;
  const previousMonthRevenue = revenueByMonth[revenueByMonth.length - 2].revenue;
  const revenueGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1);

  const totalRevenue = revenueByMonth.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = revenueByMonth.reduce((sum, item) => sum + item.orders, 0);
  const totalWeight = revenueByMonth.reduce((sum, item) => sum + item.weight, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-600 mt-1">Analyses et statistiques</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Exporter Excel
          </Button>
          <Button variant="outline" size="sm">
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">CA 6 mois</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-sm text-success font-medium">+{revenueGrowth}%</span>
              </div>
            </div>
            <div className="p-3 bg-success-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              <p className="text-sm text-gray-600 mt-1">
                Moy: {formatCurrency(avgOrderValue)}
              </p>
            </div>
            <div className="p-3 bg-accent-50 rounded-lg">
              <Package className="w-6 h-6 text-accent-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Poids traité</p>
              <p className="text-2xl font-bold text-gray-900">{formatWeight(totalWeight)}</p>
              <p className="text-sm text-gray-600 mt-1">6 mois</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <Weight className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Clients actifs</p>
              <p className="text-2xl font-bold text-gray-900">101</p>
              <p className="text-sm text-gray-600 mt-1">+12 ce mois</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du chiffre d'affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueByMonth}>
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
                  strokeWidth={3}
                  dot={{ fill: '#f97316', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Chiffre d'affaires"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders and Weight */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes et poids</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueByCategory.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par service</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} tickFormatter={(value) => `${value / 1000000}M`} />
                <YAxis type="category" dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} width={120} />
                <Tooltip
                  formatter={(value: number | undefined) => formatCurrency(value || 0)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Client</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Commandes</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Chiffre d'affaires</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Poids traité</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">CA moyen/cmd</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((client, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-accent-600">{index + 1}</span>
                        </div>
                        <span className="font-medium text-gray-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">{client.orders}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(client.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatWeight(client.weight)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatCurrency(client.revenue / client.orders)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
