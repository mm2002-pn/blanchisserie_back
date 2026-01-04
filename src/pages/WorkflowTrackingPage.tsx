import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { Package, CheckCircle, Clock, PlayCircle, AlertCircle, Search } from 'lucide-react';
import { formatWeight } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import mock data
import ordersData from '@/mocks/data/orders.json';
import workflowsData from '@/mocks/data/workflows.json';

// Workflow states mapping
const WORKFLOW_STATES = {
  COLLECTE_SCHEDULED: { label: 'Collecte programmée', color: 'default', step: 0 },
  COLLECTE_IN_PROGRESS: { label: 'Collecte en cours', color: 'primary', step: 1 },
  COLLECTE_COMPLETED: { label: 'Collectée', color: 'success', step: 1 },
  RECEPTION_PENDING: { label: 'En attente de réception', color: 'warning', step: 2 },
  WEIGHING_IN_PROGRESS: { label: 'Pesée en cours', color: 'primary', step: 3 },
  WEIGHING_COMPLETED: { label: 'Pesée terminée', color: 'success', step: 3 },
  TRIAGE_PENDING: { label: 'En attente de triage', color: 'warning', step: 4 },
  TRIAGE_IN_PROGRESS: { label: 'Triage en cours', color: 'primary', step: 4 },
  TRIAGE_COMPLETED: { label: 'Triage terminé', color: 'success', step: 4 },
  LAVAGE_PENDING: { label: 'En attente de lavage', color: 'warning', step: 5 },
  LAVAGE_IN_PROGRESS: { label: 'Lavage en cours', color: 'primary', step: 5 },
  LAVAGE_COMPLETED: { label: 'Lavage terminé', color: 'success', step: 5 },
  SECHAGE_IN_PROGRESS: { label: 'Séchage en cours', color: 'primary', step: 6 },
  SECHAGE_COMPLETED: { label: 'Séchage terminé', color: 'success', step: 6 },
  CALANDRAGE_IN_PROGRESS: { label: 'Calandrage en cours', color: 'primary', step: 7 },
  CALANDRAGE_COMPLETED: { label: 'Calandrage terminé', color: 'success', step: 7 },
  REPASSAGE_IN_PROGRESS: { label: 'Repassage en cours', color: 'primary', step: 8 },
  REPASSAGE_COMPLETED: { label: 'Repassage terminé', color: 'success', step: 8 },
  FINITION_IN_PROGRESS: { label: 'Finition en cours', color: 'primary', step: 9 },
  FINITION_COMPLETED: { label: 'Finition terminée', color: 'success', step: 9 },
  LIVRAISON_SCHEDULED: { label: 'Livraison programmée', color: 'warning', step: 10 },
  LIVRAISON_IN_PROGRESS: { label: 'En cours de livraison', color: 'primary', step: 10 },
  LIVRAISON_COMPLETED: { label: 'Livrée', color: 'success', step: 10 },
  CANCELLED: { label: 'Annulée', color: 'danger', step: -1 },
} as const;

type WorkflowStateKey = keyof typeof WORKFLOW_STATES;

