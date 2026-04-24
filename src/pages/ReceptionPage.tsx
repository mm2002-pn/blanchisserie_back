import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import {
  Truck,
  Scale,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { formatWeight } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { WorkflowTabs } from '@/components/layout/WorkflowTabs';

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
    if (Math.abs(deviation) <= 10) return 'text-ok-700';
    if (Math.abs(deviation) <= 30) return 'text-warn-700';
    return 'text-danger-600';
  };

  const currentOrder = weighingState
    ? orders.find(o => o.id === weighingState.orderId)
    : null;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Workflow quotidien</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink-900">
            Arrivées & pesée officielle
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Contrôle des camions, déchargement et pesée qui servira de base à la facturation.
          </p>
        </div>
        <WorkflowTabs />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RKpi label="Arrivées aujourd'hui" value={`${todayReceptions.length}`} tint="brand" icon={Calendar} />
        <RKpi label="À peser" value={`${ordersToWeigh.length}`} tint="warn" icon={Scale} />
        <RKpi label="Camions" value={`${Object.keys(ordersByVehicle).length}`} tint="terra" icon={Truck} />
        <RKpi label="Pesées terminées" value={`${todayReceptions.filter(o => o.actualWeight).length}`} tint="ok" icon={CheckCircle} />
      </div>

      {/* Weighing Modal */}
      {weighingState && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Pesée Officielle - {currentOrder.clientName}</CardTitle>
              <p className="text-sm text-ink-500 mt-1">
                Commande {currentOrder.orderNumber} • Estimation: {currentOrder.estimatedSize}
              </p>
            </CardHeader>
            <CardContent>
              {/* Estimation Info */}
              <div className="mb-6 p-4 bg-paper-2 rounded-input">
                <p className="text-sm text-ink-500 mb-2">Estimation client:</p>
                <p className="text-lg font-semibold text-ink-900">
                  {formatWeight(currentOrder.estimatedWeight || 0)} ({currentOrder.estimatedSize})
                </p>
                {currentOrder.visualEstimation && (
                  <p className="text-sm text-ink-500 mt-1">
                    Visuel chauffeur: {currentOrder.visualEstimation}
                  </p>
                )}
              </div>

              {/* Weight Display */}
              <div className="mb-6">
                <p className="text-sm text-ink-500 mb-2">LIRE LE POIDS SUR LA BALANCE:</p>
                <div className="text-center p-6 bg-paper-2 rounded-input border-2 border-ink-200">
                  <p className="text-5xl font-bold text-ink-900 font-mono">
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
                <div className="mb-6 p-4 bg-warn-100 rounded-input border border-warn-600">
                  <h4 className="font-semibold text-ink-900 mb-3">COMPARAISON:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-500">Estimation client:</span>
                      <span className="font-medium">{formatWeight(currentOrder.estimatedWeight || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-500">Poids réel:</span>
                      <span className="font-bold text-brand-800">
                        {formatWeight(parseFloat(weighingState.weight) * 1000)}
                      </span>
                    </div>
                    {currentOrder.estimatedWeight && (
                      <div className="flex justify-between items-center pt-2 border-t border-warn-600">
                        <span className="text-ink-500">Écart:</span>
                        <div className="flex items-center gap-2">
                          {calculateDeviation(
                            currentOrder.estimatedWeight,
                            parseFloat(weighingState.weight) * 1000
                          ) > 0 ? (
                            <TrendingUp className="w-4 h-4 text-danger-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-ok-700" />
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
                    <div className="p-3 bg-brand-100 rounded-input">
                      <Truck className="w-6 h-6 text-brand-800" />
                    </div>
                    <div>
                      <CardTitle>{vehicle.matricule} - {vehicle.marque} {vehicle.modele}</CardTitle>
                      <p className="text-sm text-ink-500 mt-1">
                        Arrivé à {format(new Date(), 'HH:mm', { locale: fr })} • {vehicleOrders.length} commande(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-ink-500">Total estimé</p>
                    <p className="font-serif text-xl font-medium tracking-tight text-ink-900">
                      ~{formatWeight(estimatedTotal)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold text-ink-900">CLIENTS À DÉCHARGER:</h4>
                  {vehicleOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className="p-4 border-2 border-ink-200 rounded-input hover:border-terra-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-serif text-lg font-medium tracking-tight text-ink-900">{index + 1}.</span>
                            <span className="font-semibold text-ink-900">{order.clientName}</span>
                            <Badge variant="warning" className="text-xs">
                              estimé {order.estimatedSize}
                            </Badge>
                          </div>
                          <p className="text-sm text-ink-500">
                            Commande {order.orderNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-ink-500">Estimation</p>
                          <p className="font-serif text-lg font-medium tracking-tight text-ink-900">
                            {formatWeight(order.estimatedWeight || 0)}
                          </p>
                        </div>
                      </div>

                      {order.visualEstimation && (
                        <div className="mb-3 p-2 bg-paper-2 rounded">
                          <p className="text-xs text-ink-500">Évaluation visuelle du chauffeur:</p>
                          <p className="text-sm font-medium text-ink-900">{order.visualEstimation}</p>
                        </div>
                      )}

                      {order.collectionPhotos && order.collectionPhotos.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-ink-500 mb-1">Photos de collecte:</p>
                          <div className="flex gap-2">
                            {order.collectionPhotos.map((_photo, idx) => (
                              <div key={idx} className="w-16 h-16 bg-ink-200 rounded border border-ink-300 flex items-center justify-center">
                                <span className="text-xs text-ink-500">Photo {idx + 1}</span>
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
          <Card className="border-ok-600 bg-ok-100">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-ok-700" />
              <h3 className="font-semibold text-ok-700 mb-1">Aucune commande en attente de pesée</h3>
              <p className="text-sm text-ok-700">
                Toutes les commandes collectées ont été pesées et sont en cours de traitement.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Alert */}
      <div className="card-surface bg-paper-2 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-ink-700 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="caps">Processus de réception</p>
            <p className="text-tiny text-ink-700 mt-1 leading-relaxed max-w-3xl">
              Les commandes sont créées par les clients via l'application mobile avec une estimation (S, M, L, XL).
              Le chauffeur valide visuellement et prend des photos lors de la collecte.
              La pesée officielle en réception détermine le poids exact qui servira à la facturation.
              Les écarts importants ({'>'} 30 %) doivent être signalés au responsable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RKpi({
  label,
  value,
  tint,
  icon: Icon,
}: {
  label: string;
  value: string;
  tint: 'ok' | 'warn' | 'danger' | 'brand' | 'terra';
  icon: typeof Calendar;
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
        <div>
          <p className="text-tiny font-medium text-ink-500">{label}</p>
          <p className="font-serif text-3xl font-medium tnum tracking-tight text-ink-900 mt-2 leading-none">
            {value}
          </p>
        </div>
        <div className={cn('w-9 h-9 rounded-input flex items-center justify-center shrink-0', bg)}>
          <Icon className={cn('w-4 h-4', fg)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
