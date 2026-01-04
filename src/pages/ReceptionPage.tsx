import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { Truck, Scale, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { formatWeight } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import mock data
import ordersData from '@/mocks/data/orders.json';
import vehiclesData from '@/mocks/data/vehicles.json';

interface WeighingState {
  orderId: string;
  weight: string;
  isWeighing: boolean;
}

export default function ReceptionPage() {
  const [orders] = useState(ordersData);
  const [vehicles] = useState(vehiclesData);
  const [weighingState, setWeighingState] = useState<WeighingState | null>(null);

  // Filter orders that are collected but not yet weighed
  const ordersToWeigh = orders.filter(o =>
    o.status === 'Collectée' ||
    (o.status === 'Réceptionnée' && !o.actualWeight)
  );

  // Filter orders that arrived today for reception
  const todayReceptions = orders.filter(o =>
    o.receptionDateTime &&
    new Date(o.receptionDateTime).toDateString() === new Date().toDateString()
  );

  // Group orders by vehicle
  const ordersByVehicle = ordersToWeigh.reduce((acc, order) => {
    if (order.vehicleId) {
      if (!acc[order.vehicleId]) {
        acc[order.vehicleId] = [];
      }
      acc[order.vehicleId].push(order);
    }
    return acc;
  }, {} as Record<string, typeof orders>);

  const startWeighing = (orderId: string) => {
    setWeighingState({
      orderId,
      weight: '',
      isWeighing: true
    });
  };

  const addDigit = (digit: string) => {
    if (!weighingState) return;
    setWeighingState({
      ...weighingState,
      weight: weighingState.weight + digit
    });
  };

  const clearWeight = () => {
    if (!weighingState) return;
    setWeighingState({
      ...weighingState,
      weight: ''
    });
  };

  const confirmWeight = () => {
    if (!weighingState) return;
    // In real app, this would update the order with actual weight
    console.log(`Order ${weighingState.orderId} weighed at ${weighingState.weight}kg`);
    setWeighingState(null);
  };

  const cancelWeighing = () => {
    setWeighingState(null);
  };

  const calculateDeviation = (estimated: number, actual: number): number => {
    return Math.round(((actual - estimated) / estimated) * 100);
  };

  const getDeviationColor = (deviation: number): string => {
    if (Math.abs(deviation) <= 10) return 'text-success';
    if (Math.abs(deviation) <= 30) return 'text-warning';
    return 'text-danger';
  };

  const currentOrder = weighingState
    ? orders.find(o => o.id === weighingState.orderId)
    : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">
          Réception et Pesée
        </h1>
        <p className="text-gray-600 mt-1">
          Gestion des arrivées et pesée officielle
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Arrivées aujourd'hui</p>
              <p className="text-2xl font-bold text-primary">{todayReceptions.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">À peser</p>
              <p className="text-2xl font-bold text-warning">{ordersToWeigh.length}</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <Scale className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Camions en déchargement</p>
              <p className="text-2xl font-bold text-accent">{Object.keys(ordersByVehicle).length}</p>
            </div>
            <div className="p-3 bg-accent-50 rounded-lg">
              <Truck className="w-6 h-6 text-accent-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pesées terminées</p>
              <p className="text-2xl font-bold text-success">
                {todayReceptions.filter(o => o.actualWeight).length}
              </p>
            </div>
            <div className="p-3 bg-success-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Weighing Modal */}
      {weighingState && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Pesée Officielle - {currentOrder.clientName}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Commande {currentOrder.orderNumber} • Estimation: {currentOrder.estimatedSize}
              </p>
            </CardHeader>
            <CardContent>
              {/* Estimation Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Estimation client:</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatWeight(currentOrder.estimatedWeight || 0)} ({currentOrder.estimatedSize})
                </p>
                {currentOrder.visualEstimation && (
                  <p className="text-sm text-gray-600 mt-1">
                    Visuel chauffeur: {currentOrder.visualEstimation}
                  </p>
                )}
              </div>

              {/* Weight Display */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">LIRE LE POIDS SUR LA BALANCE:</p>
                <div className="text-center p-6 bg-primary-50 rounded-lg border-2 border-primary-200">
                  <p className="text-5xl font-bold text-primary-900 font-mono">
                    {weighingState.weight || '0'} <span className="text-2xl">kg</span>
                  </p>
                </div>
              </div>

              {/* Numeric Keypad */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-3">
                  {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'C'].map((key) => (
                    <Button
                      key={key}
                      variant={key === 'C' ? 'outline' : 'secondary'}
                      size="lg"
                      className="h-16 text-xl font-semibold"
                      onClick={() => key === 'C' ? clearWeight() : addDigit(key)}
                    >
                      {key}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Comparison (if weight entered) */}
              {weighingState.weight && parseFloat(weighingState.weight) > 0 && (
                <div className="mb-6 p-4 bg-warning-50 rounded-lg border border-warning-200">
                  <h4 className="font-semibold text-gray-900 mb-3">COMPARAISON:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimation client:</span>
                      <span className="font-medium">{formatWeight(currentOrder.estimatedWeight || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Poids réel:</span>
                      <span className="font-bold text-primary-600">
                        {formatWeight(parseFloat(weighingState.weight) * 1000)}
                      </span>
                    </div>
                    {currentOrder.estimatedWeight && (
                      <div className="flex justify-between items-center pt-2 border-t border-warning-300">
                        <span className="text-gray-600">Écart:</span>
                        <div className="flex items-center gap-2">
                          {calculateDeviation(
                            currentOrder.estimatedWeight,
                            parseFloat(weighingState.weight) * 1000
                          ) > 0 ? (
                            <TrendingUp className="w-4 h-4 text-danger" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-success" />
                          )}
                          <span className={`font-bold ${getDeviationColor(
                            calculateDeviation(
                              currentOrder.estimatedWeight,
                              parseFloat(weighingState.weight) * 1000
                            )
                          )}`}>
                            {Math.abs(calculateDeviation(
                              currentOrder.estimatedWeight,
                              parseFloat(weighingState.weight) * 1000
                            ))}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={cancelWeighing}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={confirmWeight}
                  disabled={!weighingState.weight || parseFloat(weighingState.weight) <= 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer ce poids comme officiel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vehicles with Orders to Weigh */}
      <div className="space-y-6">
        {Object.entries(ordersByVehicle).map(([vehicleId, vehicleOrders]) => {
          const vehicle = vehicles.find(v => v.id === vehicleId);
          if (!vehicle) return null;

          const estimatedTotal = vehicleOrders.reduce((sum, o) => sum + (o.estimatedWeight || 0), 0);

          return (
            <Card key={vehicleId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent-100 rounded-lg">
                      <Truck className="w-6 h-6 text-accent-600" />
                    </div>
                    <div>
                      <CardTitle>{vehicle.matricule} - {vehicle.marque} {vehicle.modele}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Arrivé à {format(new Date(), 'HH:mm', { locale: fr })} • {vehicleOrders.length} commande(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total estimé</p>
                    <p className="text-xl font-bold text-gray-900">
                      ~{formatWeight(estimatedTotal)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">CLIENTS À DÉCHARGER:</h4>
                  {vehicleOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-accent-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-gray-900">{index + 1}.</span>
                            <span className="font-semibold text-gray-900">{order.clientName}</span>
                            <Badge variant="warning" className="text-xs">
                              estimé {order.estimatedSize}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Commande {order.orderNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Estimation</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatWeight(order.estimatedWeight || 0)}
                          </p>
                        </div>
                      </div>

                      {order.visualEstimation && (
                        <div className="mb-3 p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">Évaluation visuelle du chauffeur:</p>
                          <p className="text-sm font-medium text-gray-900">{order.visualEstimation}</p>
                        </div>
                      )}

                      {order.collectionPhotos && order.collectionPhotos.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-600 mb-1">Photos de collecte:</p>
                          <div className="flex gap-2">
                            {order.collectionPhotos.map((_photo, idx) => (
                              <div key={idx} className="w-16 h-16 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                                <span className="text-xs text-gray-500">Photo {idx + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => startWeighing(order.id)}
                      >
                        <Scale className="w-4 h-4 mr-2" />
                        Décharger et peser
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {Object.keys(ordersByVehicle).length === 0 && (
          <Card className="border-success-200 bg-success-50">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success-600" />
              <h3 className="font-semibold text-success-900 mb-1">Aucune commande en attente de pesée</h3>
              <p className="text-sm text-success-700">
                Toutes les commandes collectées ont été pesées et sont en cours de traitement.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Alert */}
      <Card className="border-primary-200 bg-primary-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-primary-900 mb-1">
                Processus de réception
              </h4>
              <p className="text-sm text-primary-700">
                Les commandes sont créées par les clients via l'application mobile avec une estimation (S, M, L, XL).
                Le chauffeur valide visuellement et prend des photos lors de la collecte.
                La pesée officielle en réception détermine le poids exact qui servira à la facturation.
                Les écarts importants ({">"} 30%) doivent être signalés au responsable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
