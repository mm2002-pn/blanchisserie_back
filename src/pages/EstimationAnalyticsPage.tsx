import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { TrendingUp, TrendingDown, AlertTriangle, Award, Users, Calendar } from 'lucide-react';
import { formatWeight, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Import mock data
import ordersData from '@/mocks/data/orders.json';

export default function EstimationAnalyticsPage() {
  const [orders] = useState(ordersData);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Filter orders with actual weights (completed weighing)
  const weighedOrders = orders.filter(o => o.actualWeight && o.estimatedWeight);

  // Calculate global stats
  const globalStats = {
    totalOrders: weighedOrders.length,
    avgDeviation: weighedOrders.reduce((sum, o) => sum + Math.abs(o.deviation || 0), 0) / weighedOrders.length || 0,
    underestimations: weighedOrders.filter(o => (o.deviation || 0) > 10).length,
    overestimations: weighedOrders.filter(o => (o.deviation || 0) < -10).length,
    accurate: weighedOrders.filter(o => Math.abs(o.deviation || 0) <= 10).length,
  };

  // Top underestimations
  const topUnderestimations = [...weighedOrders]
    .filter(o => (o.deviation || 0) > 0)
    .sort((a, b) => (b.deviation || 0) - (a.deviation || 0))
    .slice(0, 5);

  // Top overestimations
  const topOverestimations = [...weighedOrders]
    .filter(o => (o.deviation || 0) < 0)
    .sort((a, b) => (a.deviation || 0) - (b.deviation || 0))
    .slice(0, 5);

  // Group by client
  const ordersByClient = weighedOrders.reduce((acc, order) => {
    if (!acc[order.clientId]) {
      acc[order.clientId] = {
        clientId: order.clientId,
        clientName: order.clientName,
        orders: [],
      };
    }
    acc[order.clientId].orders.push(order);
    return acc;
  }, {} as Record<string, { clientId: string; clientName: string; orders: typeof weighedOrders }>);

  // Calculate client stats
  const clientStats = Object.values(ordersByClient).map(client => {
    const avgDeviation = client.orders.reduce((sum, o) => sum + (o.deviation || 0), 0) / client.orders.length;
    const avgEstimated = client.orders.reduce((sum, o) => sum + (o.estimatedWeight || 0), 0) / client.orders.length;
    const avgActual = client.orders.reduce((sum, o) => sum + (o.actualWeight || 0), 0) / client.orders.length;

    return {
      ...client,
      avgDeviation,
      avgEstimated,
      avgActual,
      totalOrders: client.orders.length,
    };
  }).sort((a, b) => Math.abs(b.avgDeviation) - Math.abs(a.avgDeviation));

  // Deviation distribution data for chart
  const deviationDistribution = [
    {
      range: '< -50%',
      count: weighedOrders.filter(o => (o.deviation || 0) < -50).length,
      color: '#dc2626'
    },
    {
      range: '-50% à -30%',
      count: weighedOrders.filter(o => (o.deviation || 0) >= -50 && (o.deviation || 0) < -30).length,
      color: '#f59e0b'
    },
    {
      range: '-30% à -10%',
      count: weighedOrders.filter(o => (o.deviation || 0) >= -30 && (o.deviation || 0) < -10).length,
      color: '#fbbf24'
    },
    {
      range: '-10% à +10%',
      count: weighedOrders.filter(o => Math.abs(o.deviation || 0) <= 10).length,
      color: '#10b981'
    },
    {
      range: '+10% à +30%',
      count: weighedOrders.filter(o => (o.deviation || 0) > 10 && (o.deviation || 0) <= 30).length,
      color: '#fbbf24'
    },
    {
      range: '+30% à +50%',
      count: weighedOrders.filter(o => (o.deviation || 0) > 30 && (o.deviation || 0) <= 50).length,
      color: '#f59e0b'
    },
    {
      range: '> +50%',
      count: weighedOrders.filter(o => (o.deviation || 0) > 50).length,
      color: '#dc2626'
    },
  ];

  const selectedClient = selectedClientId
    ? ordersByClient[selectedClientId]
    : null;

  const getDeviationColor = (deviation: number): string => {
    const abs = Math.abs(deviation);
    if (abs <= 10) return 'text-success';
    if (abs <= 30) return 'text-warning';
    return 'text-danger';
  };

  const getDeviationBadge = (deviation: number): 'success' | 'warning' | 'error' => {
    const abs = Math.abs(deviation);
    if (abs <= 10) return 'success';
    if (abs <= 30) return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">
          Analyse des Écarts
        </h1>
        <p className="text-gray-600 mt-1">
          Comparaison estimations vs poids réels
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card padding="md">
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-primary-600" />
            <p className="text-2xl font-bold text-gray-900">{globalStats.totalOrders}</p>
            <p className="text-sm text-gray-600 mt-1">Commandes pesées</p>
          </div>
        </Card>

        <Card padding="md">
          <div className="text-center">
            <Award className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold text-success">{globalStats.accurate}</p>
            <p className="text-sm text-gray-600 mt-1">Précises (±10%)</p>
          </div>
        </Card>

        <Card padding="md">
          <div className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-danger" />
            <p className="text-2xl font-bold text-danger">{globalStats.underestimations}</p>
            <p className="text-sm text-gray-600 mt-1">Sous-estimées</p>
          </div>
        </Card>

        <Card padding="md">
          <div className="text-center">
            <TrendingDown className="w-8 h-8 mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold text-warning">{globalStats.overestimations}</p>
            <p className="text-sm text-gray-600 mt-1">Surestimées</p>
          </div>
        </Card>

        <Card padding="md">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="text-2xl font-bold text-gray-900">{globalStats.avgDeviation.toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-1">Écart moyen</p>
          </div>
        </Card>
      </div>

      {/* Deviation Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution des écarts</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deviationDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {deviationDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Underestimations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-danger" />
              <CardTitle>Top des sous-estimations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUnderestimations.map((order, index) => (
                <div key={order.id} className="p-4 border border-danger-200 bg-danger-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">{index + 1}.</span>
                        <span className="font-semibold text-gray-900">{order.clientName}</span>
                      </div>
                      <p className="text-sm text-gray-600">{order.orderNumber}</p>
                    </div>
                    <Badge variant="error" className="text-xs">
                      +{order.deviation}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Estimé</p>
                      <p className="font-medium text-gray-900">{formatWeight(order.estimatedWeight || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Réel</p>
                      <p className="font-bold text-danger">{formatWeight(order.actualWeight || 0)}</p>
                    </div>
                  </div>
                  {order.invoiceDeviation && (
                    <div className="mt-2 pt-2 border-t border-danger-300">
                      <p className="text-xs text-gray-600">Impact facturation: <span className="font-bold text-danger">+{formatCurrency(order.invoiceDeviation)}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Overestimations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-warning" />
              <CardTitle>Top des surestimations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topOverestimations.map((order, index) => (
                <div key={order.id} className="p-4 border border-warning-200 bg-warning-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">{index + 1}.</span>
                        <span className="font-semibold text-gray-900">{order.clientName}</span>
                      </div>
                      <p className="text-sm text-gray-600">{order.orderNumber}</p>
                    </div>
                    <Badge variant="warning" className="text-xs">
                      {order.deviation}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Estimé</p>
                      <p className="font-medium text-gray-900">{formatWeight(order.estimatedWeight || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Réel</p>
                      <p className="font-bold text-warning-700">{formatWeight(order.actualWeight || 0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            <CardTitle>Analyse par client</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client List */}
            <div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {clientStats.map((client) => (
                  <div
                    key={client.clientId}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedClientId === client.clientId
                        ? 'border-accent-500 bg-accent-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedClientId(client.clientId)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{client.clientName}</p>
                        <p className="text-sm text-gray-600">{client.totalOrders} commandes</p>
                      </div>
                      <Badge variant={getDeviationBadge(client.avgDeviation)} className="text-xs">
                        {client.avgDeviation > 0 ? '+' : ''}{client.avgDeviation.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Moy. estimée</p>
                        <p className="font-medium text-gray-900">{formatWeight(client.avgEstimated)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Moy. réelle</p>
                        <p className={`font-bold ${getDeviationColor(client.avgDeviation)}`}>
                          {formatWeight(client.avgActual)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Detail */}
            <div>
              {selectedClient ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <h4 className="font-semibold text-gray-900 mb-3">{selectedClient.clientName}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nombre de commandes:</span>
                        <span className="font-bold">{selectedClient.orders.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Écart moyen:</span>
                        <span className={`font-bold ${getDeviationColor(
                          selectedClient.orders.reduce((sum, o) => sum + (o.deviation || 0), 0) / selectedClient.orders.length
                        )}`}>
                          {(selectedClient.orders.reduce((sum, o) => sum + (o.deviation || 0), 0) / selectedClient.orders.length).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Historique des 6 dernières commandes:</h5>
                    <div className="space-y-2">
                      {selectedClient.orders.slice(0, 6).map((order) => (
                        <div key={order.id} className="p-3 border border-gray-200 rounded-lg bg-white">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{order.orderNumber}</span>
                            <Badge variant={getDeviationBadge(order.deviation || 0)} className="text-xs">
                              {order.deviation || 0 > 0 ? '+' : ''}{order.deviation}%
                            </Badge>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{format(new Date(order.collectionDate), 'dd MMM yyyy', { locale: fr })}</span>
                            <span>Estimé: {formatWeight(order.estimatedWeight || 0)}</span>
                            <span>Réel: {formatWeight(order.actualWeight || 0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <Card className="border-accent-200 bg-accent-50">
                    <CardContent className="p-4">
                      <h5 className="font-semibold text-accent-900 mb-2">RECOMMANDATIONS:</h5>
                      <ul className="list-disc list-inside text-sm text-accent-700 space-y-1">
                        {selectedClient.orders.reduce((sum, o) => sum + (o.deviation || 0), 0) / selectedClient.orders.length > 30 && (
                          <>
                            <li>Reclasser les estimations standard vers catégorie supérieure</li>
                            <li>Former le personnel de {selectedClient.clientName} à mieux estimer</li>
                          </>
                        )}
                        {selectedClient.orders.reduce((sum, o) => sum + (o.deviation || 0), 0) / selectedClient.orders.length < -30 && (
                          <>
                            <li>Revoir le contrat avec {selectedClient.clientName}</li>
                            <li>Proposer un forfait basé sur le poids moyen réel</li>
                          </>
                        )}
                        {Math.abs(selectedClient.orders.reduce((sum, o) => sum + (o.deviation || 0), 0) / selectedClient.orders.length) <= 10 && (
                          <li className="text-success">✓ Les estimations de ce client sont précises, maintenir le système actuel</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Sélectionnez un client pour voir l'analyse détaillée</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Card className="border-primary-200 bg-primary-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-primary-900 mb-1">
                Analyse prédictive
              </h4>
              <p className="text-sm text-primary-700">
                L'analyse des écarts permet d'identifier les clients qui sous-estiment ou surestiment systématiquement leurs commandes.
                Un écart de ±10% est considéré comme acceptable. Au-delà de 30%, des actions correctives sont recommandées :
                formation du personnel client, ajustement des forfaits, ou révision des catégories d'estimation (S, M, L, XL).
                L'historique par client permet de détecter les tendances et d'optimiser la facturation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