export default function WorkflowTrackingPage() {
  const [orders] = useState(ordersData);
  const [_workflows] = useState(workflowsData);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const selectedOrder = selectedOrderId
    ? orders.find(o => o.id === selectedOrderId)
    : null;

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Count by status
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getWorkflowProgress = (state: string): number => {
    const stateInfo = WORKFLOW_STATES[state as WorkflowStateKey];
    if (!stateInfo || stateInfo.step < 0) return 0;
    return Math.round((stateInfo.step / 10) * 100);
  };

  // Workflow steps definition
  const workflowSteps = [
    { key: 'COLLECTE', label: 'Collecte', icon: Package },
    { key: 'RECEPTION', label: 'Réception', icon: CheckCircle },
    { key: 'WEIGHING', label: 'Pesée', icon: Clock },
    { key: 'TRIAGE', label: 'Triage', icon: PlayCircle },
    { key: 'LAVAGE', label: 'Lavage', icon: PlayCircle },
    { key: 'SECHAGE', label: 'Séchage', icon: PlayCircle },
    { key: 'CALANDRAGE', label: 'Calandrage', icon: PlayCircle },
    { key: 'REPASSAGE', label: 'Repassage', icon: PlayCircle },
    { key: 'FINITION', label: 'Finition', icon: PlayCircle },
    { key: 'LIVRAISON', label: 'Livraison', icon: CheckCircle },
  ];

  const getCurrentStepIndex = (state: string): number => {
    const stateInfo = WORKFLOW_STATES[state as WorkflowStateKey];
    return stateInfo?.step || 0;
  };

  const getStepStatus = (stepIndex: number, currentStepIndex: number): 'completed' | 'current' | 'pending' => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">
          Suivi des Workflows
        </h1>
        <p className="text-gray-600 mt-1">
          Suivi de l'état des commandes dans le processus de traitement
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card
          padding="sm"
          className={`cursor-pointer transition-colors ${statusFilter === 'all' ? 'border-accent-500 bg-accent-50' : 'hover:border-gray-300'}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-xs text-gray-600 mt-1">Toutes</p>
          </div>
        </Card>

        {Object.entries(statusCounts).map(([status, count]) => (
          <Card
            key={status}
            padding="sm"
            className={`cursor-pointer transition-colors ${statusFilter === status ? 'border-accent-500 bg-accent-50' : 'hover:border-gray-300'}`}
            onClick={() => setStatusFilter(status)}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-600 mt-1">{status}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro de commande ou client..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                Commandes ({filteredOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredOrders.map((order) => {
                  const stateInfo = WORKFLOW_STATES[order.workflowState as WorkflowStateKey];
                  const progress = getWorkflowProgress(order.workflowState);

                  return (
                    <div
                      key={order.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedOrderId === order.id
                          ? 'border-accent-500 bg-accent-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{order.clientName}</p>
                          <p className="text-sm text-gray-600">{order.orderNumber}</p>
                        </div>
                        <Badge variant={stateInfo?.color as any || 'default'} className="text-xs">
                          {order.status}
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{stateInfo?.label}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              progress === 100 ? 'bg-success' : 'bg-accent'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Collecte:</span> {format(new Date(order.collectionDate), 'dd/MM', { locale: fr })}
                        </div>
                        <div>
                          <span className="font-medium">Livraison:</span> {format(new Date(order.deliveryDate), 'dd/MM', { locale: fr })}
                        </div>
                        {order.actualWeight && (
                          <div>
                            <span className="font-medium">Poids:</span> {formatWeight(order.actualWeight)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Aucune commande trouvée</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Detail with Timeline */}
        <div>
          {selectedOrder ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{selectedOrder.clientName}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Commande {selectedOrder.orderNumber}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {/* Order Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Statut actuel</p>
                      <Badge variant={WORKFLOW_STATES[selectedOrder.workflowState as WorkflowStateKey]?.color as any || 'default'}>
                        {WORKFLOW_STATES[selectedOrder.workflowState as WorkflowStateKey]?.label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-600">Progression</p>
                      <p className="font-bold text-gray-900">{getWorkflowProgress(selectedOrder.workflowState)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Estimation</p>
                      <p className="font-medium text-gray-900">
                        {selectedOrder.estimatedSize} ({formatWeight(selectedOrder.estimatedWeight || 0)})
                      </p>
                    </div>
                    {selectedOrder.actualWeight && (
                      <div>
                        <p className="text-gray-600">Poids réel</p>
                        <p className="font-medium text-gray-900">{formatWeight(selectedOrder.actualWeight)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Étapes du workflow</h4>

                  {workflowSteps.map((step, index) => {
                    const currentStepIndex = getCurrentStepIndex(selectedOrder.workflowState);
                    const stepStatus = getStepStatus(index, currentStepIndex);
                    const Icon = step.icon;

                    return (
                      <div key={step.key} className="relative">
                        {/* Connector Line */}
                        {index < workflowSteps.length - 1 && (
                          <div className={`absolute left-6 top-14 w-0.5 h-12 ${
                            stepStatus === 'completed' ? 'bg-success' : 'bg-gray-300'
                          }`} />
                        )}

                        {/* Step */}
                        <div className="flex gap-4">
                          {/* Step Icon */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            stepStatus === 'completed'
                              ? 'bg-success text-white'
                              : stepStatus === 'current'
                              ? 'bg-accent-100 text-accent-600'
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            {stepStatus === 'completed' ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : stepStatus === 'current' ? (
                              <Clock className="w-6 h-6" />
                            ) : (
                              <Icon className="w-6 h-6" />
                            )}
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 pb-4">
                            <h5 className={`font-semibold ${
                              stepStatus === 'completed'
                                ? 'text-success'
                                : stepStatus === 'current'
                                ? 'text-accent-600'
                                : 'text-gray-400'
                            }`}>
                              {step.label}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                              {stepStatus === 'completed' && 'Terminée'}
                              {stepStatus === 'current' && 'En cours...'}
                              {stepStatus === 'pending' && 'En attente'}
                            </p>

                            {/* Show timestamp if available */}
                            {stepStatus === 'completed' && (
                              <p className="text-xs text-gray-500 mt-1">
                                {/* In real app, would show actual timestamp */}
                                Terminée le {format(new Date(selectedOrder.collectionDate), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                {selectedOrder.workflowState !== 'LIVRAISON_COMPLETED' && (
                  <div className="mt-6">
                    <Button variant="primary" className="w-full">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Passer à l'étape suivante
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sélectionnez une commande
                </h3>
                <p className="text-gray-600">
                  Choisissez une commande dans la liste de gauche pour voir son workflow détaillé.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Card className="border-primary-200 bg-primary-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-primary-900 mb-1">
                Suivi en temps réel
              </h4>
              <p className="text-sm text-primary-700">
                Cette page affiche l'état actuel de chaque commande dans son workflow de traitement.
                Chaque type de linge (LP, LF, NAE) suit un workflow spécifique défini dans les paramètres.
                Les étapes s'enchaînent automatiquement ou manuellement selon la configuration.
                Le suivi permet d'identifier les goulots d'étranglement et d'optimiser les processus.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
